import * as THREE from 'three';
import { Vehicle } from './Vehicle';
import { CarModel } from '../types';

export class Car extends Vehicle {
  public modelData: CarModel;
  private bodyGroup: THREE.Group;
  private frontLeftSteerPivot: THREE.Group;
  private frontRightSteerPivot: THREE.Group;
  private steeringWheel: THREE.Mesh | null = null;
  private underglowLight: THREE.PointLight | null = null;
  private tailMat: THREE.MeshStandardMaterial | null = null;
  private bodyMat: THREE.MeshStandardMaterial | null = null;
  private headlightL: THREE.SpotLight | null = null;
  private headlightR: THREE.SpotLight | null = null;
  private brakeLight: THREE.PointLight | null = null;
  public isDrifting: boolean = false;
  public hasNitroBoost: boolean = false;
  private isRusty: boolean = false;
  private lastSpeed: number = 0;

  constructor(modelData: CarModel) {
    super(modelData.id, modelData.name, {
      maxSpeed: modelData.maxSpeed / 3.6,
      acceleration: modelData.acceleration * 14,
      braking: 22,
      turnSpeed: modelData.handling * 1.6,
      weight: 1200
    });

    this.modelData = modelData;
    this.isRusty = modelData.bodyStyle === 'clunker';

    this.bodyGroup = new THREE.Group();
    this.frontLeftSteerPivot = new THREE.Group();
    this.frontRightSteerPivot = new THREE.Group();

    // Driver's eye position inside cabin (left-hand drive)
    this.cockpitOffset = new THREE.Vector3(-0.35, 1.08, 0.22);
    this.halfWidth = 0.95;
    this.halfLength = 2.1;

    this.buildRealisticCarMesh();
    this.mesh.add(this.bodyGroup);
    this.mesh.add(this.frontLeftSteerPivot);
    this.mesh.add(this.frontRightSteerPivot);
  }

