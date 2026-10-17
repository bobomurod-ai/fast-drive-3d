// Fast Drive 3D - Web Audio API Sound Engine
// 100% Procedural synthesis - no external audio files required!

class SoundManager {
    constructor() {
        this.ctx = null;
        this.isInitialized = false;
        this.masterGain = null;
        this.engineGain = null;
        this.musicGain = null;
        this.sfxGain = null;

        // Volumes (0.0 to 1.0)
        this.masterVolume = 0.8;
        this.engineVolume = 0.6;
        this.musicVolume = 0.45;
        this.sfxVolume = 0.7;
        this.isMuted = false;

        // Engine synth nodes
        this.engineOsc1 = null;
        this.engineOsc2 = null;
        this.engineNoise = null;
        this.engineFilter = null;
        this.isEngineRunning = false;

        // Background music sequencer
        this.isMusicPlaying = false;
        this.musicInterval = null;
        this.musicStep = 0;

        // Load saved audio settings
        this.loadSettings();
    }

    init() {
        if (this.isInitialized) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();

            // Master channel
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
            this.masterGain.connect(this.ctx.destination);

            // Engine channel
            this.engineGain = this.ctx.createGain();
            this.engineGain.gain.value = this.engineVolume;
            this.engineGain.connect(this.masterGain);

            // Music channel
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.masterGain);

