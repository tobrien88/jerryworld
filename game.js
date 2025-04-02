class Tumbler {
    constructor(x) {
        this.x = x;
        this.y = 650; // Just below canvas height
        this.width = 60;  // Increased from 30 to account for ski spread
        this.height = 35; // Increased to account for ski length
        this.active = true;
        
        // Animation states
        this.state = 'entering';  // 'entering' -> 'precrash' -> 'crashing' -> 'crashed'
        this.stateFrame = 0;
        
        // Animation timing
        this.preCrashDuration = 30;  // 0.5 seconds at 60fps
        this.crashDuration = 48;     // Reduced from 60 to 48 (40% faster than original)
        
        // Initial intact position
        this.intact = {
            bodyRotation: 0,
            skisRotation: 0
        };

        // Equipment positions for animation
        this.equipment = {
            leftSki: { x: 0, y: 0, rotation: 0, dx: -1.5, dy: -1 },
            rightSki: { x: 0, y: 0, rotation: 0, dx: 1.5, dy: -0.5 },
            leftPole: { x: 0, y: 0, rotation: 0, dx: -1, dy: -1.5 },
            rightPole: { x: 0, y: 0, rotation: 0, dx: 1, dy: -1 },
            bodyRotation: 0
        };

        // Randomize crash pattern
        this.crashPattern = this.generateCrashPattern();
    }

    generateCrashPattern() {
        // Random direction (-1 for left, 1 for right)
        const direction = Math.random() < 0.5 ? -1 : 1;
        
        // Random body rotation (between 15 and 45 degrees)
        const bodyRotation = (Math.PI / 12 + Math.random() * Math.PI / 6) * direction;
        
        // Random velocities and rotations for equipment
        return {
            body: {
                rotation: bodyRotation,
                finalY: Math.random() * 5 // Slight random vertical offset
            },
            leftSki: {
                dx: (-1.5 - Math.random()) * direction,
                dy: -1 - Math.random(),
                rotation: -Math.PI / 4 - Math.random() * Math.PI / 4,
                finalRotation: -Math.PI / 3 + Math.random() * Math.PI / 6
            },
            rightSki: {
                dx: (1.5 + Math.random()) * direction,
                dy: -0.5 - Math.random(),
                rotation: Math.PI / 4 + Math.random() * Math.PI / 4,
                finalRotation: Math.PI / 3 - Math.random() * Math.PI / 6
            },
            leftPole: {
                dx: (-1 - Math.random()) * direction,
                dy: -1.5 - Math.random() * 0.5,
                rotation: -Math.PI / 3 - Math.random() * Math.PI / 6,
                finalRotation: -Math.PI / 2 + Math.random() * Math.PI / 4
            },
            rightPole: {
                dx: (1 + Math.random()) * direction,
                dy: -1 - Math.random() * 0.5,
                rotation: Math.PI / 3 + Math.random() * Math.PI / 6,
                finalRotation: Math.PI / 2 - Math.random() * Math.PI / 4
            }
        };
    }

    update(scrollSpeed) {
        this.y -= scrollSpeed; // Move up with scroll
        // Remove if it moves off screen
        if (this.y < -this.height) {
            this.active = false;
        }

        // Update animation state
        this.stateFrame++;
        
        switch(this.state) {
            case 'entering':
                if (this.stateFrame >= this.preCrashDuration) {
                    this.state = 'crashing';
                    this.stateFrame = 0;
                }
                break;

            case 'crashing':
                // Faster animation but same amplitude
                const progress = this.stateFrame / this.crashDuration;
                const easeOut = 1 - Math.pow(1 - progress, 3);

                // Update equipment positions with same distances but faster timing
                ['leftSki', 'rightSki', 'leftPole', 'rightPole'].forEach(item => {
                    this.equipment[item].x += this.crashPattern[item].dx * (1 - easeOut);
                    this.equipment[item].y += this.crashPattern[item].dy * (1 - easeOut);
                    this.equipment[item].rotation = this.crashPattern[item].finalRotation * easeOut;
                });

                this.equipment.bodyRotation = this.crashPattern.body.rotation * easeOut;

                if (this.stateFrame >= this.crashDuration) {
                    this.state = 'crashed';
                }
                break;
        }
    }

    draw(ctx) {
        const pixelSize = 3;
        const centerX = this.x;
        const centerY = this.y;

        const colors = {
            red: '#FF0000',
            blue: '#0000FF',
            green: '#90EE90',  // Light green
            skin: '#FFA07A',
            yellow: '#FFD700'
        };

        if (this.state === 'entering') {
            // Draw intact skier
            this.drawIntactSkier(ctx, centerX, centerY, colors);
        } else if (this.state === 'crashing' || this.state === 'crashed') {
            // Draw scattered equipment
            this.drawScatteredEquipment(ctx, centerX, centerY, colors);
            // Draw rotating body
            this.drawCrashingBody(ctx, centerX, centerY, colors);
        }
    }

    drawIntactSkier(ctx, centerX, centerY, colors) {
        // Draw straight skis
        ctx.strokeStyle = colors.red;
        ctx.lineWidth = 3;
        
        // Left ski
        ctx.beginPath();
        ctx.moveTo(centerX - 6, centerY + 15);
        ctx.lineTo(centerX - 6, centerY + 35);
        ctx.stroke();

        // Right ski
        ctx.beginPath();
        ctx.moveTo(centerX + 6, centerY + 15);
        ctx.lineTo(centerX + 6, centerY + 35);
        ctx.stroke();

        // Draw upright body
        ctx.fillStyle = colors.green;
        ctx.fillRect(centerX - 6, centerY, 12, 15);

        // Head
        ctx.fillStyle = colors.blue;
        ctx.fillRect(centerX - 6, centerY - 9, 12, 6);
        ctx.fillStyle = colors.skin;
        ctx.fillRect(centerX - 3, centerY - 3, 6, 3);

        // Straight poles
        ctx.strokeStyle = colors.yellow;
        ctx.beginPath();
        ctx.moveTo(centerX - 12, centerY + 5);
        ctx.lineTo(centerX - 12, centerY + 20);
        ctx.moveTo(centerX + 12, centerY + 5);
        ctx.lineTo(centerX + 12, centerY + 20);
        ctx.stroke();
    }

    drawScatteredEquipment(ctx, centerX, centerY, colors) {
        ctx.strokeStyle = colors.red;
        ctx.lineWidth = 3;

        // Draw scattered skis with varied positions
        ['leftSki', 'rightSki'].forEach(ski => {
            ctx.save();
            const xOffset = ski === 'leftSki' ? -15 : 15;
            ctx.translate(
                centerX + this.equipment[ski].x + xOffset,
                centerY + this.equipment[ski].y + 15 + 
                    (this.state === 'crashed' ? this.crashPattern.body.finalY : 0)
            );
            ctx.rotate(this.equipment[ski].rotation);
            ctx.beginPath();
            ctx.moveTo(ski === 'leftSki' ? 0 : -24, 0);
            ctx.lineTo(ski === 'leftSki' ? 24 : 0, 0);
            ctx.stroke();
            ctx.restore();
        });

        // Draw scattered poles with varied positions
        ctx.strokeStyle = colors.yellow;
        ['leftPole', 'rightPole'].forEach(pole => {
            ctx.save();
            const xOffset = pole === 'leftPole' ? -20 : 20;
            ctx.translate(
                centerX + this.equipment[pole].x + xOffset,
                centerY + this.equipment[pole].y + 5 +
                    (this.state === 'crashed' ? this.crashPattern.body.finalY : 0)
            );
            ctx.rotate(this.equipment[pole].rotation);
            ctx.beginPath();
            ctx.moveTo(pole === 'leftPole' ? 0 : -15, 0);
            ctx.lineTo(pole === 'leftPole' ? 15 : 0, 0);
            ctx.stroke();
            ctx.restore();
        });
    }

    drawCrashingBody(ctx, centerX, centerY, colors) {
        ctx.save();
        ctx.translate(
            centerX, 
            centerY + (this.state === 'crashed' ? this.crashPattern.body.finalY : 0)
        );
        ctx.rotate(this.equipment.bodyRotation);

        // Body
        ctx.fillStyle = colors.green;
        ctx.fillRect(-6, -3, 12, 15);

        // Head
        ctx.fillStyle = colors.blue;
        ctx.fillRect(-3, -9, 9, 6);
        ctx.fillStyle = colors.skin;
        ctx.fillRect(0, -3, 3, 3);

        ctx.restore();
    }

    // Add method to get current hitbox based on state
    getHitbox() {
        if (this.state === 'entering') {
            // Tighter hitbox when intact
            return {
                left: this.x - 15,
                right: this.x + 15,
                top: this.y,
                bottom: this.y + this.height
            };
        } else {
            // Wider hitbox when crashed to include scattered skis
            const skiSpread = 30; // Maximum ski scatter distance
            return {
                left: this.x - skiSpread,
                right: this.x + skiSpread,
                top: this.y,
                bottom: this.y + this.height
            };
        }
    }

    // Optional: Add method to draw hitbox for debugging
    drawHitbox(ctx) {
        const hitbox = this.getHitbox();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            hitbox.left,
            hitbox.top,
            hitbox.right - hitbox.left,
            hitbox.bottom - hitbox.top
        );
    }
}

class Stopper {
    constructor(x, y = 650) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 30;
        this.active = true;
        this.colors = this.getRandomColorScheme();
    }

    getRandomColorScheme() {
        const schemes = [
            {
                jacket: '#FF69B4', // Hot Pink
                pants: '#FF1493', // Deep Pink
                helmet: '#4B0082', // Indigo
                skis: '#FF00FF'   // Magenta
            },
            {
                jacket: '#FFA500', // Orange
                pants: '#FF8C00',  // Dark Orange
                helmet: '#8B4513', // Saddle Brown
                skis: '#FF4500'    // Orange Red
            },
            {
                jacket: '#9400D3', // Dark Violet
                pants: '#8A2BE2',  // Blue Violet
                helmet: '#4B0082', // Indigo
                skis: '#9370DB'    // Medium Purple
            },
            {
                jacket: '#00FF00', // Lime
                pants: '#32CD32',  // Lime Green
                helmet: '#006400', // Dark Green
                skis: '#98FB98'    // Pale Green
            },
            {
                jacket: '#00BFFF', // Deep Sky Blue
                pants: '#1E90FF',  // Dodger Blue
                helmet: '#000080', // Navy
                skis: '#87CEEB'    // Sky Blue
            }
        ];
        return schemes[Math.floor(Math.random() * schemes.length)];
    }

    update(scrollSpeed) {
        this.y -= scrollSpeed;
        if (this.y < -this.height) {
            this.active = false;
        }
    }

    draw(ctx) {
        const centerX = this.x;
        const centerY = this.y;
        const pixelSize = 3;

        // Draw pizza stance skis with a WIDER gap between them
        ctx.strokeStyle = this.colors.skis;
        ctx.lineWidth = pixelSize;
        
        // Left ski (angled outward) - moved further out
        ctx.save();
        ctx.translate(centerX - 14, centerY + 15); // Increased from -10 to -14
        ctx.rotate(-Math.PI / 6); // -30 degrees
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 20);
        ctx.stroke();
        ctx.restore();

        // Right ski (angled outward) - moved further out
        ctx.save();
        ctx.translate(centerX + 14, centerY + 15); // Increased from +10 to +14
        ctx.rotate(Math.PI / 6); // 30 degrees
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 20);
        ctx.stroke();
        ctx.restore();

        // Draw a wider "wedge" to show the pizza shape
        ctx.strokeStyle = '#FFFFFF'; // Snow color
        ctx.lineWidth = pixelSize - 1;
        ctx.beginPath();
        ctx.moveTo(centerX - 12, centerY + 25); // Bottom of left ski (wider)
        ctx.lineTo(centerX, centerY + 15);      // Apex of wedge
        ctx.lineTo(centerX + 12, centerY + 25); // Bottom of right ski (wider)
        ctx.stroke();

        // Optional: Add snow spray effect at the inside edges of skis
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // Semi-transparent white
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY + 22);
        ctx.lineTo(centerX - 6, centerY + 26);
        ctx.lineTo(centerX - 2, centerY + 22);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(centerX + 10, centerY + 22);
        ctx.lineTo(centerX + 6, centerY + 26);
        ctx.lineTo(centerX + 2, centerY + 22);
        ctx.fill();

        // Draw body
        ctx.fillStyle = this.colors.jacket;
        ctx.fillRect(centerX - 6, centerY, 12, 8); // Jacket
        ctx.fillStyle = this.colors.pants;
        ctx.fillRect(centerX - 6, centerY + 8, 12, 7); // Pants

        // Draw arms in "pizza" stance - adjusted for wider stance
        ctx.fillStyle = this.colors.jacket;
        ctx.save();
        ctx.translate(centerX - 10, centerY + 5); // Moved further out
        ctx.rotate(-Math.PI / 4);
        ctx.fillRect(0, 0, 3, 8);
        ctx.restore();

        ctx.save();
        ctx.translate(centerX + 10, centerY + 5); // Moved further out
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-3, 0, 3, 8);
        ctx.restore();

        // Head with helmet
        ctx.fillStyle = this.colors.helmet;
        ctx.fillRect(centerX - 6, centerY - 9, 12, 6);
        ctx.fillStyle = '#FFA07A'; // Skin tone
        ctx.fillRect(centerX - 3, centerY - 3, 6, 3);

        // Draw poles - adjusted for wider stance
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = pixelSize;
        
        // Left pole (angled out)
        ctx.save();
        ctx.translate(centerX - 14, centerY + 5); // Moved further out
        ctx.rotate(-Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 15);
        ctx.stroke();
        ctx.restore();

        // Right pole (angled out)
        ctx.save();
        ctx.translate(centerX + 14, centerY + 5); // Moved further out
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 15);
        ctx.stroke();
        ctx.restore();
    }
}