  private buildRealisticCarMesh(): void {
    const isHyper = this.modelData.bodyStyle === 'hypercar';
    const isSport = this.modelData.bodyStyle === 'sport';
    const isBmw = this.modelData.bodyStyle === 'bmw';
    const isClunker = this.modelData.bodyStyle === 'clunker';

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.modelData.color,
      roughness: isClunker ? 0.95 : (isHyper ? 0.15 : (isSport ? 0.25 : 0.4)),
      metalness: isClunker ? 0.05 : (isHyper ? 0.85 : (isSport ? 0.6 : 0.45))
    });
    this.bodyMat = bodyMat;

    const blackPlasticMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 });
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.75 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.8 });
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.2 });
    this.tailMat = tailMat;
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
    const rimMat = new THREE.MeshStandardMaterial({
      color: isClunker ? 0x451a03 : (isBmw || isSport ? 0x1f2937 : 0xd1d5db),
      metalness: isClunker ? 0.2 : 0.85,
      roughness: isClunker ? 0.8 : 0.2
    });
    const caliperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 }); // Red sports calipers

    // Dimensions
    let chassisW = 1.75;
    let chassisH = 0.52;
    let chassisD = 3.9;
    let cabinW = 1.42;
    let cabinH = 0.52;
    let cabinD = 2.1;

    if (isClunker) {
      chassisW = 1.6; chassisH = 0.52; chassisD = 3.4;
      cabinW = 1.38; cabinH = 0.5; cabinD = 1.8;
      this.halfWidth = 0.85; this.halfLength = 1.8;
    } else if (isHyper) {
      chassisW = 1.95; chassisH = 0.42; chassisD = 4.3;
      cabinW = 1.32; cabinH = 0.38; cabinD = 2.0;
      this.halfWidth = 1.05; this.halfLength = 2.25;
    } else if (isSport) {
      chassisW = 1.85; chassisH = 0.48; chassisD = 4.0;
      cabinW = 1.38; cabinH = 0.44; cabinD = 1.95;
      this.halfWidth = 1.0; this.halfLength = 2.1;
    }

    // 1. Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(chassisW, chassisH, chassisD);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.set(0, 0.54, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.bodyGroup.add(chassis);

    // 2. Cabin Structure
    const cabinGeo = new THREE.BoxGeometry(cabinW, cabinH, cabinD);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 0.96, isHyper ? 0.05 : 0.15);
    cabin.castShadow = true;
    this.bodyGroup.add(cabin);

    // 3. Aerodynamic Roof
    const roofGeo = new THREE.BoxGeometry(cabinW * 0.94, 0.08, cabinD * 0.68);
    const roof = new THREE.Mesh(roofGeo, bodyMat);
    roof.position.set(0, 1.22, isHyper ? 0.05 : 0.15);
    this.bodyGroup.add(roof);

    // 4. Detailed Interior Cockpit (Steering Wheel, Dashboard, Seats)
    const dashGeo = new THREE.BoxGeometry(cabinW * 0.9, 0.28, 0.5);
    const dash = new THREE.Mesh(dashGeo, blackPlasticMat);
    dash.position.set(0, 0.85, -0.45);
    this.bodyGroup.add(dash);

    // Steering Wheel on Left side
    const wheelRingGeo = new THREE.TorusGeometry(0.16, 0.025, 8, 16);
    this.steeringWheel = new THREE.Mesh(wheelRingGeo, blackPlasticMat);
    this.steeringWheel.position.set(-0.35, 0.92, -0.22);
    this.steeringWheel.rotation.x = -0.35;
    this.bodyGroup.add(this.steeringWheel);

    // Driver & Passenger Sports Seats
    const seatGeo = new THREE.BoxGeometry(0.48, 0.58, 0.48);
    const seatL = new THREE.Mesh(seatGeo, blackPlasticMat);
    seatL.position.set(-0.35, 0.68, 0.25);
    const seatR = new THREE.Mesh(seatGeo, blackPlasticMat);
    seatR.position.set(0.35, 0.68, 0.25);
    this.bodyGroup.add(seatL, seatR);

    // Side Mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.18, 0.1, 0.12);
    const mirrorL = new THREE.Mesh(mirrorGeo, bodyMat);
    mirrorL.position.set(-chassisW / 2 - 0.08, 0.88, -0.3);
    const mirrorR = new THREE.Mesh(mirrorGeo, bodyMat);
    mirrorR.position.set(chassisW / 2 + 0.08, 0.88, -0.3);
    this.bodyGroup.add(mirrorL, mirrorR);

    // 5. Front & Rear Bumpers with Ukrainian License Plates
    const fPlate = this.createLicensePlate('AA 2026 UA');
    fPlate.position.set(0, 0.42, -(chassisD / 2 + 0.03));
    this.bodyGroup.add(fPlate);

    const rPlate = this.createLicensePlate('AA 2026 UA');
    rPlate.position.set(0, 0.5, chassisD / 2 + 0.03);
    rPlate.rotation.y = Math.PI;
    this.bodyGroup.add(rPlate);

    // 6. Distinct Car Styling per Model
    if (isClunker) {
      // Zaporozhets / Kopiika: round headlights & rusty bumper
      const hlGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.06, 12);
      hlGeo.rotateX(Math.PI / 2);
      const hlL = new THREE.Mesh(hlGeo, lightMat);
      hlL.position.set(-0.55, 0.62, -(chassisD / 2 + 0.02));
      const hlR = new THREE.Mesh(hlGeo, lightMat);
      hlR.position.set(0.55, 0.62, -(chassisD / 2 + 0.02));
      this.bodyGroup.add(hlL, hlR);

      // Crooked rusty bumper
      const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.1, 0.12), chromeMat);
      bumper.position.set(0, 0.38, -(chassisD / 2 + 0.05));
      bumper.rotation.z = 0.04;
      this.bodyGroup.add(bumper);

    } else if (isBmw) {
      // BMW E36: Iconic twin kidney grille & angel eyes
      const grilleGeo = new THREE.BoxGeometry(0.24, 0.16, 0.05);
      const grilleL = new THREE.Mesh(grilleGeo, blackPlasticMat);
      grilleL.position.set(-0.16, 0.56, -(chassisD / 2 + 0.02));
      const grilleR = new THREE.Mesh(grilleGeo, blackPlasticMat);
      grilleR.position.set(0.16, 0.56, -(chassisD / 2 + 0.02));
      this.bodyGroup.add(grilleL, grilleR);

      // Angel Eyes (quad circular rings)
      [-0.6, -0.42, 0.42, 0.6].forEach((xPos) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12), lightMat);
        ring.position.set(xPos, 0.62, -(chassisD / 2 + 0.02));
        this.bodyGroup.add(ring);
      });

      // Quad exhaust
      [-0.55, -0.45].forEach((exX) => {
        const exPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8), chromeMat);
        exPipe.rotation.x = Math.PI / 2;
        exPipe.position.set(exX, 0.38, chassisD / 2 + 0.1);
        this.bodyGroup.add(exPipe);
      });

    } else if (isSport) {
      // Nissan GT-R: Aggressive carbon front splitter + huge GT wing + signature quad round taillights
      const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.05, 0.5), carbonMat);
      splitter.position.set(0, 0.24, -(chassisD / 2 + 0.15));
      this.bodyGroup.add(splitter);

      // GT-R Quad Round Taillights
      [-0.6, -0.38, 0.38, 0.6].forEach((tx) => {
        const tRing = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 16), tailMat);
        tRing.position.set(tx, 0.65, chassisD / 2 + 0.02);
        this.bodyGroup.add(tRing);
      });

      // Huge Carbon Wing
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.06, 0.4), carbonMat);
      wing.position.set(0, 1.25, chassisD / 2 - 0.25);
      const standL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.15), carbonMat);
      standL.position.set(-0.6, 1.05, chassisD / 2 - 0.25);
      const standR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.15), carbonMat);
      standR.position.set(0.6, 1.05, chassisD / 2 - 0.25);
      this.bodyGroup.add(wing, standL, standR);

    } else if (isHyper) {
      // Cyber Hypercar: Full LED Lightbar & Neon Underglow
      const fLightbar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.05), lightMat);
      fLightbar.position.set(0, 0.55, -(chassisD / 2 + 0.02));
      const rLightbar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.05), tailMat);
      rLightbar.position.set(0, 0.62, chassisD / 2 + 0.02);
      this.bodyGroup.add(fLightbar, rLightbar);

      // Neon Underglow
      this.underglowLight = new THREE.PointLight(0xa855f7, 3.0, 5);
      this.underglowLight.position.set(0, 0.15, 0);
      this.bodyGroup.add(this.underglowLight);

    } else {
      // Daewoo Lanos: Rounded teardrop headlights & black plastic side moldings
      const hlGeo = new THREE.BoxGeometry(0.3, 0.14, 0.05);
      const hlL = new THREE.Mesh(hlGeo, lightMat);
      hlL.position.set(-0.6, 0.6, -(chassisD / 2 + 0.02));
      const hlR = new THREE.Mesh(hlGeo, lightMat);
      hlR.position.set(0.6, 0.6, -(chassisD / 2 + 0.02));
      this.bodyGroup.add(hlL, hlR);

      // Standard taillights
      const tlGeo = new THREE.BoxGeometry(0.3, 0.12, 0.05);
      const tlL = new THREE.Mesh(tlGeo, tailMat);
      tlL.position.set(-0.6, 0.65, chassisD / 2 + 0.02);
      const tlR = new THREE.Mesh(tlGeo, tailMat);
      tlR.position.set(0.6, 0.65, chassisD / 2 + 0.02);
      this.bodyGroup.add(tlL, tlR);
    }

    // 7. 4 Wheels with Steerable Front Pivots & Brake Calipers
    const wheelRadius = isClunker ? 0.33 : 0.38;
    const wheelWidth = isHyper ? 0.32 : 0.25;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.68, wheelRadius * 0.68, wheelWidth + 0.01, 10);
    rimGeo.rotateZ(Math.PI / 2);

    const caliperGeo = new THREE.BoxGeometry(0.12, 0.18, 0.1);

    const halfW = chassisW / 2;
    const halfL = chassisD / 2 - 0.55;

    // --- Front Left Wheel (Steerable) ---
    this.frontLeftSteerPivot.position.set(-halfW - wheelWidth / 3, wheelRadius, -halfL);
    const flWheel = new THREE.Mesh(wheelGeo, wheelMat);
    flWheel.castShadow = true;
    flWheel.add(new THREE.Mesh(rimGeo, rimMat));
    const flCaliper = new THREE.Mesh(caliperGeo, caliperMat);
    flCaliper.position.set(0.08, 0.1, 0);
    this.frontLeftSteerPivot.add(flWheel, flCaliper);
    this.wheels.push(flWheel);

    // --- Front Right Wheel (Steerable) ---
    this.frontRightSteerPivot.position.set(halfW + wheelWidth / 3, wheelRadius, -halfL);
    const frWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frWheel.castShadow = true;
    frWheel.add(new THREE.Mesh(rimGeo, rimMat));
    const frCaliper = new THREE.Mesh(caliperGeo, caliperMat);
    frCaliper.position.set(-0.08, 0.1, 0);
    this.frontRightSteerPivot.add(frWheel, frCaliper);
    this.wheels.push(frWheel);

    // --- Rear Left Wheel ---
    const rlWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rlWheel.position.set(-halfW - wheelWidth / 3, wheelRadius, halfL);
    rlWheel.castShadow = true;
    rlWheel.add(new THREE.Mesh(rimGeo, rimMat));
    this.mesh.add(rlWheel);
    this.wheels.push(rlWheel);

    // --- Rear Right Wheel ---
    const rrWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rrWheel.position.set(halfW + wheelWidth / 3, wheelRadius, halfL);
    rrWheel.castShadow = true;
    rrWheel.add(new THREE.Mesh(rimGeo, rimMat));
    this.mesh.add(rrWheel);
    this.wheels.push(rrWheel);

    // 8. Dual GTA 5 SpotLight Headlight Cones projecting forward
    const beamColor = isHyper ? 0xdbeafe : (isSport ? 0xf0fdf4 : 0xfffbeb);
    this.headlightL = new THREE.SpotLight(beamColor, 15.0, 42, Math.PI / 6.5, 0.45, 1.2);
    this.headlightL.position.set(-0.55, 0.65, -(chassisD / 2));
    const targetL = new THREE.Object3D();
    targetL.position.set(-0.55, 0, -(chassisD / 2 + 25));
    this.mesh.add(targetL);
    this.headlightL.target = targetL;
    this.mesh.add(this.headlightL);

    this.headlightR = new THREE.SpotLight(beamColor, 15.0, 42, Math.PI / 6.5, 0.45, 1.2);
    this.headlightR.position.set(0.55, 0.65, -(chassisD / 2));
    const targetR = new THREE.Object3D();
    targetR.position.set(0.55, 0, -(chassisD / 2 + 25));
    this.mesh.add(targetR);
    this.headlightR.target = targetR;
    this.mesh.add(this.headlightR);

    // Rear brake light
    this.brakeLight = new THREE.PointLight(0xef4444, 0.3, 7);
    this.brakeLight.position.set(0, 0.65, chassisD / 2 + 0.2);
    this.mesh.add(this.brakeLight);
  }

  private createLicensePlate(numberStr: string): THREE.Group {
    const plateGroup = new THREE.Group();

    // Plate background (white)
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.14, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    );
    plateGroup.add(plate);

    // Ukrainian Flag Blue/Yellow strip on left
    const blueStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x2563eb })
    );
    blueStrip.position.set(-0.21, 0.03, 0.005);

    const yellowStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xfacc15 })
    );
    yellowStrip.position.set(-0.21, -0.03, 0.005);

    // Embossed number block
    const textMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.08, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x111827 })
    );
    textMesh.position.set(0.04, 0, 0.005);

    plateGroup.add(blueStrip, yellowStrip, textMesh);
    return plateGroup;
  }

  public override update(dt: number, forward: boolean, backward: boolean, left: boolean, right: boolean, handbrake: boolean): void {
    super.update(dt, forward, backward, left, right, handbrake);

    // 1. Front Wheel Steering & Animation
    const targetSteer = left ? 0.45 : (right ? -0.45 : 0);
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteer, dt * 10);

    this.frontLeftSteerPivot.rotation.y = this.steerAngle;
    this.frontRightSteerPivot.rotation.y = this.steerAngle;

    // Steering wheel in interior rotates along
    if (this.steeringWheel) {
      this.steeringWheel.rotation.z = -this.steerAngle * 2.5;
    }

    // 2. Body Roll & Pitch Suspension Simulation
    const speedRatio = this.speed / this.stats.maxSpeed;
    const accelDelta = (this.speed - this.lastSpeed) / Math.max(0.001, dt);
    this.lastSpeed = this.speed;

    // Roll away from turn
    const targetRoll = -this.steerAngle * speedRatio * 0.12;
    this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, targetRoll, dt * 8);

    // Pitch down on hard braking, pitch up on hard acceleration
    const targetPitch = THREE.MathUtils.clamp(-accelDelta * 0.004, -0.08, 0.08);
    this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, targetPitch, dt * 6);

    // 3. Interactive Brake & Taillight Glow
    const isBraking = (backward && this.speed > 0) || handbrake;
    if (this.tailMat) {
      this.tailMat.emissiveIntensity = isBraking ? 4.5 : 1.2;
    }
    if (this.brakeLight) {
      this.brakeLight.intensity = isBraking ? 2.8 : 0.3;
    }

    // 4. GTA 5 Drift & Burnout Tire Smoke
    const isSharpTurn = Math.abs(this.steerAngle) > 0.22 && Math.abs(this.speed) > 6.5;
    this.isDrifting = (handbrake && Math.abs(this.speed) > 2.0) || isSharpTurn;

    if (this.isDrifting) {
      const tireL = new THREE.Vector3(-this.halfWidth * 0.85, 0.2, this.halfLength * 0.75).applyMatrix4(this.mesh.matrixWorld);
      const tireR = new THREE.Vector3(this.halfWidth * 0.85, 0.2, this.halfLength * 0.75).applyMatrix4(this.mesh.matrixWorld);
      this.emitSmoke(tireL, true);
      this.emitSmoke(tireR, true);
    }

    // 5. Smoke & Particles for exhaust
    if (this.isRusty && (this.speed > 0.5 || forward)) {
      const exPos = new THREE.Vector3(0.5, 0.3, this.mesh.position.z + 1.7).applyMatrix4(this.mesh.matrixWorld);
      this.emitSmoke(exPos, true);
    } else if (this.speed > 5) {
      const exPos = new THREE.Vector3(0.5, 0.3, 1.8).applyMatrix4(this.mesh.matrixWorld);
      this.emitSmoke(exPos, false);
    }

    // 6. GTA 5 Nitro Boost Acceleration
    if (this.hasNitroBoost && forward && !handbrake) {
      this.speed = Math.min(this.stats.maxSpeed * 1.35, this.speed + this.stats.acceleration * 1.4 * dt);
      const exPos = new THREE.Vector3(0, 0.35, this.halfLength + 0.3).applyMatrix4(this.mesh.matrixWorld);
      this.emitSmoke(exPos, false);
    }
  }

  public setCustomColor(hex: number): void {
    if (this.bodyMat) {
      this.bodyMat.color.setHex(hex);
      this.bodyMat.metalness = 0.85;
      this.bodyMat.roughness = 0.2;
    }
  }

  public setUnderglow(hex: number): void {
    if (!this.underglowLight) {
      this.underglowLight = new THREE.PointLight(hex, 3.5, 6);
      this.underglowLight.position.set(0, 0.15, 0);
      this.bodyGroup.add(this.underglowLight);
    } else {
      this.underglowLight.color.setHex(hex);
      this.underglowLight.intensity = 3.5;
    }
  }

  public setNitro(hasNitro: boolean): void {
    this.hasNitroBoost = hasNitro;
  }
}
