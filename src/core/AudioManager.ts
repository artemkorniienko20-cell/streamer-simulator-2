export class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
    const initAudio = () => {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextClass();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };

    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });
  }

  private ensureContext(): boolean {
    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextClass();
      } catch {
        return false;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return !this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.engineGain) {
      this.engineGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
    return !this.isMuted;
  }

  public playClick(): void {
    if (!this.ensureContext() || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playCashRegister(): void {
    if (!this.ensureContext() || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Chime 1
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Chime 2
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.51, now + 0.1); // E6
    gain2.gain.setValueAtTime(0.25, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.45);
  }

  public playDonation(): void {
    if (!this.ensureContext() || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Fanfare)

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
    });
  }

  public playHorn(): void {
    if (!this.ensureContext() || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(440, now); // A4
    osc2.frequency.setValueAtTime(349.23, now); // F4 (Two-tone horn)

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  public startEngine(): void {
    if (!this.ensureContext() || !this.ctx || this.isEngineRunning) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(40, this.ctx.currentTime); // Low idle rumble

      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.05, this.ctx.currentTime);

      // Low pass filter to make it sound muffled like a real engine
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch {
      // Ignored
    }
  }

  public updateEnginePitch(speedRatio: number): void {
    if (!this.ctx || !this.engineOsc || !this.engineGain || !this.isEngineRunning) return;
    if (this.isMuted) return;

    // speedRatio ranges from 0 to 1
    const baseFreq = 45;
    const maxFreq = 160;
    const targetFreq = baseFreq + (maxFreq - baseFreq) * Math.min(speedRatio, 1.2);

    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    const targetGain = 0.04 + 0.07 * Math.min(speedRatio, 1.0);
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
  }

  public stopEngine(): void {
    if (!this.engineOsc || !this.isEngineRunning) return;
    try {
      this.engineOsc.stop();
      this.engineOsc.disconnect();
    } catch {
      // Ignored
    }
    this.engineOsc = null;
    this.engineGain = null;
    this.isEngineRunning = false;
  }

  // ==================== GTA 5 DRIFT TIRE SCREECH ====================
  private tireNoiseNode: AudioBufferSourceNode | null = null;
  private tireGainNode: GainNode | null = null;
  private isTireScreeching: boolean = false;

  public startTireScreech(): void {
    if (!this.ensureContext() || !this.ctx || this.isTireScreeching) return;
    try {
      // Create white noise buffer for realistic tire friction
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.tireNoiseNode = this.ctx.createBufferSource();
      this.tireNoiseNode.buffer = noiseBuffer;
      this.tireNoiseNode.loop = true;

      // Bandpass filter to isolate high tire squeal frequencies (700Hz - 2200Hz)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1450, this.ctx.currentTime);
      filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      this.tireGainNode = this.ctx.createGain();
      this.tireGainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);

      this.tireNoiseNode.connect(filter);
      filter.connect(this.tireGainNode);
      this.tireGainNode.connect(this.ctx.destination);

      this.tireNoiseNode.start();
      this.isTireScreeching = true;
    } catch {
      // Ignored
    }
  }

  public stopTireScreech(): void {
    if (!this.tireNoiseNode || !this.isTireScreeching) return;
    try {
      this.tireNoiseNode.stop();
      this.tireNoiseNode.disconnect();
    } catch {
      // Ignored
    }
    this.tireNoiseNode = null;
    this.tireGainNode = null;
    this.isTireScreeching = false;
  }

  // ==================== GTA 5 RADIO STATIONS ====================
  private radioStationIndex: number = 0; // 0 = Off, 1 = Radio Los Santos, 2 = Nightride FM, 3 = SadSvit — Касета
  private radioTimer: number | null = null;
  private radioStep: number = 0;
  private readonly radioStations = [
    { id: 0, name: 'Радіо Вимкнено', genre: 'Mute' },
    { id: 1, name: '📻 SadSvit — Касета', genre: 'Ukrainian Post-Punk' },
    { id: 2, name: '📻 Radio Los Santos', genre: 'West Coast Beats' },
    { id: 3, name: '📻 Nightride FM', genre: '80s Synthwave' }
  ];

  public nextRadioStation(): { id: number; name: string } {
    this.radioStationIndex = (this.radioStationIndex + 1) % this.radioStations.length;
    this.applyRadioStation();
    return this.radioStations[this.radioStationIndex];
  }

  public getRadioStationName(): string {
    return this.radioStations[this.radioStationIndex].name;
  }

  public stopRadio(): void {
    if (this.radioTimer !== null) {
      clearInterval(this.radioTimer);
      this.radioTimer = null;
    }
  }

  private applyRadioStation(): void {
    this.stopRadio();
    if (!this.ensureContext() || !this.ctx || this.isMuted) return;

    if (this.radioStationIndex === 0) {
      return; // Off
    }

    this.radioStep = 0;
    let intervalMs = 125;
    if (this.radioStationIndex === 1) intervalMs = 125; // SadSvit — Касета (125 BPM post-punk)
    else if (this.radioStationIndex === 2) intervalMs = 280; // Radio Los Santos
    else if (this.radioStationIndex === 3) intervalMs = 180; // Nightride FM

    this.radioTimer = window.setInterval(() => {
      this.tickRadioBeat();
    }, intervalMs);
  }

  private tickRadioBeat(): void {
    if (!this.ctx || this.isMuted || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    const step = this.radioStep % 16;
    this.radioStep++;

    if (this.radioStationIndex === 1) {
      // --- SadSvit — Касета: Ukrainian Post-Punk / Synthwave ---
      const totalSteps = 64;
      const curStep = (this.radioStep - 1) % totalSteps;
      const bar = Math.floor(curStep / 16); // 0: Dm, 1: Bb, 2: F, 3: C
      const stepInBar = curStep % 16;

      // 1. Post-Punk Drum Machine (Four-on-the-floor + punchy snare + hi-hat)
      if (stepInBar % 4 === 0) {
        this.playDrumKick(now);
      }
      if (stepInBar === 4 || stepInBar === 12) {
        this.playDrumSnare(now);
      }
      if (stepInBar % 2 === 0) {
        this.playDrumHiHat(now);
      }

      // 2. Driving 8th-note Post-Punk Bassline (D2, Bb1, F2, C2)
      if (stepInBar % 2 === 0) {
        const rootFreqs = [73.42, 58.27, 87.31, 65.41]; // D2, Bb1, F2, C2
        const root = rootFreqs[bar];
        const isOctave = stepInBar === 14;
        const bassFreq = isOctave ? root * 2 : root;
        this.playSynthNote(bassFreq, 0.16, 'sawtooth', 0.055, now);
      }

      // 3. Iconic Nostalgic Hook Melody ("Я пам'ятаю кожен день...")
      const melodyMap: Record<number, number> = {
        // Bar 0: Dm
        0: 440.00,  // A4
        4: 440.00,  // A4
        8: 392.00,  // G4
        12: 349.23, // F4
        // Bar 1: Bb
        16: 349.23, // F4
        20: 392.00, // G4
        24: 349.23, // F4
        28: 329.63, // E4
        // Bar 2: F
        32: 349.23, // F4
        36: 329.63, // E4
        40: 293.66, // D4
        44: 329.63, // E4
        // Bar 3: C
        48: 293.66, // D4
        52: 261.63, // C4
        56: 293.66, // D4
        60: 329.63  // E4
      };

      if (melodyMap[curStep] !== undefined) {
        const freq = melodyMap[curStep];
        this.playSynthNote(freq, 0.42, 'triangle', 0.065, now);
        this.playSynthNote(freq * 1.002, 0.38, 'sine', 0.045, now);
      }
    } else if (this.radioStationIndex === 2) {
      // --- Radio Los Santos: Chill West Coast Beat ---
      if (step === 0 || step === 8 || step === 10) {
        this.playDrumKick(now);
      }
      if (step === 4 || step === 12) {
        this.playDrumSnare(now);
      }
      if (step === 0 || step === 6 || step === 10) {
        const chordRoots = [220, 261.63, 196, 246.94]; // A3, C4, G3, B3
        const root = chordRoots[Math.floor(this.radioStep / 8) % chordRoots.length];
        this.playSynthNote(root, 0.4, 'sine', 0.05, now);
        this.playSynthNote(root * 1.5, 0.35, 'triangle', 0.04, now);
      }
    } else if (this.radioStationIndex === 3) {
      // --- Nightride FM: 80s Synthwave Arpeggio ---
      if (step % 4 === 0) {
        this.playDrumKick(now);
      }
      if (step % 8 === 4) {
        this.playDrumSnare(now);
      }
      const arpNotes = [174.61, 220.00, 261.63, 329.63, 261.63, 220.00, 349.23, 392.00];
      const note = arpNotes[step % arpNotes.length];
      this.playSynthNote(note, 0.15, 'sawtooth', 0.035, now);
    }
  }

  private playDrumKick(time: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  private playDrumSnare(time: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    gain.gain.setValueAtTime(0.09, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playDrumHiHat(time: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(5500, time);
    osc.frequency.exponentialRampToValueAtTime(8000, time + 0.03);
    gain.gain.setValueAtTime(0.025, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.04);
  }

  private playSynthNote(freq: number, duration: number, type: OscillatorType, volume: number, time: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + duration);
  }
}

