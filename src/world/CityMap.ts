import * as THREE from 'three';

export interface ShopZone {
  id: 'silpo' | 'gear' | 'clothes' | 'tuning';
  name: string;
  pos: THREE.Vector3;
  color: number;
  markerGroup?: THREE.Group;
  crystal?: THREE.Mesh;
}

export class CityMap {
  public mesh: THREE.Group;
  public roadSegments: Array<{ x: number; z: number; w: number; d: number }> = [];
  public shopZones: ShopZone[] = [
    { id: 'silpo', name: 'Сільпо 24/7', pos: new THREE.Vector3(68, 0, -48), color: 0xea580c },
    { id: 'gear', name: 'Rozetka Девайси', pos: new THREE.Vector3(32, 0, -80), color: 0x10b981 },
    { id: 'clothes', name: 'Drip Store Одяг', pos: new THREE.Vector3(-25, 0, -32), color: 0xec4899 },
    { id: 'tuning', name: 'СТО Тюнінг', pos: new THREE.Vector3(68, 0, -80), color: 0xeab308 }
  ];

  constructor() {
    this.mesh = new THREE.Group();
    this.buildTerrain();
    this.buildRoadNetwork();
    this.buildIntersectionsAndCrosswalks();
    this.buildCommercialZone();
    this.buildResidentialZone();
    this.buildTownPark();
    this.buildStreetInfrastructure();
    this.buildCitySkyline();
    this.buildShopEntranceMarkers();
  }

  private buildTerrain(): void {
    // 1. Base terrain ground plane with realistic grass color
    const groundGeo = new THREE.PlaneGeometry(600, 600);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x224222, // Rich natural lawn green
      roughness: 0.95,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.mesh.add(ground);
  }

