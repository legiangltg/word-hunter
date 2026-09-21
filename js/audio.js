/* ============================================
   AUDIO - Procedural SFX + YouTube Music
   ============================================ */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.sfxVolume = 0.6;
        this.musicVolume = 0.3;
        this.initialized = false;
        this.ytPlayer = null;
        this.ytReady = false;
        this.ytLoaded = false;
        this.buffers = {};
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            this._createBuffers();
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    _createBuffers() {
        // Pre-generate sound buffers for performance
        this.buffers.laser = this._generateLaserBuffer();
        this.buffers.explosion = this._generateExplosionBuffer();
        this.buffers.hit = this._generateHitBuffer();
        this.buffers.error = this._generateErrorBuffer();
        this.buffers.levelUp = this._generateLevelUpBuffer();
    }

    _generateLaserBuffer() {
        const duration = 0.1;
        const sr = this.ctx.sampleRate;
        const len = sr * duration;
        const buffer = this.ctx.createBuffer(1, len, sr);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            const freq = 1200 - t * 8000;
            const envelope = 1 - t / duration;
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3
                     + (Math.random() - 0.5) * envelope * 0.05;
        }
        return buffer;
    }

    _generateExplosionBuffer() {
        const duration = 0.5;
        const sr = this.ctx.sampleRate;
        const len = sr * duration;
        const buffer = this.ctx.createBuffer(1, len, sr);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            const envelope = Math.pow(1 - t / duration, 2);
            const noise = (Math.random() - 0.5) * 2;
            const bass = Math.sin(2 * Math.PI * (60 - t * 40) * t);
            data[i] = (noise * 0.6 + bass * 0.4) * envelope * 0.4;
        }
        return buffer;
    }

    _generateHitBuffer() {
        const duration = 0.05;
        const sr = this.ctx.sampleRate;
        const len = sr * duration;
        const buffer = this.ctx.createBuffer(1, len, sr);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            const envelope = 1 - t / duration;
            data[i] = Math.sin(2 * Math.PI * 800 * t) * envelope * 0.2;
        }
        return buffer;
    }

    _generateErrorBuffer() {
        const duration = 0.15;
        const sr = this.ctx.sampleRate;
        const len = sr * duration;
        const buffer = this.ctx.createBuffer(1, len, sr);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            const envelope = 1 - t / duration;
            data[i] = (Math.sin(2 * Math.PI * 200 * t) + Math.sin(2 * Math.PI * 250 * t)) 
                      * envelope * 0.15;
        }
        return buffer;
    }

    _generateLevelUpBuffer() {
        const duration = 0.6;
        const sr = this.ctx.sampleRate;
        const len = sr * duration;
        const buffer = this.ctx.createBuffer(1, len, sr);
        const data = buffer.getChannelData(0);
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            const noteIdx = Math.min(Math.floor(t / (duration / 4)), 3);
            const noteT = t - noteIdx * (duration / 4);
            const envelope = Math.max(0, 1 - noteT / (duration / 4) * 2);
            data[i] = Math.sin(2 * Math.PI * notes[noteIdx] * t) * envelope * 0.2;
        }
        return buffer;
    }

    _playBuffer(buffer, volume = 1) {
        if (!this.ctx || !buffer) return;
        this.resume();
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.value = this.sfxVolume * volume;
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
    }

    playLaser() {
        this._playBuffer(this.buffers.laser);
    }

    playExplosion() {
        this._playBuffer(this.buffers.explosion);
    }

    playHit() {
        this._playBuffer(this.buffers.hit);
    }

    playError() {
        this._playBuffer(this.buffers.error);
    }

    playLevelUp() {
        this._playBuffer(this.buffers.levelUp);
    }

    setSfxVolume(v) {
        this.sfxVolume = v;
    }

    setMusicVolume(v) {
        this.musicVolume = v;
        if (this.ytPlayer && this.ytReady) {
            this.ytPlayer.setVolume(v * 100);
        }
    }

    // --- YouTube Music ---
    loadYouTubeAPI() {
        if (this.ytLoaded) return;
        this.ytLoaded = true;
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);

        window.onYouTubeIframeAPIReady = () => {
            this.ytReady = true;
            this._initYTPlayer();
        };
    }

    _initYTPlayer() {
        // Will be initialized when user provides a URL
    }

    _extractVideoId(url) {
        if (!url) return null;
        // Handle various YouTube URL formats
        let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];
        // Handle just video ID
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
        return null;
    }

    playMusic(url) {
        const videoId = this._extractVideoId(url);
        if (!videoId) return false;

        this.loadYouTubeAPI();

        const tryPlay = () => {
            if (!this.ytReady) {
                setTimeout(tryPlay, 500);
                return;
            }

            if (this.ytPlayer) {
                this.ytPlayer.loadVideoById(videoId);
                this.ytPlayer.setVolume(this.musicVolume * 100);
                return;
            }

            this.ytPlayer = new YT.Player('youtubePlayer', {
                height: '1',
                width: '1',
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    loop: 1,
                    playlist: videoId,
                    controls: 0,
                },
                events: {
                    onReady: (event) => {
                        event.target.setVolume(this.musicVolume * 100);
                        event.target.playVideo();
                    },
                    onStateChange: (event) => {
                        if (event.data === YT.PlayerState.ENDED) {
                            event.target.playVideo();
                        }
                    }
                }
            });
        };

        tryPlay();
        return true;
    }

    pauseMusic() {
        if (this.ytPlayer && this.ytReady) {
            try { this.ytPlayer.pauseVideo(); } catch(e) {}
        }
    }

    resumeMusic() {
        if (this.ytPlayer && this.ytReady) {
            try { this.ytPlayer.playVideo(); } catch(e) {}
        }
    }

    stopMusic() {
        if (this.ytPlayer && this.ytReady) {
            try { this.ytPlayer.stopVideo(); } catch(e) {}
        }
    }
}
