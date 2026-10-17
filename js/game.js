// Fast Drive 3D - Main Game Controller & Physics Engine

class FastDriveGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.gameState = 'MENU'; // 'MENU', 'GARAGE', 'SETTINGS', 'RECORDS', 'PLAYING', 'PAUSED', 'GAMEOVER'

        // Three.js Core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        // Subsystems
        this.world = null;
        this.traffic = null;

        // Player Vehicle
        this.playerCarGroup = null;
        this.playerCarData = null;
        this.playerSpeed = 0; // km/h
        this.playerMaxSpeed = 180;
        this.playerAccel = 7.5;
        this.playerHandling = 8.5;
        this.nitroPower = 1.3;
        this.nitroAmount = 100; // 0 - 100%
        this.isNitroActive = false;

        // Position & Steering Physics
        this.playerX = 0;
        this.playerZ = 0;
        this.roadLimitX = 7.8;
        this.steerInput = 0; // -1 to 1
        this.throttleInput = 0; // 1 = gaz, -1 = tormoz, 0 = inersiya
        this.carRoll = 0;
        this.wheelTurnAngle = 0;

        // Active Powerups
        this.activePowerups = {
            magnet: 0,
            shield: false,
            doubleScore: 0
        };
        this.shieldMesh = null;

        // Score & Game Stats
        this.score = 0;
        this.distance = 0;
        this.coinsCollected = 0;
        this.nearMissCount = 0;

        // Camera Shake
        this.shakeIntensity = 0;

        // Showroom (Garage & Menu)
        this.showroomCar = null;
        this.showroomRotation = 0;
        this.currentGarageCarIndex = 0;

        // Input state
        this.keys = {};
        this.steeringWheelAngle = 0; // in degrees
        this.isDraggingWheel = false;
        this.wheelDragStartY = 0;

        // Initialize Game
        this.initThree();
        this.initSubsystems();
        this.initInputListeners();
        this.initUI();
        this.setupShowroom();

        // Start render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    // 1. Initialize Three.js scene, camera, renderer
    initThree() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initSubsystems() {
        this.world = new WorldManager(this.scene);
        this.traffic = new TrafficManager(this.scene);

        // Apply saved theme
        this.world.setTheme(window.settingsManager.theme === 'night');
    }

    // 2. Setup Showroom for Menu and Garage
    setupShowroom() {
        if (this.showroomCar) {
            this.scene.remove(this.showroomCar);
        }

        const selected = window.garageManager.getSelectedCar();
        this.showroomCar = CarBuilder.build(selected.id, selected.currentColor);
        this.showroomCar.position.set(0, 0, 0);
        this.scene.add(this.showroomCar);

        // Position camera for showroom
        this.camera.position.set(3.8, 2.2, 5.0);
        this.camera.lookAt(0, 0.7, 0);
    }

    // 3. Spawn / Rebuild Player Car for In-Game
    spawnPlayerCar() {
        if (this.playerCarGroup) {
            this.scene.remove(this.playerCarGroup);
        }

        const carData = window.garageManager.getSelectedCar();
        this.playerCarData = carData;
        this.playerMaxSpeed = carData.speed;
        this.playerAccel = carData.accel;
        this.playerHandling = carData.handling;
        this.nitroPower = carData.nitroPower;

        this.playerCarGroup = CarBuilder.build(carData.id, carData.currentColor);
        this.playerCarGroup.position.set(0, 0, 0);
        this.scene.add(this.playerCarGroup);

        // Shield Bubble Mesh
        const shieldGeo = new THREE.SphereGeometry(2.4, 24, 24);
        const shieldMat = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.35,
            wireframe: true
        });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.shieldMesh.position.y = 0.8;
        this.shieldMesh.visible = false;
        this.playerCarGroup.add(this.shieldMesh);

        this.playerX = 0;
        this.playerZ = 0;
        this.playerSpeed = 0;
        this.nitroAmount = 100;
        this.score = 0;
        this.distance = 0;
        this.coinsCollected = 0;
        this.activePowerups = { magnet: 0, shield: false, doubleScore: 0 };
    }

    // 4. Start Gameplay
    startGame() {
        window.soundManager.resume();
        window.soundManager.startMusic();
        window.soundManager.startEngine();

        this.gameState = 'PLAYING';
        this.hideAllMenus();
        document.getElementById('hud-screen').classList.remove('hidden');

        // Setup Virtual Steering Wheel or touch buttons based on settings
        this.updateControlOverlay();

        // Reset world and traffic
        this.world.reset();
        this.traffic.reset();
        this.spawnPlayerCar();
    }

    updateControlOverlay() {
        const steering = window.settingsManager.steeringType;
        const wheelEl = document.getElementById('steering-wheel-container');
        const touchBtns = document.getElementById('touch-controls-container');

        if (steering === 'wheel') {
            wheelEl.classList.remove('hidden');
            touchBtns.classList.add('hidden');
        } else if (steering === 'touchButtons') {
            wheelEl.classList.add('hidden');
            touchBtns.classList.remove('hidden');
        } else {
            wheelEl.classList.add('hidden');
            touchBtns.classList.add('hidden');
        }
    }

    // 5. Game Loop & Physics Update
    animate() {
        requestAnimationFrame(this.animate);
        const delta = Math.min(this.clock.getDelta(), 0.1);

        if (this.gameState === 'MENU' || this.gameState === 'GARAGE') {
            // Showroom Turntable Animation
            if (this.showroomCar) {
                this.showroomRotation += 0.5 * delta;
                this.showroomCar.rotation.y = this.showroomRotation;
            }
            this.renderer.render(this.scene, this.camera);
            return;
        }

        if (this.gameState === 'PLAYING') {
            this.updatePhysics(delta);
            this.updateTrafficAndWorld(delta);
            this.updatePowerups(delta);
            this.updateCamera(delta);
            this.updateHUD();
        }

        this.renderer.render(this.scene, this.camera);
    }

    updatePhysics(delta) {
        // Read Inputs based on steering type
        this.readInputs();

        // Acceleration & Nitro
        const isBraking = this.throttleInput < 0;
        const isAccelerating = this.throttleInput > 0;

        let effectiveMaxSpeed = this.playerMaxSpeed;
        let effectiveAccel = this.playerAccel;

        // Nitro handling
        if (this.isNitroActive && this.nitroAmount > 0) {
            effectiveMaxSpeed *= this.nitroPower;
            effectiveAccel *= 1.8;
            this.nitroAmount = Math.max(0, this.nitroAmount - 32 * delta);
            window.soundManager.playNitro();

            // Spawn nitro flames
            const exhaustPos = this.playerCarGroup.position.clone();
            exhaustPos.y += 0.3;
            exhaustPos.z -= 2.2;
            this.world.createNitroFlame(exhaustPos);
        } else {
            // Nitro passive recharge
            this.nitroAmount = Math.min(100, this.nitroAmount + 6 * delta);
        }

        // Speed calculation
        if (isAccelerating) {
            this.playerSpeed += effectiveAccel * 6.5 * delta;
        } else if (isBraking) {
            this.playerSpeed -= 28.0 * delta; // Sharp braking
            window.soundManager.playBrake();
        } else {
            // Natural drag / rolling friction
            this.playerSpeed -= 6.0 * delta;
        }

        this.playerSpeed = Math.max(0, Math.min(effectiveMaxSpeed, this.playerSpeed));

        // Update Sound Pitch
        const speedRatio = this.playerSpeed / this.playerMaxSpeed;
        window.soundManager.updateEngine(speedRatio, isAccelerating || this.isNitroActive);

        // Taillights braking glow
        if (this.playerCarGroup.userData.taillights) {
            this.playerCarGroup.userData.taillights.forEach(tl => {
                tl.material.emissiveIntensity = isBraking ? 2.5 : 0.7;
            });
        }

        // Lateral Steering Movement
        const speedFactor = Math.min(1.0, this.playerSpeed / 30); // Need speed to turn
        const lateralMove = this.steerInput * this.playerHandling * 1.8 * speedFactor * delta;
        this.playerX += lateralMove; // Standard steering response (+X is right, -X is left)

        // Clamp to highway boundaries
        this.playerX = Math.max(-this.roadLimitX, Math.min(this.roadLimitX, this.playerX));

        // Distance & Z movement
        const unitsPerSec = (this.playerSpeed / 3.6);
        const dz = unitsPerSec * delta;
        this.playerZ += dz;
        this.distance += dz;

        // Score accrual (multiplier if 2x powerup active)
        const scoreMultiplier = this.activePowerups.doubleScore > 0 ? 2 : 1;
        this.score += dz * 1.5 * (1 + speedRatio) * scoreMultiplier;

        // Update Car Transform
        this.playerCarGroup.position.set(this.playerX, 0, this.playerZ);

        // Visual Suspension Roll / Banking on turn
        const targetRoll = -this.steerInput * 0.08 * speedFactor;
        this.carRoll = THREE.MathUtils.lerp(this.carRoll, targetRoll, 8.0 * delta);
        this.playerCarGroup.rotation.z = this.carRoll;
        this.playerCarGroup.rotation.y = -this.steerInput * 0.08 * speedFactor;

        // Wheel Rotations
        const wheelCircumference = 2 * Math.PI * 0.36;
        const wheelRotSpeed = (unitsPerSec / wheelCircumference) * Math.PI * 2 * delta;

        if (this.playerCarGroup.userData.wheels) {
            this.playerCarGroup.userData.wheels.forEach(w => {
                w.rotation.x += wheelRotSpeed;
            });
        }

        // Front wheels turn angle
        if (this.playerCarGroup.userData.frontWheels) {
            this.wheelTurnAngle = THREE.MathUtils.lerp(this.wheelTurnAngle, -this.steerInput * 0.45, 10 * delta);
            this.playerCarGroup.userData.frontWheels.forEach(wAnchor => {
                wAnchor.rotation.y = this.wheelTurnAngle;
            });
        }
    }

    readInputs() {
        const steeringType = window.settingsManager.steeringType;

        // 1. Keyboard Inputs
        let keySteer = 0;
        let keyThrottle = 0;
        let keyNitro = false;

        if (this.keys['KeyA'] || this.keys['ArrowLeft']) keySteer -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) keySteer += 1;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) keyThrottle = 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) keyThrottle = -1;
        if (this.keys['Space'] || this.keys['ShiftLeft'] || this.keys['ShiftRight']) keyNitro = true;

        if (steeringType === 'wheel') {
            // Steering Wheel input normalized (-90 deg to +90 deg -> -1 to 1)
            this.steerInput = Math.max(-1, Math.min(1, this.steeringWheelAngle / 85));
            this.throttleInput = keyThrottle !== 0 ? keyThrottle : (this.touchGaz ? 1 : (this.touchBrake ? -1 : 0));
            this.isNitroActive = keyNitro || this.touchNitro;
        } else if (steeringType === 'touchButtons') {
            this.steerInput = this.touchSteer || 0;
            this.throttleInput = this.touchGaz ? 1 : (this.touchBrake ? -1 : 0);
            this.isNitroActive = this.touchNitro;
        } else if (steeringType === 'mouse') {
            // Mouse pointer position across window width
            if (this.mouseXNormalized !== undefined) {
                this.steerInput = this.mouseXNormalized;
            }
            this.throttleInput = keyThrottle !== 0 ? keyThrottle : 1; // Auto gas with mouse unless S pressed
            this.isNitroActive = keyNitro || this.mouseNitro;
        } else {
            // Keyboard (Default)
            this.steerInput = keySteer;
            this.throttleInput = keyThrottle;
            this.isNitroActive = keyNitro;
        }
    }

    updateTrafficAndWorld(delta) {
        const isMagnetActive = this.activePowerups.magnet > 0;
        this.world.update(delta, this.playerZ, isMagnetActive, this.playerCarGroup.position);
        this.traffic.update(delta, this.playerZ, this.playerSpeed);

        // Check Traffic Collision
        const collision = this.traffic.checkCollision(this.playerCarGroup.position);
        if (collision.collided) {
            // Check if Shield is active
            if (this.activePowerups.shield) {
                // Shield absorbs the crash!
                this.activePowerups.shield = false;
                this.shieldMesh.visible = false;
                this.shakeIntensity = 0.5;
                window.soundManager.playCrash();
                this.world.createCrashExplosion(this.playerCarGroup.position);
                // Push traffic car away
                collision.hitMesh.position.z += 25;
            } else {
                // Game Over Crash!
                this.triggerGameOver();
                return;
            }
        }

        // Check Near Miss
        if (this.traffic.checkNearMiss(this.playerCarGroup.position, this.playerSpeed)) {
            this.triggerNearMiss();
        }

        // Check Coin Pickups
        for (let i = this.world.coins.length - 1; i >= 0; i--) {
            const coin = this.world.coins[i];
            const dist = this.playerCarGroup.position.distanceTo(coin.position);
            if (dist < 2.0) {
                // Collected coin!
                this.coinsCollected++;
                window.garageManager.addCoins(1);
                this.score += 50 * (this.activePowerups.doubleScore > 0 ? 2 : 1);
                window.soundManager.playCoin();
                this.world.createCoinSparkles(coin.position);
                this.scene.remove(coin);
                this.world.coins.splice(i, 1);
            }
        }

        // Check Powerup Pickups
        for (let i = this.world.powerups.length - 1; i >= 0; i--) {
            const pu = this.world.powerups[i];
            const dist = this.playerCarGroup.position.distanceTo(pu.position);
            if (dist < 2.2) {
                this.activatePowerup(pu.userData.type);
                window.soundManager.playPowerup();
                this.world.createCoinSparkles(pu.position);
                this.scene.remove(pu);
                this.world.powerups.splice(i, 1);
            }
        }
    }

    activatePowerup(type) {
        if (type === 'magnet') {
            this.activePowerups.magnet = 12; // 12 seconds
            this.showBanner("🧲 TANGA MAGNETI FAOLLASHDI! (12s)");
        } else if (type === 'shield') {
            this.activePowerups.shield = true;
            this.shieldMesh.visible = true;
            this.showBanner("🛡️ TO'QNASHUV QALQONI FAOLLASHDI!");
        } else if (type === '2x') {
            this.activePowerups.doubleScore = 15; // 15 seconds
            this.showBanner("⚡ 2X BALL MULTIPLIER! (15s)");
        }
    }

    updatePowerups(delta) {
        if (this.activePowerups.magnet > 0) {
            this.activePowerups.magnet -= delta;
        }
        if (this.activePowerups.doubleScore > 0) {
            this.activePowerups.doubleScore -= delta;
        }
        if (this.activePowerups.shield && this.shieldMesh) {
            this.shieldMesh.rotation.y += 3.0 * delta;
        }
    }

    triggerNearMiss() {
        this.nearMissCount++;
        const bonus = 100 * (this.activePowerups.doubleScore > 0 ? 2 : 1);
        this.score += bonus;
        window.soundManager.playNearMiss();

        const banner = document.getElementById('near-miss-banner');
        banner.textContent = `⚡ YONIDAN O'TISH! +${bonus} BALL`;
        banner.classList.remove('animate-pop');
        void banner.offsetWidth; // Trigger reflow
        banner.classList.add('animate-pop');
    }

    showBanner(text) {
        const banner = document.getElementById('near-miss-banner');
        banner.textContent = text;
        banner.classList.remove('animate-pop');
        void banner.offsetWidth;
        banner.classList.add('animate-pop');
    }

    // 6. Camera Tracking & Shake
    updateCamera(delta) {
        const view = window.settingsManager.cameraView;
        let targetCamPos, targetLookAt;

        if (view === 'hood') {
            // First person hood view
            targetCamPos = new THREE.Vector3(this.playerX, 1.25, this.playerZ + 0.6);
            targetLookAt = new THREE.Vector3(this.playerX, 1.1, this.playerZ + 25);
        } else if (view === 'thirdClose') {
            // Close dynamic chase cam
            targetCamPos = new THREE.Vector3(this.playerX * 0.7, 2.5, this.playerZ - 5.5);
            targetLookAt = new THREE.Vector3(this.playerX * 0.4, 1.2, this.playerZ + 12);
        } else {
            // High third-person far cam
            targetCamPos = new THREE.Vector3(this.playerX * 0.6, 4.2, this.playerZ - 8.2);
            targetLookAt = new THREE.Vector3(this.playerX * 0.3, 1.4, this.playerZ + 15);
        }

        // Apply camera shake if any
        if (this.shakeIntensity > 0) {
            targetCamPos.x += (Math.random() - 0.5) * this.shakeIntensity;
            targetCamPos.y += (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity = Math.max(0, this.shakeIntensity - 3.0 * delta);
        }

        // Smooth camera damping
        this.camera.position.lerp(targetCamPos, 12 * delta);
        this.camera.lookAt(targetLookAt);
    }

    // 7. Crash & Game Over
    triggerGameOver() {
        this.gameState = 'GAMEOVER';
        this.shakeIntensity = 1.2;
        window.soundManager.playCrash();
        window.soundManager.stopEngine();

        // Create crash particle explosion
        this.world.createCrashExplosion(this.playerCarGroup.position);

        // Record submission
        const result = window.recordsManager.submitGame(
            this.score,
            this.distance,
            this.coinsCollected,
            this.playerCarData.name
        );

        setTimeout(() => {
            document.getElementById('hud-screen').classList.add('hidden');
            const goModal = document.getElementById('game-over-modal');
            goModal.classList.remove('hidden');

            document.getElementById('go-score').textContent = Math.floor(this.score).toLocaleString();
            document.getElementById('go-distance').textContent = `${Math.floor(this.distance).toLocaleString()} m`;
            document.getElementById('go-coins').textContent = `+${this.coinsCollected}`;
            document.getElementById('go-car-name').textContent = this.playerCarData.name;

            const recordBadge = document.getElementById('go-new-record-badge');
            if (result.isNewRecord) {
                recordBadge.classList.remove('hidden');
                window.soundManager.playUnlock();
            } else {
                recordBadge.classList.add('hidden');
            }

            // Update user total coins badge
            document.querySelectorAll('.total-coins-val').forEach(el => {
                el.textContent = window.garageManager.totalCoins.toLocaleString();
            });
        }, 800);
    }

    // 8. HUD & UI Updates
    updateHUD() {
        document.getElementById('hud-speed-val').textContent = Math.floor(this.playerSpeed);
        document.getElementById('hud-score-val').textContent = Math.floor(this.score).toLocaleString();
        document.getElementById('hud-distance-val').textContent = `${Math.floor(this.distance).toLocaleString()} m`;
        document.getElementById('hud-coins-val').textContent = this.coinsCollected;

        // Nitro Bar fill
        const nitroBar = document.getElementById('hud-nitro-bar');
        nitroBar.style.width = `${this.nitroAmount}%`;
        if (this.isNitroActive && this.nitroAmount > 0) {
            nitroBar.style.boxShadow = '0 0 16px #00d4ff';
        } else {
            nitroBar.style.boxShadow = 'none';
        }

        // Speedometer needle rotation (-120deg at 0 to +120deg at 240km/h)
        const needleAngle = -120 + (Math.min(240, this.playerSpeed) / 240) * 240;
        const needle = document.getElementById('speedo-needle');
        if (needle) {
            needle.style.transform = `rotate(${needleAngle}deg)`;
        }
    }

    // 9. Input Event Listeners
    initInputListeners() {
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'Escape' && this.gameState === 'PLAYING') {
                this.pauseGame();
            }
        });

        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });

        // Mouse steering tracking
        window.addEventListener('mousemove', e => {
            if (window.settingsManager.steeringType === 'mouse' && this.gameState === 'PLAYING') {
                this.mouseXNormalized = (e.clientX / window.innerWidth) * 2 - 1;
            }
        });

        window.addEventListener('mousedown', e => {
            if (e.button === 0 && window.settingsManager.steeringType === 'mouse') {
                this.mouseNitro = true;
            }
        });
        window.addEventListener('mouseup', e => {
            if (e.button === 0 && window.settingsManager.steeringType === 'mouse') {
                this.mouseNitro = false;
            }
        });

        // Virtual Steering Wheel Drag & Physics
        const wheelEl = document.getElementById('interactive-steering-wheel');
        if (wheelEl) {
            let lastMouseX = 0;

            const onWheelMove = (clientX) => {
                if (!this.isDraggingWheel) return;
                const deltaX = clientX - lastMouseX;
                this.steeringWheelAngle += deltaX * 1.2;
                this.steeringWheelAngle = Math.max(-95, Math.min(95, this.steeringWheelAngle));
                wheelEl.style.transform = `rotate(${this.steeringWheelAngle}deg)`;
                lastMouseX = clientX;
            };

            wheelEl.addEventListener('mousedown', e => {
                this.isDraggingWheel = true;
                lastMouseX = e.clientX;
                e.preventDefault();
            });

            window.addEventListener('mousemove', e => {
                if (this.isDraggingWheel) onWheelMove(e.clientX);
            });

            window.addEventListener('mouseup', () => {
                this.isDraggingWheel = false;
            });

            // Touch support for steering wheel
            wheelEl.addEventListener('touchstart', e => {
                this.isDraggingWheel = true;
                lastMouseX = e.touches[0].clientX;
                e.preventDefault();
            }, { passive: false });

            window.addEventListener('touchmove', e => {
                if (this.isDraggingWheel && e.touches[0]) onWheelMove(e.touches[0].clientX);
            });

            window.addEventListener('touchend', () => {
                this.isDraggingWheel = false;
            });

            // Auto-centering spring when released
            setInterval(() => {
                if (!this.isDraggingWheel && Math.abs(this.steeringWheelAngle) > 0.5) {
                    this.steeringWheelAngle *= 0.82;
                    wheelEl.style.transform = `rotate(${this.steeringWheelAngle}deg)`;
                }
            }, 20);
        }

        // On-screen Touch Controls (Left, Right, Gas, Brake, Nitro)
        this.bindTouchButton('btn-touch-left', (pressed) => { this.touchSteer = pressed ? -1 : 0; });
        this.bindTouchButton('btn-touch-right', (pressed) => { this.touchSteer = pressed ? 1 : 0; });
        this.bindTouchButton('btn-touch-gas', (pressed) => { this.touchGaz = pressed; });
        this.bindTouchButton('btn-touch-brake', (pressed) => { this.touchBrake = pressed; });
        this.bindTouchButton('btn-touch-nitro', (pressed) => { this.touchNitro = pressed; });
    }

    bindTouchButton(id, callback) {
        const btn = document.getElementById(id);
        if (!btn) return;

        const start = (e) => { e.preventDefault(); callback(true); };
        const end = (e) => { e.preventDefault(); callback(false); };

        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', end);
        btn.addEventListener('mouseleave', end);
        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('touchend', end);
        btn.addEventListener('touchcancel', end);
    }

    // 10. Pause / Resume / Navigation
    pauseGame() {
        if (this.gameState !== 'PLAYING') return;
        this.gameState = 'PAUSED';
        window.soundManager.stopEngine();
        document.getElementById('pause-modal').classList.remove('hidden');
    }

    resumeGame() {
        if (this.gameState !== 'PAUSED') return;
        this.gameState = 'PLAYING';
        window.soundManager.startEngine();
        document.getElementById('pause-modal').classList.add('hidden');
    }

    hideAllMenus() {
        const screens = [
            'main-menu', 'garage-screen', 'settings-screen',
            'records-screen', 'hud-screen', 'pause-modal', 'game-over-modal'
        ];
        screens.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    }

    showMainMenu() {
        this.gameState = 'MENU';
        window.soundManager.stopEngine();
        this.hideAllMenus();
        document.getElementById('main-menu').classList.remove('hidden');
        this.setupShowroom();
        this.updateCoinsBadge();
    }

    showGarage() {
        this.gameState = 'GARAGE';
        this.hideAllMenus();
        document.getElementById('garage-screen').classList.remove('hidden');
        this.currentGarageCarIndex = UZB_CARS.findIndex(c => c.id === window.garageManager.selectedCarId);
        if (this.currentGarageCarIndex < 0) this.currentGarageCarIndex = 0;
        this.renderGarageCar();
    }

    renderGarageCar() {
        const car = UZB_CARS[this.currentGarageCarIndex];
        const isUnlocked = window.garageManager.isUnlocked(car.id);
        const isSelected = window.garageManager.selectedCarId === car.id;

        // Update 3D Model in showroom
        if (this.showroomCar) this.scene.remove(this.showroomCar);
        const currentColor = isSelected ? (window.garageManager.selectedColor || car.colors[0]) : car.colors[0];
        this.showroomCar = CarBuilder.build(car.id, currentColor);
        this.scene.add(this.showroomCar);

        // UI text
        document.getElementById('garage-car-name').textContent = car.name;
        document.getElementById('garage-car-desc').textContent = car.desc;
        document.getElementById('garage-stat-speed').style.width = `${(car.speed / 240) * 100}%`;
        document.getElementById('garage-stat-speed-val').textContent = `${car.speed} km/h`;

        document.getElementById('garage-stat-accel').style.width = `${(car.accel / 10) * 100}%`;
        document.getElementById('garage-stat-accel-val').textContent = `${car.accel}/10`;

        document.getElementById('garage-stat-handling').style.width = `${(car.handling / 10) * 100}%`;
        document.getElementById('garage-stat-handling-val').textContent = `${car.handling}/10`;

        document.getElementById('garage-stat-nitro').style.width = `${((car.nitroPower - 1) / 0.8) * 100}%`;
        document.getElementById('garage-stat-nitro-val').textContent = `+${Math.round((car.nitroPower - 1) * 100)}%`;

        // Color Palette
        const paletteEl = document.getElementById('garage-color-palette');
        paletteEl.innerHTML = '';
        car.colors.forEach(hex => {
            const circle = document.createElement('div');
            circle.className = 'color-circle';
            circle.style.backgroundColor = `#${hex.toString(16).padStart(6, '0')}`;
            if (hex === currentColor) circle.classList.add('active');
            circle.onclick = () => {
                window.soundManager.playClick();
                window.garageManager.selectCar(car.id, hex);
                this.renderGarageCar();
            };
            paletteEl.appendChild(circle);
        });

        // Select / Unlock button
        const actionBtn = document.getElementById('garage-action-btn');
        if (isSelected) {
            actionBtn.textContent = "✅ TANLANGAN";
            actionBtn.className = "btn-garage btn-selected";
            actionBtn.disabled = true;
        } else if (isUnlocked) {
            actionBtn.textContent = "🚗 TANLASH";
            actionBtn.className = "btn-garage btn-select";
            actionBtn.disabled = false;
            actionBtn.onclick = () => {
                window.soundManager.playClick();
                window.garageManager.selectCar(car.id);
                this.renderGarageCar();
            };
        } else {
            actionBtn.textContent = `🔓 OCHISH: ${car.price} TANGA`;
            const canAfford = window.garageManager.totalCoins >= car.price;
            actionBtn.className = `btn-garage ${canAfford ? 'btn-unlock' : 'btn-locked'}`;
            actionBtn.disabled = !canAfford;
            actionBtn.onclick = () => {
                if (window.garageManager.unlockCar(car.id)) {
                    window.soundManager.playUnlock();
                    window.garageManager.selectCar(car.id);
                    this.renderGarageCar();
                    this.updateCoinsBadge();
                }
            };
        }

        this.updateCoinsBadge();
    }

    showSettings() {
        this.gameState = 'SETTINGS';
        this.hideAllMenus();
        document.getElementById('settings-screen').classList.remove('hidden');

        // Reflect current settings in UI
        const s = window.settingsManager;
        document.querySelectorAll('.btn-steering-choice').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === s.steeringType);
        });

        document.querySelectorAll('.btn-camera-choice').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === s.cameraView);
        });

        document.querySelectorAll('.btn-theme-choice').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === s.theme);
        });

        // Audio sliders
        const snd = window.soundManager;
        document.getElementById('vol-master').value = Math.round(snd.masterVolume * 100);
        document.getElementById('vol-engine').value = Math.round(snd.engineVolume * 100);
        document.getElementById('vol-music').value = Math.round(snd.musicVolume * 100);
        document.getElementById('vol-sfx').value = Math.round(snd.sfxVolume * 100);
        document.getElementById('mute-toggle').checked = snd.isMuted;
    }

    showRecords() {
        this.gameState = 'RECORDS';
        this.hideAllMenus();
        document.getElementById('records-screen').classList.remove('hidden');

        const rec = window.recordsManager;
        document.getElementById('rec-high-score').textContent = Math.floor(rec.highScore).toLocaleString();
        document.getElementById('rec-max-distance').textContent = `${Math.floor(rec.maxDistance).toLocaleString()} m`;
        document.getElementById('rec-max-coins').textContent = rec.maxCoins.toLocaleString();
        document.getElementById('rec-games-played').textContent = rec.gamesPlayed.toLocaleString();

        const tableBody = document.getElementById('records-table-body');
        tableBody.innerHTML = '';

        if (rec.history.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color:#888;">Hozircha natijalar yo'q. O'yinni boshlang!</td></tr>`;
        } else {
            rec.history.forEach((entry, idx) => {
                const tr = document.createElement('tr');
                if (entry.isRecord) tr.className = 'highlight-row';
                tr.innerHTML = `
                    <td>${idx + 1}</td>
                    <td>${entry.date}</td>
                    <td><strong style="color: #ffd700;">${entry.score.toLocaleString()}</strong></td>
                    <td>${entry.distance.toLocaleString()} m</td>
                    <td>🪙 ${entry.coins}</td>
                `;
                tableBody.appendChild(tr);
            });
        }
    }

    updateCoinsBadge() {
        document.querySelectorAll('.total-coins-val').forEach(el => {
            el.textContent = window.garageManager.totalCoins.toLocaleString();
        });
    }

    // 11. Bind UI buttons
    initUI() {
        this.updateCoinsBadge();

        // Main Menu buttons
        document.getElementById('btn-play').onclick = () => {
            window.soundManager.playClick();
            this.startGame();
        };

        document.getElementById('btn-garage').onclick = () => {
            window.soundManager.playClick();
            this.showGarage();
        };

        document.getElementById('btn-settings').onclick = () => {
            window.soundManager.playClick();
            this.showSettings();
        };

        document.getElementById('btn-records').onclick = () => {
            window.soundManager.playClick();
            this.showRecords();
        };

        // Garage navigation
        document.getElementById('btn-garage-prev').onclick = () => {
            window.soundManager.playClick();
            this.currentGarageCarIndex = (this.currentGarageCarIndex - 1 + UZB_CARS.length) % UZB_CARS.length;
            this.renderGarageCar();
        };

        document.getElementById('btn-garage-next').onclick = () => {
            window.soundManager.playClick();
            this.currentGarageCarIndex = (this.currentGarageCarIndex + 1) % UZB_CARS.length;
            this.renderGarageCar();
        };

        document.getElementById('btn-garage-back').onclick = () => {
            window.soundManager.playClick();
            this.showMainMenu();
        };

        // Settings events
        document.querySelectorAll('.btn-steering-choice').forEach(btn => {
            btn.onclick = () => {
                window.soundManager.playClick();
                window.settingsManager.setSteering(btn.dataset.type);
                this.showSettings();
            };
        });

        document.querySelectorAll('.btn-camera-choice').forEach(btn => {
            btn.onclick = () => {
                window.soundManager.playClick();
                window.settingsManager.setCamera(btn.dataset.view);
                this.showSettings();
            };
        });

        document.querySelectorAll('.btn-theme-choice').forEach(btn => {
            btn.onclick = () => {
                window.soundManager.playClick();
                window.settingsManager.setTheme(btn.dataset.theme);
                this.world.setTheme(btn.dataset.theme === 'night');
                this.showSettings();
            };
        });

        // Volume Sliders
        document.getElementById('vol-master').oninput = (e) => {
            window.soundManager.setMasterVolume(e.target.value / 100);
        };
        document.getElementById('vol-engine').oninput = (e) => {
            window.soundManager.setEngineVolume(e.target.value / 100);
        };
        document.getElementById('vol-music').oninput = (e) => {
            window.soundManager.setMusicVolume(e.target.value / 100);
        };
        document.getElementById('vol-sfx').oninput = (e) => {
            window.soundManager.setSfxVolume(e.target.value / 100);
        };
        document.getElementById('mute-toggle').onchange = (e) => {
            window.soundManager.toggleMute();
        };

        document.getElementById('btn-settings-back').onclick = () => {
            window.soundManager.playClick();
            this.showMainMenu();
        };

        // Records events
        document.getElementById('btn-records-back').onclick = () => {
            window.soundManager.playClick();
            this.showMainMenu();
        };

        document.getElementById('btn-records-reset').onclick = () => {
            if (confirm("Rostdan ham barcha rekordlarni tozalashni xohlaysizmi?")) {
                window.soundManager.playClick();
                window.recordsManager.resetRecords();
                this.showRecords();
            }
        };

        // HUD & In-game Pause button
        document.getElementById('btn-hud-pause').onclick = () => {
            window.soundManager.playClick();
            this.pauseGame();
        };

        // Pause Modal buttons
        document.getElementById('btn-pause-resume').onclick = () => {
            window.soundManager.playClick();
            this.resumeGame();
        };

        document.getElementById('btn-pause-restart').onclick = () => {
            window.soundManager.playClick();
            document.getElementById('pause-modal').classList.add('hidden');
            this.startGame();
        };

        document.getElementById('btn-pause-menu').onclick = () => {
            window.soundManager.playClick();
            this.showMainMenu();
        };

        // Game Over buttons
        document.getElementById('btn-go-restart').onclick = () => {
            window.soundManager.playClick();
            document.getElementById('game-over-modal').classList.add('hidden');
            this.startGame();
        };

        document.getElementById('btn-go-garage').onclick = () => {
            window.soundManager.playClick();
            document.getElementById('game-over-modal').classList.add('hidden');
            this.showGarage();
        };

        document.getElementById('btn-go-menu').onclick = () => {
            window.soundManager.playClick();
            document.getElementById('game-over-modal').classList.add('hidden');
            this.showMainMenu();
        };
    }
}

// Instantiate game on load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new FastDriveGame();
});
