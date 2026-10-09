import * as THREE from 'three';
import { Vehicle } from './Vehicle';

export class Bike extends Vehicle {
  private handlebars: THREE.Group;
  private bodyMesh: THREE.Group;

  constructor() {
    super('bike', 'Стартовий Байк', {
      maxSpeed: 18, // ~65 km/h
      acceleration: 12,
      braking: 16,
      turnSpeed: 2.2,
      weight: 150
    });

    this.halfWidth = 0.45;
    this.halfLength = 1.1;
    this.cockpitOffset = new THREE.Vector3(0, 1.25, -0.2);

    this.handlebars = new THREE.Group();
    this.bodyMesh = new THREE.Group();
    this.buildBikeMesh();
  }

  private buildBikeMesh(): void {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.6 }); // Червоний глянець
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.8 }); // Темний метал
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 }); // Гума
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 }); // Сріблясті диски
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 });
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 });

    // --- Wheels ---
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.16, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    // Front Wheel
    const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    frontWheel.position.set(0, 0.38, -0.9);
    frontWheel.castShadow = true;
    this.bodyMesh.add(frontWheel);
    this.wheels.push(frontWheel);

    // Front Rim
    const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.17, 8);
    rimGeo.rotateZ(Math.PI / 2);
    const frontRim = new THREE.Mesh(rimGeo, rimMat);
    frontWheel.add(frontRim);

    // Rear Wheel
    const rearWheel = new THREE.Mesh(wheelGeo, wheelMat);
    rearWheel.position.set(0, 0.38, 0.7);
    rearWheel.castShadow = true;
    this.bodyMesh.add(rearWheel);
    this.wheels.push(rearWheel);

    // Rear Rim
    const rearRim = new THREE.Mesh(rimGeo, rimMat);
    rearWheel.add(rearRim);

    // --- Main Chassis / Body ---
    const chassisGeo = new THREE.BoxGeometry(0.3, 0.35, 1.1);
    const chassis = new THREE.Mesh(chassisGeo, frameMat);
    chassis.position.set(0, 0.65, -0.1);
    chassis.castShadow = true;
    this.bodyMesh.add(chassis);

    // Gas Tank
    const tankGeo = new THREE.BoxGeometry(0.36, 0.22, 0.5);
    const tank = new THREE.Mesh(tankGeo, frameMat);
    tank.position.set(0, 0.82, -0.35);
    tank.rotation.x = -0.15;
    this.bodyMesh.add(tank);

    // Seat
    const seatGeo = new THREE.BoxGeometry(0.28, 0.1, 0.5);
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 0.78, 0.15);
    this.bodyMesh.add(seat);

    // Engine Block
    const engGeo = new THREE.BoxGeometry(0.26, 0.3, 0.4);
    const engine = new THREE.Mesh(engGeo, metalMat);
    engine.position.set(0, 0.45, -0.05);
    this.bodyMesh.add(engine);

    // Exhaust Pipe
    const exhaustGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.7, 8);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhaust = new THREE.Mesh(exhaustGeo, metalMat);
    exhaust.position.set(0.18, 0.4, 0.4);
    exhaust.rotation.x = 0.1;
    this.bodyMesh.add(exhaust);

    // --- Handlebars & Fork ---
    const forkGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    const forkL = new THREE.Mesh(forkGeo, metalMat);
    forkL.position.set(-0.1, 0.6, -0.85);
    forkL.rotation.x = 0.25;
    this.handlebars.add(forkL);

    const forkR = new THREE.Mesh(forkGeo, metalMat);
    forkR.position.set(0.1, 0.6, -0.85);
    forkR.rotation.x = 0.25;
    this.handlebars.add(forkR);

    // Handlebar bar
    const barGeo = new THREE.BoxGeometry(0.7, 0.04, 0.04);
    const bar = new THREE.Mesh(barGeo, metalMat);
    bar.position.set(0, 0.95, -0.75);
    this.handlebars.add(bar);

    // Headlight
    const headlightGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12);
    headlightGeo.rotateX(Math.PI / 2);
    const headlight = new THREE.Mesh(headlightGeo, lightMat);
    headlight.position.set(0, 0.85, -0.95);
    this.handlebars.add(headlight);

    // Forward SpotLight beam
    const bikeSpot = new THREE.SpotLight(0xfffbeb, 12.0, 30, Math.PI / 6, 0.5, 1.2);
    bikeSpot.position.set(0, 0.85, -0.95);
    const bikeTarget = new THREE.Object3D();
    bikeTarget.position.set(0, 0, -20);
    this.mesh.add(bikeTarget);
    bikeSpot.target = bikeTarget;
    this.mesh.add(bikeSpot);

    // Taillight
    const tailGeo = new THREE.BoxGeometry(0.15, 0.06, 0.04);
    const taillight = new THREE.Mesh(tailGeo, tailMat);
    taillight.position.set(0, 0.75, 0.65);
    this.bodyMesh.add(taillight);

    this.bodyMesh.add(this.handlebars);
    this.mesh.add(this.bodyMesh);
  }

  public override update(dt: number, forward: boolean, backward: boolean, left: boolean, right: boolean, handbrake: boolean): void {
    super.update(dt, forward, backward, left, right, handbrake);

    // Dynamic leaning into turns
    const targetLean = left ? 0.35 : (right ? -0.35 : 0);
    const speedFactor = Math.min(1, Math.abs(this.speed) / 5);
    this.bodyMesh.rotation.z = THREE.MathUtils.lerp(this.bodyMesh.rotation.z, targetLean * speedFactor, dt * 6);

    // Handlebars turn
    const targetTurn = left ? 0.3 : (right ? -0.3 : 0);
    this.handlebars.rotation.y = THREE.MathUtils.lerp(this.handlebars.rotation.y, targetTurn, dt * 8);

    // Emit light exhaust smoke when moving
    if (this.speed > 2) {
      const exhaustPos = new THREE.Vector3(0.2, 0.4, 0.75).applyMatrix4(this.mesh.matrixWorld);
      this.emitSmoke(exhaustPos);
    }
  }
}
