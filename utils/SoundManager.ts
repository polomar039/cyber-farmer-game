class SoundManager {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1, slideTo: number | null = null) {
    if (this.isMuted || !this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, this.audioContext.currentTime + duration);
    }

    gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + duration);
  }

  public play(sound: 'click' | 'plant' | 'harvest' | 'sell' | 'error' | 'tab') {
    this.init();
    
    switch (sound) {
      case 'click':
        this.playTone(800, 'sine', 0.05, 0.05);
        break;
      case 'tab':
        this.playTone(400, 'triangle', 0.1, 0.05, 600);
        break;
      case 'plant':
        // Soft sci-fi blip
        this.playTone(300, 'sine', 0.1, 0.1, 600);
        setTimeout(() => this.playTone(600, 'sine', 0.1, 0.1), 50);
        break;
      case 'harvest':
        // High pitched "sparkle"
        this.playTone(800, 'square', 0.1, 0.05, 1200);
        setTimeout(() => this.playTone(1200, 'sine', 0.2, 0.05), 100);
        break;
      case 'sell':
        // Coin sound
        this.playTone(1000, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(1500, 'sine', 0.2, 0.1), 50);
        break;
      case 'error':
        this.playTone(150, 'sawtooth', 0.3, 0.1, 100);
        break;
    }
  }
}

export const soundManager = new SoundManager();