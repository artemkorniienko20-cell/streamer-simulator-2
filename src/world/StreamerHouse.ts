import * as THREE from 'three';

export class StreamerHouse {
  public mesh: THREE.Group;
  public entrancePos: THREE.Vector3 = new THREE.Vector3(-60, 0, -85);
  public drivewayPos: THREE.Vector3 = new THREE.Vector3(-52, 0, -85);
  public deskPos: THREE.Vector3 = new THREE.Vector3(-62, 0, -92);

  private pcGroup: THREE.Group;
  private beaconLight: THREE.Mesh;

  constructor() {
    this.mesh = new THREE.Group();
    this.pcGroup = new THREE.Group();
    this.pcGroup.position.copy(this.deskPos);

    this.beaconLight = new THREE.Mesh();
    this.buildHouse();
    this.buildStreamerRoom();
    this.buildQuestBeacon();

    this.mesh.add(this.pcGroup);
  }

  private buildHouse(): void {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.6 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5, roughness: 0.1 });
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const lawnMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });

    // House position base is (-60, 0, -90)
    const baseGroup = new THREE.Group();
    baseGroup.position.set(-60, 0, -90);

    // Yard & Lawn
    const yardGeo = new THREE.BoxGeometry(32, 0.2, 28);
    const yard = new THREE.Mesh(yardGeo, lawnMat);
    yard.position.set(0, 0.1, 0);
    yard.receiveShadow = true;
    baseGroup.add(yard);

    // Driveway / Parking for cars & bike
    const driveGeo = new THREE.BoxGeometry(10, 0.22, 16);
    const drive = new THREE.Mesh(driveGeo, asphaltMat);
    drive.position.set(8, 0.11, 4);
    drive.receiveShadow = true;
    baseGroup.add(drive);

    // Main House Building Structure (L-shape modern villa)
    const mainBuildingGeo = new THREE.BoxGeometry(18, 6.0, 16);
    const mainBuilding = new THREE.Mesh(mainBuildingGeo, wallMat);
    mainBuilding.position.set(-3, 3.0, -2);
    mainBuilding.castShadow = true;
    mainBuilding.receiveShadow = true;
    baseGroup.add(mainBuilding);

    // Wood accent wall on front
    const woodAccentGeo = new THREE.BoxGeometry(6, 5.5, 0.2);
    const woodAccent = new THREE.Mesh(woodAccentGeo, woodMat);
    woodAccent.position.set(-4, 2.8, 6.05);
    baseGroup.add(woodAccent);

    // Panoramic Studio Windows
    const windowGeo = new THREE.BoxGeometry(7, 3.5, 0.2);
    const studioWindow = new THREE.Mesh(windowGeo, glassMat);
    studioWindow.position.set(3, 2.8, 6.05);
    baseGroup.add(studioWindow);

    // Entrance Porch
    const porchGeo = new THREE.BoxGeometry(4, 0.3, 3);
    const porch = new THREE.Mesh(porchGeo, woodMat);
    porch.position.set(-4, 0.2, 7.5);
    baseGroup.add(porch);

    // Porch Light
    const porchLight = new THREE.PointLight(0xfef08a, 1.5, 8);
    porchLight.position.set(-4, 4, 6.8);
    baseGroup.add(porchLight);

    // Roof
    const roofGeo = new THREE.BoxGeometry(20, 0.6, 18);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(-3, 6.2, -2);
    roof.castShadow = true;
    baseGroup.add(roof);

    this.mesh.add(baseGroup);
  }

  private buildStreamerRoom(): void {
    // Room is inside the house around (-62, 0, -92)
    const roomGroup = new THREE.Group();
    roomGroup.position.set(-62, 0, -92);

    // Parquet Floor
    const floorGeo = new THREE.BoxGeometry(10, 0.25, 10);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0.15, 0);
    roomGroup.add(floor);

    // Streamer Desk
    const deskTopGeo = new THREE.BoxGeometry(3.0, 0.1, 1.4);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.3 });
    const deskTop = new THREE.Mesh(deskTopGeo, deskMat);
    deskTop.position.set(0, 1.2, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    roomGroup.add(deskTop);

    // Desk Legs (metal frame)
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8, roughness: 0.3 });
    const legGeo = new THREE.BoxGeometry(0.1, 1.2, 1.3);
    const legL = new THREE.Mesh(legGeo, metalMat);
    legL.position.set(-1.4, 0.6, 0);
    const legR = new THREE.Mesh(legGeo, metalMat);
    legR.position.set(1.4, 0.6, 0);
    roomGroup.add(legL, legR);

    // RGB LED Strip under the desk
    const rgbLight = new THREE.PointLight(0xa855f7, 2, 6);
    rgbLight.position.set(0, 1.1, 0);
    roomGroup.add(rgbLight);

    // Gaming Chair
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, 1.1);

    const seatGeo = new THREE.BoxGeometry(0.8, 0.12, 0.8);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 0.75, 0);

    const backGeo = new THREE.BoxGeometry(0.75, 1.1, 0.15);
    const back = new THREE.Mesh(backGeo, new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.7 }));
    back.position.set(0, 1.3, 0.35);

    chairGroup.add(seat, back);
    roomGroup.add(chairGroup);

    this.mesh.add(roomGroup);
  }

  private buildQuestBeacon(): void {
    // Glowing vertical beacon beam of light above the house for easy GPS navigation
    const beaconGeo = new THREE.CylinderGeometry(0.8, 1.4, 60, 16);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.beaconLight = new THREE.Mesh(beaconGeo, beaconMat);
    this.beaconLight.position.set(-60, 30, -90);
    this.mesh.add(this.beaconLight);

    // Top pulsing diamond marker
    const diamondGeo = new THREE.OctahedronGeometry(2.0, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.5,
      roughness: 0.1
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.position.set(-60, 12, -90);
    this.mesh.add(diamond);
  }

  public updateBeacon(time: number): void {
    if (this.beaconLight) {
      this.beaconLight.rotation.y = time * 0.5;
    }
  }

  public updatePcModel(tierIndex: number): void {
    // Clear existing PC mesh
    while (this.pcGroup.children.length > 0) {
      this.pcGroup.remove(this.pcGroup.children[0]);
    }

    if (tierIndex === -1) {
      // Empty desk: Note paper on desk
      const noteGeo = new THREE.BoxGeometry(0.4, 0.02, 0.3);
      const noteMat = new THREE.MeshStandardMaterial({ color: 0xfef08a });
      const note = new THREE.Mesh(noteGeo, noteMat);
      note.position.set(0, 1.26, 0);
      this.pcGroup.add(note);
      return;
    }

    if (tierIndex === 0) {
      // --- Tier 0: "Old Comp" (100 грн) ---
      // Bulky beige CRT Monitor, beige tower, PS/2 keyboard, ball mouse
      const beigeMat = new THREE.MeshStandardMaterial({ color: 0xd6cbb8, roughness: 0.8 }); // Пожовклий пластик
      const screenMat = new THREE.MeshStandardMaterial({ color: 0x052e16, emissive: 0x22c55e, emissiveIntensity: 0.6 }); // Зелений фосфорний термінал

      // CRT Monitor Body
      const monitorGeo = new THREE.BoxGeometry(0.7, 0.6, 0.65);
      const monitor = new THREE.Mesh(monitorGeo, beigeMat);
      monitor.position.set(0, 1.55, -0.2);
      monitor.castShadow = true;

      // Curved Screen face
      const screenGeo = new THREE.BoxGeometry(0.55, 0.45, 0.04);
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 1.55, 0.12);

      // CRT Stand
      const standGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.1, 12);
      const stand = new THREE.Mesh(standGeo, beigeMat);
      stand.position.set(0, 1.25, -0.2);

      // Old Tower Case (standing next to desk or on floor)
      const towerGeo = new THREE.BoxGeometry(0.35, 0.7, 0.65);
      const tower = new THREE.Mesh(towerGeo, beigeMat);
      tower.position.set(1.1, 0.6, 0);
      tower.castShadow = true;

      // Old Keyboard
      const kbGeo = new THREE.BoxGeometry(0.75, 0.05, 0.3);
      const kb = new THREE.Mesh(kbGeo, beigeMat);
      kb.position.set(0, 1.28, 0.25);

      // Ball Mouse
      const mouseGeo = new THREE.BoxGeometry(0.12, 0.05, 0.18);
      const mouse = new THREE.Mesh(mouseGeo, beigeMat);
      mouse.position.set(0.5, 1.28, 0.25);

      this.pcGroup.add(monitor, screen, stand, tower, kb, mouse);

    } else if (tierIndex === 1) {
      // --- Tier 1: Office PC ---
      const blackMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5 });
      const lcdScreenMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, emissive: 0x0284c7, emissiveIntensity: 0.7 });

      // Flat LCD
      const monitorGeo = new THREE.BoxGeometry(0.9, 0.55, 0.06);
      const monitor = new THREE.Mesh(monitorGeo, lcdScreenMat);
      monitor.position.set(0, 1.6, -0.2);

      const standGeo = new THREE.CylinderGeometry(0.04, 0.15, 0.35, 8);
      const stand = new THREE.Mesh(standGeo, blackMat);
      stand.position.set(0, 1.35, -0.2);

      const towerGeo = new THREE.BoxGeometry(0.35, 0.75, 0.65);
      const tower = new THREE.Mesh(towerGeo, blackMat);
      tower.position.set(1.1, 0.6, 0);

      const kbGeo = new THREE.BoxGeometry(0.75, 0.04, 0.25);
      const kb = new THREE.Mesh(kbGeo, blackMat);
      kb.position.set(0, 1.27, 0.25);

      this.pcGroup.add(monitor, stand, tower, kb);

    } else if (tierIndex === 2) {
      // --- Tier 2: Gaming Starter ---
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
      const rgbMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 1.2 });

      // Curved Gaming Monitor
      const monGeo = new THREE.BoxGeometry(1.2, 0.65, 0.08);
      const mon = new THREE.Mesh(monGeo, rgbMat);
      mon.position.set(0, 1.65, -0.2);

      // Glass RGB Case
      const caseGeo = new THREE.BoxGeometry(0.4, 0.8, 0.7);
      const pcCase = new THREE.Mesh(caseGeo, darkMat);
      pcCase.position.set(1.1, 1.6, 0);

      const fanLight = new THREE.PointLight(0x00f2fe, 1.5, 3);
      fanLight.position.set(1.1, 1.6, 0.2);

      // RGB Keyboard
      const kb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.25), rgbMat);
      kb.position.set(0, 1.27, 0.25);

      this.pcGroup.add(mon, pcCase, fanLight, kb);

    } else if (tierIndex === 3) {
      // --- Tier 3: Pro Streamer (Dual screen, microphone arm) ---
      const rgbMat = new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 1.0 });

      // Dual Monitors
      const monL = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.65, 0.08), rgbMat);
      monL.position.set(-0.55, 1.65, -0.2);
      monL.rotation.y = 0.2;

      const monR = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.65, 0.08), rgbMat);
      monR.position.set(0.55, 1.65, -0.2);
      monR.rotation.y = -0.2;

      // Studio Mic on Boom Arm
      const micGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8);
      const mic = new THREE.Mesh(micGeo, new THREE.MeshStandardMaterial({ color: 0x111827 }));
      mic.position.set(-0.4, 1.45, 0.1);

      // Facecam on top of monitor
      const camGeo = new THREE.BoxGeometry(0.15, 0.08, 0.08);
      const cam = new THREE.Mesh(camGeo, new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe }));
      cam.position.set(0, 2.02, -0.2);

      this.pcGroup.add(monL, monR, mic, cam);

    } else {
      // --- Tier 4: Ultra Cyber Beast 5090 (Triple Ultra-Wide + Water Cooling Neon) ---
      const purpleNeon = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xa855f7, emissiveIntensity: 1.5 });
      const cyanNeon = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 1.5 });

      // 3 Curved Monitors
      const monCenter = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 0.08), cyanNeon);
      monCenter.position.set(0, 1.7, -0.25);

      const monLeft = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.08), purpleNeon);
      monLeft.position.set(-1.15, 1.7, -0.15);
      monLeft.rotation.y = 0.35;

      const monRight = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.08), purpleNeon);
      monRight.position.set(1.15, 1.7, -0.15);
      monRight.rotation.y = -0.35;

      // Beast Liquid Cool PC Case
      const caseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.8), purpleNeon);
      caseMesh.position.set(1.5, 0.7, 0);

      const roomNeonLight = new THREE.PointLight(0xa855f7, 3, 8);
      roomNeonLight.position.set(0, 2.2, 0);

      this.pcGroup.add(monCenter, monLeft, monRight, caseMesh, roomNeonLight);
    }
  }
}