  private buildRoadNetwork(): void {
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.88 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 }); // Stone pavers
    const markYellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
    const markWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });

    // Road 1: Gas Station Avenue (Vertical, Z from +80 to -30 at X=0, width 14m)
    this.createRoadWithSidewalks(0, 25, 14, 110, true, asphaltMat, curbMat, sidewalkMat, markYellowMat, markWhiteMat);

    // Road 2: Main Boulevard / Crossroad (Horizontal, X from +80 to -80 at Z=-30, width 14m)
    this.createRoadWithSidewalks(0, -30, 160, 14, false, asphaltMat, curbMat, sidewalkMat, markYellowMat, markWhiteMat);

    // Road 3: Streamer Residential Avenue (Vertical, Z from -30 to -120 at X=-60, width 12m)
    this.createRoadWithSidewalks(-60, -75, 12, 90, true, asphaltMat, curbMat, sidewalkMat, markYellowMat, markWhiteMat);

    // Road 4: Commercial Shopping Street (Vertical, Z from -30 to -100 at X=50, width 12m)
    this.createRoadWithSidewalks(50, -65, 12, 70, true, asphaltMat, curbMat, sidewalkMat, markYellowMat, markWhiteMat);

    // Driveway to Streamer's House
    const driveGeo = new THREE.BoxGeometry(10, 0.08, 16);
    const driveMesh = new THREE.Mesh(driveGeo, asphaltMat);
    driveMesh.position.set(-52, 0.04, -85);
    driveMesh.receiveShadow = true;
    this.mesh.add(driveMesh);
  }

  private createRoadWithSidewalks(
    cx: number, cz: number,
    w: number, d: number,
    isVertical: boolean,
    asphaltMat: THREE.Material,
    curbMat: THREE.Material,
    sidewalkMat: THREE.Material,
    markYellowMat: THREE.Material,
    markWhiteMat: THREE.Material
  ): void {
    this.roadSegments.push({ x: cx, z: cz, w, d });

    // Asphalt surface
    const roadGeo = new THREE.BoxGeometry(w, 0.08, d);
    const road = new THREE.Mesh(roadGeo, asphaltMat);
    road.position.set(cx, 0.04, cz);
    road.receiveShadow = true;
    this.mesh.add(road);

    const sidewalkWidth = 3.5;
    const curbHeight = 0.22;

    if (isVertical) {
      // Curbs (left & right)
      const curbGeo = new THREE.BoxGeometry(0.35, curbHeight, d);
      const curbL = new THREE.Mesh(curbGeo, curbMat);
      curbL.position.set(cx - w / 2 - 0.175, curbHeight / 2, cz);
      const curbR = new THREE.Mesh(curbGeo, curbMat);
      curbR.position.set(cx + w / 2 + 0.175, curbHeight / 2, cz);
      this.mesh.add(curbL, curbR);

      // Sidewalks (left & right)
      const swGeo = new THREE.BoxGeometry(sidewalkWidth, 0.18, d);
      const swL = new THREE.Mesh(swGeo, sidewalkMat);
      swL.position.set(cx - w / 2 - sidewalkWidth / 2 - 0.35, 0.09, cz);
      swL.receiveShadow = true;
      const swR = new THREE.Mesh(swGeo, sidewalkMat);
      swR.position.set(cx + w / 2 + sidewalkWidth / 2 + 0.35, 0.09, cz);
      swR.receiveShadow = true;
      this.mesh.add(swL, swR);

      // Yellow dashed center line
      const numDashes = Math.floor(d / 6);
      for (let i = -numDashes / 2; i <= numDashes / 2; i++) {
        const dashGeo = new THREE.BoxGeometry(0.3, 0.09, 3.2);
        const dash = new THREE.Mesh(dashGeo, markYellowMat);
        dash.position.set(cx, 0.085, cz + i * 6);
        this.mesh.add(dash);
      }

      // White solid edge lines
      const edgeL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.09, d), markWhiteMat);
      edgeL.position.set(cx - w / 2 + 0.8, 0.085, cz);
      const edgeR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.09, d), markWhiteMat);
      edgeR.position.set(cx + w / 2 - 0.8, 0.085, cz);
      this.mesh.add(edgeL, edgeR);

    } else {
      // Horizontal road
      const curbGeo = new THREE.BoxGeometry(w, curbHeight, 0.35);
      const curbT = new THREE.Mesh(curbGeo, curbMat);
      curbT.position.set(cx, curbHeight / 2, cz - d / 2 - 0.175);
      const curbB = new THREE.Mesh(curbGeo, curbMat);
      curbB.position.set(cx, curbHeight / 2, cz + d / 2 + 0.175);
      this.mesh.add(curbT, curbB);

      const swGeo = new THREE.BoxGeometry(w, 0.18, sidewalkWidth);
      const swT = new THREE.Mesh(swGeo, sidewalkMat);
      swT.position.set(cx, 0.09, cz - d / 2 - sidewalkWidth / 2 - 0.35);
      swT.receiveShadow = true;
      const swB = new THREE.Mesh(swGeo, sidewalkMat);
      swB.position.set(cx, 0.09, cz + d / 2 + sidewalkWidth / 2 + 0.35);
      swB.receiveShadow = true;
      this.mesh.add(swT, swB);

      // Yellow dashes
      const numDashes = Math.floor(w / 6);
      for (let i = -numDashes / 2; i <= numDashes / 2; i++) {
        const dashGeo = new THREE.BoxGeometry(3.2, 0.09, 0.3);
        const dash = new THREE.Mesh(dashGeo, markYellowMat);
        dash.position.set(cx + i * 6, 0.085, cz);
        this.mesh.add(dash);
      }

      // White edge lines
      const edgeT = new THREE.Mesh(new THREE.BoxGeometry(w, 0.09, 0.25), markWhiteMat);
      edgeT.position.set(cx, 0.085, cz - d / 2 + 0.8);
      const edgeB = new THREE.Mesh(new THREE.BoxGeometry(w, 0.09, 0.25), markWhiteMat);
      edgeB.position.set(cx, 0.085, cz + d / 2 - 0.8);
      this.mesh.add(edgeT, edgeB);
    }
  }

  private buildIntersectionsAndCrosswalks(): void {
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });

    // Major Intersection at (0, -30)
    // 4 Pedestrian Crosswalks ("Зебри")
    this.addCrosswalk(0, -21, 12, 3.5, false, whiteMat); // North
    this.addCrosswalk(0, -39, 12, 3.5, false, whiteMat); // South
    this.addCrosswalk(-9, -30, 3.5, 12, true, whiteMat);  // West
    this.addCrosswalk(9, -30, 3.5, 12, true, whiteMat);   // East

    // Secondary Intersection at (-60, -30) near residential turn
    this.addCrosswalk(-60, -22, 10, 3.0, false, whiteMat);
    this.addCrosswalk(-60, -38, 10, 3.0, false, whiteMat);

    // Secondary Intersection at (50, -30) near commercial street
    this.addCrosswalk(50, -22, 10, 3.0, false, whiteMat);
    this.addCrosswalk(50, -38, 10, 3.0, false, whiteMat);

    // 4 Traffic Light Poles at Main Intersection (0, -30)
    this.addTrafficLightPole(-8, -21, 0);
    this.addTrafficLightPole(8, -21, Math.PI);
    this.addTrafficLightPole(-8, -39, Math.PI / 2);
    this.addTrafficLightPole(8, -39, -Math.PI / 2);
  }

  private addCrosswalk(cx: number, cz: number, w: number, d: number, isVerticalBars: boolean, mat: THREE.Material): void {
    const numBars = 7;
    if (isVerticalBars) {
      const barH = d / (numBars * 1.6);
      for (let i = 0; i < numBars; i++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.09, barH), mat);
        bar.position.set(cx, 0.09, cz - d / 2 + (i + 0.5) * (d / numBars));
        this.mesh.add(bar);
      }
    } else {
      const barW = w / (numBars * 1.6);
      for (let i = 0; i < numBars; i++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(barW, 0.09, d), mat);
        bar.position.set(cx - w / 2 + (i + 0.5) * (w / numBars), 0.09, cz);
        this.mesh.add(bar);
      }
    }
  }

  private addTrafficLightPole(x: number, z: number, rotY: number): void {
    const poleGroup = new THREE.Group();
    poleGroup.position.set(x, 0, z);
    poleGroup.rotation.y = rotY;

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 });

    // Vertical mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6.0, 10), metalMat);
    mast.position.y = 3.0;
    mast.castShadow = true;
    poleGroup.add(mast);

    // Horizontal arm over road
    const arm = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.12, 0.12), metalMat);
    arm.position.set(1.6, 5.8, 0);
    poleGroup.add(arm);

    // Traffic light box
    const boxGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    const box = new THREE.Mesh(boxGeo, metalMat);
    box.position.set(3.0, 5.3, 0);
    poleGroup.add(box);

    // 3 lights: Red, Yellow, Green
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.8 });
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.5 });

    const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), redMat);
    redLight.position.set(3.0, 5.7, 0.2);

    const yellowLight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), yellowMat);
    yellowLight.position.set(3.0, 5.3, 0.2);

    const greenLight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), greenMat);
    greenLight.position.set(3.0, 4.9, 0.2);

    poleGroup.add(redLight, yellowLight, greenLight);
    this.mesh.add(poleGroup);
  }

  // ==================== COMMERCIAL DISTRICT ====================
  private buildCommercialZone(): void {
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65, roughness: 0.1 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const silpoOrangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.3 }); // Сільпо помаранчевий
    const cafeWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });

    // 1. Супермаркет "СІЛЬПО / МАРКЕТ" at (65, 0, -60)
    const marketGroup = new THREE.Group();
    marketGroup.position.set(68, 0, -60);

    // Main Store Hall
    const storeBuilding = new THREE.Mesh(new THREE.BoxGeometry(24, 7.5, 20), concreteMat);
    storeBuilding.position.set(0, 3.75, 0);
    storeBuilding.castShadow = true;
    storeBuilding.receiveShadow = true;
    marketGroup.add(storeBuilding);

    // Orange Facade Canopy & Signboard
    const marketCanopy = new THREE.Mesh(new THREE.BoxGeometry(24.5, 1.2, 4.0), silpoOrangeMat);
    marketCanopy.position.set(0, 6.5, 9.5);
    marketGroup.add(marketCanopy);

    // Glowing Logo
    const signMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffedd5, emissiveIntensity: 1.2 });
    const logoMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 1.0, 0.3), signMat);
    logoMesh.position.set(0, 6.5, 11.6);
    marketGroup.add(logoMesh);

    // Panoramic Entrance Glass
    const entranceGlass = new THREE.Mesh(new THREE.BoxGeometry(16, 4.2, 0.2), glassMat);
    entranceGlass.position.set(0, 2.5, 10.1);
    marketGroup.add(entranceGlass);

    // Parking Bays in front of Market
    const parkingGeo = new THREE.BoxGeometry(22, 0.09, 12);
    const parkingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const parking = new THREE.Mesh(parkingGeo, parkingMat);
    parking.position.set(0, 0.05, 17);
    marketGroup.add(parking);

    // White parking lot lines
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    for (let px = -9; px <= 9; px += 3) {
      const pLine = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 6.0), lineMat);
      pLine.position.set(px, 0.1, 16);
      marketGroup.add(pLine);
    }
    this.mesh.add(marketGroup);

    // 2. Затишна Кав'ярня "COFFEE TIME" at (35, 0, -60)
    const cafeGroup = new THREE.Group();
    cafeGroup.position.set(32, 0, -60);

    const cafeBuilding = new THREE.Mesh(new THREE.BoxGeometry(12, 5.5, 14), brickMat);
    cafeBuilding.position.set(0, 2.75, 0);
    cafeBuilding.castShadow = true;
    cafeGroup.add(cafeBuilding);

    // Striped Awning
    const awningMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    const awning = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 3.0), awningMat);
    awning.position.set(0, 4.2, 7.8);
    awning.rotation.x = 0.2;
    cafeGroup.add(awning);

    // Outdoor Terrace with Tables and Chairs
    const terrace = new THREE.Mesh(new THREE.BoxGeometry(12, 0.15, 6), cafeWoodMat);
    terrace.position.set(0, 0.1, 9.5);
    cafeGroup.add(terrace);

    // 2 cafe tables with parasols
    [-3, 3].forEach((tx) => {
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.9, 12), whiteMat);
      table.position.set(tx, 0.55, 9.5);
      const parasol = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.8, 12), awningMat);
      parasol.position.set(tx, 2.5, 9.5);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6), whiteMat);
      pole.position.set(tx, 1.5, 9.5);
      cafeGroup.add(table, parasol, pole);
    });

    this.mesh.add(cafeGroup);

    // 3. Автосервіс & Детейлінг "СТО / АВТОМАЙСТЕРНЯ" at (68, 0, -85)
    const stoGroup = new THREE.Group();
    stoGroup.position.set(68, 0, -90);

    const stoBuilding = new THREE.Mesh(new THREE.BoxGeometry(22, 6.5, 16), concreteMat);
    stoBuilding.position.set(0, 3.25, 0);
    stoBuilding.castShadow = true;
    stoGroup.add(stoBuilding);

    // Roll-up industrial garage doors
    const shutterMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 });
    [-5, 5].forEach((gx) => {
      const shutter = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4.2, 0.2), shutterMat);
      shutter.position.set(gx, 2.2, 8.1);
      stoGroup.add(shutter);
    });

    // Signboard "СТО 24/7"
    const stoSign = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, 0.3), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.8 }));
    stoSign.position.set(0, 5.5, 8.2);
    stoGroup.add(stoSign);

    // Stacked Tires outside STO
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const tireGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12);
    for (let i = 0; i < 4; i++) {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.position.set(-10, 0.2 + i * 0.36, 9);
      stoGroup.add(tire);
    }

    this.mesh.add(stoGroup);

    // 4. Магазин Стрім-Техніки "ROZETKA TECH" at (32, 0, -90)
    const techGroup = new THREE.Group();
    techGroup.position.set(32, 0, -90);

    const techBuilding = new THREE.Mesh(new THREE.BoxGeometry(18, 6.5, 16), concreteMat);
    techBuilding.position.set(0, 3.25, 0);
    techBuilding.castShadow = true;
    techGroup.add(techBuilding);

    // Green Rozetka Canopy
    const rozetkaGreenMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
    const techCanopy = new THREE.Mesh(new THREE.BoxGeometry(18.5, 1.0, 3.5), rozetkaGreenMat);
    techCanopy.position.set(0, 5.8, 8.5);
    techGroup.add(techCanopy);

    // Glowing Rozetka Sign
    const techSign = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1.0, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.2 })
    );
    techSign.position.set(0, 5.8, 10.3);
    techGroup.add(techSign);

    // Glass Showcase Windows
    const techGlass = new THREE.Mesh(new THREE.BoxGeometry(14, 3.6, 0.2), glassMat);
    techGlass.position.set(0, 2.2, 8.1);
    techGroup.add(techGlass);

    // Display Stands with Glowing Tech Products
    [-4, 0, 4].forEach((dx) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.2, 12), whiteMat);
      stand.position.set(dx, 0.6, 6.5);
      const gadget = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.4, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.0 })
      );
      gadget.position.set(dx, 1.4, 6.5);
      techGroup.add(stand, gadget);
    });

    this.mesh.add(techGroup);

    // 5. Модний Бутік "DRIP STORE (ОДЯГ & СКІНИ)" at (-25, 0, -38)
    const dripGroup = new THREE.Group();
    dripGroup.position.set(-25, 0, -38);

    const boutiqueBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(14, 5.8, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.5 })
    );
    boutiqueBuilding.position.set(0, 2.9, 0);
    boutiqueBuilding.castShadow = true;
    dripGroup.add(boutiqueBuilding);

    // Magenta Fashion Canopy
    const dripPinkMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3 });
    const dripCanopy = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.8, 3.0), dripPinkMat);
    dripCanopy.position.set(0, 5.0, 6.2);
    dripGroup.add(dripCanopy);

    // Glowing Drip Store Sign
    const dripSign = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.9, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 1.4 })
    );
    dripSign.position.set(0, 5.0, 7.8);
    dripGroup.add(dripSign);

    // Boutique Glass Windows
    const dripGlass = new THREE.Mesh(new THREE.BoxGeometry(10, 3.2, 0.2), glassMat);
    dripGlass.position.set(0, 2.0, 6.1);
    dripGroup.add(dripGlass);

    // Mannequin Models in window
    [-2.5, 2.5].forEach((mx) => {
      const manBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.25, 1.4, 8),
        new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 })
      );
      manBody.position.set(mx, 1.3, 4.8);
      const manHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), whiteMat);
      manHead.position.set(mx, 2.15, 4.8);
      dripGroup.add(manBody, manHead);
    });

    this.mesh.add(dripGroup);
  }

  // ==================== HOLOGRAPHIC SHOP ENTRANCE BEACONS ====================
  private buildShopEntranceMarkers(): void {
    this.shopZones.forEach((zone) => {
      const markerGroup = new THREE.Group();
      markerGroup.position.copy(zone.pos);

      // Glowing Ground Ring
      const ringGeo = new THREE.RingGeometry(1.4, 1.85, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: zone.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.08;
      markerGroup.add(ringMesh);

      // Inner Soft Ground Disc
      const discGeo = new THREE.CircleGeometry(1.35, 32);
      const discMat = new THREE.MeshBasicMaterial({
        color: zone.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25
      });
      const discMesh = new THREE.Mesh(discGeo, discMat);
      discMesh.rotation.x = -Math.PI / 2;
      discMesh.position.y = 0.06;
      markerGroup.add(discMesh);

      // Floating Animated Diamond / Crystal
      const crystalGeo = new THREE.OctahedronGeometry(0.55, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: zone.color,
        emissive: zone.color,
        emissiveIntensity: 1.5,
        roughness: 0.2,
        metalness: 0.8
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.y = 1.7;
      markerGroup.add(crystal);

      // Soft light beacon
      const light = new THREE.PointLight(zone.color, 1.8, 5.5);
      light.position.y = 1.6;
      markerGroup.add(light);

      zone.markerGroup = markerGroup;
      zone.crystal = crystal;
      this.mesh.add(markerGroup);
    });
  }

  public updateShopMarkers(timeSec: number): void {
    this.shopZones.forEach((zone) => {
      if (zone.crystal) {
        zone.crystal.rotation.y = timeSec * 1.8;
        zone.crystal.rotation.x = Math.sin(timeSec * 1.2) * 0.2;
        zone.crystal.position.y = 1.7 + Math.sin(timeSec * 3.0) * 0.15;
      }
    });
  }

  // ==================== RESIDENTIAL DISTRICT ====================
  private buildResidentialZone(): void {
    // Neighborhood houses along X=-60 street
    const houseCoords = [
      { x: -80, z: -55, color: 0xd97706, roofColor: 0x7f1d1d },
      { x: -40, z: -55, color: 0x0284c7, roofColor: 0x0f172a },
      { x: -80, z: -90, color: 0x059669, roofColor: 0x374151 },
      { x: -40, z: -110, color: 0x475569, roofColor: 0x991b1b }
    ];

    houseCoords.forEach((h) => {
      const houseGroup = new THREE.Group();
      houseGroup.position.set(h.x, 0, h.z);

      const wallMat = new THREE.MeshStandardMaterial({ color: h.color, roughness: 0.7 });
      const roofMat = new THREE.MeshStandardMaterial({ color: h.roofColor, roughness: 0.6 });
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

      // Yard Lawn
      const yard = new THREE.Mesh(new THREE.BoxGeometry(22, 0.15, 20), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 }));
      yard.position.set(0, 0.08, 0);
      yard.receiveShadow = true;
      houseGroup.add(yard);

      // House Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(12, 5.0, 10), wallMat);
      body.position.set(0, 2.5, 0);
      body.castShadow = true;
      body.receiveShadow = true;
      houseGroup.add(body);

      // Gabled Roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(9.0, 3.5, 4), roofMat);
      roof.position.set(0, 6.5, 0);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      houseGroup.add(roof);

      // Brick Chimney
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 0.8), new THREE.MeshStandardMaterial({ color: 0x991b1b }));
      chimney.position.set(2.5, 6.8, 1.5);
      houseGroup.add(chimney);

      // Front Door & Windows
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.1), woodMat);
      door.position.set(0, 1.25, 5.06);
      houseGroup.add(door);

      // Fence along front of the house
      const fenceMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
      for (let fx = -9; fx <= 9; fx += 1.5) {
        if (Math.abs(fx) < 2.0) continue; // Gate opening
        const picket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.08), fenceMat);
        picket.position.set(fx, 0.6, 9.5);
        houseGroup.add(picket);
      }

      this.mesh.add(houseGroup);
    });
  }

  // ==================== TOWN PARK & FOUNTAIN ====================
  private buildTownPark(): void {
    // Park located at quadrant (X=-30, Z=25)
    const parkGroup = new THREE.Group();
    parkGroup.position.set(-35, 0, 25);

    // Park Stone Base
    const parkBase = new THREE.Mesh(new THREE.BoxGeometry(45, 0.16, 45), new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 }));
    parkBase.position.set(0, 0.08, 0);
    parkBase.receiveShadow = true;
    parkGroup.add(parkBase);

    // Cobblestone Pathways crossing the park
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    const pathX = new THREE.Mesh(new THREE.BoxGeometry(45, 0.18, 5.0), pathMat);
    pathX.position.set(0, 0.09, 0);
    const pathZ = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.18, 45), pathMat);
    pathZ.position.set(0, 0.09, 0);
    parkGroup.add(pathX, pathZ);

    // Central Circular Plaza with Fountain
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.2, 24), pathMat);
    plaza.position.set(0, 0.1, 0);
    parkGroup.add(plaza);

    // Fountain Basin
    const basinMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.5, 0.8, 20), basinMat);
    basin.position.set(0, 0.4, 0);
    parkGroup.add(basin);

    // Water Surface
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.85 });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.9, 0.1, 20), waterMat);
    water.position.set(0, 0.75, 0);
    parkGroup.add(water);

    // Fountain Spout & Jet
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2.0, 12), basinMat);
    spout.position.set(0, 1.2, 0);
    const jet = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.8, 12), waterMat);
    jet.position.set(0, 2.8, 0);
    parkGroup.add(spout, jet);

    // Park Benches
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const benchPositions = [
      { x: -5, z: 5, rot: Math.PI / 4 },
      { x: 5, z: 5, rot: -Math.PI / 4 },
      { x: -5, z: -5, rot: 3 * Math.PI / 4 },
      { x: 5, z: -5, rot: -3 * Math.PI / 4 }
    ];

    benchPositions.forEach((bp) => {
      const bench = new THREE.Group();
      bench.position.set(bp.x, 0.1, bp.z);
      bench.rotation.y = bp.rot;

      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.6), benchMat);
      seat.position.y = 0.5;
      const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.1), benchMat);
      back.position.set(0, 0.85, -0.28);
      bench.add(seat, back);
      parkGroup.add(bench);
    });

    // Colorful Flowerbeds
    const flowerColors = [0xef4444, 0xf59e0b, 0xec4899, 0x8b5cf6];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const fx = Math.cos(angle) * 14;
      const fz = Math.sin(angle) * 14;
      const bed = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
      bed.position.set(fx, 0.15, fz);

      const fMat = new THREE.MeshStandardMaterial({ color: flowerColors[i % flowerColors.length], roughness: 0.5 });
      const flowers = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3, 0), fMat);
      flowers.position.set(fx, 0.8, fz);
      parkGroup.add(bed, flowers);
    }

    this.mesh.add(parkGroup);
  }

  // ==================== STREET INFRASTRUCTURE & DETAIL ====================
  private buildStreetInfrastructure(): void {
    // 1. Bus Stop Pavilion at (8.5, 0, 30)
    const busStop = new THREE.Group();
    busStop.position.set(9.5, 0, 30);
    busStop.rotation.y = -Math.PI / 2;

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });

    // Glass walls & roof
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.6, 0.1), glassMat);
    backWall.position.set(0, 1.3, -1.2);
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 2.4), glassMat);
    sideWall.position.set(-2.25, 1.3, 0);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.15, 2.6), frameMat);
    roof.position.set(0, 2.65, 0);
    const bench = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.1, 0.5), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    bench.position.set(0, 0.45, -0.8);

    busStop.add(backWall, sideWall, roof, bench);
    this.mesh.add(busStop);

    // 2. Ukrainian Road Signs
    this.addRoadSign(-10, -26, 'priority');   // Головна дорога
    this.addRoadSign(10, -26, 'pedestrian'); // Пішохідний перехід
    this.addRoadSign(-10, 40, 'speed50');    // Обмеження 50
    this.addRoadSign(-52, -26, 'priority');  // Головна дорога

    // 3. Billboards along the highway
    this.addBillboard(20, 0, 50, 'STREAMER SIMULATOR 2\nКУПУЙ СУПЕРКАРИ ТА 5090!', 0x00f2fe);
    this.addBillboard(-70, 0, -20, 'ДОНАТЬ НА ЗСУ!\nРАЗОМ ДО ПЕРЕМОГИ!', 0xfbbf24);

    // 4. Streetlights across all roads
    this.buildRealisticStreetLights();

    // 5. Trees along roads and sidewalks
    this.buildFoliage();
  }

  private addRoadSign(x: number, z: number, type: 'priority' | 'pedestrian' | 'speed50'): void {
    const signGroup = new THREE.Group();
    signGroup.position.set(x, 0, z);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), metalMat);
    pole.position.y = 1.6;
    pole.castShadow = true;
    signGroup.add(pole);

    if (type === 'priority') {
      // Головна дорога (Diamond)
      const signMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.05), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
      signMesh.rotation.z = Math.PI / 4;
      signMesh.position.y = 3.0;
      signGroup.add(signMesh);
    } else if (type === 'pedestrian') {
      // Пішохідний перехід (Blue square)
      const signMesh = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.05), new THREE.MeshStandardMaterial({ color: 0x2563eb }));
      signMesh.position.y = 3.0;
      signGroup.add(signMesh);
    } else {
      // Обмеження 50 (Red circle)
      const signMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      signMesh.rotation.x = Math.PI / 2;
      signMesh.position.y = 3.0;
      signGroup.add(signMesh);
    }

    this.mesh.add(signGroup);
  }

  private addBillboard(x: number, y: number, z: number, text: string, neonColor: number): void {
    const bGroup = new THREE.Group();
    bGroup.position.set(x, y, z);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    // 2 sturdy support legs
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 8), metalMat);
    leg1.position.set(-4, 4, 0);
    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 8), metalMat);
    leg2.position.set(4, 4, 0);
    bGroup.add(leg1, leg2);

    // Large Billboard Canvas
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(11, 5, 0.4), boardMat);
    board.position.set(0, 9.5, 0);
    board.castShadow = true;
    bGroup.add(board);

    // Glowing border light
    const glowMat = new THREE.MeshStandardMaterial({ color: neonColor, emissive: neonColor, emissiveIntensity: 1.2 });
    const borderTop = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.2, 0.5), glowMat);
    borderTop.position.set(0, 12, 0);
    bGroup.add(borderTop);

    this.mesh.add(bGroup);
  }

  private buildRealisticStreetLights(): void {
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 1.8 });

    const lightPositions = [
      // Gas station main road
      { x: -9, z: 60 }, { x: 9, z: 45 }, { x: -9, z: 15 }, { x: 9, z: 0 },
      // Main crossroad
      { x: -20, z: -21 }, { x: -40, z: -21 }, { x: 20, z: -21 }, { x: 40, z: -21 },
      { x: -20, z: -39 }, { x: -40, z: -39 }, { x: 20, z: -39 }, { x: 40, z: -39 },
      // Residential street
      { x: -52, z: -55 }, { x: -68, z: -70 }, { x: -52, z: -85 }, { x: -68, z: -100 },
      // Commercial street
      { x: 42, z: -55 }, { x: 58, z: -70 }, { x: 42, z: -85 }
    ];

    lightPositions.forEach((lp) => {
      const pole = new THREE.Group();
      pole.position.set(lp.x, 0, lp.z);

      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 6.5, 8), metalMat);
      mast.position.y = 3.25;
      mast.castShadow = true;
      pole.add(mast);

      // Curved overhead arm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.1), metalMat);
      arm.position.set(0.7, 6.3, 0);
      pole.add(arm);

      // Lamp bulb
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bulbMat);
      bulb.position.set(1.4, 6.1, 0);
      pole.add(bulb);

      // Warm street illumination
      const pLight = new THREE.PointLight(0xfef08a, 1.4, 16);
      pLight.position.set(1.4, 5.9, 0);
      pole.add(pLight);

      this.mesh.add(pole);
    });
  }

  private buildFoliage(): void {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
    const birchTrunkMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 }); // Берези
    const oakLeavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const pineLeavesMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });

    const trees = [
      // Along main road sidewalks
      { x: -11, z: 50, type: 'birch' }, { x: 11, z: 35, type: 'oak' },
      { x: -11, z: 25, type: 'pine' },  { x: 11, z: 10, type: 'birch' },
      // Los Santos Palm Trees Boulevard
      { x: -9.5, z: 75, type: 'palm' }, { x: 9.5, z: 70, type: 'palm' },
      { x: -9.5, z: 45, type: 'palm' }, { x: 9.5, z: 30, type: 'palm' },
      { x: -9.5, z: 15, type: 'palm' }, { x: 9.5, z: 0, type: 'palm' },
      { x: -35, z: -21, type: 'palm' }, { x: -55, z: -21, type: 'palm' },
      { x: 35, z: -21, type: 'palm' },  { x: 55, z: -21, type: 'palm' },
      // Park perimeter
      { x: -55, z: 45, type: 'oak' },   { x: -55, z: 15, type: 'pine' },
      { x: -15, z: 45, type: 'oak' },   { x: -15, z: 5, type: 'birch' },
      // Residential neighborhood
      { x: -75, z: -40, type: 'oak' },  { x: -45, z: -40, type: 'birch' },
      { x: -75, z: -70, type: 'pine' }, { x: -45, z: -70, type: 'oak' },
      { x: -75, z: -100, type: 'pine' }, { x: -45, z: -100, type: 'birch' },
      // Commercial area borders
      { x: 25, z: -45, type: 'oak' },   { x: 78, z: -45, type: 'pine' },
      { x: 25, z: -75, type: 'birch' }, { x: 78, z: -75, type: 'oak' }
    ];

    trees.forEach((t) => {
      const tree = new THREE.Group();
      tree.position.set(t.x, 0, t.z);

      if (t.type === 'palm') {
        // Los Santos California Fan Palm Tree
        const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
        const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7, side: THREE.DoubleSide });

        const trunkHeight = 9.5;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, trunkHeight, 8), palmTrunkMat);
        trunk.position.y = trunkHeight / 2;
        trunk.rotation.z = (Math.random() - 0.5) * 0.06;
        trunk.castShadow = true;
        tree.add(trunk);

        // Crown of 8 radiating palm fronds
        const crown = new THREE.Group();
        crown.position.y = trunkHeight;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const frond = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 3.2), palmLeafMat);
          frond.position.set(Math.sin(angle) * 1.5, -0.4, Math.cos(angle) * 1.5);
          frond.rotation.y = angle;
          frond.rotation.x = 0.45;
          frond.castShadow = true;
          crown.add(frond);
        }
        tree.add(crown);

      } else if (t.type === 'pine') {
        // Pine tree
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 2.5, 8), trunkMat);
        trunk.position.y = 1.25;
        trunk.castShadow = true;
        tree.add(trunk);

        const f1 = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.0, 8), pineLeavesMat);
        f1.position.y = 3.5;
        f1.castShadow = true;
        const f2 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.4, 8), pineLeavesMat);
        f2.position.y = 4.8;
        f2.castShadow = true;
        tree.add(f1, f2);

      } else if (t.type === 'birch') {
        // Birch tree with slender trunk
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 4.0, 8), birchTrunkMat);
        trunk.position.y = 2.0;
        trunk.castShadow = true;
        tree.add(trunk);

        const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), oakLeavesMat);
        foliage.position.y = 4.8;
        foliage.scale.set(1.0, 1.4, 1.0);
        foliage.castShadow = true;
        tree.add(foliage);

      } else {
        // Lush Oak tree
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 2.8, 8), trunkMat);
        trunk.position.y = 1.4;
        trunk.castShadow = true;
        tree.add(trunk);

        const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), oakLeavesMat);
        foliage.position.y = 4.0;
        foliage.castShadow = true;
        tree.add(foliage);
      }

      this.mesh.add(tree);
    });
  }

  private buildCitySkyline(): void {
    const bMat1 = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const bMat2 = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const bMat3 = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const winMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.8 });

    // Distant urban blocks
    const skyline = [
      { x: 120, z: 40, w: 35, h: 65, d: 35, mat: bMat1 },
      { x: 130, z: -30, w: 40, h: 80, d: 30, mat: bMat2 },
      { x: 110, z: -100, w: 32, h: 55, d: 28, mat: bMat3 },
      { x: -140, z: 50, w: 38, h: 70, d: 36, mat: bMat2 },
      { x: -150, z: -40, w: 45, h: 85, d: 40, mat: bMat1 },
      { x: -130, z: -120, w: 35, h: 60, d: 35, mat: bMat3 }
    ];

    skyline.forEach((b) => {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), b.mat);
      bMesh.position.set(b.x, b.h / 2, b.z);
      bMesh.castShadow = true;
      this.mesh.add(bMesh);

      // Lit windows grid
      for (let wy = 8; wy < b.h - 8; wy += 9) {
        for (let wx = -b.w / 2 + 5; wx < b.w / 2 - 5; wx += 8) {
          if (Math.random() > 0.35) {
            const win = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.2, 0.2), winMat);
            win.position.set(b.x + wx, wy, b.z + b.d / 2 + 0.1);
            this.mesh.add(win);
          }
        }
      }
    });
  }
}
