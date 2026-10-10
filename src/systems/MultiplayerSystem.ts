import * as THREE from 'three';
import { Peer, DataConnection, MediaConnection } from 'peerjs';
import { LobbyRoom, MultiplayerPeerState, UserAccount } from '../types';

export class MultiplayerSystem {
  public readonly sessionId: string = 'p_' + Math.random().toString(36).substring(2, 9);
  private currentLobby: LobbyRoom | null = null;
  private currentUser: UserAccount;
  private channel: BroadcastChannel | null = null;
  private peers: Map<string, { state: MultiplayerPeerState; mesh?: THREE.Group; targetPos: THREE.Vector3; targetRotY: number; nameplateCanvas?: HTMLCanvasElement; nameplateTexture?: THREE.CanvasTexture }> = new Map();
  private scene: THREE.Scene | null = null;

  // WebRTC PeerJS
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private mediaCalls: Map<string, MediaConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private isHost: boolean = false;
  private processedMsgIds: Set<string> = new Set();

  // Voice Chat (Push-to-Talk on [X])
  private localAudioStream: MediaStream | null = null;
  private isTalking: boolean = false;
  private onVoiceStatusChangeCallbacks: Array<(isTalking: boolean) => void> = [];

  private onPeersChangeCallbacks: Array<(peers: MultiplayerPeerState[]) => void> = [];
  private onChatCallbacks: Array<(sender: string, text: string) => void> = [];
  private onLobbyStateCallbacks: Array<(lobby: LobbyRoom | null) => void> = [];
  private onLobbiesChangeCallbacks: Array<(lobbies: LobbyRoom[]) => void> = [];

