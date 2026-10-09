import * as THREE from 'three';

export interface VehicleStats {
  maxSpeed: number; // in units/sec
  acceleration: number;
  braking: number;
  turnSpeed: number;
  weight: number;
}

export abstract class Vehicle {
  public mesh: THREE.Group;
  public id: string;
  public name: string;
  public speed: number = 0;
  public steeringAngle: number = 0;
  public stats: VehicleStats;
  public wheels: THREE.Mesh[] = [];
  public isPlayerInside: boolean = false;
  public cockpitOffset: THREE.Vector3 = new THREE.Vector3(0, 1.1, 0);
  public halfWidth: number = 0.9;
  public halfLength: number = 2.0;
  public steerAngle: number = 0;

  protected smokeParticles: THREE.Points | null = null;
  protected smokeGeo: THREE.BufferGeometry | null = null;
  protected smokePositions: Float32Array | null = null;
  protected smokeOpacities: Float32Array | null = null;
  protected smokeIndex: number = 0;
  protected maxSmoke: number = 40;

  constructor(id: string, name: string, stats: VehicleStats) {
    this.id = id;
    this.name = name;
    this.stats = stats;
    this.mesh = new THREE.Group();
    this.initSmoke();
  }

  protected initSmoke(): void {
    this.maxSmoke = 40;
    this.smokePositions = new Float32Array(this.maxSmoke * 3);
    this.smokeOpacities = new Float32Array(this.maxSmoke);

    for (let i = 0; i < this.maxSmoke; i++) {
      this.smokePositions[i * 3 + 1] = -100; // hide offscreen initially
      this.smokeOpacities[i] = 0;
    }

    this.smokeGeo = new THREE.BufferGeometry();
    this.smokeGeo.setAttribute('position', new THREE.BufferAttribute(this.smokePositions, 3));
    this.smokeGeo.setAttribute('opacity', new THREE.BufferAttribute(this.smokeOpacities, 1));

    const smokeMat = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.6,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });

    this.smokeParticles = new THREE.Points(this.smokeGeo, smokeMat);
  }

  public emitSmoke(pos: THREE.Vector3, isHeavy: boolean = false): void {
    if (!this.smokePositions || !this.smokeGeo) return;
    const idx = this.smokeIndex % this.maxSmoke;
    this.smokePositions[idx * 3] = pos.x + (Math.random() - 0.5) * 0.2;
    this.smokePositions[idx * 3 + 1] = pos.y + Math.random() * 0.1;
    this.smokePositions[idx * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.2;

    this.smokeIndex++;
    this.smokeGeo.attributes.position.needsUpdate = true;
  }

  public updateSmoke(dt: number): void {
    if (!this.smokePositions || !this.smokeGeo) return;
    for (let i = 0; i < this.maxSmoke; i++) {
      if (this.smokePositions[i * 3 + 1] > -50) {
        this.smokePositions[i * 3 + 1] += dt * 0.8; // rise up
        this.smokePositions[i * 3] += (Math.random() - 0.5) * 0.05;
        this.smokePositions[i * 3 + 2] += (Math.random() - 0.5) * 0.05;

        // fade out
        if (this.smokePositions[i * 3 + 1] > 2.5) {
          this.smokePositions[i * 3 + 1] = -100;
        }
      }
    }
    this.smokeGeo.attributes.position.needsUpdate = true;
  }

  public getSmokeParticles(): THREE.Points | null {
    return this.smokeParticles;
  }

  public update(dt: number, forward: boolean, backward: boolean, left: boolean, right: boolean, handbrake: boolean): void {
    // Acceleration / Deceleration
    if (forward) {
      this.speed = Math.min(this.stats.maxSpeed, this.speed + this.stats.acceleration * dt);
    } else if (backward) {
      this.speed = Math.max(-this.stats.maxSpeed * 0.4, this.speed - this.stats.acceleration * 0.8 * dt);
    } else {
      // Natural rolling friction
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.stats.braking * 0.5 * dt);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.stats.braking * 0.5 * dt);
      }
    }

    if (handbrake) {
      if (this.speed > 0) this.speed = Math.max(0, this.speed - this.stats.braking * 2.5 * dt);
      if (this.speed < 0) this.speed = Math.min(0, this.speed + this.stats.braking * 2.5 * dt);
    }

    // Steering
    const movingForward = this.speed >= 0 ? 1 : -1;
    const steerFactor = Math.min(1, Math.abs(this.speed) / (this.stats.maxSpeed * 0.2 + 0.1));

    if (left) {
      this.mesh.rotation.y += this.stats.turnSpeed * steerFactor * movingForward * dt;
    }
    if (right) {
      this.mesh.rotation.y -= this.stats.turnSpeed * steerFactor * movingForward * dt;
    }

    // Move forward based on vehicle heading
    const forwardVec = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
    this.mesh.position.addScaledVector(forwardVec, this.speed * dt);

    // Rotate wheels
    const wheelRotDelta = (this.speed * dt) / 0.4;
    this.wheels.forEach((w) => {
      w.rotation.x += wheelRotDelta;
    });

    this.updateSmoke(dt);
  }

  public getSpeedKmh(): number {
    return Math.abs(Math.round(this.speed * 3.6));
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position;
  }
}
