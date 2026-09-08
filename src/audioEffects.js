// Web Audio API Sound Synthesizer for Wedding Invitation
// Provides realistic paper-rustle, golden harp chime, and ambient romance music without external MP3 files.

class AudioController {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isMusicPlaying = false;
    this.musicInterval = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Synthesizes a delicate, realistic paper rustling sound when the envelope is opened
  playPaperRustle() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // White noise buffer for paper texture
      const bufferSize = this.ctx.sampleRate * 0.8;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      // Bandpass filter to simulate crisp textured paper friction
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.3);
      filter.frequency.exponentialRampToValueAtTime(600, now + 0.7);
      filter.Q.value = 3.0;

      // Gain envelope
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.04, now + 0.4);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.8);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Synthesizes an ethereal, romantic chime/harp sparkle when invitation reveals
  playChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      const now = this.ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.09);

        const startTime = now + index * 0.09;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.3);
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Romantic ambient soft piano/harp arpeggio
  toggleAmbientMusic() {
    if (this.isMusicPlaying) {
      this.stopAmbientMusic();
      return false;
    } else {
      this.startAmbientMusic();
      return true;
    }
  }

  startAmbientMusic() {
    this.init();
    if (!this.ctx) return;
    this.isMusicPlaying = true;
    this.isMuted = false;

    // Gentle chord progression: Fmaj7 - Cmaj7 - Am7 - G
    const chords = [
      [349.23, 440.00, 523.25, 659.25], // F, A, C, E
      [261.63, 329.63, 392.00, 493.88], // C, E, G, B
      [220.00, 261.63, 329.63, 392.00], // A, C, E, G
      [196.00, 246.94, 293.66, 392.00]  // G, B, D, G
    ];

    let chordIdx = 0;
    let step = 0;

    const playNextNote = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      const currentChord = chords[chordIdx];
      const noteFreq = currentChord[step % currentChord.length];

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(noteFreq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.7);
      } catch (e) {}

      step++;
      if (step % currentChord.length === 0) {
        chordIdx = (chordIdx + 1) % chords.length;
      }
    };

    playNextNote();
    this.musicInterval = setInterval(playNextNote, 600);
  }

  stopAmbientMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const audioController = new AudioController();
