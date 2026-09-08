// High-Fidelity Audio System for Wedding Invitation
// Features genuine acoustic romantic wedding soundtrack, realistic paper-rustle, and golden chime.

class AudioController {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isMusicPlaying = false;
    this.fadeInterval = null;

    // Curated high-fidelity wedding music tracks
    this.tracks = [
      {
        id: 'romantic-piano',
        name: 'Romantic Wedding Piano & Strings',
        src: '/assets/audio/romantic-wedding-piano.mp3',
      },
      {
        id: 'canon-in-d',
        name: "Pachelbel's Canon in D",
        src: '/assets/audio/wedding-canon.mp3',
      },
    ];

    this.currentTrackIndex = 0;
    this.audioElement = null;
    this.targetVolume = 0.5;
  }

  initAudioElement() {
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.src = this.tracks[this.currentTrackIndex].src;
      this.audioElement.loop = true;
      this.audioElement.volume = 0;
      this.audioElement.preload = 'auto';

      this.audioElement.addEventListener('ended', () => {
        this.audioElement.currentTime = 0;
        this.audioElement.play().catch(() => {});
      });
    }
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Synthesizes a delicate, realistic paper rustling sound when the envelope is opened
  playPaperRustle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.7);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.25);
      filter.frequency.exponentialRampToValueAtTime(700, now + 0.65);
      filter.Q.value = 2.8;

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.04, now + 0.35);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.7);
    } catch (e) {
      console.warn('Paper sound error:', e);
    }
  }

  // Synthesizes an ethereal, romantic chime/harp sparkle when invitation reveals
  playChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
      const now = this.ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        const startTime = now + index * 0.08;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.3);
      });
    } catch (e) {
      console.warn('Chime error:', e);
    }
  }

  // Smooth fade-in volume ramp
  fadeIn(duration = 2000) {
    if (!this.audioElement) return;
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    const stepTime = 50;
    const steps = duration / stepTime;
    const stepGain = this.targetVolume / steps;

    this.fadeInterval = setInterval(() => {
      if (!this.audioElement) {
        clearInterval(this.fadeInterval);
        return;
      }
      if (this.audioElement.volume + stepGain >= this.targetVolume) {
        this.audioElement.volume = this.targetVolume;
        clearInterval(this.fadeInterval);
      } else {
        this.audioElement.volume += stepGain;
      }
    }, stepTime);
  }

  // Smooth fade-out volume ramp
  fadeOut(duration = 1000, callback = () => {}) {
    if (!this.audioElement) {
      callback();
      return;
    }
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    const stepTime = 50;
    const steps = duration / stepTime;
    const stepGain = this.audioElement.volume / steps;

    this.fadeInterval = setInterval(() => {
      if (!this.audioElement) {
        clearInterval(this.fadeInterval);
        callback();
        return;
      }
      if (this.audioElement.volume - stepGain <= 0.01) {
        this.audioElement.volume = 0;
        clearInterval(this.fadeInterval);
        this.audioElement.pause();
        callback();
      } else {
        this.audioElement.volume -= stepGain;
      }
    }, stepTime);
  }

  // Play romantic wedding music
  startAmbientMusic() {
    this.initAudioElement();
    this.initContext();
    if (!this.audioElement) return;

    this.isMusicPlaying = true;
    this.isMuted = false;

    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.fadeIn(1800);
        })
        .catch((err) => {
          console.warn('Audio play restricted by browser policy:', err);
        });
    }
  }

  // Stop romantic wedding music
  stopAmbientMusic() {
    this.isMusicPlaying = false;
    this.fadeOut(800);
  }

  // Toggle play / pause
  toggleAmbientMusic() {
    if (this.isMusicPlaying) {
      this.stopAmbientMusic();
      return false;
    } else {
      this.startAmbientMusic();
      return true;
    }
  }

  // Switch track (e.g. Piano & Strings <-> Canon in D)
  switchTrack(index) {
    if (index >= 0 && index < this.tracks.length) {
      this.currentTrackIndex = index;
      const wasPlaying = this.isMusicPlaying;
      if (this.audioElement) {
        this.fadeOut(400, () => {
          this.audioElement.src = this.tracks[this.currentTrackIndex].src;
          if (wasPlaying) {
            this.startAmbientMusic();
          }
        });
      }
    }
  }

  getCurrentTrack() {
    return this.tracks[this.currentTrackIndex];
  }
}

export const audioController = new AudioController();
