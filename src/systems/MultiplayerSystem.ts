import * as THREE from 'three';
import { LobbyRoom, MultiplayerPeerState, UserAccount } from '../types';

export class MultiplayerSystem {
  private currentLobby: LobbyRoom | null = null;
  private currentUser: UserAccount;
  private channel: BroadcastChannel | null = null;
  private peers: Map<string, { state: MultiplayerPeerState; mesh?: THREE.Group; nameplate?: THREE.Sprite }> = new Map();
  private scene: THREE.Scene | null = null;

  private onPeersChangeCallbacks: Array<(peers: MultiplayerPeerState[]) => void> = [];
  private onChatCallbacks: Array<(sender: string, text: string) => void> = [];
  private onLobbyStateCallbacks: Array<(lobby: LobbyRoom | null) => void> = [];

  // Bot friend for single-instance multiplayer demonstration
  private botFriend: {
    state: MultiplayerPeerState;
    targetX: number;
    targetZ: number;
    speed: number;
  } | null = null;

  constructor(currentUser: UserAccount) {
    this.currentUser = currentUser;
    this.initBroadcastChannel();
    this.initDefaultLobbies();
  }

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  public setCurrentUser(user: UserAccount): void {
    this.currentUser = user;
  }

  private initBroadcastChannel(): void {
    try {
      this.channel = new BroadcastChannel('streamer_sim_multiplayer');
      this.channel.onmessage = (event) => {
        this.handleNetworkMessage(event.data);
      };
    } catch {
      // BroadcastChannel not available in rare environments
    }
  }

  private initDefaultLobbies(): void {
    const existing = this.getAllLobbies();
    if (existing.length === 0) {
      const defaultLobbies: LobbyRoom[] = [
        {
          id: 'room_pub_1',
          name: '🎮 Стрім-Паті Київ (UA)',
          hostName: 'Kozak_Patriot',
          hostEmail: 'kozak@streamer.ua',
          isPrivate: false,
          maxPlayers: 4,
          currentPlayers: 2,
          createdAt: Date.now() - 360000,
          status: 'in_game'
        },
        {
          id: 'room_pub_2',
          name: '🏎️ Дрифт на Ланосах по Бульвару',
          hostName: 'Sasha_Drift',
          hostEmail: 'drift_sasha@streamer.ua',
          isPrivate: false,
          maxPlayers: 4,
          currentPlayers: 1,
          createdAt: Date.now() - 120000,
          status: 'waiting'
        },
        {
          id: 'room_priv_1',
          name: '🔒 Закрите VIP Лобі (Тільки друзі)',
          hostName: 'Oksana_Queen',
          hostEmail: 'oksana@gmail.com',
          isPrivate: true,
          password: '123',
          maxPlayers: 2,
          currentPlayers: 1,
          createdAt: Date.now() - 60000,
          status: 'waiting'
        }
      ];
      localStorage.setItem('streamer_sim_lobbies', JSON.stringify(defaultLobbies));
    }
  }

