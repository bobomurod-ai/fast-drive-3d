// Fast Drive 3D - Uzbek Cars Procedural 3D Models & Specs
// Gentra, Cobalt, Nexia 3, Damas, Malibu 2 Turbo, Tracker

const UZB_CARS = [
    {
        id: 'gentra',
        name: 'Gentra (Lacetti)',
        desc: 'O\'zbekiston ko\'chalarining haqiqiy afsonasi! Qulay boshqaruv va mustahkam dvigatel.',
        speed: 180,      // Max km/h
        accel: 7.5,      // Acceleration factor
        handling: 8.5,   // Turn responsiveness
        nitroPower: 1.3,
        price: 0,        // Boshlang'ich bepul
        unlocked: true,
        colors: [0xffffff, 0x111111, 0x3a3f47, 0x8b0000, 0x0f3460]
    },
    {
        id: 'cobalt',
        name: 'Cobalt',
        desc: 'Oila va uzoq safarlar uchun ideal, ishonchli va keng avtomobil.',
        speed: 175,
        accel: 7.2,
        handling: 8.0,
        nitroPower: 1.25,
        price: 250,
        unlocked: false,
        colors: [0xffffff, 0xd0d5dd, 0x222222, 0x4a6572, 0xb8860b]
    },
    {
        id: 'nexia3',
        name: 'Nexia 3',
        desc: 'Chaqqon, yengil va juda tezkor shahar sedani.',
        speed: 185,
        accel: 8.2,
        handling: 9.0,
        nitroPower: 1.35,
        price: 500,
        unlocked: false,
        colors: [0xffffff, 0x0044ff, 0x111111, 0xbb0a1e, 0x555555]
    },
    {
        id: 'damas',
        name: 'Damas',
        desc: 'Tadbirkorlarning ajralmas do\'sti! Baland korpus va chaqqon burilish.',
        speed: 140,
        accel: 6.5,
        handling: 9.2,
        nitroPower: 1.45,
        price: 750,
        unlocked: false,
        colors: [0xffffff, 0xe0e0e0, 0x2255aa, 0x22aa55]
    },
    {
        id: 'tracker',
        name: 'Tracker Turbo',
        desc: 'Zamonaviy shahar krossoveri. Baland klirens va qudratli turbo dvigatel.',
        speed: 200,
        accel: 8.8,
        handling: 8.8,
        nitroPower: 1.4,
        price: 1200,
        unlocked: false,
        colors: [0x111111, 0xffffff, 0x8b0000, 0x334455, 0x1e3f66]
    },
    {
        id: 'malibu2',
        name: 'Malibu 2 Turbo',
        desc: 'Prezident klassi! Qora nasha, yovvoyi tezlanish va aerodinamik qiyofa.',
        speed: 230,
        accel: 9.5,
        handling: 9.3,
        nitroPower: 1.6,
        price: 2000,
        unlocked: false,
        colors: [0x0d0d0d, 0xffffff, 0x2b2b2b, 0x4b0082]
    }
];

