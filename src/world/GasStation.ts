import * as THREE from 'three';

export class GasStation {
  public mesh: THREE.Group;
  public spawnPos: THREE.Vector3 = new THREE.Vector3(2, 0, -2);
  public bikeSpawnPos: THREE.Vector3 = new THREE.Vector3(4, 0, -2);

  constructor() {
    this.mesh = new THREE.Group();
    this.buildGasStation();
  }

  private buildGasStation(): void {
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const brandGreenMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 }); // OKKO/WOG green
    const brandYellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, roughness: 0.1 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.2 });

    // 1. Concrete Base Slab
    const slabGeo = new THREE.BoxGeometry(26, 0.2, 20);
    const slab = new THREE.Mesh(slabGeo, concreteMat);
    slab.position.set(0, 0.1, 0);
    slab.receiveShadow = true;
    this.mesh.add(slab);

    // 2. Large Canopy Roof
    const roofGeo = new THREE.BoxGeometry(22, 0.8, 12);
    const roof = new THREE.Mesh(roofGeo, canopyMat);
    roof.position.set(0, 5.5, 0);
    roof.castShadow = true;
    this.mesh.add(roof);

    // Canopy Trim Strips (Green & Yellow)
    const trimGeo = new THREE.BoxGeometry(22.2, 0.3, 12.2);
    const trimGreen = new THREE.Mesh(trimGeo, brandGreenMat);
    trimGreen.position.set(0, 5.7, 0);
    this.mesh.add(trimGreen);

    const trimYellowGeo = new THREE.BoxGeometry(22.3, 0.12, 12.3);
    const trimYellow = new THREE.Mesh(trimYellowGeo, brandYellowMat);
    trimYellow.position.set(0, 5.4, 0);
    this.mesh.add(trimYellow);

    // Under-canopy Lights
    const lightPositions = [
      [-6, 5.0, -3], [-6, 5.0, 3],
      [0, 5.0, -3],  [0, 5.0, 3],
      [6, 5.0, -3],  [6, 5.0, 3]
    ];
    lightPositions.forEach(([lx, ly, lz]) => {
      const lampGeo = new THREE.BoxGeometry(1.5, 0.1, 0.8);
      const lamp = new THREE.Mesh(lampGeo, lightMat);
      lamp.position.set(lx, ly, lz);
      this.mesh.add(lamp);

      const pLight = new THREE.PointLight(0xfff5e6, 0.8, 10);
      pLight.position.set(lx, ly - 0.2, lz);
      this.mesh.add(pLight);
    });

    // 3. Support Pillars (4 steel pillars)
    const pillarGeo = new THREE.CylinderGeometry(0.35, 0.35, 5.2, 16);
    const pillarPositions = [
      [-7, 2.7, -3.5], [-7, 2.7, 3.5],
      [7, 2.7, -3.5],  [7, 2.7, 3.5]
    ];
    pillarPositions.forEach(([px, py, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, metalMat);
      pillar.position.set(px, py, pz);
      pillar.castShadow = true;
      this.mesh.add(pillar);
    });

    // 4. Fuel Pump Islands
    const islandGeo = new THREE.BoxGeometry(8, 0.3, 1.4);
    const pumpGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    const pumpScreenGeo = new THREE.BoxGeometry(0.5, 0.4, 0.82);

    [-3, 3].forEach((zOffset) => {
      const island = new THREE.Mesh(islandGeo, whiteMat);
      island.position.set(0, 0.25, zOffset);
      island.receiveShadow = true;
      this.mesh.add(island);

      // 2 fuel pumps per island
      [-2.5, 2.5].forEach((xOffset) => {
        const pump = new THREE.Mesh(pumpGeo, brandGreenMat);
        pump.position.set(xOffset, 1.15, zOffset);
        pump.castShadow = true;

        const screen = new THREE.Mesh(pumpScreenGeo, lightMat);
        screen.position.set(xOffset, 1.4, zOffset);

        this.mesh.add(pump, screen);
      });
    });

    // 5. Convenience Store Building ("АЗС Маркет 24/7")
    const storeGeo = new THREE.BoxGeometry(14, 4.5, 8);
    const store = new THREE.Mesh(storeGeo, whiteMat);
    store.position.set(0, 2.35, -9.5);
    store.castShadow = true;
    this.mesh.add(store);

    // Store Roof Fascia
    const fasciaGeo = new THREE.BoxGeometry(14.4, 0.6, 8.4);
    const fascia = new THREE.Mesh(fasciaGeo, brandGreenMat);
    fascia.position.set(0, 4.6, -9.5);
    this.mesh.add(fascia);

    // Glass Windows & Doors
    const glassFrontGeo = new THREE.BoxGeometry(10, 2.8, 0.1);
    const glassFront = new THREE.Mesh(glassFrontGeo, glassMat);
    glassFront.position.set(0, 1.8, -5.45);
    this.mesh.add(glassFront);

    // Glowing Store Signboard
    const signGeo = new THREE.BoxGeometry(6, 0.8, 0.2);
    const sign = new THREE.Mesh(signGeo, brandYellowMat);
    sign.position.set(0, 4.0, -5.35);
    this.mesh.add(sign);

    // 6. Fuel Price Totem Tower
    const totemGeo = new THREE.BoxGeometry(1.6, 6.5, 0.8);
    const totem = new THREE.Mesh(totemGeo, canopyMat);
    totem.position.set(11.5, 3.25, 6);
    totem.castShadow = true;
    this.mesh.add(totem);

    const totemScreenGeo = new THREE.BoxGeometry(1.4, 3.5, 0.82);
    const totemScreen = new THREE.Mesh(totemScreenGeo, brandGreenMat);
    totemScreen.position.set(11.5, 4.2, 6);
    this.mesh.add(totemScreen);
  }
}