class Zigzagger {
    constructor(x) {
        this.x = x;
        this.startX = x;  // Keep track of center position
        this.y = -30;
        this.width = 24;
        this.height = 30;
        this.active = true;
        this.zigzagOffset = 0;
        
        // Adjust zigzag pattern for slower movement
        this.movementConfig = {
            downwardSpeed: 2.5,     // Base speed (will be modified by game)
            zigzagWidth: 80,        // Slightly reduced from 100
            zigzagSpeed: 0.015      // Reduced from 0.04 for smoother pattern
        };

        // Random color scheme for this zigzagger
        this.colors = this.getRandomColorScheme();

        // Base speeds
        this.baseSpeed = 8;
        this.currentSpeed = this.baseSpeed;

        // Flag to track if this zigzagger has entered the screen
        this.hasEnteredScreen = false;
    }

    getRandomColorScheme() {
        const schemes = [
            {
                jacket: '#FF1493',  // Deep Pink
                pants: '#FF69B4',   // Hot Pink
                helmet: '#C71585',   // Medium Violet Red
                skis: '#FF00FF'     // Magenta
            },
            {
                jacket: '#00FF00',   // Lime
                pants: '#32CD32',    // Lime Green
                helmet: '#228B22',   // Forest Green
                skis: '#90EE90'     // Light Green
            },
            {
                jacket: '#FF4500',   // Orange Red
                pants: '#FF8C00',    // Dark Orange
                helmet: '#D2691E',   // Chocolate
                skis: '#FFA500'     // Orange
            }
        ];
        return schemes[Math.floor(Math.random() * schemes.length)];
    }

    updateSpeed(newBaseSpeed) {
        this.currentSpeed = newBaseSpeed;
    }

    update(scrollSpeed) {
        // Use current speed from game
        this.y += this.currentSpeed;
        
        // Slower zigzag pattern
        this.zigzagOffset += this.movementConfig.zigzagSpeed;
        this.x = this.startX + Math.sin(this.zigzagOffset) * this.movementConfig.zigzagWidth;

        // Check if zigzagger has entered the visible screen
        if (!this.hasEnteredScreen && this.y > 0) {
            this.hasEnteredScreen = true;
            // Sound is now handled in the Game class when spawning
        }

        if (this.y > 650) {
            this.active = false;
        }
    }

    draw(ctx) {
        const centerX = this.x;
        const centerY = this.y;
        const pixelSize = 3;

        // Calculate lean angle based on movement
        const leanAngle = Math.cos(this.zigzagOffset) * Math.PI / 6; // ±30 degrees

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(leanAngle);

        // Draw skis
        ctx.strokeStyle = this.colors.skis;
        ctx.lineWidth = pixelSize;
        
        // Left ski
        ctx.beginPath();
        ctx.moveTo(-8, 15);
        ctx.lineTo(-8, 35);
        ctx.stroke();

        // Right ski
        ctx.beginPath();
        ctx.moveTo(8, 15);
        ctx.lineTo(8, 35);
        ctx.stroke();

        // Draw body
        ctx.fillStyle = this.colors.jacket;
        ctx.fillRect(-6, 0, 12, 8);  // Upper body
        ctx.fillStyle = this.colors.pants;
        ctx.fillRect(-6, 8, 12, 7);  // Lower body

        // Draw flailing arms
        const armAngle = Math.sin(this.zigzagOffset * 2) * Math.PI / 4; // Arms swing with movement
        
        // Left arm
        ctx.save();
        ctx.translate(-6, 4);
        ctx.rotate(-Math.PI / 4 - armAngle);
        ctx.fillStyle = this.colors.jacket;
        ctx.fillRect(0, 0, 3, 8);
        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(6, 4);
        ctx.rotate(Math.PI / 4 + armAngle);
        ctx.fillStyle = this.colors.jacket;
        ctx.fillRect(-3, 0, 3, 8);
        ctx.restore();

        // Head with helmet
        ctx.fillStyle = this.colors.helmet;
        ctx.fillRect(-6, -9, 12, 6);
        ctx.fillStyle = '#FFA07A'; // Skin tone
        ctx.fillRect(-3, -3, 6, 3);

        ctx.restore();
    }

    getHitbox() {
        return {
            left: this.x - this.width/2,
            right: this.x + this.width/2,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}

// Audio state management
const audioState = {
    soundtrackMuted: false,
    soundEffectsMuted: false,
    
    // Save preferences to localStorage
    savePreferences: function() {
        try {
            localStorage.setItem('jerryWorld_soundtrackMuted', this.soundtrackMuted);
            localStorage.setItem('jerryWorld_soundEffectsMuted', this.soundEffectsMuted);
        } catch (e) {
            console.error('Could not save audio preferences:', e);
        }
    },
    
    // Load preferences from localStorage
    loadPreferences: function() {
        try {
            const storedSoundtrack = localStorage.getItem('jerryWorld_soundtrackMuted');
            const storedSoundEffects = localStorage.getItem('jerryWorld_soundEffectsMuted');
            
            if (storedSoundtrack !== null) {
                this.soundtrackMuted = storedSoundtrack === 'true';
            }
            
            if (storedSoundEffects !== null) {
                this.soundEffectsMuted = storedSoundEffects === 'true';
            }
        } catch (e) {
            console.error('Could not load audio preferences:', e);
        }
    }
};

// Tree class for edge obstacles
class Tree {
    constructor(x, side) {
        this.x = x;
        this.y = 650; // Start below screen
        this.side = side; // 'left' or 'right' edge
        this.scale = 0.25 + Math.random() * 0.25; // Random scale between 25-50%
        
        // Image will be assigned in Game class after loading
        this.image = null;
        
        // Default dimensions until image is loaded
        this.width = 30;
        this.height = 50;
        
        this.active = true;
    }
    
    setImage(image) {
        if (!image || !image.complete || !image.width) {
            console.error("Invalid or incomplete image provided to Tree");
            return;
        }
        
        this.image = image;
        // Set dimensions based on image and scale
        this.width = this.image.width * this.scale;
        this.height = this.image.height * this.scale;
    }
    
    update(scrollSpeed) {
        // Move with scroll speed
        this.y -= scrollSpeed;
        
        // Deactivate when off screen
        if (this.y < -this.height) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        // Skip if off screen (optimization)
        if (this.y > 650 || this.y < -this.height) {
            return;
        }
        
        if (this.image && this.image.complete && this.image.width > 0) {
            // Draw the tree image with appropriate scaling
            ctx.drawImage(
                this.image,
                this.x - (this.width / 2), // Center horizontally
                this.y,
                this.width,
                this.height
            );
        } else {
            // Fallback if image isn't loaded
            ctx.fillStyle = '#006400'; // Dark green
            ctx.fillRect(this.x - 10, this.y, 20, 50);
        }
    }
    
    getHitbox() {
        // Create a smaller hitbox that starts at the tip of the tree
        // and allows some overlap with the branches
        
        // Start hitbox at the tip (top) of the tree
        const hitboxTop = this.y + (this.height * 0.1); // Start 10% down from the top
        
        // Allow brushing against sides (narrower hitbox)
        const hitboxWidth = this.width * 0.5; // Only 50% of the visual width
        
        // Center the hitbox within the tree visual
        return {
            left: this.x - (hitboxWidth / 2),
            right: this.x + (hitboxWidth / 2),
            top: hitboxTop,
            bottom: this.y + this.height // Bottom remains the same (trunk)
        };
    }
}

// Add Track class to manage individual track segments
class TrackSegment {
    constructor(x, y, angle, isLeftSki) {
        this.x = x;
        this.y = y;
        this.angle = angle || 0;
        this.isLeftSki = isLeftSki;
        this.age = 0;
        this.maxAge = 300;
        this.opacity = 0.6;
        this.width = 2;
        this.active = true;
    }
    
    update(scrollSpeed) {
        scrollSpeed = scrollSpeed || 0;
        this.y -= scrollSpeed;
        this.age++;
        this.opacity = 0.6 * (1 - (this.age / this.maxAge));
        
        if (this.age >= this.maxAge || this.y < -20) {
            this.active = false;
        }
    }
}

// Make TrackSegment available globally
window.TrackSegment = TrackSegment;

// Update Game class with improved ski tracks implementation
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 600;
        
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height * 0.33, // Player at 1/3 height
            width: 20,
            height: 30,
            speed: 10,  // Increased from 8 to 10
            skiAngle: 0
        };

        this.scroll = {
            y: 0,
            speed: 6  // Increased from 5 to 6
        };

        this.trackMarkers = this.createTrackMarkers();
        this.score = 0;
        this.keys = {};
        
        this.obstacles = [];
        this.lastSpawnTime = 0;
        this.spawnInterval = 2000; // 2 seconds between spawns
        
        this.gameOver = false;
        this.crashing = false;
        this.crashAnimation = {
            frames: 0,
            totalFrames: 60,         // 1 second at 60fps
            delayAfterCrash: 60,     // 1 additional second delay
            equipment: [],
            finalX: 0,
            finalY: 0
        };
        this.finalScore = 0;
        
        // Add game over display
        this.gameOverDisplay = document.createElement('div');
        this.gameOverDisplay.id = 'gameOverDisplay';
        this.gameOverDisplay.style.display = 'none';
        document.querySelector('.game-container').appendChild(this.gameOverDisplay);
        
        this.lastStopperTime = 0;
        this.stopperInterval = 4000; // 4 seconds between groups
        this.lastTumblerTime = 0;
        this.tumblerInterval = 3000;
        this.minObstacleSpacing = 200; // Minimum vertical space between any obstacles
        
        this.playerY = this.canvas.height * 0.33; // Move player lower
        this.lastZigzaggerTime = 0;
        this.zigzaggerInterval = 10000; // 10 seconds
        
        this.scoreMultiplier = 5; // New multiplier for faster score accumulation
        
        // Base speeds with extra reduction for zigzaggers
        this.baseConfig = {
            scrollSpeed: 3,        // 50% of original (6)
            playerSpeed: 5,        // 50% of original (10)
            zigzaggerSpeed: 2.5    // ~30% of original (8) - further reduced
        };