class CarBuilder {
    // Shared materials generator
    static getMaterials(paintColor = 0xffffff) {
        return {
            body: new THREE.MeshStandardMaterial({
                color: paintColor,
                roughness: 0.25,
                metalness: 0.65,
                envMapIntensity: 1.0
            }),
            glass: new THREE.MeshPhysicalMaterial({
                color: 0x111827,
                roughness: 0.1,
                transmission: 0.6,
                transparent: true,
                opacity: 0.75
            }),
            blackTrim: new THREE.MeshStandardMaterial({
                color: 0x1a1a1a,
                roughness: 0.7,
                metalness: 0.2
            }),
            chrome: new THREE.MeshStandardMaterial({
                color: 0xeeeeee,
                roughness: 0.1,
                metalness: 0.95
            }),
            headlight: new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xeeeeff,
                emissiveIntensity: 0.8
            }),
            taillight: new THREE.MeshStandardMaterial({
                color: 0xff1111,
                emissive: 0xaa0000,
                emissiveIntensity: 0.7
            }),
            wheelRubber: new THREE.MeshStandardMaterial({
                color: 0x151515,
                roughness: 0.9,
                metalness: 0.1
            }),
            wheelRim: new THREE.MeshStandardMaterial({
                color: 0xdcdcdc,
                roughness: 0.3,
                metalness: 0.85
            }),
            licensePlate: new THREE.MeshBasicMaterial({
                color: 0xffffff
            })
        };
    }

    static createWheel(radius = 0.36, width = 0.26, rimColor = 0xdcdcdc) {
        const wheelGroup = new THREE.Group();
        const mats = this.getMaterials();

        // Tire
        const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 18);
        tireGeo.rotateZ(Math.PI / 2);
        const tire = new THREE.Mesh(tireGeo, mats.wheelRubber);
        tire.castShadow = true;
        wheelGroup.add(tire);

        // Rim
        const rimGeo = new THREE.CylinderGeometry(radius * 0.7, radius * 0.7, width * 1.02, 16);
        rimGeo.rotateZ(Math.PI / 2);
        const rimMat = mats.wheelRim.clone();
        rimMat.color.setHex(rimColor);
        const rim = new THREE.Mesh(rimGeo, rimMat);
        wheelGroup.add(rim);

        // Hub cap / spokes
        for (let i = 0; i < 5; i++) {
            const spokeGeo = new THREE.BoxGeometry(width * 1.05, radius * 1.25, radius * 0.15);
            spokeGeo.rotateX((i * Math.PI) / 2.5);
            const spoke = new THREE.Mesh(spokeGeo, mats.chrome);
            wheelGroup.add(spoke);
        }

        return wheelGroup;
    }

    static createLicensePlate(text = "01 | 777 AAA") {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 64);

        // Border
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(2, 2, 252, 60);

        // Uzbek flag strip on left
        ctx.fillStyle = '#0099b5';
        ctx.fillRect(8, 8, 30, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, 24, 30, 16);
        ctx.fillStyle = '#1eb53a';
        ctx.fillRect(8, 40, 30, 16);

        // Text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 145, 33);

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ map: texture });
        const geo = new THREE.PlaneGeometry(0.7, 0.18);
        return new THREE.Mesh(geo, mat);
    }

    // --- Build Car by ID ---
    static build(carId, paintColor = null) {
        const carData = UZB_CARS.find(c => c.id === carId) || UZB_CARS[0];
        const color = (paintColor !== null) ? paintColor : carData.colors[0];
        const mats = this.getMaterials(color);

        const carGroup = new THREE.Group();
        carGroup.userData = {
            id: carData.id,
            name: carData.name,
            wheels: [],
            frontWheels: [],
            taillights: [],
            headlights: [],
            paintMesh: null
        };

        if (carId === 'damas') {
            this.buildDamas(carGroup, mats);
        } else if (carId === 'malibu2') {
            this.buildMalibu(carGroup, mats);
        } else if (carId === 'tracker') {
            this.buildTracker(carGroup, mats);
        } else if (carId === 'nexia3') {
            this.buildNexia3(carGroup, mats);
        } else if (carId === 'cobalt') {
            this.buildCobalt(carGroup, mats);
        } else {
            // Default Gentra (Lacetti)
            this.buildGentra(carGroup, mats);
        }

        // License plates
        const frontPlate = this.createLicensePlate("01 | 777 AAA");
        frontPlate.position.set(0, 0.35, 2.16);
        carGroup.add(frontPlate);

        const rearPlate = this.createLicensePlate("01 | 777 AAA");
        rearPlate.position.set(0, 0.45, -2.16);
        rearPlate.rotation.y = Math.PI;
        carGroup.add(rearPlate);

        return carGroup;
    }

    // 1. GENTRA (LACETTI)
    static buildGentra(group, mats) {
        // Lower chassis & main body
        const bodyGeo = new THREE.BoxGeometry(1.85, 0.55, 4.3);
        const body = new THREE.Mesh(bodyGeo, mats.body);
        body.position.y = 0.52;
        body.castShadow = true;
        group.add(body);
        group.userData.paintMesh = body;

        // Cabin / Roof
        const cabinGeo = new THREE.BoxGeometry(1.58, 0.52, 2.3);
        const cabin = new THREE.Mesh(cabinGeo, mats.body);
        cabin.position.set(0, 0.95, -0.2);
        cabin.castShadow = true;
        group.add(cabin);

        // Windshield (Front glass)
        const frontGlassGeo = new THREE.PlaneGeometry(1.5, 0.58);
        const frontGlass = new THREE.Mesh(frontGlassGeo, mats.glass);
        frontGlass.position.set(0, 0.92, 0.98);
        frontGlass.rotation.x = -Math.PI / 4;
        group.add(frontGlass);

        // Rear window
        const rearGlassGeo = new THREE.PlaneGeometry(1.5, 0.52);
        const rearGlass = new THREE.Mesh(rearGlassGeo, mats.glass);
        rearGlass.position.set(0, 0.92, -1.38);
        rearGlass.rotation.x = Math.PI / 3.8;
        group.add(rearGlass);

        // Side windows
        const sideGlassL = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.42), mats.glass);
        sideGlassL.position.set(-0.8, 0.93, -0.2);
        sideGlassL.rotation.y = -Math.PI / 2;
        group.add(sideGlassL);

        const sideGlassR = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.42), mats.glass);
        sideGlassR.position.set(0.8, 0.93, -0.2);
        sideGlassR.rotation.y = Math.PI / 2;
        group.add(sideGlassR);

        // Front Grille with Chevrolet gold/chrome bow-tie
        const grilleGeo = new THREE.BoxGeometry(0.9, 0.18, 0.1);
        const grille = new THREE.Mesh(grilleGeo, mats.blackTrim);
        grille.position.set(0, 0.55, 2.16);
        group.add(grille);

        const badgeGeo = new THREE.BoxGeometry(0.18, 0.08, 0.12);
        const badgeMat = new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.9, roughness: 0.2 });
        const badge = new THREE.Mesh(badgeGeo, badgeMat);
        badge.position.set(0, 0.55, 2.17);
        group.add(badge);

        // Headlights (Curved shape)
        const hlGeo = new THREE.BoxGeometry(0.35, 0.16, 0.15);
        const hlL = new THREE.Mesh(hlGeo, mats.headlight);
        hlL.position.set(-0.65, 0.56, 2.14);
        group.add(hlL);
        group.userData.headlights.push(hlL);

        const hlR = new THREE.Mesh(hlGeo, mats.headlight);
        hlR.position.set(0.65, 0.56, 2.14);
        group.add(hlR);
        group.userData.headlights.push(hlR);

        // Taillights
        const tlGeo = new THREE.BoxGeometry(0.35, 0.16, 0.1);
        const tlL = new THREE.Mesh(tlGeo, mats.taillight);
        tlL.position.set(-0.65, 0.58, -2.16);
        group.add(tlL);
        group.userData.taillights.push(tlL);

        const tlR = new THREE.Mesh(tlGeo, mats.taillight);
        tlR.position.set(0.65, 0.58, -2.16);
        group.add(tlR);
        group.userData.taillights.push(tlR);

        // Add 4 Wheels
        this.attachWheels(group, 0.98, 1.35, 0.36, 0.26);
    }

    // 2. COBALT
    static buildCobalt(group, mats) {
        // Taller, muscular body
        const bodyGeo = new THREE.BoxGeometry(1.88, 0.62, 4.35);
        const body = new THREE.Mesh(bodyGeo, mats.body);
        body.position.y = 0.56;
        body.castShadow = true;
        group.add(body);
        group.userData.paintMesh = body;

        // Tall cabin
        const cabinGeo = new THREE.BoxGeometry(1.6, 0.56, 2.35);
        const cabin = new THREE.Mesh(cabinGeo, mats.body);
        cabin.position.set(0, 1.02, -0.15);
        cabin.castShadow = true;
        group.add(cabin);

        // Large front grille (Cobalt dual-port)
        const grilleUpper = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.15, 0.1), mats.blackTrim);
        grilleUpper.position.set(0, 0.68, 2.18);
        group.add(grilleUpper);

        const grilleLower = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.1), mats.blackTrim);
        grilleLower.position.set(0, 0.42, 2.18);
        group.add(grilleLower);

        // Big angular Cobalt headlights
        const hlGeo = new THREE.BoxGeometry(0.38, 0.22, 0.15);
        const hlL = new THREE.Mesh(hlGeo, mats.headlight);
        hlL.position.set(-0.66, 0.64, 2.15);
        group.add(hlL);
        group.userData.headlights.push(hlL);

        const hlR = new THREE.Mesh(hlGeo, mats.headlight);
        hlR.position.set(0.66, 0.64, 2.15);
        group.add(hlR);
        group.userData.headlights.push(hlR);

        // Windows
        const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.62), mats.glass);
        frontGlass.position.set(0, 0.98, 1.04);
        frontGlass.rotation.x = -Math.PI / 4.2;
        group.add(frontGlass);

        const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.55), mats.glass);
        rearGlass.position.set(0, 0.98, -1.34);
        rearGlass.rotation.x = Math.PI / 3.8;
        group.add(rearGlass);

        // Vertical style Cobalt taillights
        const tlGeo = new THREE.BoxGeometry(0.24, 0.32, 0.1);
        const tlL = new THREE.Mesh(tlGeo, mats.taillight);
        tlL.position.set(-0.7, 0.64, -2.18);
        group.add(tlL);
        group.userData.taillights.push(tlL);

        const tlR = new THREE.Mesh(tlGeo, mats.taillight);
        tlR.position.set(0.7, 0.64, -2.18);
        group.add(tlR);
        group.userData.taillights.push(tlR);

        this.attachWheels(group, 0.98, 1.35, 0.37, 0.26);
    }

    // 3. NEXIA 3
    static buildNexia3(group, mats) {
        // Compact sporty body
        const bodyGeo = new THREE.BoxGeometry(1.78, 0.54, 4.05);
        const body = new THREE.Mesh(bodyGeo, mats.body);
        body.position.y = 0.52;
        body.castShadow = true;
        group.add(body);
        group.userData.paintMesh = body;

        // Cabin
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.52, 2.15), mats.body);
        cabin.position.set(0, 0.93, -0.15);
        cabin.castShadow = true;
        group.add(cabin);

        // Sporty rear spoiler
        const spoilerBar = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.05, 0.25), mats.body);
        spoilerBar.position.set(0, 0.88, -1.95);
        group.add(spoilerBar);

        const spoilerStandL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.15), mats.blackTrim);
        spoilerStandL.position.set(-0.55, 0.8, -1.95);
        group.add(spoilerStandL);

        const spoilerStandR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.15), mats.blackTrim);
        spoilerStandR.position.set(0.55, 0.8, -1.95);
        group.add(spoilerStandR);

        // Sporty teardrop headlights
        const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.15), mats.headlight);
        hlL.position.set(-0.62, 0.55, 2.02);
        group.add(hlL);
        group.userData.headlights.push(hlL);

        const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.15), mats.headlight);
        hlR.position.set(0.62, 0.55, 2.02);
        group.add(hlR);
        group.userData.headlights.push(hlR);

        // Taillights
        const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.1), mats.taillight);
        tlL.position.set(-0.62, 0.56, -2.03);
        group.add(tlL);
        group.userData.taillights.push(tlL);

        const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.1), mats.taillight);
        tlR.position.set(0.62, 0.56, -2.03);
        group.add(tlR);
        group.userData.taillights.push(tlR);

        // Windows
        const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.58), mats.glass);
        frontGlass.position.set(0, 0.9, 0.94);
        frontGlass.rotation.x = -Math.PI / 4.1;
        group.add(frontGlass);

        this.attachWheels(group, 0.95, 1.25, 0.35, 0.25);
    }

    // 4. DAMAS (Uzbekistan's Iconic Minivan)
    static buildDamas(group, mats) {
        // High boxy body
        const vanGeo = new THREE.BoxGeometry(1.55, 1.25, 3.4);
        const van = new THREE.Mesh(vanGeo, mats.body);
        van.position.y = 0.95;
        van.castShadow = true;
        group.add(van);
        group.userData.paintMesh = van;

        // Flat vertical windshield
        const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.65), mats.glass);
        frontGlass.position.set(0, 1.15, 1.71);
        frontGlass.rotation.x = -0.15;
        group.add(frontGlass);

        // Big side windows
        const sideWindowGeo = new THREE.PlaneGeometry(2.4, 0.45);
        const sideL = new THREE.Mesh(sideWindowGeo, mats.glass);
        sideL.position.set(-0.78, 1.15, -0.2);
        sideL.rotation.y = -Math.PI / 2;
        group.add(sideL);

        const sideR = new THREE.Mesh(sideWindowGeo, mats.glass);
        sideR.position.set(0.78, 1.15, -0.2);
        sideR.rotation.y = Math.PI / 2;
        group.add(sideR);

        // Damas sliding door groove
        const grooveGeo = new THREE.BoxGeometry(0.04, 0.05, 1.4);
        const groove = new THREE.Mesh(grooveGeo, mats.blackTrim);
        groove.position.set(0.78, 0.85, -0.2);
        group.add(groove);

        // Damas bumper & front grill
        const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.26, 0.2), mats.blackTrim);
        bumper.position.set(0, 0.45, 1.68);
        group.add(bumper);

        // Classic rectangular Damas headlights
        const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.08), mats.headlight);
        hlL.position.set(-0.52, 0.68, 1.71);
        group.add(hlL);
        group.userData.headlights.push(hlL);

        const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.08), mats.headlight);
        hlR.position.set(0.52, 0.68, 1.71);
        group.add(hlR);
        group.userData.headlights.push(hlR);

        // Rear vertical taillights
        const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.08), mats.taillight);
        tlL.position.set(-0.62, 0.85, -1.71);
        group.add(tlL);
        group.userData.taillights.push(tlL);

        const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.08), mats.taillight);
        tlR.position.set(0.62, 0.85, -1.71);
        group.add(tlR);
        group.userData.taillights.push(tlR);

        // Compact wheels
        this.attachWheels(group, 0.82, 1.1, 0.3, 0.22);
    }

    // 5. MALIBU 2 TURBO
    static buildMalibu(group, mats) {
        // Wide, aggressive sports sedan body
        const bodyGeo = new THREE.BoxGeometry(1.98, 0.5, 4.6);
        const body = new THREE.Mesh(bodyGeo, mats.body);
        body.position.y = 0.48;
        body.castShadow = true;
        group.add(body);
        group.userData.paintMesh = body;

        // Low roof aerodynamic fastback cabin
        const cabinGeo = new THREE.BoxGeometry(1.65, 0.46, 2.5);
        const cabin = new THREE.Mesh(cabinGeo, mats.body);
        cabin.position.set(0, 0.88, -0.2);
        cabin.castShadow = true;
        group.add(cabin);

        // Sleek slanted windshield
        const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 0.65), mats.glass);
        frontGlass.position.set(0, 0.88, 1.08);
        frontGlass.rotation.x = -Math.PI / 3.6;
        group.add(frontGlass);

        // Fastback rear glass
        const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 0.72), mats.glass);
        rearGlass.position.set(0, 0.84, -1.48);
        rearGlass.rotation.x = Math.PI / 3.4;
        group.add(rearGlass);

        // Sharp LED aggressive headlights
        const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.2), mats.headlight);
        hlL.position.set(-0.7, 0.52, 2.25);
        hlL.rotation.y = 0.15;
        group.add(hlL);
        group.userData.headlights.push(hlL);

        const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.2), mats.headlight);
        hlR.position.set(0.7, 0.52, 2.25);
        hlR.rotation.y = -0.15;
        group.add(hlR);
        group.userData.headlights.push(hlR);

        // Wide black aerodynamic sport grille
        const grille = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.24, 0.1), mats.blackTrim);
        grille.position.set(0, 0.48, 2.31);
        group.add(grille);

        // Malibu Dual Exhaust pipes
        const pipeL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 12), mats.chrome);
        pipeL.rotation.x = Math.PI / 2;
        pipeL.position.set(-0.65, 0.32, -2.32);
        group.add(pipeL);

        const pipeR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 12), mats.chrome);
        pipeR.rotation.x = Math.PI / 2;
        pipeR.position.set(0.65, 0.32, -2.32);
        group.add(pipeR);

        // Rear LED sleek taillights
        const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.1), mats.taillight);
        tlL.position.set(-0.7, 0.55, -2.31);
        group.add(tlL);
        group.userData.taillights.push(tlL);

        const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.1), mats.taillight);
        tlR.position.set(0.7, 0.55, -2.31);
        group.add(tlR);
        group.userData.taillights.push(tlR);

        // Low profile sport wheels with black rim
        this.attachWheels(group, 1.05, 1.45, 0.38, 0.29, 0x111111);
    }

    // 6. TRACKER TURBO
    static buildTracker(group, mats) {
        // SUV High body
        const bodyGeo = new THREE.BoxGeometry(1.92, 0.65, 4.25);
        const body = new THREE.Mesh(bodyGeo, mats.body);
        body.position.y = 0.65;
        body.castShadow = true;
        group.add(body);
        group.userData.paintMesh = body;

        // Cabin
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.58, 2.3), mats.body);
        cabin.position.set(0, 1.15, -0.1);
        cabin.castShadow = true;
        group.add(cabin);

        // Roof rails
        const railL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 2.0), mats.blackTrim);
        railL.position.set(-0.75, 1.48, -0.1);
        group.add(railL);

        const railR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 2.0), mats.blackTrim);
        railR.position.set(0.75, 1.48, -0.1);
        group.add(railR);

        // Windows
        const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 0.65), mats.glass);
        frontGlass.position.set(0, 1.12, 1.08);
        frontGlass.rotation.x = -Math.PI / 3.8;
        group.add(frontGlass);

        // Rugged front bumper
        const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.28, 0.2), mats.blackTrim);
        bumper.position.set(0, 0.45, 2.15);
        group.add(bumper);

        // Headlights
        const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.15), mats.headlight);
        hlL.position.set(-0.68, 0.72, 2.14);
        group.add(hlL);
        group.userData.headlights.push(hlL);

        const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.15), mats.headlight);
        hlR.position.set(0.68, 0.72, 2.14);
        group.add(hlR);
        group.userData.headlights.push(hlR);

        // Taillights
        const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.1), mats.taillight);
        tlL.position.set(-0.68, 0.75, -2.14);
        group.add(tlL);
        group.userData.taillights.push(tlL);

        const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.1), mats.taillight);
        tlR.position.set(0.68, 0.75, -2.14);
        group.add(tlR);
        group.userData.taillights.push(tlR);

        // Big SUV wheels
        this.attachWheels(group, 1.02, 1.35, 0.42, 0.28, 0x333333);
    }

    // Attach 4 wheels with proper offsets
    static attachWheels(group, halfTrack, halfWheelbase, radius, width, rimColor = 0xdcdcdc) {
        const positions = [
            { x: -halfTrack, z: halfWheelbase, isFront: true },
            { x: halfTrack, z: halfWheelbase, isFront: true },
            { x: -halfTrack, z: -halfWheelbase, isFront: false },
            { x: halfTrack, z: -halfWheelbase, isFront: false }
        ];

        positions.forEach(pos => {
            const wheelAnchor = new THREE.Group();
            wheelAnchor.position.set(pos.x, radius, pos.z);

            const wheelMesh = this.createWheel(radius, width, rimColor);
            wheelAnchor.add(wheelMesh);

            group.add(wheelAnchor);
            group.userData.wheels.push(wheelMesh);

            if (pos.isFront) {
                group.userData.frontWheels.push(wheelAnchor);
            }
        });
    }
}