  public getAllLobbies(): LobbyRoom[] {
    try {
      const data = localStorage.getItem('streamer_sim_lobbies');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getPublicLobbies(): LobbyRoom[] {
    return this.getAllLobbies().filter((l) => !l.isPrivate);
  }

  public createLobby(name: string, isPrivate: boolean, password?: string, maxPlayers: number = 4): LobbyRoom {
    const newLobby: LobbyRoom = {
      id: 'lobby_' + Math.random().toString(36).substring(2, 8),
      name: name.trim() || `Лобі гравця ${this.currentUser.name}`,
      hostName: this.currentUser.name,
      hostEmail: this.currentUser.email,
      isPrivate,
      password: isPrivate ? (password || '1234') : undefined,
      maxPlayers,
      currentPlayers: 1,
      createdAt: Date.now(),
      status: 'in_game'
    };

    const lobbies = this.getAllLobbies();
    lobbies.unshift(newLobby);
    localStorage.setItem('streamer_sim_lobbies', JSON.stringify(lobbies));

    this.currentLobby = newLobby;
    this.broadcastMessage({ type: 'lobby_created', lobby: newLobby });
    this.notifyLobbyState();

    // Spawn companion friend if alone
    this.setupBotFriend();

    return newLobby;
  }

  public joinLobby(lobbyId: string, passwordAttempt?: string): { success: boolean; error?: string; lobby?: LobbyRoom } {
    const lobbies = this.getAllLobbies();
    const lobby = lobbies.find((l) => l.id === lobbyId);

    if (!lobby) {
      return { success: false, error: 'Лобі не знайдено!' };
    }

    if (lobby.isPrivate) {
      if (!passwordAttempt || passwordAttempt.trim() !== lobby.password) {
        return { success: false, error: 'Невірний пароль від кімнати!' };
      }
    }

    if (lobby.currentPlayers >= lobby.maxPlayers) {
      return { success: false, error: 'Кімната заповнена!' };
    }

    lobby.currentPlayers = Math.min(lobby.maxPlayers, lobby.currentPlayers + 1);
    localStorage.setItem('streamer_sim_lobbies', JSON.stringify(lobbies));

    this.currentLobby = lobby;
    this.broadcastMessage({ type: 'player_joined', lobbyId: lobby.id, user: this.currentUser });
    this.notifyLobbyState();

    this.setupBotFriend();

    return { success: true, lobby };
  }

  public leaveLobby(): void {
    if (!this.currentLobby) return;
    const lobbies = this.getAllLobbies();
    const found = lobbies.find((l) => l.id === this.currentLobby?.id);
    if (found) {
      found.currentPlayers = Math.max(0, found.currentPlayers - 1);
      if (found.currentPlayers <= 0 && found.id.startsWith('lobby_')) {
        // remove custom empty lobby
        const filtered = lobbies.filter((l) => l.id !== found.id);
        localStorage.setItem('streamer_sim_lobbies', JSON.stringify(filtered));
      } else {
        localStorage.setItem('streamer_sim_lobbies', JSON.stringify(lobbies));
      }
    }

    this.broadcastMessage({ type: 'player_left', userId: this.currentUser.id });
    this.removePeers();
    this.currentLobby = null;
    this.botFriend = null;
    this.notifyLobbyState();
  }

  public getCurrentLobby(): LobbyRoom | null {
    return this.currentLobby;
  }

  public isInMultiplayer(): boolean {
    return this.currentLobby !== null;
  }

  // Real-time peer movement broadcast
  public broadcastPlayerState(
    pos: THREE.Vector3,
    rotY: number,
    isRidingVehicle: boolean,
    vehicleId?: string,
    outfitId?: string,
    isStreaming?: boolean
  ): void {
    if (!this.currentLobby) return;

    const myState: MultiplayerPeerState = {
      id: this.currentUser.id,
      name: this.currentUser.name,
      email: this.currentUser.email,
      isDev: this.currentUser.isDev,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      rotY,
      isRidingVehicle,
      vehicleId,
      outfitId,
      isStreaming: isStreaming || false,
      lastSeen: Date.now()
    };

    this.broadcastMessage({
      type: 'player_state',
      lobbyId: this.currentLobby.id,
      state: myState
    });
  }

  public sendChatMessage(text: string): void {
    if (!this.currentLobby || !text.trim()) return;
    const cleanText = text.trim();
    this.broadcastMessage({
      type: 'chat_message',
      lobbyId: this.currentLobby.id,
      sender: this.currentUser.name,
      text: cleanText
    });
    this.notifyChat(this.currentUser.name, cleanText);
  }

  private broadcastMessage(payload: any): void {
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch {}
    }
  }

  private handleNetworkMessage(data: any): void {
    if (!data || !this.currentLobby) return;

    if (data.type === 'player_state' && data.lobbyId === this.currentLobby.id) {
      const state: MultiplayerPeerState = data.state;
      if (state.id === this.currentUser.id) return; // ignore self
      this.updatePeer(state);
    } else if (data.type === 'chat_message' && data.lobbyId === this.currentLobby.id) {
      this.notifyChat(data.sender, data.text);
    } else if (data.type === 'player_left') {
      this.removePeer(data.userId);
    }
  }

  private updatePeer(state: MultiplayerPeerState): void {
    let peer = this.peers.get(state.id);
    if (!peer) {
      peer = { state };
      if (this.scene) {
        peer.mesh = this.createPeerMesh(state);
        this.scene.add(peer.mesh);
      }
      this.peers.set(state.id, peer);
      this.notifyPeers();
    }

    peer.state = state;
    if (peer.mesh) {
      peer.mesh.position.set(state.x, state.y, state.z);
      peer.mesh.rotation.y = state.rotY;
    }
  }

  private createPeerMesh(state: MultiplayerPeerState): THREE.Group {
    const group = new THREE.Group();
    group.position.set(state.x, state.y, state.z);

    // Friend body
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.3, 10);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: state.isDev ? 0xf59e0b : 0x3b82f6,
      roughness: 0.5
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.24, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.6;
    head.castShadow = true;
    group.add(head);

    // 3D Nameplate Sprite overhead
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect ? ctx.roundRect(4, 4, 248, 56, 12) : ctx.fillRect(4, 4, 248, 56);
    ctx.fill();
    ctx.strokeStyle = state.isDev ? '#fbbf24' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = state.isDev ? '#fbbf24' : '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.isDev ? `👑 ${state.name}` : `👤 ${state.name}`, 128, 38);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.y = 2.2;
    sprite.scale.set(2.4, 0.6, 1);
    group.add(sprite);

    return group;
  }