        // Speed progression system with updated thresholds
        this.speedProgression = {
            currentLevel: 0,
            maxLevel: 5,
            levelThresholds: [0, 500, 1000, 2000, 4000], // Updated thresholds
            speedMultipliers: {
                0: { scroll: 1.0, player: 1.0, zigzagger: 1.0 },  // 0-499 points
                1: { scroll: 1.2, player: 1.1, zigzagger: 1.1 },  // 500-999 points
                2: { scroll: 1.4, player: 1.2, zigzagger: 1.2 },  // 1000-1999 points
                3: { scroll: 1.6, player: 1.3, zigzagger: 1.3 },  // 2000-3999 points
                4: { scroll: 1.8, player: 1.4, zigzagger: 1.4 },  // 4000+ points
                5: { scroll: 2.0, player: 1.5, zigzagger: 1.5 }   // Maximum level (not currently used)
            },
            lastLevelUpScore: 0,
            levelUpMessageShown: false
        };

        // Initialize current speeds
        this.currentSpeeds = {
            scroll: this.baseConfig.scrollSpeed,
            player: this.baseConfig.playerSpeed,
            zigzagger: this.baseConfig.zigzaggerSpeed
        };

        // Apply initial speeds
        this.scroll.speed = this.currentSpeeds.scroll;
        this.player.speed = this.currentSpeeds.player;
        
        // Audio system with improved debugging
        this.audio = {
            turns: document.getElementById('turns_audio'),
            fast: document.getElementById('fast_audio'),
            crash: document.getElementById('crash_audio'),
            currentPriority: 0,
            turnSoundPlaying: false,
            debugLevel: true // Enable additional debugging
        };

        // Set volumes
        this.audio.turns.volume = 0.5;
        this.audio.fast.volume = 1.0;
        this.audio.crash.volume = 1.0;

        // Add event listeners with better debugging
        this.audio.turns.addEventListener('ended', () => {
            console.log(`Turn sound ended (level: ${this.speedProgression.currentLevel})`);
            this.audio.turnSoundPlaying = false;
            
            if (this.audio.currentPriority === 1) {
                this.audio.currentPriority = 0;
            }
        });

        this.audio.turns.addEventListener('play', () => {
            console.log(`Turn sound started playing (level: ${this.speedProgression.currentLevel})`);
        });

        this.audio.turns.addEventListener('error', (e) => {
            console.error(`Turn sound error (level: ${this.speedProgression.currentLevel}):`, e);
        });

        // Load audio
        this.loadAudio();
        
        // Touch state tracking
        this.touchControls = {
            left: false,
            right: false
        };
        
        // Add audio state reference
        this.audioState = audioState;
        
        // Add soundtrack reference and ensure it's playing if not muted
        this.soundtrack = document.getElementById('soundtrack');
        this.ensureSoundtrackPlaying();
        
        // Initialize game
        this.bindEvents();
        this.setupTouchControls();
        this.gameLoop();

        // Update zigzagger delay duration to 5 seconds
        this.zigzaggerDelay = {
            active: false,
            startTime: 0,
            duration: 5000 // 5 seconds (reduced from 20000)
        };

        // Add game start time tracking for play duration
        this.gameStartTime = Date.now();

        // Tree properties - with defensive defaults
        this.treeImage = new Image();
        this.treeImageLoaded = false;
        this.lastTreeTime = 0;
        this.treeInterval = 450;
        this.treeProbability = 0.5;
        this.maxTrees = 28;
        this.clusterSize = { min: 1, max: 3 };
        
        // Initialize obstacles array if it doesn't exist
        if (!this.obstacles) {
            this.obstacles = [];
        }
        
        // Progressive narrowing configuration
        this.narrowingConfig = {
            startScore: 500,
            maxNarrowing: 120,
            narrowingRate: 0.02,
            gapFrequency: 1000,
            gapChance: 0.3,
            gapDuration: 300
        };
        
        // Add visual indicator for tree boundary that player can see
        this.boundaryIndicators = {
            left: 50,
            right: this.canvas ? (this.canvas.width - 50) : 350,
            targetLeft: 50,
            targetRight: this.canvas ? (this.canvas.width - 50) : 350,
            transitionSpeed: 0.05
        };
        
        // Load tree image with error handling
        if (this.treeImage) {
            this.treeImage.onload = () => {
                console.log('Tree image loaded successfully');
                this.treeImageLoaded = true;
            };
            
            this.treeImage.onerror = (err) => {
                console.error('Error loading tree image:', err);
                // Game can still run without the tree image
                this.treeImageLoaded = false;
            };
            
            // Set image source last (after handlers are defined)
            this.treeImage.src = 'snowtree.png';
        }

        // Add debug option - set to false in production
        this.showHitboxes = false;

        // Initialize ski tracks configuration
        try {
            this.tracks = {
                leftSegments: [],
                rightSegments: [],
                lastPositions: {
                    left: { x: 0, y: 0 },
                    right: { x: 0, y: 0 }
                },
                lastAngles: {
                    left: 0,
                    right: 0
                },
                turnHistory: [], // Store recent turn data for smoother curves
                frameCount: 0,
                recordInterval: 2,
                maxSegmentsPerSki: 100,
                enabled: true,
                skiDistance: 12,
                // Control points for bezier curves
                curveIntensity: 0.4 // Higher values = more pronounced curves
            };
            
            console.log("Ski tracks system initialized");
        } catch (e) {
            console.error("Error initializing ski tracks:", e);
            this.tracks = {
                leftSegments: [],
                rightSegments: [],
                enabled: false
            };
        }

        // Initialize corduroy patches with adjusted settings
        try {
            this.corduroy = {
                patches: [],
                lastPatchTime: 0,
                patchInterval: 1200,
                spawnChance: 0.5, // Decreased to 50%
                maxPatches: 8,
                enabled: true,
                sections: [
                    { active: false, x: 0, width: 0, nextY: 0 },
                    { active: false, x: 0, width: 0, nextY: 0 }
                ]
            };
            
            console.log("Corduroy system initialized");
        } catch (e) {
            console.error("Error initializing corduroy:", e);
            this.corduroy = {
                patches: [],
                enabled: false
            };
        }

