import * as THREE from 'three';

export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  name: string;
}

export interface CylinderCollider {
  x: number;
  z: number;
  radius: number;
  name: string;
}

export class CollisionSystem {
  private boxColliders: BoxCollider[] = [];
  private cylinderColliders: CylinderCollider[] = [];

  constructor() {
    this.initWorldColliders();
  }

  private initWorldColliders(): void {
    // 1. Gas Station (0, 0)
    // Convenience Store building
    this.addBox(0, -9.5, 14.5, 8.5, 'Gas Station Store');
    // Gas Station Pillars
    this.addCylinder(-7, -3.5, 0.5, 'Gas Pillar 1');
    this.addCylinder(-7, 3.5, 0.5, 'Gas Pillar 2');
    this.addCylinder(7, -3.5, 0.5, 'Gas Pillar 3');
    this.addCylinder(7, 3.5, 0.5, 'Gas Pillar 4');
    // Gas Pumps
    this.addBox(-2.5, -3, 1.2, 1.2, 'Gas Pump 1');
    this.addBox(2.5, -3, 1.2, 1.2, 'Gas Pump 2');
    this.addBox(-2.5, 3, 1.2, 1.2, 'Gas Pump 3');
    this.addBox(2.5, 3, 1.2, 1.2, 'Gas Pump 4');
    // Gas Price Totem
    this.addBox(11.5, 6, 2.0, 1.2, 'Gas Totem');

    // 2. Streamer's House (-60, 0, -90)
    // Main Villa walls (leave doorway / entrance open around X=-60, Z=-86)
    // House body: center around (-63, -92), size 18 x 16
    this.addBox(-63, -95, 19, 12, 'Streamer House Main');
    this.addBox(-70, -89, 7, 8, 'Streamer House West Wing');

    // 3. Commercial District
    // Супермаркет "Сільпо" at (68, -60), size 25 x 21
    this.addBox(68, -60, 25, 21, 'Supermarket Silpo');
    // Кав'ярня "Coffee Time" at (32, -60), size 13 x 15
    this.addBox(32, -60, 13, 15, 'Coffee Time Cafe');
    // СТО / Автосервіс at (68, -90), size 23 x 17
    this.addBox(68, -90, 23, 17, 'STO Auto Service');

    // 4. Residential Houses along X=-60 Street
    this.addBox(-80, -55, 13, 11, 'Residential House 1');
    this.addBox(-40, -55, 13, 11, 'Residential House 2');
    this.addBox(-80, -90, 13, 11, 'Residential House 3');
    this.addBox(-40, -110, 13, 11, 'Residential House 4');

    // 5. Town Park Fountain at (-35, 25)
    this.addCylinder(-35, 25, 4.6, 'Park Fountain');

    // 6. Bus Stop at (9.5, 30)
    this.addBox(9.5, 30, 2.8, 5.0, 'Bus Stop');

    // 7. Billboards
    this.addCylinder(16, 50, 0.4, 'Billboard 1 Leg L');
    this.addCylinder(24, 50, 0.4, 'Billboard 1 Leg R');
    this.addCylinder(-74, -20, 0.4, 'Billboard 2 Leg L');
    this.addCylinder(-66, -20, 0.4, 'Billboard 2 Leg R');

    // 8. Distant City Skyline Towers
    this.addBox(120, 40, 36, 36, 'Skyline Tower 1');
    this.addBox(130, -30, 41, 31, 'Skyline Tower 2');
    this.addBox(110, -100, 33, 29, 'Skyline Tower 3');
    this.addBox(-140, 50, 39, 37, 'Skyline Tower 4');
    this.addBox(-150, -40, 46, 41, 'Skyline Tower 5');
    this.addBox(-130, -120, 36, 36, 'Skyline Tower 6');
  }

  public addBox(cx: number, cz: number, width: number, depth: number, name: string = 'obstacle'): void {
    const halfW = width / 2;
    const halfD = depth / 2;
    this.boxColliders.push({
      minX: cx - halfW,
      maxX: cx + halfW,
      minZ: cz - halfD,
      maxZ: cz + halfD,
      name
    });
  }

  public addCylinder(x: number, z: number, radius: number, name: string = 'obstacle'): void {
    this.cylinderColliders.push({ x, z, radius, name });
  }

