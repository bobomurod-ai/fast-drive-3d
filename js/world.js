// Fast Drive 3D - Highway, Environment & Collectibles System

class WorldManager {
    constructor(scene) {
        this.scene = scene;
        this.roadWidth = 18;      // 4 lanes (~4.5m each)
        this.chunkLength = 120;
        this.numChunks = 4;
        this.chunks = [];
        this.roadZOffset = 0;

        // Collectibles
        this.coins = [];
        this.powerups = [];
        this.particles = [];

        // Environment materials
        this.isNightMode = false;
        this.initMaterials();
        this.initLighting();
        this.buildRoadNetwork();
    }

    initMaterials() {
        // Road surface texture generated dynamically with lane markers
        const roadCanvas = document.createElement('canvas');
        roadCanvas.width = 512;
        roadCanvas.height = 512;
        const ctx = roadCanvas.getContext('2d');

        // Dark asphalt
        ctx.fillStyle = '#232528';
        ctx.fillRect(0, 0, 512, 512);

        // Subtle asphalt grain
        for (let i = 0; i < 4000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#1b1d1f' : '#2d3035';
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
        }

        // Solid outer road boundaries (yellow/white)
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(16, 0, 8, 512);
        ctx.fillRect(488, 0, 8, 512);

        // Dashed lane dividers for 4 lanes (x: 134, 256, 378)
        ctx.fillStyle = '#ffffff';
        const dashLen = 48;
        const dashGap = 32;
        const lanes = [134, 256, 378];

        for (let y = 0; y < 512; y += (dashLen + dashGap)) {
            lanes.forEach(lx => {
                ctx.fillRect(lx - 4, y, 8, dashLen);
            });
        }

        const roadTex = new THREE.CanvasTexture(roadCanvas);
        roadTex.wrapS = THREE.RepeatWrapping;
        roadTex.wrapT = THREE.RepeatWrapping;
        roadTex.repeat.set(1, 10);

        this.roadMaterial = new THREE.MeshStandardMaterial({
            map: roadTex,
            roughness: 0.8,
            metalness: 0.1
        });

        // Guardrail material (galvanized steel)
        this.guardrailMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.3,
            metalness: 0.8
        });

        // Grass / Desert terrain side material
        this.groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d472c,
            roughness: 0.9,
            metalness: 0.05
        });

        // Coin gold material
        this.coinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffaa00,
            emissiveIntensity: 0.35,
            metalness: 0.9,
            roughness: 0.2
        });
    }

    initLighting() {
        // Ambient Light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(this.ambientLight);

        // Sun / Directional Light
        this.dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
        this.dirLight.position.set(40, 70, 30);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 1024;
        this.dirLight.shadow.mapSize.height = 1024;
        this.dirLight.shadow.camera.near = 10;
        this.dirLight.shadow.camera.far = 250;
        this.dirLight.shadow.camera.left = -30;
        this.dirLight.shadow.camera.right = 30;
        this.dirLight.shadow.camera.top = 30;
        this.dirLight.shadow.camera.bottom = -30;
        this.scene.add(this.dirLight);

        // Sky fog
        this.scene.fog = new THREE.FogExp2(0xcde3f5, 0.007);
    }

    setTheme(isNight) {
        this.isNightMode = isNight;
        if (isNight) {
            this.ambientLight.color.setHex(0x192233);
            this.ambientLight.intensity = 0.5;

            this.dirLight.color.setHex(0x406090);
            this.dirLight.intensity = 0.4;
            this.dirLight.position.set(-30, 40, -20);

            this.scene.background = new THREE.Color(0x060913);
            this.scene.fog.color.setHex(0x080e1b);
            this.scene.fog.density = 0.009;
            this.groundMaterial.color.setHex(0x0e1713);
        } else {
            this.ambientLight.color.setHex(0xffffff);
            this.ambientLight.intensity = 0.75;

            this.dirLight.color.setHex(0xfffaed);
            this.dirLight.intensity = 1.2;
            this.dirLight.position.set(40, 70, 30);

            this.scene.background = new THREE.Color(0xcde3f5);
            this.scene.fog.color.setHex(0xcde3f5);
            this.scene.fog.density = 0.007;
            this.groundMaterial.color.setHex(0x2d472c);
        }
    }

    // Build highway chunks for endless recycling
    buildRoadNetwork() {
        for (let i = 0; i < this.numChunks; i++) {
            const chunk = this.createRoadChunk(i * this.chunkLength);
            this.chunks.push(chunk);
            this.scene.add(chunk);
        }
    }

    createRoadChunk(zPos) {
        const chunk = new THREE.Group();
        chunk.position.z = zPos;

        // Road Surface
        const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.chunkLength);
        roadGeo.rotateX(-Math.PI / 2);
        const road = new THREE.Mesh(roadGeo, this.roadMaterial);
        road.receiveShadow = true;
        chunk.add(road);

        // Side terrain (left & right)
        const groundGeo = new THREE.PlaneGeometry(120, this.chunkLength);
        groundGeo.rotateX(-Math.PI / 2);

        const groundL = new THREE.Mesh(groundGeo, this.groundMaterial);
        groundL.position.x = -68;
        groundL.receiveShadow = true;
        chunk.add(groundL);

        const groundR = new THREE.Mesh(groundGeo, this.groundMaterial);
        groundR.position.x = 68;
        groundR.receiveShadow = true;
        chunk.add(groundR);

        // Guardrails
        const railGeo = new THREE.BoxGeometry(0.3, 0.7, this.chunkLength);
        const railL = new THREE.Mesh(railGeo, this.guardrailMaterial);
        railL.position.set(-this.roadWidth / 2 - 0.2, 0.35, 0);
        railL.castShadow = true;
        chunk.add(railL);

        const railR = new THREE.Mesh(railGeo, this.guardrailMaterial);
        railR.position.set(this.roadWidth / 2 + 0.2, 0.35, 0);
        railR.castShadow = true;
        chunk.add(railR);

        // Street light posts along the highway
        for (let z = -this.chunkLength / 2 + 15; z < this.chunkLength / 2; z += 35) {
            const pole = this.createLightPole();
            pole.position.set(-this.roadWidth / 2 - 1.2, 0, z);
            chunk.add(pole);

            // Trees and scenery on sides
            const treeL = this.createTree();
            treeL.position.set(-this.roadWidth / 2 - 6 - Math.random() * 12, 0, z + Math.random() * 10);
            chunk.add(treeL);

            const treeR = this.createTree();
            treeR.position.set(this.roadWidth / 2 + 6 + Math.random() * 12, 0, z + Math.random() * 10);
            chunk.add(treeR);
        }

        // Highway Overhead Billboard / Signs
        if (Math.random() > 0.4) {
            const signTextList = [
                "M39 | TOSHKENT -> SAMARQAND",
                "FAST DRIVE | TEZLIK CHEGARASI 120 KM/H",
                "O'ZBEKISTON AVTOBANLARI | XUSH KELIBSIZ!",
                "DIQQAT: RADAR VA KAMERALAR NAZORATIDA",
                "TOSHKENT VILOYATI CHINORLAR YO'LI"
            ];
            const signText = signTextList[Math.floor(Math.random() * signTextList.length)];
            const overheadSign = this.createHighwaySign(signText);
            overheadSign.position.set(0, 0, 0);
            chunk.add(overheadSign);
        }

        return chunk;
    }

    createLightPole() {
        const group = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });

        // Vertical pole
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7, 8), metalMat);
        pole.position.y = 3.5;
        pole.castShadow = true;
        group.add(pole);

        // Curved top arm reaching over road
        const arm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 0.12), metalMat);
        arm.position.set(1.2, 6.9, 0);
        group.add(arm);

        // Glowing lamp
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.3), new THREE.MeshStandardMaterial({
            color: 0xffeedd,
            emissive: 0xffd28e,
            emissiveIntensity: 1.5
        }));
        lamp.position.set(2.2, 6.78, 0);
        group.add(lamp);

        return group;
    }

    createTree() {
        const group = new THREE.Group();
        // Trunk
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 2.5, 6), trunkMat);
        trunk.position.y = 1.25;
        trunk.castShadow = true;
        group.add(trunk);

        // Foliage (Stylized low-poly)
        const foliageMat = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.5 ? 0x2e6f40 : 0x3d8b4e,
            roughness: 0.8
        });

        for (let i = 0; i < 3; i++) {
            const cone = new THREE.Mesh(new THREE.ConeGeometry(1.8 - i * 0.35, 2.0, 7), foliageMat);
            cone.position.y = 2.4 + i * 1.1;
            cone.castShadow = true;
            group.add(cone);
        }

        const scale = 0.8 + Math.random() * 0.6;
        group.scale.set(scale, scale, scale);
        return group;
    }

    createHighwaySign(text) {
        const group = new THREE.Group();

        // Left and right pillars
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });
        const pillL = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 7.5, 8), pillarMat);
        pillL.position.set(-this.roadWidth / 2 - 0.8, 3.75, 0);
        group.add(pillL);

        const pillR = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 7.5, 8), pillarMat);
        pillR.position.set(this.roadWidth / 2 + 0.8, 3.75, 0);
        group.add(pillR);

        // Cross beam
        const beam = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + 2.4, 0.3, 0.3), pillarMat);
        beam.position.set(0, 7.2, 0);
        group.add(beam);

        // Signboard
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');

        // Uzbek Green highway board background
        ctx.fillStyle = '#0b6623';
        ctx.fillRect(0, 0, 1024, 180);

        // White border
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(8, 8, 1008, 164);

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 512, 90);

        const tex = new THREE.CanvasTexture(canvas);
        const signMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 });
        const signMesh = new THREE.Mesh(new THREE.BoxGeometry(11, 2.0, 0.15), signMat);
        signMesh.position.set(0, 6.2, 0);
        group.add(signMesh);

        return group;
    }

    // --- Collectibles: Coins & Powerups ---
    spawnCoin(laneX, zPos) {
        const group = new THREE.Group();
        group.position.set(laneX, 0.8, zPos);

        // Coin mesh (cylinder with embossed edge)
        const coinGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.12, 16);
        coinGeo.rotateZ(Math.PI / 2);
        const coinMesh = new THREE.Mesh(coinGeo, this.coinMaterial);
        coinMesh.castShadow = true;
        group.add(coinMesh);

        group.userData = {
            type: 'coin',
            value: 1,
            mesh: coinMesh,
            baseY: 0.8,
            rotationSpeed: 3.5
        };

        this.scene.add(group);
        this.coins.push(group);
        return group;
    }

    spawnPowerup(laneX, zPos, type = 'magnet') {
        const group = new THREE.Group();
        group.position.set(laneX, 1.0, zPos);

        let iconColor = 0x00d4ff;
        if (type === 'shield') iconColor = 0x22c55e;
        if (type === '2x') iconColor = 0xff3b30;

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.55, 16, 16),
            new THREE.MeshStandardMaterial({
                color: iconColor,
                emissive: iconColor,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.85
            })
        );
        group.add(sphere);

        // Outer rotating ring
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.85, 0.08, 8, 24),
            new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: iconColor, emissiveIntensity: 0.8 })
        );
        group.add(ring);

        group.userData = {
            type: type, // 'magnet', 'shield', '2x'
            sphere: sphere,
            ring: ring,
            baseY: 1.0
        };

        this.scene.add(group);
        this.powerups.push(group);
        return group;
    }

    // --- Particle Effects (Sparks, Nitro, Coin pickup) ---
    createCoinSparkles(pos) {
        const count = 12;
        const color = 0xffd700;
        for (let i = 0; i < count; i++) {
            const p = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.12, 0.12),
                new THREE.MeshBasicMaterial({ color: color })
            );
            p.position.copy(pos);
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            p.userData = {
                velX: Math.cos(angle) * speed,
                velY: 2 + Math.random() * 5,
                velZ: Math.sin(angle) * speed,
                life: 0.4
            };
            this.scene.add(p);
            this.particles.push(p);
        }
    }

    createCrashExplosion(pos) {
        // Metall parchalari va tutun
        for (let i = 0; i < 35; i++) {
            const isFire = Math.random() > 0.4;
            const p = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.25, 0.25),
                new THREE.MeshBasicMaterial({
                    color: isFire ? (Math.random() > 0.5 ? 0xff4500 : 0xffa500) : 0x333333
                })
            );
            p.position.copy(pos);
            const speed = 5 + Math.random() * 8;
            const angle = Math.random() * Math.PI * 2;
            p.userData = {
                velX: Math.cos(angle) * speed,
                velY: 4 + Math.random() * 8,
                velZ: (Math.random() - 0.5) * speed * 2,
                life: 1.0
            };
            this.scene.add(p);
            this.particles.push(p);
        }
    }

    createNitroFlame(pos) {
        for (let i = 0; i < 3; i++) {
            const p = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: Math.random() > 0.3 ? 0x00d4ff : 0xffffff,
                    transparent: true,
                    opacity: 0.8
                })
            );
            p.position.set(
                pos.x + (Math.random() - 0.5) * 0.4,
                pos.y + (Math.random() - 0.5) * 0.2,
                pos.z - 0.2
            );
            p.userData = {
                velX: (Math.random() - 0.5) * 0.5,
                velY: (Math.random() - 0.5) * 0.5,
                velZ: -12 - Math.random() * 5,
                life: 0.2
            };
            this.scene.add(p);
            this.particles.push(p);
        }
    }

    update(delta, playerZ, magnetActive = false, playerPos = null) {
        // Recycle highway chunks ahead of player
        this.chunks.forEach(chunk => {
            if (chunk.position.z < playerZ - this.chunkLength) {
                // Find maximum chunk Z
                let maxZ = -Infinity;
                this.chunks.forEach(c => {
                    if (c.position.z > maxZ) maxZ = c.position.z;
                });
                chunk.position.z = maxZ + this.chunkLength;

                // Spawn lane collectibles in this new segment!
                this.spawnCollectiblesInChunk(chunk.position.z);
            }
        });

        // Animate coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.rotation.y += coin.userData.rotationSpeed * delta;
            coin.position.y = coin.userData.baseY + Math.sin(Date.now() * 0.005 + coin.position.z) * 0.15;

            // Magnet effect: attract coins toward player!
            if (magnetActive && playerPos) {
                const dist = coin.position.distanceTo(playerPos);
                if (dist < 18) {
                    coin.position.lerp(playerPos, 8.0 * delta);
                }
            }

            // Remove if way behind player
            if (coin.position.z < playerZ - 25) {
                this.scene.remove(coin);
                this.coins.splice(i, 1);
            }
        }

        // Animate powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pu = this.powerups[i];
            pu.userData.ring.rotation.x += 2.0 * delta;
            pu.userData.ring.rotation.y += 3.0 * delta;
            pu.position.y = pu.userData.baseY + Math.sin(Date.now() * 0.004 + pu.position.z) * 0.2;

            if (pu.position.z < playerZ - 25) {
                this.scene.remove(pu);
                this.powerups.splice(i, 1);
            }
        }

        // Update particle life
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.userData.life -= delta;
            p.position.x += p.userData.velX * delta;
            p.position.y += p.userData.velY * delta;
            p.position.z += p.userData.velZ * delta;
            p.userData.velY -= 9.8 * delta; // Gravity

            if (p.userData.life <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
            }
        }
    }

    spawnCollectiblesInChunk(chunkCenterZ) {
        const lanes = [-6.3, -2.1, 2.1, 6.3];
        // 50% chance to spawn coins chain in this chunk
        if (Math.random() > 0.3) {
            const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
            const startZ = chunkCenterZ - this.chunkLength / 2 + 10;
            const count = 4 + Math.floor(Math.random() * 5);
            for (let i = 0; i < count; i++) {
                this.spawnCoin(chosenLane, startZ + i * 5);
            }
        }

        // 25% chance to spawn a powerup
        if (Math.random() > 0.75) {
            const types = ['magnet', 'shield', '2x'];
            const type = types[Math.floor(Math.random() * types.length)];
            const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
            this.spawnPowerup(chosenLane, chunkCenterZ + (Math.random() - 0.5) * 30, type);
        }
    }

    reset() {
        // Clear all coins, powerups, particles
        this.coins.forEach(c => this.scene.remove(c));
        this.coins = [];

        this.powerups.forEach(p => this.scene.remove(p));
        this.powerups = [];

        this.particles.forEach(p => this.scene.remove(p));
        this.particles = [];

        // Reset chunks to initial positions
        for (let i = 0; i < this.numChunks; i++) {
            this.chunks[i].position.z = i * this.chunkLength;
            this.spawnCollectiblesInChunk(this.chunks[i].position.z);
        }
    }
}

window.WorldManager = WorldManager;