        // Initialize crud patches with reduced coverage settings
        try {
            this.crudSnow = {
                patches: [],
                lastPatchTime: 0,
                patchInterval: 1000, // Keep at 1000ms
                spawnChance: 0.4, // Keep at 0.4
                maxPatches: 5, // Keep at 5
                enabled: true
            };
            
            console.log("Crud snow system initialized");
        } catch (e) {
            console.error("Error initializing crud snow:", e);
            this.crudSnow = {
                patches: [],
                enabled: false
            };
        }
    }

    createTrackMarkers() {
        const markers = [];
        const markerSpacing = 100;
        for (let y = 0; y < this.canvas.height + markerSpacing; y += markerSpacing) {
            markers.push({
                x1: 50,
                y: y,
                x2: this.canvas.width - 50
            });
        }
        return markers;
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    canSpawnObstacle(y, type) {
        // Check if there's enough space between obstacles
        return !this.obstacles.some(obs => {
            const verticalDist = Math.abs(obs.y - y);
            return verticalDist < this.minObstacleSpacing;
        });
    }

    getStopperFormation(groupSize) {
        const formations = [
            {
                name: 'line',
                positions: (centerX) => {
                    const positions = [];
                    for (let i = 0; i < groupSize; i++) {
                        const offset = (i - (groupSize-1)/2) * 35;
                        positions.push({ x: centerX + offset, y: 650 });
                    }
                    return positions;
                }
            },
            {
                name: 'diagonal',
                positions: (centerX) => {
                    const positions = [];
                    for (let i = 0; i < groupSize; i++) {
                        const xOffset = (i - (groupSize-1)/2) * 35;
                        const yOffset = i * 20; // Diagonal offset
                        positions.push({ x: centerX + xOffset, y: 650 + yOffset });
                    }
                    return positions;
                }
            },
            {
                name: 'triangle',
                positions: (centerX) => {
                    const positions = [];
                    if (groupSize === 3) {
                        // Leader
                        positions.push({ x: centerX, y: 650 });
                        // Followers
                        positions.push({ x: centerX - 35, y: 650 + 30 });
                        positions.push({ x: centerX + 35, y: 650 + 30 });
                    } else if (groupSize === 2) {
                        // Diagonal pair
                        positions.push({ x: centerX - 20, y: 650 });
                        positions.push({ x: centerX + 20, y: 650 + 25 });
                    } else {
                        // Single stopper
                        positions.push({ x: centerX, y: 650 });
                    }
                    return positions;
                }
            }
        ];

        // Randomly select a formation
        return formations[Math.floor(Math.random() * formations.length)];
    }

    spawnStopperGroup() {
        const groupSize = Math.floor(Math.random() * 3) + 1;
        const minX = 50;
        const maxX = this.canvas.width - 50;
        const groupWidth = 30 * groupSize;
        const groupCenterX = Math.random() * (maxX - minX - groupWidth) + minX + groupWidth/2;

        // Get random formation
        const formation = this.getStopperFormation(groupSize);
        const positions = formation.positions(groupCenterX);

        // Check if we can spawn at this location
        if (this.canSpawnObstacle(650, 'stopper')) {
            positions.forEach(pos => {
                this.obstacles.push(new Stopper(pos.x, pos.y));
            });
            this.lastStopperTime = Date.now();
        }
    }

    spawnTumbler() {
        const minX = 50;
        const maxX = this.canvas.width - 50;
        const x = Math.random() * (maxX - minX) + minX;
        
        if (this.canSpawnObstacle(650, 'tumbler')) {
            this.obstacles.push(new Tumbler(x));
            this.lastTumblerTime = Date.now();
        }
    }

    spawnZigzagger() {
        // Only spawn zigzaggers at level 3 or higher (1000+ points)
        if (this.speedProgression.currentLevel < 2) { // Level 3 is index 2
            return;
        }
        
        // Check if we're in the delay period after the warning
        if (this.zigzaggerDelay.active) {
            const currentTime = Date.now();
            const elapsedTime = currentTime - this.zigzaggerDelay.startTime;
            
            if (elapsedTime < this.zigzaggerDelay.duration) {
                // Still in delay period, don't spawn yet
                return;
            } else {
                // Delay period over, reset flag and continue with spawn
                this.zigzaggerDelay.active = false;
                console.log("Zigzagger delay ended - now spawning zigzaggers");
            }
        }

        // Regular spawn timing check
        const currentTime = Date.now();
        if (currentTime - this.lastZigzaggerTime < this.zigzaggerInterval) {
            return;
        }

        // Random x position, keeping away from edges
        const minX = 100;
        const maxX = this.canvas.width - 100;
        const x = Math.random() * (maxX - minX) + minX;
        
        this.obstacles.push(new Zigzagger(x));
        this.lastZigzaggerTime = currentTime;
        
        // Play fast sound when zigzagger spawns
        setTimeout(() => this.playSound('fast'), 0);
    }

    // Calculate current narrowing amount based on score
    calculateNarrowing() {
        if (!this.narrowingConfig || !this.score) {
            return 0;
        }
        
        // No narrowing before start score
        if (this.score < (this.narrowingConfig.startScore * (this.scoreMultiplier || 1))) {
            return 0;
        }
        
        // Calculate based on points past the start threshold
        const baseScore = (this.score / (this.scoreMultiplier || 1)) - this.narrowingConfig.startScore;
        const rawNarrowing = baseScore * this.narrowingConfig.narrowingRate;
        
        // Check if we should create a gap ("breathing room")
        if (this.shouldCreateGap()) {
            return 0; // No narrowing during gap
        }
        
        return Math.min(this.narrowingConfig.maxNarrowing, Math.max(0, rawNarrowing));
    }
    
    // Determine if there should be a gap - with defensive checks
    shouldCreateGap() {
        if (!this.narrowingConfig || !this.score) {
            return false;
        }
        
        const adjustedScore = Math.floor(this.score / (this.scoreMultiplier || 1));
        
        // Check if we're in a gap zone
        if (adjustedScore < this.narrowingConfig.startScore) {
            return false; // No gaps before narrowing starts
        }
        
        // Get current section of the score
        const scoreSection = Math.floor(
            (adjustedScore - this.narrowingConfig.startScore) / 
            this.narrowingConfig.gapFrequency
        );
        
        // Calculate position within current section
        const positionInSection = 
            (adjustedScore - this.narrowingConfig.startScore) % 
            this.narrowingConfig.gapFrequency;
        
        // Check if we're in the potential gap zone
        const inGapZone = positionInSection < this.narrowingConfig.gapDuration;
        
        // Pseudo-random determination based on score section
        const gapSeed = Math.sin(scoreSection * 12345) * 0.5 + 0.5; // 0-1 value
        const createGap = inGapZone && gapSeed < this.narrowingConfig.gapChance;
        
        return createGap;
    }
    
    // Update boundary indicators - with defensive checks
    updateBoundaryIndicators() {
        if (!this.boundaryIndicators || !this.canvas) {
            return;
        }
        
        const narrowing = this.calculateNarrowing();
        
        // Update target positions
        this.boundaryIndicators.targetLeft = 50 + narrowing;
        this.boundaryIndicators.targetRight = this.canvas.width - 50 - narrowing;
        
        // Smooth transition to target
        this.boundaryIndicators.left += (
            this.boundaryIndicators.targetLeft - this.boundaryIndicators.left
        ) * this.boundaryIndicators.transitionSpeed;
        
        this.boundaryIndicators.right += (
            this.boundaryIndicators.targetRight - this.boundaryIndicators.right
        ) * this.boundaryIndicators.transitionSpeed;
    }
    
    // Draw boundary indicators - with defensive checks
    drawBoundaryIndicators() {
        if (!this.ctx || !this.canvas || !this.boundaryIndicators || !this.narrowingConfig) {
            return;
        }
        
        // Only draw if narrowing has started
        if (!this.score || this.score < (this.narrowingConfig.startScore * (this.scoreMultiplier || 1))) {
            return;
        }
        
        try {
            const ctx = this.ctx;
            
            // Draw subtle gradient boundaries
            const gradient = {
                left: ctx.createLinearGradient(
                    this.boundaryIndicators.left - 10, 
                    0, 
                    this.boundaryIndicators.left + 10, 
                    0
                ),
                right: ctx.createLinearGradient(
                    this.boundaryIndicators.right - 10, 
                    0, 
                    this.boundaryIndicators.right + 10, 
                    0
                )
            };
            
            // Set gradient colors
            gradient.left.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
            gradient.left.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
            
            gradient.right.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
            gradient.right.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
            
            // Draw left indicator
            ctx.fillStyle = gradient.left;
            ctx.fillRect(
                this.boundaryIndicators.left - 10,
                0,
                10,
                this.canvas.height
            );
            
            // Draw right indicator
            ctx.fillStyle = gradient.right;
            ctx.fillRect(
                this.boundaryIndicators.right,
                0,
                10,
                this.canvas.height
            );
        } catch (e) {
            console.error("Error drawing boundary indicators:", e);
            // Silently fail - don't break the game if indicators can't be drawn
        }
    }
    
    spawnTreeCluster() {
        // Skip if obstacles array doesn't exist
        if (!this.obstacles) {
            this.obstacles = [];
            return;
        }
        
        // Skip if we have too many active trees
        const activeTrees = this.obstacles.filter(obs => obs instanceof Tree);
        if (activeTrees.length >= this.maxTrees) {
            return;
        }
        
        // Skip if canvas isn't available
        if (!this.canvas) {
            return;
        }
        
        try {
            // Randomly choose side (left or right)
            const side = Math.random() < 0.5 ? 'left' : 'right';
            
            // Get narrowing amount for tree positioning - with defensive check
            const narrowing = this.calculateNarrowing();
            
            // Determine base position for this cluster with narrowing applied
            let baseX;
            if (side === 'left') {
                // Left edge: position based on narrowing
                baseX = narrowing + Math.random() * 40;
            } else {
                // Right edge: position based on narrowing
                baseX = this.canvas.width - narrowing - Math.random() * 40;
            }
            
            // Determine cluster size with weighted probabilities
            const randomValue = Math.random();
            let clusterSize;
            if (randomValue < 0.5) {
                clusterSize = 1;
            } else if (randomValue < 0.8) {
                clusterSize = 2;
            } else {
                clusterSize = 3;
            }
            
            // Calculate approximate tree width for spacing
            const approximateTreeWidth = 30;
            
            // Create cluster of trees with better spacing
            for (let i = 0; i < clusterSize; i++) {
                // Vary position within cluster - increased spacing
                const clusterSpread = 60;
                
                // More controlled positioning for less overlap
                const xVariation = (i / (clusterSize - 1 || 1)) * clusterSpread - (clusterSpread / 2);
                
                // Add some randomness to the evenly distributed positions
                const randomOffset = (Math.random() - 0.5) * (approximateTreeWidth * 0.5);
                
                // More vertical staggering to reduce overlap
                const yVariation = i * 30 + Math.random() * 30;
                
                const treeX = baseX + xVariation + randomOffset;
                
                // Create tree
                const tree = new Tree(treeX, side);
                
                // Only set image if it's loaded
                if (this.treeImageLoaded && this.treeImage) {
                    tree.setImage(this.treeImage);
                }
                
                tree.y = 650 + yVariation;
                
                // Add to obstacles array
                this.obstacles.push(tree);
            }
        } catch (e) {
            console.error("Error spawning tree cluster:", e);
            // Continue game even if tree spawning fails
        }
    }

    updateSpeedLevel() {
        const currentScore = Math.floor(this.score / this.scoreMultiplier);
        
        for (let level = this.speedProgression.maxLevel; level >= 0; level--) {
            if (currentScore >= this.speedProgression.levelThresholds[level]) {
                if (level !== this.speedProgression.currentLevel) {
                    const oldLevel = this.speedProgression.currentLevel;
                    this.speedProgression.currentLevel = level;
                    this.speedProgression.lastLevelUpScore = currentScore;
                    this.speedProgression.levelUpMessageShown = false;
                    this.updateGameSpeeds();
                    
                    // Track level up event
                    sendGAEvent('level_up', {
                        'level': level + 1,
                        'score': currentScore
                    });
                    
                    // Special message when reaching level 3 (zigzaggers appear)
                    if (oldLevel < 2 && level >= 2) {
                        this.showZigzaggerWarning();
                    } else {
                        this.showSpeedIncreaseEffect();
                    }
                } else if (!this.speedProgression.levelUpMessageShown && 
                    currentScore <= this.speedProgression.lastLevelUpScore + 15) {
                    this.showSpeedIncreaseEffect();
                    this.speedProgression.levelUpMessageShown = true;
                }
                break;
            }
        }
    }

    updateGameSpeeds() {
        const multipliers = this.speedProgression.speedMultipliers[this.speedProgression.currentLevel];
        
        // Update current speeds
        this.currentSpeeds = {
            scroll: this.baseConfig.scrollSpeed * multipliers.scroll,
            player: this.baseConfig.playerSpeed * multipliers.player,
            zigzagger: this.baseConfig.zigzaggerSpeed * multipliers.zigzagger
        };

        // Update player speed
        this.player.speed = this.currentSpeeds.player;
        
        // Update scroll speed
        this.scroll.speed = this.currentSpeeds.scroll;
    }

    showSpeedIncreaseEffect() {
        const speedAlert = document.createElement('div');
        speedAlert.className = 'speed-up-alert';
        
        speedAlert.innerHTML = `
            <div class="alert-text">SEND IT!</div>
            <div class="level-text" style="margin-top: 15px;">LEVEL ${this.speedProgression.currentLevel + 1}</div>
        `;
        
        document.querySelector('.game-container').appendChild(speedAlert);

        // Reduce duration by 50% (from 3000ms to 1500ms)
        setTimeout(() => {
            speedAlert.classList.add('fade-out');
            setTimeout(() => {
                speedAlert.remove();
            }, 500);
        }, 1500); // Changed from 3000 to 1500
    }

    showZigzaggerWarning() {
        // Special warning when zigzaggers start appearing
        const warningAlert = document.createElement('div');
        warningAlert.className = 'speed-up-alert';
        
        warningAlert.innerHTML = `
            <div class="alert-text">WATCH OUT!</div>
            <div class="level-text">GONG SHOW AHEAD!</div>
            <div class="level-text" style="margin-top: 15px;">LEVEL ${this.speedProgression.currentLevel + 1}</div>
        `;
        
        document.querySelector('.game-container').appendChild(warningAlert);

        // Reduce duration by 50% (from 3000ms to 1500ms)
        setTimeout(() => {
            warningAlert.classList.add('fade-out');
            setTimeout(() => {
                warningAlert.remove();
            }, 500);
        }, 1500); // Changed from 3000 to 1500
        
        this.speedProgression.levelUpMessageShown = true;
        
        // Play fast sound to alert player
        setTimeout(() => {
            const fastPromise = this.audio.fast.play();
            if (fastPromise !== undefined) {
                fastPromise.then(() => {
                    this.audio.currentPriority = 2;
                    this.audio.fast.onended = () => {
                        this.audio.currentPriority = 0;
                    };
                }).catch(e => console.error("Error playing fast sound:", e));
            }
        }, 100);
    }

    handleCollision() {
        if (this.crashing || this.gameOver) return;
        
        // Play crash sound
        this.playSound('crash');
        
        this.crashing = true;
        this.crashAnimation.frames = 0;
        this.crashAnimation.finalX = this.player.x;
        this.crashAnimation.finalY = this.player.y;
        
        // Initialize scattered equipment
        this.crashAnimation.equipment = [
            // Left ski
            {
                type: 'ski',
                x: 0,
                y: 0,
                rotation: 0,
                dx: -1.5,
                dy: -1,
                targetX: -15,
                targetY: 10,
                targetRotation: -Math.PI / 4
            },
            // Right ski
            {
                type: 'ski',
                x: 0,
                y: 0,
                rotation: 0,
                dx: 1.5,
                dy: -0.5,
                targetX: 15,
                targetY: 10,
                targetRotation: Math.PI / 4
            },
            // Left pole
            {
                type: 'pole',
                x: 0,
                y: 0,
                rotation: 0,
                dx: -1,
                dy: -1.5,
                targetX: -20,
                targetY: 5,
                targetRotation: -Math.PI / 3
            },
            // Right pole
            {
                type: 'pole',
                x: 0,
                y: 0,
                rotation: 0,
                dx: 1,
                dy: -1,
                targetX: 20,
                targetY: 5,
                targetRotation: Math.PI / 3
            }
        ];
    }

    updateCrashAnimation() {
        if (!this.crashing) return;

        this.crashAnimation.frames++;
        
        if (this.crashAnimation.frames <= this.crashAnimation.totalFrames) {
            // Animation phase - scatter equipment
            const progress = this.crashAnimation.frames / this.crashAnimation.totalFrames;
            const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
            
            // Update equipment positions
            this.crashAnimation.equipment.forEach(item => {
                // Move toward target positions
                item.x = item.targetX * easeOut;
                item.y = item.targetY * easeOut;
                item.rotation = item.targetRotation * easeOut;
            });
        } else if (this.crashAnimation.frames >= this.crashAnimation.totalFrames + this.crashAnimation.delayAfterCrash) {
            // After animation and delay, show game over
            this.crashing = false;
            this.gameOver = true;
            this.finalScore = Math.floor(this.score / this.scoreMultiplier);
            this.showGameOver();
        }
    }

    drawCrashingPlayer() {
        const ctx = this.ctx;
        const centerX = this.crashAnimation.finalX;
        const centerY = this.crashAnimation.finalY;
        
        // Draw scattered equipment
        this.crashAnimation.equipment.forEach(item => {
            ctx.save();
            ctx.translate(
                centerX + item.x, 
                centerY + item.y
            );
            ctx.rotate(item.rotation);
            
            if (item.type === 'ski') {
                // Draw ski
                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-12, 0);
                ctx.lineTo(12, 0);
                ctx.stroke();
            } else {
                // Draw pole
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-8, 0);
                ctx.lineTo(8, 0);
                ctx.stroke();
            }
            
            ctx.restore();
        });

        // Draw fallen player body
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Body rotates forward when crashing
        const bodyRotation = Math.min(Math.PI / 6, 
            (Math.PI / 6) * (this.crashAnimation.frames / (this.crashAnimation.totalFrames / 2)));
        ctx.rotate(bodyRotation);

        // Draw body
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(-6, -3, 12, 15);

        // Draw head
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(-6, -9, 12, 6);
        ctx.fillStyle = '#FFA07A'; // Skin tone
        ctx.fillRect(-3, -3, 6, 3);

        ctx.restore();
    }

    update() {
        if (this.gameOver) return;

        if (this.crashing) {
            this.updateCrashAnimation();
            return;
        }

        // Update speed level based on score
        this.updateSpeedLevel();

        // Update player movement with keyboard and touch controls
        const previousSkiAngle = this.player.skiAngle;
        let directionChanged = false;
        
        // Combine keyboard and touch inputs
        const movingLeft = (this.keys['ArrowLeft'] || this.keys['a'] || this.touchControls?.left);
        const movingRight = (this.keys['ArrowRight'] || this.keys['d'] || this.touchControls?.right);
        
        if (movingLeft && this.player.x > 0) {
            this.player.x -= this.player.speed;
            
            if (previousSkiAngle <= 0) {
                directionChanged = true;
            }
            
            this.player.skiAngle = Math.PI / 4;
        } else if (movingRight && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
            
            if (previousSkiAngle >= 0) {
                directionChanged = true;
            }
            
            this.player.skiAngle = -Math.PI / 4;
        } else {
            this.player.skiAngle = 0;
        }
        
        // Play turn sound if direction changed and not already playing
        if (directionChanged && !this.audio.turnSoundPlaying) {
            this.playSound('turns');
        }

        // Update scroll position
        this.scroll.y += this.scroll.speed;
        if (this.scroll.y > this.canvas.height) {
            this.scroll.y = 0;
        }

        // Update track markers
        this.trackMarkers.forEach(marker => {
            marker.y -= this.scroll.speed;
            if (marker.y < -50) {
                marker.y = this.canvas.height + 50;
            }
        });

        // Update boundary indicators
        this.updateBoundaryIndicators();

        // Only spawn tree clusters at level 2 or higher with updated narrowing
        if (this.speedProgression && this.speedProgression.currentLevel >= 1) {
            const currentTime = Date.now();
            if (currentTime - this.lastTreeTime > this.treeInterval) {
                if (Math.random() < this.treeProbability) {
                    try {
                        this.spawnTreeCluster();
                    } catch (e) {
                        console.error("Error in tree cluster spawning:", e);
                    }
                }
                this.lastTreeTime = currentTime;
            }
        }

        // Spawn other obstacles
        const currentTime = Date.now();
        if (currentTime - this.lastTumblerTime > this.tumblerInterval) {
            this.spawnTumbler();
        }
        
        if (currentTime - this.lastStopperTime > this.stopperInterval) {
            this.spawnStopperGroup();
        }
        
        this.spawnZigzagger();

        // Update all obstacles - with defensive checks
        if (this.obstacles) {
            try {
                this.obstacles = this.obstacles.filter(obs => obs && obs.active);
                this.obstacles.forEach(obs => {
                    if (obs) {
                        if (obs instanceof Zigzagger && this.currentSpeeds) {
                            obs.updateSpeed(this.currentSpeeds.zigzagger);
                        }
                        if (typeof obs.update === 'function') {
                            obs.update(this.scroll.speed);
                        }
                    }
                });
            } catch (e) {
                console.error("Error updating obstacles:", e);
                // Reset obstacles array if it's corrupted
                this.obstacles = [];
            }
        } else {
            this.obstacles = [];
        }

        // Check collisions with all obstacles
        this.checkCollisions();

        // Update score
        this.score += 2;
        const displayScore = Math.floor(this.score / this.scoreMultiplier);
        document.getElementById('score').textContent = 
            `SCORE: ${String(displayScore).padStart(6, '0')}`;

        // Record player position for ski tracks
        this.recordPlayerPosition();
        
        // Update track segments
        this.updateTracks();

        try {
            // Update snow textures
            this.updateCorduroy();
            this.updateCrudSnow();
            
            // Record player position for ski tracks
            this.recordPlayerPosition();
            
            // Update track segments
            this.updateTracks();
        } catch (e) {
            console.error("Error in visual effects update cycle:", e);
        }
    }

    checkCollisions() {
        if (this.gameOver) return;

        for (let obs of this.obstacles) {
            // Get player ski positions based on current angle
            const skiLength = 35;
            
            const leftSkiBase = {
                x: this.player.x - 6,
                y: this.player.y + 15
            };
            
            const rightSkiBase = {
                x: this.player.x + 6,
                y: this.player.y + 15
            };
            
            const leftSkiEnd = {
                x: leftSkiBase.x + skiLength * Math.sin(this.player.skiAngle),
                y: leftSkiBase.y + skiLength * Math.cos(this.player.skiAngle)
            };
            
            const rightSkiEnd = {
                x: rightSkiBase.x + skiLength * Math.sin(this.player.skiAngle),
                y: rightSkiBase.y + skiLength * Math.cos(this.player.skiAngle)
            };

            const leftSki = {
                x1: leftSkiBase.x,
                y1: leftSkiBase.y,
                x2: leftSkiEnd.x,
                y2: leftSkiEnd.y
            };
            
            const rightSki = {
                x1: rightSkiBase.x,
                y1: rightSkiBase.y,
                x2: rightSkiEnd.x,
                y2: rightSkiEnd.y
            };

            // Get obstacle hitbox - different for trees vs other obstacles
            let obsBox;
            if (obs instanceof Tree) {
                obsBox = obs.getHitbox();
                
                // Special handling for tree collision - check if intersection point
                // is near the center of the tree to make brushing against edges more forgiving
                const leftSkiCollision = this.lineIntersectsBox(leftSki, obsBox);
                const rightSkiCollision = this.lineIntersectsBox(rightSki, obsBox);
                
                if (leftSkiCollision || rightSkiCollision) {
                    // Calculate collision position
                    const collisionPoint = leftSkiCollision || rightSkiCollision;
                    
                    // If it's just a brush with the edge, don't count as collision
                    // This creates even more forgiveness for tree collisions
                    if (collisionPoint && obs instanceof Tree) {
                        const treeCenter = obs.x;
                        const distanceFromCenter = Math.abs(collisionPoint.x - treeCenter);
                        const collisionThreshold = obsBox.right - obsBox.left;
                        
                        // If collision is near the edge (>40% of distance to edge), ignore it
                        // This means player can overlap with up to ~10% of the tree visual
                        if (distanceFromCenter > (collisionThreshold * 0.4)) {
                            continue; // Skip this collision
                        }
                    }
                    
                    this.handleCollision();
                    break;
                }
            } else {
                // Regular obstacles use standard hitbox
                obsBox = {
                    left: obs.x - obs.width/2,
                    right: obs.x + obs.width/2,
                    top: obs.y,
                    bottom: obs.y + obs.height
                };
                
                // Check if either ski intersects with obstacle
                if (this.lineIntersectsBox(leftSki, obsBox) || 
                    this.lineIntersectsBox(rightSki, obsBox)) {
                    this.handleCollision();
                    break;
                }
            }
        }
    }

    lineIntersectsBox(line, box) {
        // Check if any part of the line intersects with the box
        const left = this.lineIntersectsLine(
            line.x1, line.y1, line.x2, line.y2,
            box.left, box.top, box.left, box.bottom
        );
        
        const right = this.lineIntersectsLine(
            line.x1, line.y1, line.x2, line.y2,
            box.right, box.top, box.right, box.bottom
        );
        
        const top = this.lineIntersectsLine(
            line.x1, line.y1, line.x2, line.y2,
            box.left, box.top, box.right, box.top
        );
        
        const bottom = this.lineIntersectsLine(
            line.x1, line.y1, line.x2, line.y2,
            box.left, box.bottom, box.right, box.bottom
        );
        
        return left || right || top || bottom;
    }

    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
        
        // Lines are parallel
        if (denominator === 0) {
            return false;
        }
        
        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
        
        // Return false if the intersection is beyond line segments
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return false;
        }
        
        // Return the intersection point
        const x = x1 + ua * (x2 - x1);
        const y = y1 + ua * (y2 - y1);
        
        return {x, y};
    }

    showGameOver() {
        this.gameOverDisplay.style.display = 'flex';
        const formattedScore = String(this.finalScore).padStart(6, '0');
        this.gameOverDisplay.innerHTML = `
            <div class="game-over-content">
                <h2>GAME OVER</h2>
                <p>FINAL SCORE</p>
                <p>${formattedScore}</p>
                <button id="continueButton">CONTINUE?</button>
            </div>
        `;
        
        // Calculate play duration in seconds
        const playDurationSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
        
        // Track game over event with comprehensive data
        sendGAEvent('game_over', {
            'score': this.finalScore,
            'level': this.speedProgression.currentLevel + 1,
            'play_duration_seconds': playDurationSeconds,
            'timestamp': new Date().toISOString()
        });
        
        // Track score as a separate event for easier analytics
        sendGAEvent('score_recorded', {
            'score': this.finalScore,
            'play_duration_seconds': playDurationSeconds
        });
        
        // Make continue button work with both click and touch
        setTimeout(() => {
            const continueButton = document.getElementById('continueButton');
            if (continueButton) {
                // Use custom reload to ensure soundtrack continues
                continueButton.addEventListener('click', () => {
                    // Preserve soundtrack element
                    const soundtrack = this.soundtrack;
                    
                    // Reload the page
                    location.reload();
                });
                
                continueButton.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    this.click();
                });
            }
        }, 100);
    }

    draw() {
        try {
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw snow background
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw snow textures (before track markers, behind everything else)
            try {
                this.drawCorduroy();
                this.drawCrudSnow();
            } catch (e) {
                console.error("Error drawing snow textures:", e);
            }

            // Draw track markers
            if (typeof this.drawTrackMarkers === 'function') {
                this.drawTrackMarkers();
            }
            
            // Draw boundary indicators
            try {
                this.drawBoundaryIndicators();
            } catch (e) {
                console.error("Error drawing boundary indicators:", e);
            }

            // Draw ski tracks with error handling
            try {
                this.drawTracks();
            } catch (e) {
                console.error("Error drawing ski tracks:", e);
                // Disable tracks if drawing fails
                if (this.tracks) {
                    this.tracks.enabled = false;
                }
            }

            // Draw obstacles with extensive error handling
            if (this.obstacles && this.ctx) {
                // Draw trees (before player so player appears in front)
                try {
                    const trees = this.obstacles.filter(obs => obs instanceof Tree);
                    trees.forEach(tree => {
                        if (tree && typeof tree.draw === 'function') {
                            tree.draw(this.ctx);
                        }
                    });
                } catch (e) {
                    console.error("Error drawing trees:", e);
                }

                // Draw other obstacles
                try {
                    this.obstacles
                        .filter(obs => obs && !(obs instanceof Tree))
                        .forEach(obs => {
                            if (typeof obs.draw === 'function') {
                                obs.draw(this.ctx);
                            }
                        });
                } catch (e) {
                    console.error("Error drawing other obstacles:", e);
                }
            }

            // Draw player
            if (this.crashing) {
                this.drawCrashingPlayer();
            } else if (!this.gameOver) {
                this.drawPlayer();
            }
        } catch (e) {
            console.error("Critical error in draw method:", e);
            // Continue game loop even if draw fails
        }
    }

    drawPlayer() {
        const ctx = this.ctx;
        const pixelSize = 3;
        
        const centerX = this.player.x;
        const centerY = this.player.y;

        const colors = {
            red: '#FF0000',
            blue: '#0000FF',
            skin: '#FFA07A',
            yellow: '#FFD700'
        };

        // Draw skis with reversed angles
        ctx.strokeStyle = colors.red;
        ctx.lineWidth = pixelSize;
        
        // Left ski
        ctx.save();
        ctx.translate(centerX - 6, centerY + 15);
        ctx.rotate(this.player.skiAngle); // Using the reversed angle
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(0, 20);
        ctx.stroke();
        ctx.restore();

        // Right ski
        ctx.save();
        ctx.translate(centerX + 6, centerY + 15);
        ctx.rotate(this.player.skiAngle); // Using the reversed angle
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(0, 20);
        ctx.stroke();
        ctx.restore();

        // Draw body parts using rectangles for pixel art style
        ctx.fillStyle = colors.blue;
        // Torso
        ctx.fillRect(centerX - 6, centerY, 12, 15);
        
        // Arms
        ctx.fillRect(centerX - 9, centerY + 3, 3, 6); // Left arm
        ctx.fillRect(centerX + 6, centerY + 3, 3, 6); // Right arm
        
        // Head/Hat
        ctx.fillStyle = colors.red;
        ctx.fillRect(centerX - 6, centerY - 9, 12, 6); // Hat
        ctx.fillStyle = colors.skin;
        ctx.fillRect(centerX - 3, centerY - 3, 6, 3); // Face

        // Yellow pole details
        ctx.fillStyle = colors.yellow;
        ctx.fillRect(centerX - 12, centerY + 3, 3, 9); // Left pole
        ctx.fillRect(centerX + 9, centerY + 3, 3, 9); // Right pole
    }

    gameLoop() {
        this.update();
        this.draw();
        
        if (!this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    loadAudio() {
        // Ensure audio is properly loaded
        const audioFiles = ['turns', 'fast', 'crash'];
        
        audioFiles.forEach(type => {
            this.audio[type].load();
            
            // Log when audio is loaded
            this.audio[type].addEventListener('canplaythrough', () => {
                console.log(`${type} audio loaded successfully`);
            });
            
            // Log errors
            this.audio[type].addEventListener('error', (e) => {
                console.error(`Error loading ${type} audio:`, e);
            });
        });
    }

    playSound(soundType) {
        // Don't play sound effects if muted
        if (this.audioState.soundEffectsMuted) {
            return;
        }
        
        if (this.audio.debugLevel) {
            console.log(`Attempting to play ${soundType} sound (level: ${this.speedProgression.currentLevel})`);
        }
        
        const priorityMap = {
            'turns': 1,
            'fast': 2,
            'crash': 3
        };

        const priority = priorityMap[soundType];
        
        // Special handling for turns sound
        if (soundType === 'turns') {
            if (this.audio.turnSoundPlaying) {
                return;
            }
            
            this.audio.turns.pause();
            this.audio.turns.currentTime = 0;
            
            try {
                const playPromise = this.audio.turns.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        this.audio.turnSoundPlaying = true;
                    }).catch(error => {
                        console.error(`Error playing turns sound:`, error);
                    });
                }
            } catch (e) {
                console.error("Exception playing turns sound:", e);
            }
            
            return;
        }
        
        // For other sounds, use priority system
        if (priority >= this.audio.currentPriority) {
            // Stop all sound effects but NOT the soundtrack
            this.audio.turns.pause();
            this.audio.turns.currentTime = 0;
            this.audio.turnSoundPlaying = false;
            
            this.audio.fast.pause();
            this.audio.fast.currentTime = 0;
            
            this.audio.crash.pause();
            this.audio.crash.currentTime = 0;
            
            // Play the requested sound
            try {
                const playPromise = this.audio[soundType].play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        this.audio.currentPriority = priority;
                    }).catch(error => {
                        console.error(`Error playing ${soundType} sound:`, error);
                    });
                }
            } catch (e) {
                console.error(`Exception playing ${soundType} sound:`, e);
            }
            
            // Reset priority after sound finishes
            this.audio[soundType].onended = () => {
                if (this.audio.debugLevel) {
                    console.log(`${soundType} sound finished`);
                }
                this.audio.currentPriority = 0;
            };
        }
    }

    setupTouchControls() {
        const leftTouchArea = document.getElementById('leftTouchArea');
        const rightTouchArea = document.getElementById('rightTouchArea');
        
        // Left touch area
        leftTouchArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.left = true;
            leftTouchArea.classList.add('active'); // Optional visual feedback
        });
        
        leftTouchArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.left = false;
            leftTouchArea.classList.remove('active');
        });
        
        leftTouchArea.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.touchControls.left = false;
            leftTouchArea.classList.remove('active');
        });
        
        // Right touch area
        rightTouchArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.right = true;
            rightTouchArea.classList.add('active'); // Optional visual feedback
        });
        
        rightTouchArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.right = false;
            rightTouchArea.classList.remove('active');
        });
        
        rightTouchArea.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.touchControls.right = false;
            rightTouchArea.classList.remove('active');
        });
        
        // Prevent touchmove to avoid scrolling while playing
        document.addEventListener('touchmove', (e) => {
            if (this.gameStarted && !this.gameOver) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    ensureSoundtrackPlaying() {
        // Check if soundtrack should be playing
        if (this.soundtrack.paused && !this.audioState.soundtrackMuted) {
            console.log('Soundtrack was paused, attempting to play...');
            this.soundtrack.muted = this.audioState.soundtrackMuted;
            this.soundtrack.play().catch(error => {
                console.error('Could not play soundtrack in game constructor:', error);
            });
        }
    }

    // Ensure Tree class is in the global scope
    initGame() {
        // Make Tree class available globally
        window.Tree = Tree;
        
        // ... other initialization code ...
    }

    // Calculate ski positions ensuring they remain parallel
    calculateSkiPositions() {
        if (!this.player) return null;
        
        try {
            const playerX = this.player.x || 0;
            const playerY = this.player.y || 0;
            const skiAngle = this.player.skiAngle || 0;
            const skiDistance = this.tracks.skiDistance;
            const backOffset = 10;
            
            // Calculate perpendicular direction
            const perpX = Math.sin(skiAngle);
            const perpY = -Math.cos(skiAngle);
            
            // Track turn data for curve calculation
            this.tracks.turnHistory.push({
                angle: skiAngle,
                time: Date.now()
            });
            
            // Keep only recent turn history
            if (this.tracks.turnHistory.length > 10) {
                this.tracks.turnHistory.shift();
            }
            
            // Left and right ski positions
            const leftSkiX = playerX - (skiDistance / 2) * perpX;
            const leftSkiY = playerY - (skiDistance / 2) * perpY + backOffset;
            
            const rightSkiX = playerX + (skiDistance / 2) * perpX;
            const rightSkiY = playerY + (skiDistance / 2) * perpY + backOffset;
            
            return {
                left: { x: leftSkiX, y: leftSkiY },
                right: { x: rightSkiX, y: rightSkiY }
            };
        } catch (e) {
            console.error("Error calculating ski positions:", e);
            return null;
        }
    }
    
    // Record player position and create track segments
    recordPlayerPosition() {
        if (!this.tracks || !this.tracks.enabled) {
            return;
        }
        
        try {
            this.tracks.frameCount++;
            
            // Always record during straightlining, otherwise use interval
            const isMovingStraight = Math.abs(this.player.skiAngle) < 0.1;
            const shouldRecord = isMovingStraight || 
                (this.tracks.frameCount % this.tracks.recordInterval === 0);
                
            if (!shouldRecord) {
                return;
            }
            
            // Calculate ski positions
            const skiPositions = this.calculateSkiPositions();
            if (!skiPositions) return;
            
            // Initialize last positions if they're not set
            if (!this.tracks.lastPositions.left.x && !this.tracks.lastPositions.left.y) {
                this.tracks.lastPositions.left = skiPositions.left;
                this.tracks.lastPositions.right = skiPositions.right;
                this.tracks.lastAngles.left = this.player.skiAngle;
                this.tracks.lastAngles.right = this.player.skiAngle;
                return;
            }
            
            // Only create new segments if skis have moved enough
            const leftDist = Math.hypot(
                skiPositions.left.x - this.tracks.lastPositions.left.x,
                skiPositions.left.y - this.tracks.lastPositions.left.y
            );
            
            const rightDist = Math.hypot(
                skiPositions.right.x - this.tracks.lastPositions.right.x,
                skiPositions.right.y - this.tracks.lastPositions.right.y
            );
            
            // Create track segments for both skis
            const minDistance = isMovingStraight ? 3 : 5;
            
            // Check if we're turning
            const turningAmount = Math.abs(this.player.skiAngle - this.tracks.lastAngles.left);
            const isTurning = turningAmount > 0.1;
            
            if (leftDist > minDistance) {
                // Create left ski track
                if (typeof TrackSegment === 'function') {
                    this.tracks.leftSegments.push(new TrackSegment(
                        skiPositions.left.x,
                        skiPositions.left.y,
                        this.player.skiAngle,
                        true
                    ));
                    
                    // Update last position and angle
                    this.tracks.lastPositions.left = skiPositions.left;
                    this.tracks.lastAngles.left = this.player.skiAngle;
                    
                    // Limit segments
                    if (this.tracks.leftSegments.length > this.tracks.maxSegmentsPerSki) {
                        this.tracks.leftSegments = this.tracks.leftSegments.slice(
                            -this.tracks.maxSegmentsPerSki
                        );
                    }
                }
            }
            
            if (rightDist > minDistance) {
                // Create right ski track
                if (typeof TrackSegment === 'function') {
                    this.tracks.rightSegments.push(new TrackSegment(
                        skiPositions.right.x,
                        skiPositions.right.y,
                        this.player.skiAngle,
                        false
                    ));
                    
                    // Update last position and angle
                    this.tracks.lastPositions.right = skiPositions.right;
                    this.tracks.lastAngles.right = this.player.skiAngle;
                    
                    // Limit segments
                    if (this.tracks.rightSegments.length > this.tracks.maxSegmentsPerSki) {
                        this.tracks.rightSegments = this.tracks.rightSegments.slice(
                            -this.tracks.maxSegmentsPerSki
                        );
                    }
                }
            }
        } catch (e) {
            console.error("Error recording player position for tracks:", e);
            this.tracks.enabled = false;
        }
    }
    
    // Update all track segments
    updateTracks() {
        if (!this.tracks || !this.tracks.enabled) {
            return;
        }
        
        try {
            const scrollSpeed = this.scroll ? (this.scroll.speed || 0) : 0;
            
            // Update and filter segments
            this.tracks.leftSegments = this.tracks.leftSegments.filter(segment => {
                if (segment && typeof segment.update === 'function') {
                    segment.update(scrollSpeed);
                    return segment.active;
                }
                return false;
            });
            
            this.tracks.rightSegments = this.tracks.rightSegments.filter(segment => {
                if (segment && typeof segment.update === 'function') {
                    segment.update(scrollSpeed);
                    return segment.active;
                }
                return false;
            });
        } catch (e) {
            console.error("Error updating tracks:", e);
            this.tracks.leftSegments = [];
            this.tracks.rightSegments = [];
        }
    }
    
    // Calculate control points for a smooth curve between three points
    calculateControlPoints(p0, p1, p2) {
        if (!p0 || !p1 || !p2) return null;
        
        try {
            const curveIntensity = this.tracks.curveIntensity;
            
            // Distance between points
            const d01 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
            const d12 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            
            // Normalized distances
            const f1 = curveIntensity * d01 / (d01 + d12);
            const f2 = curveIntensity * d12 / (d01 + d12);
            
            // Control points
            const c1 = {
                x: p1.x - f1 * (p2.x - p0.x),
                y: p1.y - f1 * (p2.y - p0.y)
            };
            
            const c2 = {
                x: p1.x + f2 * (p2.x - p0.x),
                y: p1.y + f2 * (p2.y - p0.y)
            };
            
            return { c1, c2 };
        } catch (e) {
            console.error("Error calculating control points:", e);
            return null;
        }
    }
    
    // Draw smooth curve through a set of points
    drawSmoothCurve(ctx, points) {
        if (!ctx || !points || points.length < 2) return;
        
        try {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            
            // For the first segment, just draw a line
            if (points.length === 2) {
                ctx.lineTo(points[1].x, points[1].y);
                return;
            }
            
            // For each set of 3 consecutive points, draw a quadratic curve
            for (let i = 0; i < points.length - 2; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const p2 = points[i + 2];
                
                // Calculate control points
                const cp = this.calculateControlPoints(p0, p1, p2);
                if (!cp) continue;
                
                // Draw cubic bezier curve
                if (i === 0) {
                    // First segment
                    ctx.quadraticCurveTo(cp.c1.x, cp.c1.y, p1.x, p1.y);
                } else {
                    ctx.bezierCurveTo(
                        cp.c1.x, cp.c1.y,
                        cp.c2.x, cp.c2.y,
                        p1.x, p1.y
                    );
                }
            }
            
            // For the last segment
            const lastIndex = points.length - 1;
            ctx.lineTo(points[lastIndex].x, points[lastIndex].y);
            
            ctx.stroke();
        } catch (e) {
            console.error("Error drawing smooth curve:", e);
        }
    }
    
    // Draw ski tracks with smooth curves
    drawTracks() {
        if (!this.tracks || !this.tracks.enabled || !this.ctx) {
            return;
        }
        
        try {
            const ctx = this.ctx;
            
            // Draw each ski's track as a smooth curved path
            [
                { segments: this.tracks.leftSegments, label: 'left' },
                { segments: this.tracks.rightSegments, label: 'right' }
            ].forEach(({ segments, label }) => {
                if (!segments || segments.length < 2) return;
                
                // Find segments that belong together (no large gaps)
                const paths = [];
                let currentPath = [segments[0]];
                
                for (let i = 1; i < segments.length; i++) {
                    const segment = segments[i];
                    const prevSegment = segments[i-1];
                    
                    if (!segment || !prevSegment) continue;
                    
                    // Check if there's a large gap
                    const distance = Math.hypot(
                        segment.x - prevSegment.x, 
                        segment.y - prevSegment.y
                    );
                    
                    if (distance > 30) {
                        // End current path and start a new one
                        if (currentPath.length > 1) {
                            paths.push([...currentPath]);
                        }
                        currentPath = [segment];
                    } else {
                        // Continue current path
                        currentPath.push(segment);
                    }
                }
                
                // Add the last path if it has points
                if (currentPath.length > 1) {
                    paths.push(currentPath);
                }
                
                // Draw each path with smooth curves
                paths.forEach(path => {
                    if (path.length < 2) return;
                    
                    const points = path.map(segment => ({
                        x: segment.x,
                        y: segment.y
                    }));
                    
                    // Set style based on first segment
                    ctx.strokeStyle = `rgba(200, 200, 210, ${path[0].opacity})`;
                    ctx.lineWidth = path[0].width;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    
                    // For longer paths, apply smooth curve rendering
                    if (path.length >= 3) {
                        this.drawSmoothCurve(ctx, points);
                    } else {
                        // For short paths, just draw lines
                        ctx.beginPath();
                        ctx.moveTo(points[0].x, points[0].y);
                        for (let i = 1; i < points.length; i++) {
                            ctx.lineTo(points[i].x, points[i].y);
                        }
                        ctx.stroke();
                    }
                });
            });
        } catch (e) {
            console.error("Error drawing tracks:", e);
            this.tracks.enabled = false;
        }
    }

    // Spawn new corduroy patch with adjusted width
    spawnCorduroyPatch() {
        if (!this.corduroy || !this.corduroy.enabled || !this.canvas) {
            return;
        }
        
        try {
            // Skip if we have too many patches
            if (this.corduroy.patches.length >= this.corduroy.maxPatches) {
                return;
            }
            
            // Choose a section to spawn into (0 or 1)
            let sectionIndex = Math.floor(Math.random() * 2);
            let section = this.corduroy.sections[sectionIndex];
            
            // If both sections are inactive, choose randomly and set up a new section
            if (!section.active && !this.corduroy.sections[1-sectionIndex].active) {
                // Set up a new section with the narrower width
                const minX = 50;
                const maxWidth = this.canvas.width - 100;
                const width = 100 + Math.random() * 40; // 100-140px for narrower sections
                
                // Calculate x position (keep away from edges)
                const x = minX + Math.random() * (maxWidth - width);
                
                section.active = true;
                section.x = x;
                section.width = width;
                section.nextY = this.canvas.height + 20;
            }
            
            // If selected section is inactive but other is active, use the active one
            if (!section.active && this.corduroy.sections[1-sectionIndex].active) {
                sectionIndex = 1-sectionIndex;
                section = this.corduroy.sections[sectionIndex];
            }
            
            // If we have an active section, spawn a new patch in it
            if (section.active) {
                // Get properties from section
                const x = section.x;
                const width = section.width;
                const y = section.nextY;
                
                // Size with some variation in height only
                const height = 500 + Math.random() * 200; // 500-700px tall
                
                // Slight random angle (very slight for continuity)
                const maxAngle = 0.05; // About 3 degrees max
                const angle = (Math.random() * 2 - 1) * maxAngle;
                
                // Create patch and add to array
                if (typeof CorduroyPatch === 'function') {
                    this.corduroy.patches.push(new CorduroyPatch(
                        x, y, width, height, angle
                    ));
                    
                    // Update section's next spawn position
                    section.nextY = y + height - 50; // Overlap by 50px for continuity
                    
                    // Check if section has extended far enough
                    // If we've spawned a long enough section, consider ending it
                    if (Math.random() < 0.2 && section.nextY > this.canvas.height + 1000) {
                        section.active = false;
                    }
                }
            } else {
                // All sections inactive - set up a new one with narrower width
                const minX = 50;
                const maxWidth = this.canvas.width - 100;
                const width = 100 + Math.random() * 40; // 100-140px
                const x = minX + Math.random() * (maxWidth - width);
                
                section.active = true;
                section.x = x;
                section.width = width;
                section.nextY = this.canvas.height + 20;
                
                // Then spawn first patch in new section
                const height = 500 + Math.random() * 200;
                const angle = (Math.random() * 2 - 1) * 0.05;
                
                if (typeof CorduroyPatch === 'function') {
                    this.corduroy.patches.push(new CorduroyPatch(
                        x, this.canvas.height + 20, width, height, angle
                    ));
                    
                    section.nextY = this.canvas.height + 20 + height - 50;
                }
            }
        } catch (e) {
            console.error("Error spawning corduroy patch:", e);
        }
    }
    
    // Update corduroy patches
    updateCorduroy() {
        if (!this.corduroy || !this.corduroy.enabled) {
            return;
        }
        
        try {
            const scrollSpeed = this.scroll ? (this.scroll.speed || 0) : 0;
            
            // Update existing patches
            this.corduroy.patches = this.corduroy.patches.filter(patch => {
                if (patch && typeof patch.update === 'function') {
                    patch.update(scrollSpeed);
                    return patch.active;
                }
                return false;
            });
            
            // Spawn new patches periodically
            const currentTime = Date.now();
            if (currentTime - this.corduroy.lastPatchTime > this.corduroy.patchInterval) {
                if (Math.random() < this.corduroy.spawnChance) {
                    this.spawnCorduroyPatch();
                }
                this.corduroy.lastPatchTime = currentTime;
            }
        } catch (e) {
            console.error("Error updating corduroy:", e);
            this.corduroy.patches = [];
        }
    }
    
    // Draw corduroy patches
    drawCorduroy() {
        if (!this.corduroy || !this.corduroy.enabled || !this.ctx) {
            return;
        }
        
        try {
            // Draw each patch
            this.corduroy.patches.forEach(patch => {
                if (patch && typeof patch.draw === 'function') {
                    patch.draw(this.ctx);
                }
            });
        } catch (e) {
            console.error("Error drawing corduroy:", e);
            this.corduroy.enabled = false;
        }
    }

    // Spawn new crud snow patch with reduced size
    spawnCrudPatch() {
        if (!this.crudSnow || !this.crudSnow.enabled || !this.canvas) {
            return;
        }
        
        try {
            // Skip if we have too many patches
            if (this.crudSnow.patches.length >= this.crudSnow.maxPatches) {
                return;
            }
            
            // Random position - same positioning logic
            const minX = 20;
            const maxX = this.canvas.width - 300;
            const x = minX + Math.random() * (maxX - minX);
            
            // Keep the reduced size
            const width = 180 + Math.random() * 100; // Keep at 180-280px
            const height = 220 + Math.random() * 120; // Keep at 220-340px
            
            // Start below screen
            const y = this.canvas.height + 20;
            
            // Create patch and add to array
            if (typeof CrudPatch === 'function') {
                this.crudSnow.patches.push(new CrudPatch(
                    x, y, width, height
                ));
            }
        } catch (e) {
            console.error("Error spawning crud patch:", e);
        }
    }
    
    // Update crud snow patches
    updateCrudSnow() {
        if (!this.crudSnow || !this.crudSnow.enabled) {
            return;
        }
        
        try {
            const scrollSpeed = this.scroll ? (this.scroll.speed || 0) : 0;
            
            // Update existing patches
            this.crudSnow.patches = this.crudSnow.patches.filter(patch => {
                if (patch && typeof patch.update === 'function') {
                    patch.update(scrollSpeed);
                    return patch.active;
                }
                return false;
            });
            
            // Spawn new patches periodically
            const currentTime = Date.now();
            if (currentTime - this.crudSnow.lastPatchTime > this.crudSnow.patchInterval) {
                if (Math.random() < this.crudSnow.spawnChance) {
                    this.spawnCrudPatch();
                }
                this.crudSnow.lastPatchTime = currentTime;
            }
        } catch (e) {
            console.error("Error updating crud snow:", e);
            this.crudSnow.patches = [];
        }
    }
    
    // Draw crud snow patches
    drawCrudSnow() {
        if (!this.crudSnow || !this.crudSnow.enabled || !this.ctx) {
            return;
        }
        
        try {
            // Draw each patch
            this.crudSnow.patches.forEach(patch => {
                if (patch && typeof patch.draw === 'function') {
                    patch.draw(this.ctx);
                }
            });
        } catch (e) {
            console.error("Error drawing crud snow:", e);
            this.crudSnow.enabled = false;
        }
    }
}

// Make sure Tree class is available
if (typeof Tree !== 'function') {
    window.Tree = Tree;
}

// Google Analytics event tracking function
function sendGAEvent(eventName, eventParams = {}) {
    if (window.gtag) {
        gtag('event', eventName, eventParams);
        console.log('GA Event:', eventName, eventParams);
    }
}

// Start screen handling
document.addEventListener('DOMContentLoaded', function() {
    // Load audio preferences
    audioState.loadPreferences();
    
    const startScreen = document.getElementById('startScreen');
    const startButton = document.getElementById('startButton');
    const gameContainer = document.querySelector('.game-container');
    const soundtrack = document.getElementById('soundtrack');
    const soundtrackToggle = document.getElementById('soundtrackToggle');
    const soundEffectsToggle = document.getElementById('soundEffectsToggle');
    
    // Set soundtrack volume
    soundtrack.volume = 0.3;
    soundtrack.muted = audioState.soundtrackMuted;
    
    // Initialize toggle buttons based on loaded preferences
    updateToggleButton(soundtrackToggle, !audioState.soundtrackMuted);
    updateToggleButton(soundEffectsToggle, !audioState.soundEffectsMuted);
    
    // Soundtrack toggle
    soundtrackToggle.addEventListener('click', function() {
        const isActive = this.classList.contains('active');
        audioState.soundtrackMuted = isActive;
        updateToggleButton(this, !isActive);
        
        // Apply mute state to soundtrack
        soundtrack.muted = audioState.soundtrackMuted;
        
        // Save preferences
        audioState.savePreferences();
        
        // Track event
        sendGAEvent('audio_setting_changed', {
            'setting': 'soundtrack',
            'state': audioState.soundtrackMuted ? 'muted' : 'unmuted'
        });
    });
    
    // Sound effects toggle
    soundEffectsToggle.addEventListener('click', function() {
        const isActive = this.classList.contains('active');
        audioState.soundEffectsMuted = isActive;
        updateToggleButton(this, !isActive);
        
        // Save preferences
        audioState.savePreferences();
        
        // Track event
        sendGAEvent('audio_setting_changed', {
            'setting': 'sound_effects',
            'state': audioState.soundEffectsMuted ? 'muted' : 'unmuted'
        });
    });
    
    // Helper function to update toggle button appearance
    function updateToggleButton(button, isActive) {
        if (isActive) {
            button.classList.add('active');
            button.classList.remove('inactive');
            button.setAttribute('aria-pressed', 'false');
            
            // Use simpler icons
            if (button.id === 'soundtrackToggle') {
                button.querySelector('.toggle-icon').textContent = '♫';
            } else {
                button.querySelector('.toggle-icon').textContent = '♪';
            }
        } else {
            button.classList.remove('active');
            button.classList.add('inactive');
            button.setAttribute('aria-pressed', 'true');
            button.querySelector('.toggle-icon').textContent = '✕';
        }
    }
    
    // Add touch events to toggle buttons
    soundtrackToggle.addEventListener('touchstart', function(e) {
        e.preventDefault();
        this.click();
    });
    
    soundEffectsToggle.addEventListener('touchstart', function(e) {
        e.preventDefault();
        this.click();
    });
    
    // Add click event to start button
    startButton.addEventListener('click', function() {
        // Hide start screen
        startScreen.style.display = 'none';
        
        // Show game container
        gameContainer.style.display = 'block';
        
        // Start the soundtrack with user interaction
        startSoundtrack();
        
        // Track game start
        sendGAEvent('game_start', {
            'timestamp': new Date().toISOString()
        });
        
        // Start the game
        new Game();
    });
    
    // Add touch event to start button
    startButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        this.click();
    });
    
    // Function to start soundtrack with better browser compatibility
    function startSoundtrack() {
        // Create a new audio context on user interaction
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            // Initialize audio context to unlock audio on iOS
            const audioContext = new AudioContext();
            
            // Resume audio context if it's suspended
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }
        
        // Try multiple approaches to start the soundtrack
        const playPromise = soundtrack.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('Soundtrack started successfully');
            }).catch(error => {
                console.error('Error playing soundtrack:', error);
                
                // Fallback method: try again after a short delay
                setTimeout(() => {
                    soundtrack.play().catch(e => {
                        console.error('Second attempt failed:', e);
                        
                        // Last resort: add a manual play button
                        if (!document.getElementById('audioFix')) {
                            addAudioFixButton();
                        }
                    });
                }, 1000);
            });
        }
    }
    
    // Function to add a temporary audio fix button if needed
    function addAudioFixButton() {
        const audioFixButton = document.createElement('button');
        audioFixButton.id = 'audioFix';
        audioFixButton.textContent = 'Enable Music';
        audioFixButton.style.position = 'absolute';
        audioFixButton.style.top = '10px';
        audioFixButton.style.right = '10px';
        audioFixButton.style.zIndex = '1000';
        audioFixButton.style.padding = '5px 10px';
        audioFixButton.style.backgroundColor = '#000';
        audioFixButton.style.color = '#fff';
        audioFixButton.style.border = '2px solid #fff';
        audioFixButton.style.fontFamily = "'Press Start 2P', cursive";
        audioFixButton.style.fontSize = '10px';
        
        audioFixButton.addEventListener('click', function() {
            soundtrack.play();
            this.remove();
        });
        
        document.body.appendChild(audioFixButton);
    }
});