  // Bot companion friend for solo testing
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
    this.initStorageListener();
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
      // Ignored
    }
  }

  private initStorageListener(): void {
    window.addEventListener('storage', (e) => {
      if (e.key === 'streamer_sim_lobbies') {
        this.notifyLobbiesChange();
      }
    });
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
          currentPlayers: 1,
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

  // ==================== LOBBY MANAGEMENT ====================
  public createLobby(name: string, isPrivate: boolean, password?: string, maxPlayers: number = 4): LobbyRoom {
    const cleanName = name.trim() || `Лобі гравця ${this.currentUser.name}`;
    const cleanId = 'room_' + Math.random().toString(36).substring(2, 7);

    const newLobby: LobbyRoom = {
      id: cleanId,
      name: cleanName,
      hostName: this.currentUser.name,
      hostEmail: this.currentUser.email,
      isPrivate,
      password: isPrivate ? (password || '1234').trim() : undefined,
      maxPlayers,
      currentPlayers: 1,
      createdAt: Date.now(),
      status: 'in_game'
    };

    const lobbies = this.getAllLobbies();
    lobbies.unshift(newLobby);
    localStorage.setItem('streamer_sim_lobbies', JSON.stringify(lobbies));

    this.currentLobby = newLobby;
    this.isHost = true;

    // Start WebRTC Peer as Host
    this.startPeerAsHost(newLobby.id);

    // Broadcast creation
    this.broadcastMessage({ type: 'lobby_created', lobby: newLobby });
    this.notifyLobbyState();
    this.notifyLobbiesChange();

    // Spawn companion friend if alone so host sees another player
    this.setupBotFriend();

    // Init voice chat mic silently in background
    this.initVoiceChat().catch(() => {});

    return newLobby;
  }

  public joinLobby(lobbyQuery: string, passwordAttempt?: string): { success: boolean; error?: string; lobby?: LobbyRoom } {
    const query = lobbyQuery.trim().toLowerCase();
    const lobbies = this.getAllLobbies();
    
    // Find by exact ID, or normalized ID, or name match
    const lobby = lobbies.find((l) => 
      l.id.toLowerCase() === query || 
      l.name.toLowerCase().includes(query) ||
      l.id.replace('room_', '').toLowerCase() === query
    );

    if (!lobby) {
      return { success: false, error: 'Кімнату не знайдено! Перевірте ID або назву.' };
    }

    if (lobby.isPrivate) {
      const attempt = (passwordAttempt || '').trim();
      if (!attempt || attempt !== lobby.password) {
        return { success: false, error: 'Невірний пароль від кімнати!' };
      }
    }

    if (lobby.currentPlayers >= lobby.maxPlayers) {
      return { success: false, error: 'Кімната вже заповнена гравцями!' };
    }

    lobby.currentPlayers = Math.min(lobby.maxPlayers, lobby.currentPlayers + 1);
    localStorage.setItem('streamer_sim_lobbies', JSON.stringify(lobbies));

    this.currentLobby = lobby;
    this.isHost = false;

    // Connect via WebRTC to Host
    this.startPeerAsClient(lobby.id);

    // Broadcast join to cross-tab & WebRTC
    this.broadcastMessage({ 
      type: 'player_joined', 
      lobbyId: lobby.id, 
      user: this.currentUser,
      sessionId: this.sessionId 
    });

    this.notifyLobbyState();
    this.notifyLobbiesChange();

    // Companion friend will welcome you if alone
    this.setupBotFriend();

    // Init voice chat mic silently in background
    this.initVoiceChat().catch(() => {});

    return { success: true, lobby };
  }

  public leaveLobby(): void {
    if (!this.currentLobby) return;

    const lobbies = this.getAllLobbies();
    const found = lobbies.find((l) => l.id === this.currentLobby?.id);
    if (found) {
      found.currentPlayers = Math.max(0, found.currentPlayers - 1);
      if (found.currentPlayers <= 0 && found.id.startsWith('room_') && found.id !== 'room_pub_1' && found.id !== 'room_pub_2') {
        const filtered = lobbies.filter((l) => l.id !== found.id);
        localStorage.setItem('streamer_sim_lobbies', JSON.stringify(filtered));
      } else {
        localStorage.setItem('streamer_sim_lobbies', JSON.stringify(lobbies));
      }
    }

    this.broadcastMessage({ type: 'player_left', userId: this.sessionId, lobbyId: this.currentLobby.id });
    
    // Disconnect WebRTC
    this.disconnectPeer();

    this.removePeers();
    this.currentLobby = null;
    this.botFriend = null;
    this.isHost = false;

    this.notifyLobbyState();
    this.notifyLobbiesChange();
  }

  public getCurrentLobby(): LobbyRoom | null {
    return this.currentLobby;
  }

  public isInMultiplayer(): boolean {
    return this.currentLobby !== null;
  }

  // ==================== VOICE CHAT (PUSH-TO-TALK ON [X]) ====================
  public async initVoiceChat(): Promise<boolean> {
    if (this.localAudioStream) return true;
    try {
      this.localAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      // Muted by default: audio only transmits when [X] is held down
      this.localAudioStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });

      // If active connections exist, call peers with voice stream
      if (this.peer) {
        if (this.isHost) {
          this.connections.forEach((_conn, peerId) => {
            this.callPeerAudio(peerId);
          });
        } else if (this.hostConnection) {
          const hostPeerId = this.hostConnection.peer;
          this.callPeerAudio(hostPeerId);
        }
      }

      return true;
    } catch {
      // Microphone not available or permission denied
      return false;
    }
  }

  public async startVoiceTransmission(): Promise<void> {
    this.isTalking = true;

    if (!this.localAudioStream) {
      await this.initVoiceChat();
    }

    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    }

    // Broadcast talking packet so nameplate glows
    this.broadcastMessage({
      type: 'voice_talking',
      lobbyId: this.currentLobby?.id,
      sessionId: this.sessionId,
      isTalking: true
    });

    this.onVoiceStatusChangeCallbacks.forEach((cb) => cb(true));
  }

  public stopVoiceTransmission(): void {
    this.isTalking = false;

    if (this.localAudioStream) {
      this.localAudioStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }

    // Broadcast talking stopped
    this.broadcastMessage({
      type: 'voice_talking',
      lobbyId: this.currentLobby?.id,
      sessionId: this.sessionId,
      isTalking: false
    });

    this.onVoiceStatusChangeCallbacks.forEach((cb) => cb(false));
  }

  public onVoiceStatusChange(cb: (isTalking: boolean) => void): void {
    this.onVoiceStatusChangeCallbacks.push(cb);
  }

  private callPeerAudio(remotePeerId: string): void {
    if (!this.peer || !this.localAudioStream) return;
    try {
      if (this.mediaCalls.has(remotePeerId)) return;

      const call = this.peer.call(remotePeerId, this.localAudioStream);
      if (!call) return;

      this.mediaCalls.set(remotePeerId, call);

      call.on('stream', (remoteStream) => {
        this.playRemoteAudio(remotePeerId, remoteStream);
      });

      call.on('close', () => {
        this.mediaCalls.delete(remotePeerId);
      });

      call.on('error', () => {
        this.mediaCalls.delete(remotePeerId);
      });
    } catch {
      // Ignored
    }
  }

  private playRemoteAudio(peerId: string, remoteStream: MediaStream): void {
    const cleanId = peerId.replace(/[^a-zA-Z0-9_-]/g, '_');
    let audio = document.getElementById('audio_peer_' + cleanId) as HTMLAudioElement;
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'audio_peer_' + cleanId;
      audio.autoplay = true;
      audio.setAttribute('playsinline', 'true');
      audio.style.display = 'none';
      document.body.appendChild(audio);
    }
    audio.srcObject = remoteStream;
    audio.play().catch(() => {});
  }

  // ==================== WEBRTC (PEERJS) ENGINE ====================
  private getPeerRoomId(lobbyId: string): string {
    return 'ss2_' + lobbyId.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  private startPeerAsHost(lobbyId: string): void {
    try {
      this.disconnectPeer();
      const hostPeerId = this.getPeerRoomId(lobbyId);

      this.peer = new Peer(hostPeerId, { debug: 0 });

      // Incoming Data Connections
      this.peer.on('connection', (conn) => {
        this.connections.set(conn.peer, conn);

        conn.on('data', (data) => {
          this.handleNetworkMessage(data);
          // Host relays to all other connected clients
          this.connections.forEach((otherConn, otherId) => {
            if (otherId !== conn.peer && otherConn.open) {
              try { otherConn.send(data); } catch {}
            }
          });
        });

        conn.on('close', () => {
          this.connections.delete(conn.peer);
        });

        conn.on('error', () => {
          this.connections.delete(conn.peer);
        });

        // Call client for voice chat
        if (this.localAudioStream) {
          this.callPeerAudio(conn.peer);
        }
      });

      // Incoming Voice Calls
      this.peer.on('call', async (call) => {
        if (!this.localAudioStream) {
          await this.initVoiceChat();
        }
        call.answer(this.localAudioStream || undefined);
        this.mediaCalls.set(call.peer, call);

        call.on('stream', (remoteStream) => {
          this.playRemoteAudio(call.peer, remoteStream);
        });

        call.on('close', () => {
          this.mediaCalls.delete(call.peer);
        });
      });

      this.peer.on('error', () => {
        // Fallback gracefully
      });
    } catch {
      // Ignored
    }
  }

  private startPeerAsClient(lobbyId: string): void {
    try {
      this.disconnectPeer();
      const myPeerId = 'ss2_client_' + this.sessionId;
      const hostPeerId = this.getPeerRoomId(lobbyId);

      this.peer = new Peer(myPeerId, { debug: 0 });

      // Incoming Voice Calls from Host
      this.peer.on('call', async (call) => {
        if (!this.localAudioStream) {
          await this.initVoiceChat();
        }
        call.answer(this.localAudioStream || undefined);
        this.mediaCalls.set(call.peer, call);

        call.on('stream', (remoteStream) => {
          this.playRemoteAudio(call.peer, remoteStream);
        });

        call.on('close', () => {
          this.mediaCalls.delete(call.peer);
        });
      });

      this.peer.on('open', () => {
        const conn = this.peer!.connect(hostPeerId, { reliable: true });
        this.hostConnection = conn;

        conn.on('open', () => {
          conn.send({
            type: 'player_joined',
            lobbyId,
            user: this.currentUser,
            sessionId: this.sessionId
          });

          // Connect voice call to host
          if (this.localAudioStream) {
            this.callPeerAudio(hostPeerId);
          }
        });

        conn.on('data', (data) => {
          this.handleNetworkMessage(data);
        });

        conn.on('close', () => {
          this.hostConnection = null;
        });

        conn.on('error', () => {
          this.hostConnection = null;
        });
      });

      this.peer.on('error', () => {
        // Fallback to BroadcastChannel
      });
    } catch {
      // Ignored
    }
  }

  private disconnectPeer(): void {
    if (this.hostConnection) {
      try { this.hostConnection.close(); } catch {}
      this.hostConnection = null;
    }
    this.connections.forEach((conn) => {
      try { conn.close(); } catch {}
    });
    this.connections.clear();

    this.mediaCalls.forEach((call) => {
      try { call.close(); } catch {}
    });
    this.mediaCalls.clear();

    if (this.peer) {
      try { this.peer.destroy(); } catch {}
      this.peer = null;
    }
  }

  // ==================== REALTIME PACKET HANDLING ====================
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
      id: this.sessionId, // Unique session ID so tabs never ignore each other!
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
      isTalking: this.isTalking,
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
      text: cleanText,
      sessionId: this.sessionId
    });
    this.notifyChat(this.currentUser.name, cleanText);
  }

  private broadcastMessage(payload: any): void {
    payload.msgId = payload.msgId || (this.sessionId + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));

    // 1. Cross-tab BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch {}
    }

    // 2. WebRTC PeerJS
    if (this.isHost) {
      this.connections.forEach((conn) => {
        if (conn.open) {
          try { conn.send(payload); } catch {}
        }
      });
    } else if (this.hostConnection && this.hostConnection.open) {
      try {
        this.hostConnection.send(payload);
      } catch {}
    }
  }

  private handleNetworkMessage(data: any): void {
    if (!data) return;

    // Deduplicate packets
    if (data.msgId) {
      if (this.processedMsgIds.has(data.msgId)) return;
      this.processedMsgIds.add(data.msgId);
      if (this.processedMsgIds.size > 200) {
        this.processedMsgIds.clear();
      }
    }

    // Always update lobbies discovery, even before joining!
    if (data.type === 'lobby_created' || data.type === 'lobby_updated') {
      this.notifyLobbiesChange();
    }

    if (!this.currentLobby) return;

    // Only accept messages for this lobby
    if (data.lobbyId && data.lobbyId !== this.currentLobby.id) return;

    if (data.type === 'player_state') {
      const state: MultiplayerPeerState = data.state;
      // IGNORE SELF BY SESSION ID (Tab 1 and Tab 2 have different sessionIds!)
      if (state.id === this.sessionId) return;

      // Real player joined -> hide bot companion
      if (this.botFriend && state.id !== this.botFriend.state.id) {
        this.removePeer(this.botFriend.state.id);
        this.botFriend = null;
      }

      this.updatePeer(state);
    } else if (data.type === 'voice_talking') {
      if (data.sessionId !== this.sessionId) {
        const peer = this.peers.get(data.sessionId);
        if (peer) {
          peer.state.isTalking = !!data.isTalking;
          this.updatePeerNameplate(peer);
        }
      }
    } else if (data.type === 'player_joined') {
      if (data.sessionId !== this.sessionId) {
        if (this.botFriend) {
          this.removePeer(this.botFriend.state.id);
          this.botFriend = null;
        }
        // Connect audio call to joining player
        if (this.localAudioStream && this.peer) {
          const peerTargetId = 'ss2_client_' + data.sessionId;
          this.callPeerAudio(peerTargetId);
        }
      }
    } else if (data.type === 'chat_message') {
      if (data.sessionId !== this.sessionId) {
        this.notifyChat(data.sender, data.text);
      }
    } else if (data.type === 'player_left') {
      if (data.userId && data.userId !== this.sessionId) {
        this.removePeer(data.userId);
      }
    }
  }

  // ==================== 3D RENDERING PEERS ====================
  private updatePeer(state: MultiplayerPeerState): void {
    let peer = this.peers.get(state.id);
    if (!peer) {
      peer = { 
        state, 
        targetPos: new THREE.Vector3(state.x, state.y, state.z), 
        targetRotY: state.rotY 
      };
      if (this.scene) {
        peer.mesh = this.createPeerMesh(peer);
        this.scene.add(peer.mesh);
      }
      this.peers.set(state.id, peer);
      this.notifyPeers();
    }

    const wasTalking = peer.state.isTalking;
    peer.state = state;
    peer.targetPos.set(state.x, state.y, state.z);
    peer.targetRotY = state.rotY;

    if (wasTalking !== state.isTalking) {
      this.updatePeerNameplate(peer);
    }

    // Vehicle visibility toggle
    if (peer.mesh) {
      const vehicleMesh = peer.mesh.getObjectByName('peer_vehicle_chassis');
      if (vehicleMesh) {
        vehicleMesh.visible = !!state.isRidingVehicle;
      }
    }
  }

  private updatePeerNameplate(peer: { state: MultiplayerPeerState; nameplateCanvas?: HTMLCanvasElement; nameplateTexture?: THREE.CanvasTexture }): void {
    if (!peer.nameplateCanvas || !peer.nameplateTexture) return;
    this.drawNameplateOnCanvas(peer.nameplateCanvas, peer.state.name, !!peer.state.isTalking);
    peer.nameplateTexture.needsUpdate = true;
  }

  private drawNameplateOnCanvas(canvas: HTMLCanvasElement, name: string, isTalking: boolean): void {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = isTalking ? 'rgba(6, 78, 59, 0.95)' : 'rgba(15, 23, 42, 0.88)';
    if (ctx.roundRect) {
      ctx.roundRect(6, 6, canvas.width - 12, canvas.height - 12, 14);
    } else {
      ctx.fillRect(6, 6, canvas.width - 12, canvas.height - 12);
    }
    ctx.fill();

    ctx.strokeStyle = isTalking ? '#10b981' : '#38bdf8';
    ctx.lineWidth = isTalking ? 4 : 3;
    ctx.stroke();

    if (isTalking) {
      // Talking icon and pulsating text
      ctx.font = '24px sans-serif';
      ctx.fillText('🎙️', 16, 44);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${name} [ГОВОРИТЬ...]`, 52, 42);
    } else {
      // Normal online dot
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(32, 36, 8, 0, Math.PI * 2);
      ctx.fill();

      // Name text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(name, 50, 42);
    }
  }

  private createPeerMesh(peerItem: { state: MultiplayerPeerState; nameplateCanvas?: HTMLCanvasElement; nameplateTexture?: THREE.CanvasTexture }): THREE.Group {
    const state = peerItem.state;
    const group = new THREE.Group();
    group.position.set(state.x, state.y, state.z);

    // 1. Character Torso / Jacket
    const torsoGeo = new THREE.CylinderGeometry(0.32, 0.36, 1.15, 12);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.45
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    group.add(torso);

    // 2. Head
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.68;
    head.castShadow = true;
    group.add(head);

    // 3. Cap / Headphones
    const capGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.12, 14);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 1.82;
    group.add(cap);

    // Streamer Headphones earcups
    const cupGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 8);
    const cupMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
    const leftCup = new THREE.Mesh(cupGeo, cupMat);
    leftCup.rotation.z = Math.PI / 2;
    leftCup.position.set(0.26, 1.68, 0);
    group.add(leftCup);
    const rightCup = leftCup.clone();
    rightCup.position.set(-0.26, 1.68, 0);
    group.add(rightCup);

    // 4. Vehicle Chassis (visible when isRidingVehicle = true)
    const vehGroup = new THREE.Group();
    vehGroup.name = 'peer_vehicle_chassis';
    vehGroup.visible = !!state.isRidingVehicle;

    const bikeBodyGeo = new THREE.BoxGeometry(0.65, 0.5, 1.9);
    const bikeBodyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.4 });
    const bikeBody = new THREE.Mesh(bikeBodyGeo, bikeBodyMat);
    bikeBody.position.y = 0.4;
    vehGroup.add(bikeBody);

    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const frontW = new THREE.Mesh(wheelGeo, wheelMat);
    frontW.rotation.z = Math.PI / 2;
    frontW.position.set(0, 0.3, 0.8);
    vehGroup.add(frontW);
    const rearW = frontW.clone();
    rearW.position.set(0, 0.3, -0.8);
    vehGroup.add(rearW);

    group.add(vehGroup);

    // 5. Overhead 3D Nameplate Sprite with Dynamic Talking Status
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 72;
    peerItem.nameplateCanvas = canvas;
    this.drawNameplateOnCanvas(canvas, state.name, !!state.isTalking);

    const texture = new THREE.CanvasTexture(canvas);
    peerItem.nameplateTexture = texture;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.name = 'peer_nameplate_sprite';
    sprite.position.y = 2.35;
    sprite.scale.set(2.7, 0.65, 1);
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

  // Companion bot for solo exploration
  private setupBotFriend(): void {
    if (this.botFriend) return;
    this.botFriend = {
      state: {
        id: 'bot_taras',
        name: 'Друг Тарас [Стрімер]',
        email: 'taras@streamer.ua',
        isDev: false,
        x: 4.5,
        y: 0,
        z: 46,
        rotY: 0,
        isRidingVehicle: false,
        isStreaming: true,
        isTalking: false,
        lastSeen: Date.now()
      },
      targetX: 8,
      targetZ: 40,
      speed: 3.8
    };

    this.updatePeer(this.botFriend.state);
  }

  // Smooth lerp frame update for other players
  public update(dt: number, playerPos: THREE.Vector3): void {
    if (!this.currentLobby) return;

    // Smoothly interpolate real player meshes
    this.peers.forEach((peer) => {
      if (peer.mesh) {
        peer.mesh.position.lerp(peer.targetPos, Math.min(1, dt * 18));
        peer.mesh.rotation.y = THREE.MathUtils.lerp(peer.mesh.rotation.y, peer.targetRotY, Math.min(1, dt * 15));
      }
    });

    // Update bot friend if alone
    if (this.botFriend) {
      const dx = playerPos.x + 3.0 - this.botFriend.state.x;
      const dz = playerPos.z + 3.0 - this.botFriend.state.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 3.2) {
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

  public onLobbiesChange(cb: (lobbies: LobbyRoom[]) => void): void {
    this.onLobbiesChangeCallbacks.push(cb);
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

  private notifyLobbiesChange(): void {
    const lobbies = this.getAllLobbies();
    this.onLobbiesChangeCallbacks.forEach((cb) => cb(lobbies));
  }
}