  /**
   * Resolves player circle collision against all static obstacles with smooth wall-sliding.
   */
  public resolvePlayerCollision(pos: THREE.Vector3, radius: number = 0.45): boolean {
    let hadCollision = false;

    // Check Box Colliders
    for (const box of this.boxColliders) {
      // Find closest point on box to circle center
      const closestX = Math.max(box.minX, Math.min(pos.x, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(pos.z, box.maxZ));

      const distX = pos.x - closestX;
      const distZ = pos.z - closestZ;
      const distSq = distX * distX + distZ * distZ;

      if (distSq < radius * radius) {
        hadCollision = true;
        const dist = Math.sqrt(distSq);

        if (dist > 0.001) {
          // Push circle out along normal
          const overlap = radius - dist;
          pos.x += (distX / dist) * overlap;
          pos.z += (distZ / dist) * overlap;
        } else {
          // Inside the box center: push out to closest edge
          const dLeft = Math.abs(pos.x - box.minX);
          const dRight = Math.abs(box.maxX - pos.x);
          const dTop = Math.abs(pos.z - box.minZ);
          const dBottom = Math.abs(box.maxZ - pos.z);

          const minD = Math.min(dLeft, dRight, dTop, dBottom);
          if (minD === dLeft) pos.x = box.minX - radius;
          else if (minD === dRight) pos.x = box.maxX + radius;
          else if (minD === dTop) pos.z = box.minZ - radius;
          else pos.z = box.maxZ + radius;
        }
      }
    }

    // Check Cylinder Colliders
    for (const cyl of this.cylinderColliders) {
      const dx = pos.x - cyl.x;
      const dz = pos.z - cyl.z;
      const minDist = radius + cyl.radius;
      const distSq = dx * dx + dz * dz;

      if (distSq < minDist * minDist) {
        hadCollision = true;
        const dist = Math.sqrt(distSq);
        if (dist > 0.001) {
          const overlap = minDist - dist;
          pos.x += (dx / dist) * overlap;
          pos.z += (dz / dist) * overlap;
        } else {
          pos.x += minDist;
        }
      }
    }

    return hadCollision;
  }

  /**
   * Resolves vehicle collision. Uses 3 bounding spheres along vehicle length (front, center, rear).
   */
  public resolveVehicleCollision(pos: THREE.Vector3, headingY: number, halfWidth: number, halfLength: number): { collided: boolean; normal: THREE.Vector3 } {
    let collided = false;
    const normal = new THREE.Vector3();

    // 3 test points along the vehicle chassis
    const offsets = [
      halfLength * 0.75, // Front
      0,                 // Center
      -halfLength * 0.75 // Rear
    ];

    const radius = halfWidth * 1.05;

    for (const offZ of offsets) {
      const testPos = new THREE.Vector3(
        pos.x + Math.sin(headingY) * offZ,
        pos.y,
        pos.z + Math.cos(headingY) * offZ
      );

      // Test against boxes
      for (const box of this.boxColliders) {
        const closestX = Math.max(box.minX, Math.min(testPos.x, box.maxX));
        const closestZ = Math.max(box.minZ, Math.min(testPos.z, box.maxZ));

        const dx = testPos.x - closestX;
        const dz = testPos.z - closestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < radius * radius) {
          collided = true;
          const dist = Math.sqrt(distSq);
          if (dist > 0.001) {
            const overlap = radius - dist;
            pos.x += (dx / dist) * overlap;
            pos.z += (dz / dist) * overlap;
            normal.set(dx / dist, 0, dz / dist);
          } else {
            pos.x += Math.sin(headingY) * -0.5;
            pos.z += Math.cos(headingY) * -0.5;
            normal.set(-Math.sin(headingY), 0, -Math.cos(headingY));
          }
          break;
        }
      }

      // Test against cylinders
      for (const cyl of this.cylinderColliders) {
        const dx = testPos.x - cyl.x;
        const dz = testPos.z - cyl.z;
        const minDist = radius + cyl.radius;
        const distSq = dx * dx + dz * dz;

        if (distSq < minDist * minDist) {
          collided = true;
          const dist = Math.sqrt(distSq);
          if (dist > 0.001) {
            const overlap = minDist - dist;
            pos.x += (dx / dist) * overlap;
            pos.z += (dz / dist) * overlap;
            normal.set(dx / dist, 0, dz / dist);
          }
          break;
        }
      }

      if (collided) break;
    }

    return { collided, normal };
  }
}