// Prevent default touch behavior on the document
document.addEventListener('touchstart', function(e) {
    if (e.target.tagName !== 'BUTTON') {
        e.preventDefault();
    }
}, { passive: false });

// Prevent pull-to-refresh and other browser gestures
document.body.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

// Add a global function to check and fix audio
window.fixAudio = function() {
    const soundtrack = document.getElementById('soundtrack');
    if (soundtrack && soundtrack.paused) {
        soundtrack.play();
    }
};

// Try to unlock audio on first user interaction with the page
document.addEventListener('click', function audioUnlock() {
    window.fixAudio();
    document.removeEventListener('click', audioUnlock);
}, { once: true });

document.addEventListener('touchstart', function audioUnlockTouch() {
    window.fixAudio();
    document.removeEventListener('touchstart', audioUnlockTouch);
}, { once: true, passive: false }); 

// Update the CorduroyPatch class with the requested changes
class CorduroyPatch {
    constructor(x, y, width, height, angle) {
        this.x = x;
        this.y = y;
        this.width = width || 120; // Reverted to 120px width
        this.height = height || 500; // Keeping the longer height
        this.angle = angle || 0;
        this.opacity = 0.8;
        this.lineSpacing = 5 + Math.random() * 3;
        this.lineThickness = 1;
        this.active = true;
    }
    
