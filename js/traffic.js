// Fast Drive 3D - Traffic AI & Highway Vehicles (Sedans, Trucks, Buses)

class TrafficManager {
    constructor(scene) {
        this.scene = scene;
        this.traffic = [];
        this.lanes = [-6.3, -2.1, 2.1, 6.3];
        this.maxTraffic = 14;
        this.spawnDistanceMin = 65;
        this.spawnDistanceMax = 180;

        // Shared materials
        this.materials = {
            truckBody: new THREE.MeshStandardMaterial({ color: 0x2b4c7e, roughness: 0.5, metalness: 0.3 }),
            trailer: new THREE.MeshStandardMaterial({ color: 0xd9d9d9, roughness: 0.4, metalness: 0.5 }),
            bus: new THREE.MeshStandardMaterial({ color: 0xe6af2e, roughness: 0.4, metalness: 0.2 }),
            taxi: new THREE.MeshStandardMaterial({ color: 0xf4d03f, roughness: 0.3, metalness: 0.5 }),
            glass: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.1, metalness: 0.8 }),
            wheel: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }),
            headlight: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffeedd, emissiveIntensity: 0.8 }),
            taillight: new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x990000, emissiveIntensity: 0.6 }),
            turnSignal: new THREE.MeshStandardMaterial({ color: 0xffa500, emissive: 0xff8800, emissiveIntensity: 1.2 })
        };
    }

    createSedanMesh(colorHex) {
        const group = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.5 });

        // Lower body
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.52, 4.2), bodyMat);
        body.position.y = 0.52;
        body.castShadow = true;
        group.add(body);

        // Cabin
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2.2), this.materials.glass);
        cabin.position.set(0, 0.95, -0.1);
        cabin.castShadow = true;
        group.add(cabin);

        // Lights
        const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.08), this.materials.taillight);
        tlL.position.set(-0.6, 0.55, -2.11);
        group.add(tlL);

        const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.08), this.materials.taillight);
        tlR.position.set(0.6, 0.55, -2.11);
        group.add(tlR);

        const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.08), this.materials.headlight);
        hlL.position.set(-0.6, 0.55, 2.11);
        group.add(hlL);

        const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.08), this.materials.headlight);
        hlR.position.set(0.6, 0.55, 2.11);
        group.add(hlR);

        // Simple wheels
        const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        [
            [-0.92, 0.34, 1.2],
            [0.92, 0.34, 1.2],
            [-0.92, 0.34, -1.2],
            [0.92, 0.34, -1.2]
        ].forEach(pos => {
            const w = new THREE.Mesh(wheelGeo, this.materials.wheel);
            w.position.set(...pos);
            group.add(w);
        });

        group.userData.hitBox = { width: 1.9, height: 1.3, length: 4.4 };
        return group;
    }

    createTruckMesh() {
        const group = new THREE.Group();

        // Cabin
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.4, 2.4), this.materials.truckBody);
        cabin.position.set(0, 1.7, 2.8);
        cabin.castShadow = true;
        group.add(cabin);

        // Windshield
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.0), this.materials.glass);
        glass.position.set(0, 2.1, 4.01);
        group.add(glass);

        // Large Cargo Trailer
        const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.9, 6.8), this.materials.trailer);
        trailer.position.set(0, 2.1, -1.6);
        trailer.castShadow = true;
        group.add(trailer);

        // Taillights
        const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), this.materials.taillight);
        tlL.position.set(-0.85, 0.7, -5.02);
        group.add(tlL);

        const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), this.materials.taillight);
        tlR.position.set(0.85, 0.7, -5.02);
        group.add(tlR);

        // Big Truck Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.35, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        [
            [-1.15, 0.48, 3.2],
            [1.15, 0.48, 3.2],
            [-1.15, 0.48, -0.6],
            [1.15, 0.48, -0.6],
            [-1.15, 0.48, -3.8],
            [1.15, 0.48, -3.8],
            [-1.15, 0.48, -4.6],
            [1.15, 0.48, -4.6]
        ].forEach(pos => {
            const w = new THREE.Mesh(wheelGeo, this.materials.wheel);
            w.position.set(...pos);
            group.add(w);
        });

        group.userData.hitBox = { width: 2.5, height: 3.2, length: 9.8 };
        return group;
    }

    createBusMesh() {
        const group = new THREE.Group();

        // Long Bus Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.3, 7.2), this.materials.bus);
        body.position.set(0, 1.55, 0);
        body.castShadow = true;
        group.add(body);

        // Panoramic windows strip
        const glassGeo = new THREE.BoxGeometry(2.22, 0.75, 6.8);
        const glass = new THREE.Mesh(glassGeo, this.materials.glass);
        glass.position.set(0, 1.75, 0);
        group.add(glass);

        // Taillights
        const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.1), this.materials.taillight);
        tlL.position.set(-0.8, 0.75, -3.61);
        group.add(tlL);

        const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.1), this.materials.taillight);
        tlR.position.set(0.8, 0.75, -3.61);
        group.add(tlR);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.3, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        [
            [-1.08, 0.44, 2.4],
            [1.08, 0.44, 2.4],
            [-1.08, 0.44, -2.4],
            [1.08, 0.44, -2.4]
        ].forEach(pos => {
            const w = new THREE.Mesh(wheelGeo, this.materials.wheel);
            w.position.set(...pos);
            group.add(w);
        });

        group.userData.hitBox = { width: 2.3, height: 2.6, length: 7.4 };
        return group;
    }

    spawnTrafficCar(minZ) {
        // Pick lane
        const laneIdx = Math.floor(Math.random() * this.lanes.length);
        const laneX = this.lanes[laneIdx];
        const z = minZ + this.spawnDistanceMin + Math.random() * (this.spawnDistanceMax - this.spawnDistanceMin);

        // Prevent overlapping with existing traffic
        const tooClose = this.traffic.some(c =>
            Math.abs(c.mesh.position.x - laneX) < 2.0 &&
            Math.abs(c.mesh.position.z - z) < 18
        );
        if (tooClose) return;

        // Choose vehicle type
        const rand = Math.random();
        let mesh;
        let speed; // km/h converted to units/s

        if (rand < 0.22) {
            // Heavy truck
            mesh = this.createTruckMesh();
            speed = 65 + Math.random() * 25; // 65-90 km/h
        } else if (rand < 0.38) {
            // Bus
            mesh = this.createBusMesh();
            speed = 75 + Math.random() * 25; // 75-100 km/h
        } else if (rand < 0.52) {
            // Yellow City Taxi
            mesh = this.createSedanMesh(0xf4d03f);
            speed = 100 + Math.random() * 35;
        } else {
            // Standard Sedans
            const colors = [0xffffff, 0x111111, 0x3b82f6, 0xef4444, 0x64748b, 0x10b981];
            mesh = this.createSedanMesh(colors[Math.floor(Math.random() * colors.length)]);
            speed = 95 + Math.random() * 45; // 95-140 km/h
        }

        mesh.position.set(laneX, 0, z);
        this.scene.add(mesh);

        const carObj = {
            mesh: mesh,
            currentLane: laneIdx,
            targetLaneX: laneX,
            speed: speed, // In km/h
            isChangingLane: false,
            laneChangeTimer: Math.random() * 8 + 4,
            nearMissChecked: false
        };

        this.traffic.push(carObj);
    }

    update(delta, playerZ, playerSpeed) {
        // Keep traffic population populated
        while (this.traffic.length < this.maxTraffic) {
            this.spawnTrafficCar(playerZ);
        }

        for (let i = this.traffic.length - 1; i >= 0; i--) {
            const car = this.traffic[i];
            const mesh = car.mesh;

            // Move traffic car forward along highway
            // Speed km/h to units/sec: 1 unit ~ 1 meter -> km/h / 3.6
            const unitsPerSec = car.speed / 3.6;
            mesh.position.z += unitsPerSec * delta;

            // Smooth lane changing AI
            car.laneChangeTimer -= delta;
            if (car.laneChangeTimer <= 0 && !car.isChangingLane) {
                car.laneChangeTimer = 8 + Math.random() * 12;
                if (Math.random() > 0.4) {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    const nextLane = car.currentLane + dir;
                    if (nextLane >= 0 && nextLane < this.lanes.length) {
                        // Check if target lane is clear
                        const targetX = this.lanes[nextLane];
                        const blocked = this.traffic.some(other =>
                            other !== car &&
                            Math.abs(other.mesh.position.x - targetX) < 1.8 &&
                            Math.abs(other.mesh.position.z - mesh.position.z) < 22
                        );
                        if (!blocked) {
                            car.currentLane = nextLane;
                            car.targetLaneX = targetX;
                            car.isChangingLane = true;
                        }
                    }
                }
            }

            // Interpolate toward target lane
            if (car.isChangingLane) {
                const diff = car.targetLaneX - mesh.position.x;
                mesh.position.x += Math.sign(diff) * Math.min(Math.abs(diff), 2.5 * delta);
                mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, (car.targetLaneX - mesh.position.x) * 0.1, 0.1);

                if (Math.abs(mesh.position.x - car.targetLaneX) < 0.05) {
                    mesh.position.x = car.targetLaneX;
                    mesh.rotation.y = 0;
                    car.isChangingLane = false;
                }
            }

            // Remove traffic cars falling behind or way too far ahead
            if (mesh.position.z < playerZ - 30 || mesh.position.z > playerZ + 240) {
                this.scene.remove(mesh);
                this.traffic.splice(i, 1);
            }
        }
    }

    // Check collision with player car bounding box
    checkCollision(playerPos, playerBoxSize = { width: 1.8, length: 4.2 }) {
        for (const car of this.traffic) {
            const hit = car.mesh.userData.hitBox;
            const dx = Math.abs(playerPos.x - car.mesh.position.x);
            const dz = Math.abs(playerPos.z - car.mesh.position.z);

            const overlapX = (playerBoxSize.width + hit.width) * 0.44;
            const overlapZ = (playerBoxSize.length + hit.length) * 0.44;

            if (dx < overlapX && dz < overlapZ) {
                return { collided: true, hitMesh: car.mesh };
            }
        }
        return { collided: false };
    }

    // Near miss detection (reward high-speed dodge)
    checkNearMiss(playerPos, playerSpeed) {
        if (playerSpeed < 100) return false;

        for (const car of this.traffic) {
            if (car.nearMissChecked) continue;

            const dx = Math.abs(playerPos.x - car.mesh.position.x);
            const dz = Math.abs(playerPos.z - car.mesh.position.z);

            // Passed right alongside between 1.6m and 2.6m
            if (dx > 1.3 && dx < 2.5 && dz < 2.0) {
                car.nearMissChecked = true;
                return true;
            }
        }
        return false;
    }

    reset() {
        this.traffic.forEach(c => this.scene.remove(c.mesh));
        this.traffic = [];
    }
}

window.TrafficManager = TrafficManager;