  private removePeer(id: string): void {
    const peer = this.peers.get(id);
    if (peer && peer.mesh && this.scene) {
      this.scene.remove(peer.mesh);
    }
    this.peers.delete(id);
    this.notifyPeers();
  }

  private removePeers(): void {
    if (this.scene) {
      this.peers.forEach((peer) => {
        if (peer.mesh) this.scene!.remove(peer.mesh);
      });
    }
    this.peers.clear();
    this.notifyPeers();
  }

  // Setup simulated friend inside room
  private setupBotFriend(): void {
    if (this.botFriend) return;
    this.botFriend = {
      state: {
        id: 'bot_friend_taras',
        name: 'Друг Тарас [Стрімер]',
        email: 'taras_bro@gmail.com',
        isDev: false,
        x: 4,
        y: 0,
        z: 60,
        rotY: 0,
        isRidingVehicle: false,
        isStreaming: true,
        lastSeen: Date.now()
      },
      targetX: 8,
      targetZ: 40,
      speed: 3.5
    };

    this.updatePeer(this.botFriend.state);
  }

  public update(dt: number, playerPos: THREE.Vector3): void {
    if (!this.currentLobby) return;

    // Update bot friend movement in multiplayer
    if (this.botFriend) {
      const dx = playerPos.x + 2.5 - this.botFriend.state.x;
      const dz = playerPos.z + 2.5 - this.botFriend.state.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 3.0) {
        const moveDist = Math.min(dist, this.botFriend.speed * dt);
        this.botFriend.state.x += (dx / dist) * moveDist;
        this.botFriend.state.z += (dz / dist) * moveDist;
        this.botFriend.state.rotY = Math.atan2(dx, dz);
        this.updatePeer(this.botFriend.state);
      }
    }
  }

  public onPeersChange(cb: (peers: MultiplayerPeerState[]) => void): void {
    this.onPeersChangeCallbacks.push(cb);
  }

  public onChat(cb: (sender: string, text: string) => void): void {
    this.onChatCallbacks.push(cb);
  }

  public onLobbyStateChange(cb: (lobby: LobbyRoom | null) => void): void {
    this.onLobbyStateCallbacks.push(cb);
  }

  private notifyPeers(): void {
    const list = Array.from(this.peers.values()).map((p) => p.state);
    this.onPeersChangeCallbacks.forEach((cb) => cb(list));
  }

  private notifyChat(sender: string, text: string): void {
    this.onChatCallbacks.forEach((cb) => cb(sender, text));
  }

  private notifyLobbyState(): void {
    this.onLobbyStateCallbacks.forEach((cb) => cb(this.currentLobby));
  }
}
