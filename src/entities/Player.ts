import * as THREE from 'three';
import { Vehicle } from './Vehicle';

export class Player {
  public mesh: THREE.Group;
  public walkSpeed: number = 5.5;
  public sprintSpeed: number = 9.5;
  public currentVehicle: Vehicle | null = null;
  public isRidingVehicle: boolean = false;

  // GTA 5 Stamina System
  public stamina: number = 100;
  public maxStamina: number = 100;
  public isExhausted: boolean = false;

  private head: THREE.Mesh;
  private torso: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private walkTime: number = 0;

  private isFirstPersonMode: boolean = false;

  // Jump and vertical physics
  private velocityY: number = 0;
  private isGrounded: boolean = true;
  private readonly gravity: number = 22.0;
  private readonly jumpForce: number = 8.5;

  private hoodieMat: THREE.MeshStandardMaterial;
  private pantsMat: THREE.MeshStandardMaterial;
  private glassesMesh: THREE.Mesh | null = null;

  constructor() {
    this.mesh = new THREE.Group();

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.7 });
    this.hoodieMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 }); // Яскравий синій худі
    this.pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }); // Темні спортивні штани
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }); // Білі снікери
    const capMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.5 });
    const headsetMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.8 }); // Стрімерські навушники

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.7, 0.32);
    this.torso = new THREE.Mesh(torsoGeo, this.hoodieMat);
    this.torso.position.y = 1.05;
    this.torso.castShadow = true;
    this.mesh.add(this.torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.36, 0.36, 0.36);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 0.55;
    this.torso.add(this.head);

    // Cap
    const capGeo = new THREE.BoxGeometry(0.39, 0.12, 0.39);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.19;
    this.head.add(cap);

    const visorGeo = new THREE.BoxGeometry(0.39, 0.04, 0.2);
    const visor = new THREE.Mesh(visorGeo, capMat);
    visor.position.set(0, 0.15, -0.24);
    this.head.add(visor);

    // Streamer Headset
    const headsetGeo = new THREE.BoxGeometry(0.44, 0.12, 0.16);
    const headset = new THREE.Mesh(headsetGeo, headsetMat);
    headset.position.y = 0.05;
    this.head.add(headset);

    // Left Arm
    const armGeo = new THREE.BoxGeometry(0.15, 0.65, 0.15);
    armGeo.translate(0, -0.28, 0);
    this.leftArm = new THREE.Mesh(armGeo, this.hoodieMat);
    this.leftArm.position.set(-0.35, 0.28, 0);
    this.leftArm.castShadow = true;
    this.torso.add(this.leftArm);

    // Right Arm
    this.rightArm = new THREE.Mesh(armGeo, this.hoodieMat);
    this.rightArm.position.set(0.35, 0.28, 0);
    this.rightArm.castShadow = true;
    this.torso.add(this.rightArm);

    // Left Leg
    const legGeo = new THREE.BoxGeometry(0.19, 0.72, 0.19);
    legGeo.translate(0, -0.36, 0);
    this.leftLeg = new THREE.Mesh(legGeo, this.pantsMat);
    this.leftLeg.position.set(-0.16, -0.35, 0);
    this.leftLeg.castShadow = true;
    this.torso.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Mesh(legGeo, this.pantsMat);
    this.rightLeg.position.set(0.16, -0.35, 0);
    this.rightLeg.castShadow = true;
    this.torso.add(this.rightLeg);

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.2, 0.12, 0.28);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.7, -0.04);
    this.leftLeg.add(leftShoe);

    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.7, -0.04);
    this.rightLeg.add(rightShoe);
  }

  public setOutfit(outfitId: string): void {
    if (outfitId === 'kyiv') {
      this.hoodieMat.color.setHex(0x111827);
      this.hoodieMat.emissive.setHex(0xd97706);
      this.hoodieMat.emissiveIntensity = 0.35;
      this.pantsMat.color.setHex(0x1e293b);
    } else if (outfitId === 'cyber') {
      this.hoodieMat.color.setHex(0x06b6d4);
      this.hoodieMat.emissive.setHex(0x06b6d4);
      this.hoodieMat.emissiveIntensity = 0.8;
      this.pantsMat.color.setHex(0x0f172a);
    } else if (outfitId === 'gold') {
      this.hoodieMat.color.setHex(0xf59e0b);
      this.hoodieMat.emissive.setHex(0xfbbf24);
      this.hoodieMat.emissiveIntensity = 0.55;
      this.pantsMat.color.setHex(0x18181b);
    } else if (outfitId === 'shades') {
      if (!this.glassesMesh) {
        const gGeo = new THREE.BoxGeometry(0.38, 0.08, 0.08);
        const gMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1 });
        this.glassesMesh = new THREE.Mesh(gGeo, gMat);
        this.glassesMesh.position.set(0, 0.05, -0.2);
        this.head.add(this.glassesMesh);
      }
      this.glassesMesh.visible = true;
    }
  }

  public mountVehicle(vehicle: Vehicle): void {
    this.currentVehicle = vehicle;
    this.isRidingVehicle = true;
    vehicle.isPlayerInside = true;

    if (vehicle.id === 'bike') {
      this.mesh.visible = true;
      vehicle.mesh.add(this.mesh);
      this.mesh.position.set(0, 0.25, 0.05);
      this.mesh.rotation.set(0, 0, 0);

      // Riding pose
      this.leftLeg.rotation.x = -1.1;
      this.rightLeg.rotation.x = -1.1;
      this.leftArm.rotation.x = -0.7;
      this.rightArm.rotation.x = -0.7;
      this.torso.rotation.x = 0.2;
    } else {
      this.mesh.visible = false;
      vehicle.mesh.add(this.mesh);
      this.mesh.position.set(-0.35, 0.2, 0.1);
    }
  }

  public dismountVehicle(worldScene: THREE.Scene): void {
    if (!this.currentVehicle) return;

    const exitPos = this.currentVehicle.mesh.position.clone();
    const sideVec = new THREE.Vector3(-1.8, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentVehicle.mesh.rotation.y);
    exitPos.add(sideVec);
    exitPos.y = 0;

    this.currentVehicle.mesh.remove(this.mesh);
    worldScene.add(this.mesh);

    this.mesh.position.copy(exitPos);
    this.mesh.rotation.set(0, this.currentVehicle.mesh.rotation.y, 0);
    this.mesh.visible = true;

    // Reset pose
    this.leftLeg.rotation.x = 0;
    this.rightLeg.rotation.x = 0;
    this.leftArm.rotation.x = 0;
    this.rightArm.rotation.x = 0;
    this.torso.rotation.x = 0;
    this.velocityY = 0;
    this.isGrounded = true;

    this.currentVehicle.isPlayerInside = false;
    this.currentVehicle = null;
    this.isRidingVehicle = false;
  }

  public update(
    dt: number,
    forward: boolean,
    backward: boolean,
    left: boolean,
    right: boolean,
    sprint: boolean,
    jump: boolean,
    cameraAngleY: number
  ): void {
    if (this.isRidingVehicle) return;

    // 1. Calculate camera-relative movement vectors
    const camForward = new THREE.Vector3(-Math.sin(cameraAngleY), 0, -Math.cos(cameraAngleY));
    const camRight = new THREE.Vector3(Math.cos(cameraAngleY), 0, -Math.sin(cameraAngleY));

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (forward) moveDir.add(camForward);
    if (backward) moveDir.sub(camForward);
    if (right) moveDir.add(camRight);
    if (left) moveDir.sub(camRight);

    const isMoving = moveDir.lengthSq() > 0.001;

    // GTA 5 Stamina Calculation
    const wantsSprint = sprint && isMoving && !this.isExhausted;
    if (wantsSprint) {
      this.stamina = Math.max(0, this.stamina - dt * 25);
      if (this.stamina <= 0) {
        this.isExhausted = true;
      }
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * 16);
      if (this.stamina > 22) {
        this.isExhausted = false;
      }
    }

    // Current movement speed (walk vs sprint)
    const currentSpeed = wantsSprint ? this.sprintSpeed : this.walkSpeed;

    if (this.isFirstPersonMode) {
      // In first-person mode: character instantly faces exactly where camera crosshair points
      const targetHeading = cameraAngleY + Math.PI;
      let angleDiff = targetHeading - this.mesh.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.mesh.rotation.y += angleDiff * Math.min(1, dt * 25);
    } else if (isMoving) {
      // In third-person mode: smooth rotation towards movement vector
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      let angleDiff = targetAngle - this.mesh.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.mesh.rotation.y += angleDiff * Math.min(1, dt * 14);
    }

    if (isMoving) {
      moveDir.normalize();

      // Move in world space
      this.mesh.position.addScaledVector(moveDir, currentSpeed * dt);

      // Animated walk/run cycle
      const animMultiplier = sprint ? 1.7 : 1.0;
      this.walkTime += dt * 11 * animMultiplier;

      this.leftLeg.rotation.x = Math.sin(this.walkTime) * 0.7;
      this.rightLeg.rotation.x = -Math.sin(this.walkTime) * 0.7;
      this.leftArm.rotation.x = -Math.sin(this.walkTime) * 0.6;
      this.rightArm.rotation.x = Math.sin(this.walkTime) * 0.6;
      this.torso.position.y = 1.05 + Math.abs(Math.sin(this.walkTime * 2)) * 0.05;
    } else {
      // Idle return to neutral pose
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, dt * 10);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, dt * 10);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, dt * 10);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, dt * 10);
      this.torso.position.y = 1.05;
    }

    // 2. Jump and Gravity Physics
    if (jump && this.isGrounded) {
      this.velocityY = this.jumpForce;
      this.isGrounded = false;
    }

    if (!this.isGrounded || this.mesh.position.y > 0.01) {
      this.velocityY -= this.gravity * dt;
      this.mesh.position.y += this.velocityY * dt;

      if (this.mesh.position.y <= 0) {
        this.mesh.position.y = 0;
        this.velocityY = 0;
        this.isGrounded = true;
      }
    }
  }

  public getPosition(): THREE.Vector3 {
    return this.isRidingVehicle && this.currentVehicle ? this.currentVehicle.mesh.position : this.mesh.position;
  }

  public setFirstPerson(isFp: boolean): void {
    this.isFirstPersonMode = isFp;
    this.head.visible = !isFp;
  }

  public getWalkTime(): number {
    return this.walkTime;
  }
}
