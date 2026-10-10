import * as THREE from 'three';
import { InputManager } from './InputManager';
import { AudioManager } from './AudioManager';
import { EconomySystem } from '../systems/EconomySystem';
import { TutorialSystem } from '../systems/TutorialSystem';
import { StreamSimulation } from '../systems/StreamSimulation';
import { Player } from '../entities/Player';
import { Bike } from '../entities/Bike';
import { Car } from '../entities/Car';
import { Vehicle } from '../entities/Vehicle';
import { GasStation } from '../world/GasStation';
import { StreamerHouse } from '../world/StreamerHouse';
import { CityMap } from '../world/CityMap';
import { HudUI } from '../ui/HudUI';
import { MiniMapUI } from '../ui/MiniMapUI';
import { PhoneUI } from '../ui/PhoneUI';
import { CARS_CATALOG } from '../data/items';
import { CollisionSystem } from '../systems/CollisionSystem';
import { SkyDome } from '../world/SkyDome';
import { PostProcessingManager } from './PostProcessing';
import { AuthSystem } from '../systems/AuthSystem';
import { MultiplayerSystem } from '../systems/MultiplayerSystem';
import { MainMenuUI } from '../ui/MainMenuUI';
import { DevMoneyModal } from '../ui/DevMoneyModal';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Core managers
  private input: InputManager;
  private audio: AudioManager;
  private economy: EconomySystem;
  private tutorial: TutorialSystem;
  private streamSim: StreamSimulation;
  private collisionSystem: CollisionSystem;
  private postProcessing: PostProcessingManager;
  private auth: AuthSystem;
  private multiplayer: MultiplayerSystem;

  // World & Entities
  private skyDome: SkyDome;
  private cityMap: CityMap;
  private gasStation: GasStation;
  private house: StreamerHouse;
  private player: Player;
  private bike: Bike;
  private currentCar: Car | null = null;
  private activeVehicle: Vehicle | null = null;

  // UI
  private hud: HudUI;
  private minimap: MiniMapUI;
  private phone: PhoneUI;
  private mainMenu: MainMenuUI;
  private devMoneyModal: DevMoneyModal;
  private isGameActive: boolean = false;

  // Camera Orbit State
  private cameraYaw: number = 0;
  private cameraPitch: number = -0.15;
  private cameraDistance: number = 6.0;
  private cameraTarget: THREE.Vector3 = new THREE.Vector3();
  private lastTime: number = 0;
  private isFirstPerson: boolean = false;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    // 1. Initialize Core Systems
    this.audio = new AudioManager();
    this.input = new InputManager();
    this.economy = new EconomySystem();
    this.tutorial = new TutorialSystem();
    this.streamSim = new StreamSimulation(this.economy, this.audio);
    this.collisionSystem = new CollisionSystem();
    this.auth = new AuthSystem();
    this.multiplayer = new MultiplayerSystem(this.auth.getCurrentUser());

    // 2. Setup Three.js Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xfdd5a0, 0.0032);

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // GTA 5 Los Santos SkyDome & Atmosphere
    this.skyDome = new SkyDome();
    this.scene.add(this.skyDome.mesh);

    // GTA 5 Post-Processing (Bloom + Color Grading + Speed Blur)
    this.postProcessing = new PostProcessingManager(this.renderer, this.scene, this.camera);

    // 3. Lighting
    this.setupLighting();

    // 4. World construction
    this.cityMap = new CityMap();
    this.scene.add(this.cityMap.mesh);

    this.gasStation = new GasStation();
    this.scene.add(this.gasStation.mesh);

    this.house = new StreamerHouse();
    this.scene.add(this.house.mesh);

    // 5. Entities
    this.player = new Player();
    this.player.mesh.position.copy(this.gasStation.spawnPos);
    this.scene.add(this.player.mesh);

    // Starting Bike at Gas Station
    this.bike = new Bike();
    this.bike.mesh.position.copy(this.gasStation.bikeSpawnPos);
    this.bike.mesh.rotation.y = Math.PI; // facing road
    this.scene.add(this.bike.mesh);
    const bikeSmoke = this.bike.getSmokeParticles();
    if (bikeSmoke) this.scene.add(bikeSmoke);

    // 6. UI Initialization
    this.hud = new HudUI(this.audio);
    this.minimap = new MiniMapUI();
    this.phone = new PhoneUI(
      this.economy,
      this.streamSim,
      this.audio,
      this.tutorial,
      (carId) => this.spawnCar(carId),
      (tierIndex) => this.house.updatePcModel(tierIndex),
      (outfitId) => this.player.setOutfit(outfitId),
      () => this.applyTuningToActiveCar(),
      (item) => this.hud.showToast(`Смачного! Ви спожили: ${item.name} (${item.effect.bonusText || ''})`, 'success'),
      () => this.openMainMenu()
    );

    this.multiplayer.setScene(this.scene);
    this.devMoneyModal = new DevMoneyModal(this.economy, this.audio, () => this.toggleMap());
    this.mainMenu = new MainMenuUI(this.auth, this.multiplayer, this.audio, (mode) => this.onStartGame(mode));

    // Hide HUD until game is launched from Main Menu
    const hudContainer = document.getElementById('hud-container');
    if (hudContainer) {
      hudContainer.style.display = 'none';
    }

    // 7. Event Handlers
    this.setupEvents();

    // Initial PC model on desk (-1 = empty desk)
    this.house.updatePcModel(-1);

    // Initial HUD update
    this.hud.updateBalance(this.economy.getBalance());
    this.hud.updateVehicle('Пішки', false);
    this.updateTutorialDisplay();

    // Start Loop
    window.addEventListener('resize', () => this.onResize());
    requestAnimationFrame((t) => this.loop(t));
  }

  private setupLighting(): void {
    // Ambient light (warm daylight bounce)
    const ambientLight = new THREE.AmbientLight(0xffedd5, 0.7);
    this.scene.add(ambientLight);

    // Hemisphere light (azure sky vs dark asphalt ground)
    const hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x334155, 0.6);
    this.scene.add(hemiLight);

    // Directional Sunlight with sharp soft shadows
    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    dirLight.position.set(60, 95, 45);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 320;
    dirLight.shadow.camera.left = -110;
    dirLight.shadow.camera.right = 110;
    dirLight.shadow.camera.top = 110;
    dirLight.shadow.camera.bottom = -110;
    dirLight.shadow.bias = -0.0003;
    this.scene.add(dirLight);
  }

  private setupEvents(): void {
    // [E] Interaction key
    this.input.onInteract(() => {
      this.handleInteract();
    });

    // [P] Phone toggle
    this.input.onPhoneToggle(() => {
      this.phone.toggle();
    });

    // [M] Map modal toggle
    this.input.onMapToggle(() => {
      this.toggleMap();
    });

    // [F] Secret Dev Money Cheat for korn333@gmail.com
    this.input.onDevCheat(() => {
      this.handleKeyF();
    });

    document.getElementById('btn-toggle-map')?.addEventListener('click', () => {
      this.toggleMap();
    });

    document.getElementById('btn-close-map')?.addEventListener('click', () => {
      document.getElementById('map-modal')?.classList.add('hidden');
      this.audio.playClick();
    });

    // Open Main Menu button in HUD
    document.getElementById('btn-open-menu')?.addEventListener('click', () => {
      this.openMainMenu();
    });

    // [H] Horn on vehicle
    this.input.onHorn(() => {
      if (this.player.isRidingVehicle) {
        this.audio.playHorn();
      }
    });

    // [V] Camera mode toggle (1st person vs 3rd person)
    this.input.onCameraToggle(() => {
      this.toggleCameraMode();
    });
    this.hud.onCameraBtnClick(() => {
      this.toggleCameraMode();
    });

    // [R] GTA 5 Radio station toggle
    this.input.onRadio(() => {
      this.toggleRadio();
    });
    this.hud.onRadioBtnClick(() => {
      this.toggleRadio();
    });

    // Tutorial step updates
    this.tutorial.onStepChange((_step, quest) => {
      this.hud.showTutorialModal(quest.title, quest.body);
      this.updateTutorialDisplay();
    });

    // Stream status in HUD
    this.streamSim.onStateChange((isStreaming, viewers) => {
      this.hud.updateStreamStatus(isStreaming, viewers);
    });

    // Stream donation alerts
    this.streamSim.onDonation((donor, amount, msg) => {
      this.hud.showToast(`${donor} задонатив ${amount} ₴: "${msg}"`, 'donation');
    });

    // Economy balance listener
    this.economy.onBalanceChange((bal) => {
      this.hud.updateBalance(bal);
    });
  }

  private onStartGame(mode: 'solo' | 'multiplayer'): void {
    this.isGameActive = true;
    const hudEl = document.getElementById('hud-container');
    if (hudEl) hudEl.style.display = 'flex';

    const multiBadge = document.getElementById('hud-multiplayer-badge');
    const multiRoomName = document.getElementById('hud-multiplayer-room-name');

    if (mode === 'solo') {
      this.multiplayer.leaveLobby();
      multiBadge?.classList.add('hidden');
      this.hud.showToast('Одиночну гру розпочато!', 'info');
    } else {
      const lobby = this.multiplayer.getCurrentLobby();
      multiBadge?.classList.remove('hidden');
      if (multiRoomName) {
        multiRoomName.textContent = lobby ? lobby.name : 'Мультиплеєр';
      }
      this.hud.showToast(`Приєднано до лобі: ${lobby?.name || 'Мультиплеєр'}!`, 'success');
    }
  }

  public openMainMenu(): void {
    this.input.exitPointerLock();
    this.mainMenu.show();
  }

  private handleKeyF(): void {
    if (this.mainMenu.isMenuVisible()) return;

    if (this.auth.isDevAccount()) {
      // Secret DEV Account korn333@gmail.com -> Toggle Dev Money Modal on [F]!
      this.devMoneyModal.toggle();
    }
  }

  private toggleMap(): void {
    const mapModal = document.getElementById('map-modal');
    mapModal?.classList.toggle('hidden');
    this.input.exitPointerLock();
    this.audio.playClick();
  }

  private toggleRadio(): void {
    if (!this.player.isRidingVehicle) return;
    const station = this.audio.nextRadioStation();
    this.hud.showRadioBanner(station.name);
    const label = document.getElementById('radio-btn-label');
    if (label) label.textContent = station.name;
    this.audio.playClick();
  }

  private toggleCameraMode(): void {
    this.isFirstPerson = !this.isFirstPerson;
    this.player.setFirstPerson(this.isFirstPerson);
    this.hud.updateCameraMode(this.isFirstPerson);
    this.input.setAlwaysTrackMouse(this.isFirstPerson);

    if (this.isFirstPerson) {
      this.cameraPitch = 0.0;
      this.input.requestPointerLock();
      this.hud.showToast('Вид від першої особи (Приціл-крапка увімкнено)', 'info');
    } else {
      this.cameraPitch = -0.15;
      this.input.exitPointerLock();
      this.hud.showToast('Вид від третьої особи', 'info');
    }
  }

  private handleInteract(): void {
    const playerPos = this.player.getPosition();

    // 1. If currently in a vehicle: dismount
    if (this.player.isRidingVehicle && this.activeVehicle) {
      this.player.dismountVehicle(this.scene);
      this.activeVehicle = null;
      this.audio.stopEngine();
      this.audio.stopRadio();
      this.audio.stopTireScreech();
      this.hud.updateVehicle('Пішки', false);
      this.audio.playClick();
      return;
    }

    // 2. Check if near bike to mount
    const bikeDist = playerPos.distanceTo(this.bike.getPosition());
    if (bikeDist < 3.0) {
      this.activeVehicle = this.bike;
      this.player.mountVehicle(this.bike);
      this.audio.startEngine();
      this.hud.updateVehicle(this.bike.name, true);
      this.audio.playClick();

      // Check tutorial step 1 -> 2
      if (this.tutorial.getCurrentStep() === 1) {
        this.tutorial.advanceStep(1);
      }
      return;
    }

    // 3. Check if near current car to mount
    if (this.currentCar) {
      const carDist = playerPos.distanceTo(this.currentCar.getPosition());
      if (carDist < 3.8) {
        this.activeVehicle = this.currentCar;
        this.player.mountVehicle(this.currentCar);
        this.audio.startEngine();
        this.hud.updateVehicle(this.currentCar.name, true);
        this.audio.playClick();
        return;
      }
    }

    // 4. Check if near streamer desk
    const deskDist = playerPos.distanceTo(this.house.deskPos);
    if (deskDist < 3.5) {
      this.audio.playClick();
      if (!this.economy.getActivePc()) {
        this.phone.open();
        this.hud.showToast('Спочатку придбай Old Comp за 100 ₴ у Магазині ПК!', 'info');
      } else {
        if (!this.streamSim.isStreaming()) {
          this.streamSim.startStream();
          this.hud.showToast('Стрім успішно запущено!', 'success');
          if (this.tutorial.getCurrentStep() === 5) {
            this.tutorial.advanceStep(5);
          }
        } else {
          this.phone.open();
        }
      }
      return;
    }

    // 5. Check if near any physical shop entrance in 3D world
    for (const shop of this.cityMap.shopZones) {
      if (playerPos.distanceTo(shop.pos) < 3.8) {
        this.phone.openSpecificApp(shop.id);
        this.hud.showToast(`Ласкаво просимо до магазину "${shop.name}"!`, 'info');
        return;
      }
    }
  }

  private applyTuningToActiveCar(): void {
    if (this.currentCar) {
      const col = this.economy.getCarCustomColor();
      if (col !== null) this.currentCar.setCustomColor(col);
      const under = this.economy.getUnderglowColor();
      if (under !== null) this.currentCar.setUnderglow(under);
      this.currentCar.setNitro(this.economy.hasNitro());
    }
  }

  private spawnCar(carId: string): void {
    const carModel = CARS_CATALOG.find((c) => c.id === carId);
    if (!carModel) return;

    // Remove previous car if exists
    if (this.currentCar) {
      if (this.activeVehicle === this.currentCar) {
        this.player.dismountVehicle(this.scene);
        this.activeVehicle = null;
        this.audio.stopEngine();
      }
      this.scene.remove(this.currentCar.mesh);
      const prevSmoke = this.currentCar.getSmokeParticles();
      if (prevSmoke) this.scene.remove(prevSmoke);
    }

    // Create new car at House Driveway
    this.currentCar = new Car(carModel);
    this.currentCar.mesh.position.copy(this.house.drivewayPos);
    this.currentCar.mesh.rotation.y = -Math.PI / 2;
    this.scene.add(this.currentCar.mesh);

    // Apply any purchased tunings
    this.applyTuningToActiveCar();

    const smoke = this.currentCar.getSmokeParticles();
    if (smoke) this.scene.add(smoke);

    this.hud.showToast(`Авто ${carModel.name} доставлено до гаражу будинку!`, 'success');
  }

  private updateTutorialDisplay(): void {
    const quest = this.tutorial.getCurrentQuest();
    const playerPos = this.player.getPosition();
    const targetVec = new THREE.Vector3(quest.targetCoords.x, 0, quest.targetCoords.z);
    const dist = playerPos.distanceTo(targetVec);

    this.hud.updateQuest(quest.hudText, dist);
  }

  private loop(time: number): void {
    requestAnimationFrame((t) => this.loop(t));

    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(dt, time / 1000);
    this.render();
  }

  private update(dt: number, timeSec: number): void {
    const forward = this.input.isForward();
    const backward = this.input.isBackward();
    const left = this.input.isLeft();
    const right = this.input.isRight();
    const handbrake = this.input.isHandbrake();
    const isSprint = this.input.isSprint();
    const isJump = this.input.isJump();

    // 0. Update SkyDome & Shop Beacons
    this.skyDome.update(timeSec);
    this.cityMap.updateShopMarkers(timeSec);

    // If main menu is visible, smooth cinematic orbit
    if (this.mainMenu.isMenuVisible()) {
      this.cameraYaw += dt * 0.12;
      this.updateCamera(dt);
      return;
    }

    // Multiplayer synchronization
    if (this.multiplayer.isInMultiplayer()) {
      this.multiplayer.broadcastPlayerState(
        this.player.getPosition(),
        this.player.isRidingVehicle && this.activeVehicle ? this.activeVehicle.mesh.rotation.y : this.player.mesh.rotation.y,
        this.player.isRidingVehicle,
        this.activeVehicle?.name,
        this.economy.getActiveOutfit(),
        this.streamSim.isStreaming()
      );
      this.multiplayer.update(dt, this.player.getPosition());
    }

    // Update Camera Orbit from Mouse input
    const { dx, dy, zoom } = this.input.getAndResetMouseDeltas();
    this.cameraYaw -= dx * 0.0035;
    const minPitch = this.isFirstPerson ? -1.35 : -0.75;
    const maxPitch = this.isFirstPerson ? 1.35 : 0.65;
    this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch - dy * 0.003, minPitch, maxPitch);
    this.cameraDistance = THREE.MathUtils.clamp(this.cameraDistance + zoom * 0.8, 3.2, 14.0);

    // 1. Vehicle Physics & Collision
    if (this.player.isRidingVehicle && this.activeVehicle) {
      this.activeVehicle.update(dt, forward, backward, left, right, handbrake);

      // GTA 5 Drift Tire Screech Audio
      if ((this.activeVehicle as any).isDrifting) {
        this.audio.startTireScreech();
      } else {
        this.audio.stopTireScreech();
      }

      // Resolve Vehicle Collision with buildings & obstacles
      const col = this.collisionSystem.resolveVehicleCollision(
        this.activeVehicle.mesh.position,
        this.activeVehicle.mesh.rotation.y,
        this.activeVehicle.halfWidth,
        this.activeVehicle.halfLength
      );
      if (col.collided) {
        // Dampen and bounce vehicle speed on collision
        if (this.activeVehicle.speed > 0) {
          this.activeVehicle.speed = Math.min(0, -this.activeVehicle.speed * 0.2);
        } else if (this.activeVehicle.speed < 0) {
          this.activeVehicle.speed = Math.max(0, -this.activeVehicle.speed * 0.2);
        }
      }

      // Smoothly align camera yaw behind moving vehicle if player isn't dragging mouse (in 3rd person)
      if (!this.isFirstPerson && Math.abs(dx) < 0.001) {
        const vehicleHeading = this.activeVehicle.mesh.rotation.y;
        let angleDiff = vehicleHeading - this.cameraYaw;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.cameraYaw += angleDiff * Math.min(1, dt * 3.5);
      }

      // Sound pitch update
      const speedRatio = Math.abs(this.activeVehicle.speed) / this.activeVehicle.stats.maxSpeed;
      this.audio.updateEnginePitch(speedRatio);

      // GTA 5 Dynamic Speed FOV & Speed Blur
      const targetFov = THREE.MathUtils.lerp(65, 78, Math.min(1, speedRatio * 1.15));
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 5);
      this.camera.updateProjectionMatrix();

      // Motion blur intensity
      this.postProcessing.setSpeedBlur(Math.max(0, (speedRatio - 0.35) * 1.4));

      // High-speed camera shake
      if (speedRatio > 0.65) {
        this.camera.position.x += (Math.random() - 0.5) * 0.035 * speedRatio;
        this.camera.position.y += (Math.random() - 0.5) * 0.035 * speedRatio;
      }

      // HUD Speedometer
      const kmh = this.activeVehicle.getSpeedKmh();
      this.hud.updateSpeed(kmh, this.activeVehicle.speed >= 0);
    } else {
      this.audio.stopTireScreech();
      this.postProcessing.setSpeedBlur(0.0);
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 65, dt * 5);
      this.camera.updateProjectionMatrix();

      // Player Walking relative to camera view
      this.player.update(dt, forward, backward, left, right, isSprint, isJump, this.cameraYaw);
      this.hud.updateStamina(this.player.stamina, this.player.maxStamina);

      // Resolve Player Collision with static obstacles (walls, pillars, fences)
      this.collisionSystem.resolvePlayerCollision(this.player.mesh.position, 0.45);
    }

    // Check GTA 5 Location Notification Zones
    this.checkLocationZones();

    // 2. Camera Follow & Orbit (First person or Third person)
    this.updateCamera(dt);

    // 3. Quest Beacon Rotation
    this.house.updateBeacon(timeSec);

    // 4. Update Quest & Tutorial Triggers
    this.checkTutorialTriggers();

    // 5. Update Interaction Prompts
    this.updatePrompts();

    // 6. MiniMap render
    const pPos = this.player.getPosition();
    const quest = this.tutorial.getCurrentQuest();
    const activeCarPos = this.currentCar?.getPosition();
    this.minimap.render(
      pPos,
      this.player.isRidingVehicle && this.activeVehicle ? this.activeVehicle.mesh.rotation.y : this.player.mesh.rotation.y,
      quest.targetCoords,
      activeCarPos
    );
  }

  private updateCamera(dt: number): void {
    const isVehicle = this.player.isRidingVehicle && this.activeVehicle !== null;
    const targetObj = isVehicle ? this.activeVehicle!.mesh : this.player.mesh;
    const targetPos = targetObj.position;

    if (this.isFirstPerson) {
      if (isVehicle && this.activeVehicle) {
        // --- First-Person Cockpit View (Inside Car or on Bike) ---
        const cockpitLocal = this.activeVehicle.cockpitOffset.clone();
        const cockpitWorld = cockpitLocal.applyEuler(this.activeVehicle.mesh.rotation).add(this.activeVehicle.mesh.position);

        this.camera.position.lerp(cockpitWorld, Math.min(1, dt * 25));

        const vehicleHeading = this.activeVehicle.mesh.rotation.y;
        const lookYaw = vehicleHeading + this.cameraYaw;
        const lookDir = new THREE.Vector3(
          -Math.sin(lookYaw) * Math.cos(this.cameraPitch),
          Math.sin(this.cameraPitch),
          -Math.cos(lookYaw) * Math.cos(this.cameraPitch)
        );

        this.camera.lookAt(cockpitWorld.clone().add(lookDir));
      } else {
        // --- First-Person On Foot View ---
        const isMoving = this.input.isForward() || this.input.isBackward() || this.input.isLeft() || this.input.isRight();
        const headBob = isMoving ? Math.sin(this.player.getWalkTime()) * 0.04 : 0;
        const eyePos = targetPos.clone().add(new THREE.Vector3(0, 1.62 + headBob, 0));

        this.camera.position.lerp(eyePos, Math.min(1, dt * 25));

        const lookDir = new THREE.Vector3(
          -Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
          Math.sin(this.cameraPitch),
          -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
        );

        this.camera.lookAt(eyePos.clone().add(lookDir));
      }
    } else {
      // --- Third-Person Orbit View ---
      const targetHeight = isVehicle ? 1.6 : 1.35;
      const dist = isVehicle ? Math.max(7.5, this.cameraDistance) : this.cameraDistance;

      const horizontalDist = dist * Math.cos(this.cameraPitch);
      // When pitch > 0 (looking up), camera drops lower. When pitch < 0 (looking down), camera elevates higher.
      const cameraElevation = -Math.sin(this.cameraPitch) * dist * 0.65 + 0.45;

      const desiredX = targetPos.x + Math.sin(this.cameraYaw) * horizontalDist;
      const desiredY = Math.max(0.6, targetPos.y + targetHeight + cameraElevation);
      const desiredZ = targetPos.z + Math.cos(this.cameraYaw) * horizontalDist;

      const desiredPos = new THREE.Vector3(desiredX, desiredY, desiredZ);
      this.camera.position.lerp(desiredPos, Math.min(1, dt * 10));

      const lookTargetY = targetPos.y + targetHeight + Math.sin(this.cameraPitch) * dist * 0.35;
      const lookTarget = targetPos.clone().add(new THREE.Vector3(0, lookTargetY - targetPos.y, 0));
      this.cameraTarget.lerp(lookTarget, Math.min(1, dt * 12));
      this.camera.lookAt(this.cameraTarget);
    }
  }

  private checkTutorialTriggers(): void {
    const step = this.tutorial.getCurrentStep();
    const playerPos = this.player.getPosition();

    // Step 2: Going to house
    if (step === 2) {
      const distToHouse = playerPos.distanceTo(this.house.entrancePos);
      if (distToHouse < 16) {
        this.tutorial.advanceStep(2);
      }
    }

    this.updateTutorialDisplay();
  }

  private updatePrompts(): void {
    const playerPos = this.player.getPosition();

    if (this.player.isRidingVehicle) {
      this.hud.showPrompt('E', 'Вийти з транспорту');
      return;
    }

    // Near bike?
    if (playerPos.distanceTo(this.bike.getPosition()) < 3.0) {
      this.hud.showPrompt('E', 'Сісти на байк');
      return;
    }

    // Near car?
    if (this.currentCar && playerPos.distanceTo(this.currentCar.getPosition()) < 3.8) {
      this.hud.showPrompt('E', `Сісти в ${this.currentCar.name}`);
      return;
    }

    // Near streamer desk?
    if (playerPos.distanceTo(this.house.deskPos) < 3.2) {
      if (!this.economy.getActivePc()) {
        this.hud.showPrompt('P', 'Відкрий телефон та купи Old Comp');
      } else if (!this.streamSim.isStreaming()) {
        this.hud.showPrompt('E', 'Сісти за стіл та розпочати стрім');
      } else {
        this.hud.showPrompt('P', 'Відкрити панель стріму');
      }
      return;
    }

    // Near any shop entrance?
    for (const shop of this.cityMap.shopZones) {
      if (playerPos.distanceTo(shop.pos) < 3.8) {
        this.hud.showPrompt('E', `Зайти в ${shop.name}`);
        return;
      }
    }

    this.hud.hidePrompt();
  }

  private checkLocationZones(): void {
    const pos = this.player.getPosition();
    let zone = '';

    if (pos.z > 35 && Math.abs(pos.x) < 35) {
      zone = 'АЗС «ОККО» / GAS STATION';
    } else if (pos.x > 50 && pos.z < -40 && pos.z > -65) {
      zone = 'СУПЕРМАРКЕТ «СІЛЬПО 24/7»';
    } else if (pos.x > 50 && pos.z <= -65) {
      zone = 'СТО ТЮНІНГ «WEST COAST»';
    } else if (pos.x >= 20 && pos.x <= 50 && pos.z <= -75) {
      zone = 'ROZETKA TECH / ДЕВАЙСИ';
    } else if (pos.x < -15 && pos.x > -40 && pos.z < -25 && pos.z > -45) {
      zone = 'DRIP STORE / БУТІК ОДЯГУ';
    } else if (Math.abs(pos.z + 30) < 18) {
      zone = 'БУЛЬВАР ВЕЙНВУД / LOS SANTOS BLVD';
    } else if (pos.x < -35 && pos.z < -60) {
      zone = 'МАЄТОК СТРІМЕРА / STREAMER RESIDENCE';
    } else if (pos.x > 20 && pos.z < -40) {
      zone = 'ТОРГОВИЙ КВАРТАЛ / COMMERCIAL DISTRICT';
    } else if (pos.x < 0 && pos.z > 0 && pos.z < 45) {
      zone = 'МІСЬКИЙ ПАРК / CENTRAL PARK';
    }

    if (zone) {
      this.hud.showLocationBanner(zone);
    }
  }

  private render(): void {
    this.postProcessing.render();
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.postProcessing.setSize(window.innerWidth, window.innerHeight);
  }
}