// User garage inventory manager
class GarageManager {
    constructor() {
        this.selectedCarId = 'gentra';
        this.selectedColor = null;
        this.totalCoins = 0;
        this.unlockedCars = ['gentra'];
        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem('fastdrive_garage');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.selectedCarId) this.selectedCarId = data.selectedCarId;
                if (data.selectedColor !== undefined) this.selectedColor = data.selectedColor;
                if (data.totalCoins !== undefined) this.totalCoins = data.totalCoins;
                if (Array.isArray(data.unlockedCars)) this.unlockedCars = data.unlockedCars;
            }
        } catch (e) {}
    }

    save() {
        try {
            localStorage.setItem('fastdrive_garage', JSON.stringify({
                selectedCarId: this.selectedCarId,
                selectedColor: this.selectedColor,
                totalCoins: this.totalCoins,
                unlockedCars: this.unlockedCars
            }));
        } catch (e) {}
    }

    addCoins(amount) {
        this.totalCoins += Math.max(0, amount);
        this.save();
    }

    isUnlocked(carId) {
        return this.unlockedCars.includes(carId);
    }

    unlockCar(carId) {
        const car = UZB_CARS.find(c => c.id === carId);
        if (!car) return false;
        if (this.isUnlocked(carId)) return true;
        if (this.totalCoins >= car.price) {
            this.totalCoins -= car.price;
            this.unlockedCars.push(carId);
            this.save();
            return true;
        }
        return false;
    }

    selectCar(carId, colorHex = null) {
        if (this.isUnlocked(carId)) {
            this.selectedCarId = carId;
            if (colorHex !== null) {
                this.selectedColor = colorHex;
            } else {
                const car = UZB_CARS.find(c => c.id === carId);
                this.selectedColor = car ? car.colors[0] : 0xffffff;
            }
            this.save();
            return true;
        }
        return false;
    }

    getSelectedCar() {
        const car = UZB_CARS.find(c => c.id === this.selectedCarId) || UZB_CARS[0];
        return {
            ...car,
            currentColor: this.selectedColor || car.colors[0]
        };
    }
}

window.garageManager = new GarageManager();
