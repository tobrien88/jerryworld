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

        // Add soundtrack reference
        this.soundtrack = document.getElementById('soundtrack');
        
        // Add game start time tracking for play duration
        this.gameStartTime = Date.now();
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
        // Remove any existing speed up alerts first
        const existingAlert = document.querySelector('.speed-up-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const speedUpAlert = document.createElement('div');
        speedUpAlert.className = 'speed-up-alert';
        
        speedUpAlert.innerHTML = `
            <div class="alert-text">SEND IT!</div>
            <div class="level-text">LEVEL ${this.speedProgression.currentLevel + 1}</div>
        `;
        
        document.querySelector('.game-container').appendChild(speedUpAlert);

        setTimeout(() => {
            speedUpAlert.classList.add('fade-out');
            setTimeout(() => {
                speedUpAlert.remove();
            }, 500);
        }, 3000);
    }

    showZigzaggerWarning() {
        // Special warning when zigzaggers start appearing
        const warningAlert = document.createElement('div');
        warningAlert.className = 'speed-up-alert';
        
        warningAlert.innerHTML = `
            <div class="alert-text">WATCH OUT!</div>
            <div class="level-text">GONG SHOW AHEAD!</div>
            <div class="level-text">LEVEL ${this.speedProgression.currentLevel + 1}</div>
        `;
        
        document.querySelector('.game-container').appendChild(warningAlert);

        setTimeout(() => {
            warningAlert.classList.add('fade-out');
            setTimeout(() => {
                warningAlert.remove();
            }, 500);
        }, 3000);
        
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
        
        // Activate zigzagger delay
        this.zigzaggerDelay.active = true;
        this.zigzaggerDelay.startTime = Date.now();
        console.log("Zigzagger delay activated - waiting 5 seconds before first spawn");
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

        // Update player movement with both keyboard and touch controls
        const previousSkiAngle = this.player.skiAngle;
        let directionChanged = false;
        
        // Combine keyboard and touch inputs
        const movingLeft = (this.keys['ArrowLeft'] || this.keys['a'] || this.touchControls.left);
        const movingRight = (this.keys['ArrowRight'] || this.keys['d'] || this.touchControls.right);
        
        if (movingLeft && this.player.x > 0) {
            this.player.x -= this.player.speed;
            
            // Check if direction actually changed
            if (previousSkiAngle <= 0) {
                directionChanged = true;
            }
            
            this.player.skiAngle = Math.PI / 4;
        } else if (movingRight && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
            
            // Check if direction actually changed
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
        if (this.scroll.y >= 100) {
            this.scroll.y = 0;
        }

        // Update track markers
        this.trackMarkers.forEach(marker => {
            marker.y -= this.scroll.speed;
            if (marker.y < -50) {
                marker.y = this.canvas.height + 50;
            }
        });

        // Spawn new obstacles
        const currentTime = Date.now();
        
        // Always check for tumblers and stoppers
        if (currentTime - this.lastTumblerTime > this.tumblerInterval) {
            this.spawnTumbler();
        }
        
        if (currentTime - this.lastStopperTime > this.stopperInterval) {
            this.spawnStopperGroup();
        }
        
        // Check for zigzaggers only at level 3+
        this.spawnZigzagger(); // The check is now inside the method
        
        // Update obstacles
        this.obstacles = this.obstacles.filter(obs => obs.active);
        this.obstacles.forEach(obs => {
            if (obs instanceof Zigzagger) {
                obs.updateSpeed(this.currentSpeeds.zigzagger);
            }
            obs.update(this.scroll.speed);
        });

        // Check for collisions
        this.checkCollisions();

        // Update score - faster accumulation
        this.score += 2; // Increased from 1 to 2 for base score increment
        const displayScore = Math.floor(this.score / this.scoreMultiplier); // Divided by 5 instead of 10
        document.getElementById('score').textContent = 
            `SCORE: ${String(displayScore).padStart(6, '0')}`;
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

            // Get obstacle hitbox
            let obsBox;
            if (obs instanceof Tumbler) {
                obsBox = obs.getHitbox();
            } else if (obs instanceof Zigzagger) {
                obsBox = obs.getHitbox();
            } else {
                // Default hitbox for other obstacles
                obsBox = {
                    left: obs.x - obs.width/2,
                    right: obs.x + obs.width/2,
                    top: obs.y,
                    bottom: obs.y + obs.height
                };
            }

            // Check if either ski intersects with obstacle
            if (this.lineIntersectsBox(leftSki, obsBox) || 
                this.lineIntersectsBox(rightSki, obsBox)) {
                this.handleCollision();
                break;
            }
        }
    }

    lineIntersectsBox(line, box) {
        // Check if line segment intersects with rectangle
        const lines = [
            {x1: box.left, y1: box.top, x2: box.right, y2: box.top},
            {x1: box.right, y1: box.top, x2: box.right, y2: box.bottom},
            {x1: box.right, y1: box.bottom, x2: box.left, y2: box.bottom},
            {x1: box.left, y1: box.bottom, x2: box.left, y2: box.top}
        ];

        for (let boxLine of lines) {
            if (this.lineIntersectsLine(line, boxLine)) {
                return true;
            }
        }

        return false;
    }

    lineIntersectsLine(line1, line2) {
        const x1 = line1.x1, y1 = line1.y1;
        const x2 = line1.x2, y2 = line1.y2;
        const x3 = line2.x1, y3 = line2.y1;
        const x4 = line2.x2, y4 = line2.y2;

        const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denominator === 0) return false;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }

    showGameOver() {
        this.gameOverDisplay.style.display = 'flex';
        const formattedScore = String(this.finalScore).padStart(6, '0');
        this.gameOverDisplay.innerHTML = `
            <div class="game-over-content">
                <h2>GAME OVER</h2>
                <p>FINAL SCORE</p>
                <p>${formattedScore}</p>
                <button onclick="location.reload()">CONTINUE?</button>
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

        // Make continue button touch-friendly
        setTimeout(() => {
            const continueButton = document.querySelector('.game-over-content button');
            if (continueButton) {
                continueButton.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    this.click();
                });
            }
        }, 100);
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snow background
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw track markers
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 2;
        this.trackMarkers.forEach(marker => {
            this.ctx.beginPath();
            this.ctx.moveTo(marker.x1, marker.y);
            this.ctx.lineTo(marker.x2, marker.y);
            this.ctx.stroke();
        });

        // Draw obstacles
        this.obstacles.forEach(obs => obs.draw(this.ctx));

        // Draw player or crash animation
        if (this.crashing) {
            this.drawCrashingPlayer();
        } else if (!this.gameOver) {
            this.drawPlayer();
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
    // Track page visit
    sendGAEvent('page_view', {
        'page_title': 'Jerry World: Send It!',
        'page_location': window.location.href
    });
    
    const startScreen = document.getElementById('startScreen');
    const startButton = document.getElementById('startButton');
    const gameContainer = document.querySelector('.game-container');
    const soundtrack = document.getElementById('soundtrack');
    
    // Set soundtrack volume lower than sound effects
    soundtrack.volume = 0.3;
    
    startButton.addEventListener('click', function() {
        // Hide start screen
        startScreen.style.display = 'none';
        
        // Show game container
        gameContainer.style.display = 'block';
        
        // Start the soundtrack
        playSoundtrack();
        
        // Track game start
        sendGAEvent('game_start', {
            'timestamp': new Date().toISOString()
        });
        
        // Start the game
        new Game();
    });
    
    // Function to play soundtrack
    function playSoundtrack() {
        soundtrack.play().catch(error => {
            console.error("Error playing soundtrack:", error);
            document.addEventListener('click', () => {
                soundtrack.play().catch(e => console.error("Still can't play soundtrack:", e));
            }, { once: true });
        });
    }

    // Make start button touch-friendly
    startButton.addEventListener('touchstart', function(e) {
        e.preventDefault(); // Prevent default touch behavior
        this.click(); // Trigger the click event
    });
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