            // SFX channel
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.masterGain);

            this.isInitialized = true;
        } catch (e) {
            console.warn("Web Audio API not supported or blocked", e);
        }
    }

    resume() {
        if (!this.isInitialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('fastdrive_audio_settings');
            if (saved) {
                const s = JSON.parse(saved);
                if (s.masterVolume !== undefined) this.masterVolume = s.masterVolume;
                if (s.engineVolume !== undefined) this.engineVolume = s.engineVolume;
                if (s.musicVolume !== undefined) this.musicVolume = s.musicVolume;
                if (s.sfxVolume !== undefined) this.sfxVolume = s.sfxVolume;
                if (s.isMuted !== undefined) this.isMuted = s.isMuted;
            }
        } catch (e) {}
    }

    saveSettings() {
        try {
            localStorage.setItem('fastdrive_audio_settings', JSON.stringify({
                masterVolume: this.masterVolume,
                engineVolume: this.engineVolume,
                musicVolume: this.musicVolume,
                sfxVolume: this.sfxVolume,
                isMuted: this.isMuted
            }));
        } catch (e) {}
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
        }
        this.saveSettings();
    }

    setEngineVolume(val) {
        this.engineVolume = Math.max(0, Math.min(1, val));
        if (this.engineGain) {
            this.engineGain.gain.setTargetAtTime(this.engineVolume, this.ctx.currentTime, 0.05);
        }
        this.saveSettings();
    }

    setMusicVolume(val) {
        this.musicVolume = Math.max(0, Math.min(1, val));
        if (this.musicGain) {
            this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
        }
        this.saveSettings();
    }

    setSfxVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, val));
        if (this.sfxGain) {
            this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
        }
        this.saveSettings();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
        }
        this.saveSettings();
        return this.isMuted;
    }

    // --- Dynamic Procedural Engine Sound ---
    startEngine() {
        if (!this.ctx || this.isEngineRunning) return;
        this.resume();

        try {
            const now = this.ctx.currentTime;

            // Low frequency rumble oscillator (Sawtooth)
            this.engineOsc1 = this.ctx.createOscillator();
            this.engineOsc1.type = 'sawtooth';
            this.engineOsc1.frequency.setValueAtTime(55, now);

            // Higher harmonic oscillator (Triangle)
            this.engineOsc2 = this.ctx.createOscillator();
            this.engineOsc2.type = 'triangle';
            this.engineOsc2.frequency.setValueAtTime(110, now);

            // Low-pass filter to shape the raw waveform into a car engine throat
            this.engineFilter = this.ctx.createBiquadFilter();
            this.engineFilter.type = 'lowpass';
            this.engineFilter.frequency.setValueAtTime(320, now);
            this.engineFilter.Q.setValueAtTime(3.5, now);

            // Connect oscillators to filter -> engine gain
            this.engineOsc1.connect(this.engineFilter);
            this.engineOsc2.connect(this.engineFilter);
            this.engineFilter.connect(this.engineGain);

            this.engineOsc1.start();
            this.engineOsc2.start();
            this.isEngineRunning = true;
        } catch (e) {
            console.warn("Engine audio error", e);
        }
    }

    updateEngine(speedRatio, isAccelerating) {
        if (!this.isEngineRunning || !this.ctx) return;
        const now = this.ctx.currentTime;
        const ratio = Math.max(0, Math.min(1.2, speedRatio));

        // Pitch calculations based on speed and throttle
        const basePitch = 50 + ratio * 140 + (isAccelerating ? 25 : 0);
        const filterCutoff = 250 + ratio * 900 + (isAccelerating ? 300 : 0);

        try {
            this.engineOsc1.frequency.setTargetAtTime(basePitch, now, 0.08);
            this.engineOsc2.frequency.setTargetAtTime(basePitch * 1.8, now, 0.08);
            this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.08);
        } catch (e) {}
    }

    stopEngine() {
        if (!this.isEngineRunning) return;
        try {
            if (this.engineOsc1) { this.engineOsc1.stop(); this.engineOsc1.disconnect(); }
            if (this.engineOsc2) { this.engineOsc2.stop(); this.engineOsc2.disconnect(); }
            if (this.engineFilter) { this.engineFilter.disconnect(); }
        } catch (e) {}
        this.isEngineRunning = false;
    }

    // --- Sound Effects ---

    playCoin() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';

        // 2-tone sparkle (B5 -> E6)
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.08);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    playNitro() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        // White noise burst with resonance
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(2400, now + 0.3);
        filter.Q.value = 4.0;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
    }

    playBrake() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.25);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    playNearMiss() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.25);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    playCrash() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Sub explosion
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.7);

        oscGain.gain.setValueAtTime(0.8, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.7);

        // Noise crash
        const bufferSize = this.ctx.sampleRate * 0.6;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.6);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.7, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        noise.start(now);
    }

    playClick() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.05);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    playUnlock() {
        if (!this.ctx) return;
        this.resume();
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, i) => {
            const now = this.ctx.currentTime + i * 0.1;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.3);
        });
    }

    playPowerup() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    // --- Procedural Synthwave Music Generator ---
    startMusic() {
        if (this.isMusicPlaying) return;
        this.resume();
        this.isMusicPlaying = true;
        this.musicStep = 0;

        // 124 BPM -> 16th note step = 60 / 124 / 4 = ~0.121s
        const stepTime = 125; // ms

        // Bassline chords progression (Am, F, C, G)
        const bassProgression = [
            // Bar 1: A
            110, 110, 220, 110, 110, 110, 220, 164.81,
            110, 110, 220, 110, 110, 110, 220, 164.81,
            // Bar 2: F
            87.31, 87.31, 174.61, 87.31, 87.31, 87.31, 174.61, 130.81,
            87.31, 87.31, 174.61, 87.31, 87.31, 87.31, 174.61, 130.81,
            // Bar 3: C
            130.81, 130.81, 261.63, 130.81, 130.81, 130.81, 261.63, 196.00,
            130.81, 130.81, 261.63, 130.81, 130.81, 130.81, 261.63, 196.00,
            // Bar 4: G
            98.00, 98.00, 196.00, 98.00, 98.00, 98.00, 196.00, 146.83,
            98.00, 98.00, 196.00, 98.00, 98.00, 98.00, 196.00, 146.83
        ];

        // Lead melody notes (sparse and catchy)
        const leadProgression = [
            440, 0, 523.25, 0, 659.25, 0, 523.25, 0,
            440, 0, 0, 0, 392, 0, 440, 0,
            349.23, 0, 440, 0, 523.25, 0, 440, 0,
            349.23, 0, 0, 0, 329.63, 0, 349.23, 0,
            523.25, 0, 659.25, 0, 783.99, 0, 659.25, 0,
            523.25, 0, 0, 0, 440, 0, 523.25, 0,
            392, 0, 493.88, 0, 587.33, 0, 493.88, 0,
            392, 0, 440, 0, 493.88, 0, 523.25, 0
        ];

        this.musicInterval = setInterval(() => {
            if (!this.isMusicPlaying || !this.ctx) return;
            const now = this.ctx.currentTime;
            const step = this.musicStep % 64;

            // Kick drum on 1, 5, 9, 13 (four-on-the-floor)
            if (step % 4 === 0) {
                const kickOsc = this.ctx.createOscillator();
                const kickGain = this.ctx.createGain();
                kickOsc.type = 'sine';
                kickOsc.frequency.setValueAtTime(130, now);
                kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
                kickGain.gain.setValueAtTime(0.35, now);
                kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
                kickOsc.connect(kickGain);
                kickGain.connect(this.musicGain);
                kickOsc.start(now);
                kickOsc.stop(now + 0.13);
            }

            // Snare / clap on steps 4, 12 (beats 2 and 4)
            if (step % 8 === 4) {
                const snareOsc = this.ctx.createOscillator();
                const snareGain = this.ctx.createGain();
                snareOsc.type = 'triangle';
                snareOsc.frequency.setValueAtTime(180, now);
                snareGain.gain.setValueAtTime(0.2, now);
                snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                snareOsc.connect(snareGain);
                snareGain.connect(this.musicGain);
                snareOsc.start(now);
                snareOsc.stop(now + 0.1);
            }

            // Bass note
            const bassFreq = bassProgression[step];
            if (bassFreq) {
                const bassOsc = this.ctx.createOscillator();
                const bassGain = this.ctx.createGain();
                bassOsc.type = 'sawtooth';
                bassOsc.frequency.setValueAtTime(bassFreq, now);

                const bassFilter = this.ctx.createBiquadFilter();
                bassFilter.type = 'lowpass';
                bassFilter.frequency.setValueAtTime(450, now);

                bassGain.gain.setValueAtTime(0.18, now);
                bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

                bassOsc.connect(bassFilter);
                bassFilter.connect(bassGain);
                bassGain.connect(this.musicGain);
                bassOsc.start(now);
                bassOsc.stop(now + 0.11);
            }

            // Lead synth note
            const leadFreq = leadProgression[step];
            if (leadFreq > 0) {
                const leadOsc = this.ctx.createOscillator();
                const leadGain = this.ctx.createGain();
                leadOsc.type = 'square';
                leadOsc.frequency.setValueAtTime(leadFreq, now);

                const leadFilter = this.ctx.createBiquadFilter();
                leadFilter.type = 'lowpass';
                leadFilter.frequency.setValueAtTime(1200, now);

                leadGain.gain.setValueAtTime(0.12, now);
                leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

                leadOsc.connect(leadFilter);
                leadFilter.connect(leadGain);
                leadGain.connect(this.musicGain);
                leadOsc.start(now);
                leadOsc.stop(now + 0.18);
            }

            this.musicStep++;
        }, stepTime);
    }

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

// Global sound manager instance
window.soundManager = new SoundManager();