    update(scrollSpeed) {
        // Move with scroll
        this.y -= scrollSpeed;
        
        // Deactivate when off screen
        if (this.y + this.height < -50) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        if (!ctx) return;
        
        try {
            // Skip if completely off screen
            if (this.y > 650 || this.y + this.height < 0) {
                return;
            }
            
            // Save context state
            ctx.save();
            
            // Set up clipping region for the patch
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.clip();
            
            // Set line style
            ctx.strokeStyle = `rgba(204, 204, 204, ${this.opacity})`;
            ctx.lineWidth = this.lineThickness;
            
            // Calculate number of lines based on spacing
            const numLines = Math.ceil(this.width / this.lineSpacing) + 4;
            
            // Apply rotation if needed
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.angle);
            ctx.translate(-(this.x + this.width/2), -(this.y + this.height/2));
            
            // Draw corduroy lines with restored waviness
            for (let i = -2; i < numLines; i++) {
                const xPos = this.x + i * this.lineSpacing;
                
                // Determine waviness for this line (restored)
                const hasWaviness = Math.random() < 0.3;
                const waviness = hasWaviness ? 2 : 0; // Amount of wave in pixels
                
                ctx.beginPath();
                ctx.moveTo(xPos, this.y - 20);
                
                // Draw with or without waviness
                if (waviness > 0) {
                    // Draw wavy line
                    for (let y = this.y - 20; y < this.y + this.height + 20; y += 5) {
                        const xOffset = Math.sin((y - this.y) / 20) * waviness;
                        ctx.lineTo(xPos + xOffset, y);
                    }
                } else {
                    // Draw straight line
                    ctx.lineTo(xPos, this.y + this.height + 20);
                }
                
                ctx.stroke();
            }
            
            // Restore context
            ctx.restore();
        } catch (e) {
            console.error("Error drawing corduroy:", e);
        }
    }
} 

// Updated CrudPatch class with original pixel density but reduced opacity
class CrudPatch {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width || 280; // Wider patches
        this.height = height || 360; // Taller patches
        this.opacity = 0.5; // Keeping at 50%
        this.active = true;
        
        // Generate irregular patch shape
        this.shape = this.generateIrregularShape();
        
        // Generate pixelated features
        this.pixels = [];
        this.generatePixels();
    }
    
    // Create an irregular outline for the patch
    generateIrregularShape() {
        const points = 8 + Math.floor(Math.random() * 4); // 8-11 points
        const vertices = [];
        
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            // Base radius is half the width/height, with variation
            const radiusX = (this.width / 2) * (0.7 + Math.random() * 0.6); // 70-130% of radius
            const radiusY = (this.height / 2) * (0.7 + Math.random() * 0.6); // 70-130% of radius
            
            vertices.push({
                x: (this.width / 2) + Math.cos(angle) * radiusX,
                y: (this.height / 2) + Math.sin(angle) * radiusY
            });
        }
        
        return vertices;
    }
    
    // Check if a point is inside the irregular shape
    isInside(x, y) {
        // Simple point-in-polygon algorithm
        let inside = false;
        for (let i = 0, j = this.shape.length - 1; i < this.shape.length; j = i++) {
            const xi = this.shape[i].x, yi = this.shape[i].y;
            const xj = this.shape[j].x, yj = this.shape[j].y;
            
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
    
    // Generate pixelated texture with original density
    generatePixels() {
        // Generate a grid of potential pixel positions
        const pixelSize = 4;
        const gridSpacing = 6; // Reverted back to original 6 (from 8)
        
        const gridWidth = Math.ceil(this.width / gridSpacing);
        const gridHeight = Math.ceil(this.height / gridSpacing);
        
        // Fill rate - reverted to original
        const fillRate = 0.2; // Reverted back to original 0.2 (from 0.1)
        
        // Create pixels
        for (let gridY = 0; gridY < gridHeight; gridY++) {
            for (let gridX = 0; gridX < gridWidth; gridX++) {
                const x = gridX * gridSpacing + (Math.random() * 2 - 1);
                const y = gridY * gridSpacing + (Math.random() * 2 - 1);
                
                if (this.isInside(x, y) && Math.random() < fillRate) {
                    if (Math.random() < 0.8) {
                        this.addPixel(x, y, pixelSize);
                    } else {
                        this.addPixelCluster(x, y, pixelSize);
                    }
                }
            }
        }
    }
    
    // Add a single pixel
    addPixel(x, y, size) {
        // Vary the shade of gray
        // Use black for some pixels as in the example image
        const isBlack = Math.random() < 0.15; // 15% black pixels
        const shade = isBlack ? 0 : 120 + Math.floor(Math.random() * 120); // Either black or 120-240 (medium to light gray)
        
        this.pixels.push({
            x: x,
            y: y,
            size: size * (0.8 + Math.random() * 0.4), // Slight size variation
            shade: shade
        });
    }
    
    // Add a small cluster of 2-4 connected pixels
    addPixelCluster(centerX, centerY, baseSize) {
        const clusterSize = 2 + Math.floor(Math.random() * 3); // 2-4 pixels
        
        // Same color for all pixels in cluster
        const isBlack = Math.random() < 0.15; // 15% black clusters
        const shade = isBlack ? 0 : 120 + Math.floor(Math.random() * 120);
        
        // Add center pixel
        this.pixels.push({
            x: centerX,
            y: centerY,
            size: baseSize * (0.8 + Math.random() * 0.4),
            shade: shade
        });
        
        // Add satellite pixels
        for (let i = 1; i < clusterSize; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = baseSize * 1.1; // Slightly more than size to create connected look
            
            this.pixels.push({
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance,
                size: baseSize * (0.7 + Math.random() * 0.4), // Slightly smaller
                shade: shade
            });
        }
    }
    
    update(scrollSpeed) {
        // Move with scroll
        this.y -= scrollSpeed;
        
        // Deactivate when off screen
        if (this.y + this.height < -50) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        if (!ctx) return;
        
        try {
            // Skip if off screen
            if (this.y > 650 || this.y + this.height < 0) {
                return;
            }
            
            // Draw all pixels
            this.pixels.forEach(pixel => {
                ctx.fillStyle = `rgba(${pixel.shade}, ${pixel.shade}, ${pixel.shade}, ${this.opacity})`;
                ctx.fillRect(
                    this.x + pixel.x - pixel.size/2,
                    this.y + pixel.y - pixel.size/2,
                    pixel.size,
                    pixel.size
                );
            });
            
            // Debug: draw patch outline
            // ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
            // ctx.beginPath();
            // ctx.moveTo(this.x + this.shape[0].x, this.y + this.shape[0].y);
            // for (let i = 1; i < this.shape.length; i++) {
            //     ctx.lineTo(this.x + this.shape[i].x, this.y + this.shape[i].y);
            // }
            // ctx.closePath();
            // ctx.stroke();
        } catch (e) {
            console.error("Error drawing crud snow:", e);
        }
    }
}

// Make CrudPatch available globally
window.CrudPatch = CrudPatch;

// Initialize snow textures when game loads
window.addEventListener('load', function() {
    window.CorduroyPatch = CorduroyPatch;
    window.CrudPatch = CrudPatch;
});