/**
 * TGFC 27 — Tomi Gelo Football Club Portfolio
 * Widescreen Console State Machine, Boot Loader, YouTube IFrame Radio Engine & Blade Menu
 */

document.addEventListener('DOMContentLoaded', () => {
    // Load Plausible Analytics only in production (exclude preview channels and staging)
    if (window.location.hostname === 'tomigelo.com' || window.location.hostname === 'www.tomigelo.com') {
        const plausibleScript = document.createElement('script');
        plausibleScript.defer = true;
        plausibleScript.setAttribute('data-domain', 'tomigelo.com');
        plausibleScript.src = 'https://plausible.io/js/plausible.js';
        document.head.appendChild(plausibleScript);
    }

    const DESKTOP_MIN_WIDTH = 960;
    const THEME_STORAGE_KEY = 'tgfc-central-bento-theme';

    function readSavedTheme() {
        try {
            const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
            return raw === 'dark' || raw === 'pop' ? raw : 'pop';
        } catch (_) {
            return 'pop';
        }
    }

    let activeSiteTheme = readSavedTheme();
    document.documentElement.setAttribute('data-theme', activeSiteTheme);

    function prefersReducedMotion() {
        try {
            return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        } catch (_) {
            return false;
        }
    }

    function hasFinePointer() {
        try {
            return Boolean(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
        } catch (_) {
            return false;
        }
    }

    let redrawStaticParticles = null;

    /* ======================================================================
       1. LIVE PROJECT CLUBS DATA STORE
       ====================================================================== */
    const PROJECT_CLUBS = [
        {
            id: 'not-so-bigquery',
            code: 'BQ',
            crestClass: 'crest-volt',
            league: 'LEAGUE 01 // GCP DATA & ANALYTICS',
            statusPill: '304 ISSUES // LIVE',
            name: 'NOT SO BIGQUERY',
            namePrimary: 'NOT SO',
            nameOutline: 'BIGQUERY',
            ovr: '91 OVR',
            stars: '★★★★★',
            desc: 'Weekly BigQuery & Google Cloud data newsletter curated by Tomi Gelo — 304 issues covering GCP releases, AI functions, and community reads.',
            att: 88,
            mid: 93,
            def: 92,
            stadium: 'HOSTING // MAILBREW + CRSSNT',
            formation: '4-2-3-1 WEEKLY',
            stack: 'MAILBREW // CRSSNT // SHEETS',
            season: 'SINCE 2020 • 304#',
            ctaLabel: 'OPEN NOT SO BIGQUERY ↗',
            url: 'https://app.mailbrew.com/tgel0/not-so-bigquery-9HLtpmj0Pl8B'
        },
        {
            id: 'songcards',
            code: 'SC',
            crestClass: 'crest-cyan',
            league: 'LEAGUE 02 // MUSIC & PARTY GAME',
            statusPill: 'WEB APP // FREE',
            name: 'SONGCARDS',
            namePrimary: 'SONG',
            nameOutline: 'CARDS',
            ovr: '90 OVR',
            stars: '★★★★☆',
            desc: 'Convert any public Spotify playlist into printable double-sided A4 QR music trivia cards for timeline party games — free, no sign-up.',
            att: 92,
            mid: 90,
            def: 88,
            stadium: 'HOSTING // GCP APP HOSTING',
            formation: '3-3-3 DECK GRID',
            stack: 'SVELTEKIT // SPOTIFY API + JSPDF',
            season: '2026 SEASON',
            ctaLabel: 'LAUNCH SONGCARDS ↗',
            url: 'https://songcards.de/'
        },
        {
            id: 'crssnt',
            code: 'CR',
            crestClass: 'crest-gold',
            league: 'LEAGUE 03 // OPEN SOURCE & FEEDS',
            statusPill: 'OPEN SOURCE // MIT',
            name: 'CRSSNT',
            namePrimary: 'CRSSNT',
            nameOutline: 'FEED API',
            ovr: '93 OVR',
            stars: '★★★★★',
            desc: 'Open-source stateless feed & Google Sheet converter turning RSS, Atom, and Sheets into LLM-ready Markdown, JSON Feed, and XML.',
            att: 89,
            mid: 96,
            def: 94,
            stadium: 'HOSTING // FIREBASE CLOUD V2',
            formation: '3-4-3 STATELESS',
            stack: 'NODE 22 // FIREBASE V2 // RSS•MD',
            season: '2021–26 SEASON',
            ctaLabel: 'EXPLORE CRSSNT ↗',
            url: 'https://crssnt.com/'
        }
    ];

    /* ======================================================================
       2. CURATED YOUTUBE IFRAME SOUNDTRACK ROTATION (LOFI.CAFE APPROACH)
       ====================================================================== */
    const SOUNDTRACKS = [
        {
            title: 'LOVE ME AGAIN',
            artist: 'JOHN NEWMAN • SOUNDTRACK CLASSICS',
            ytIds: ['jLPE5KlWeVI', 'nyw4G2fB_E4', 'CfihYWRWRTQ'],
            startSeconds: 2
        },
        {
            title: 'THE NIGHTS',
            artist: 'AVICII • SOUNDTRACK CLASSICS',
            ytIds: ['2S0QhGGO1gQ', 'H7HmzwI67ec', 'UtF6Jej8yb4'],
            startSeconds: 2
        },
        {
            title: 'MY TYPE',
            artist: 'SAINT MOTEL • SOUNDTRACK CLASSICS',
            ytIds: ['64123PhOpsA', 'j8cKdDkkIYY', 'IyVPyKrx0Xo'],
            startSeconds: 3
        },
        {
            title: 'HEAT WAVES',
            artist: 'GLASS ANIMALS • SOUNDTRACK CLASSICS',
            ytIds: ['d6F4B5KxRo8', 'rfTgO9rpqck', 'mRD0-GxqHVo'],
            startSeconds: 4
        },
        {
            title: 'DREAMING',
            artist: 'SMALLPOOLS • SOUNDTRACK CLASSICS',
            ytIds: ['zJtKCzfyZP0', 'm3d03-s356U', 'e8xni3EcIbc'],
            startSeconds: 2
        },
        {
            title: 'KIDS',
            artist: 'MGMT • SOUNDTRACK CLASSICS',
            ytIds: ['rdKfuwy6LUM', 'bIEOZCcaXzE', 'fe4EK4HSPkI'],
            startSeconds: 2
        }
    ];

    // Fisher-Yates shuffle on load so every session starts with a random song and random order
    for (let i = SOUNDTRACKS.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [SOUNDTRACKS[i], SOUNDTRACKS[j]] = [SOUNDTRACKS[j], SOUNDTRACKS[i]];
    }

    /* ======================================================================
       3. HYBRID YOUTUBE RADIO + WEB AUDIO UI SFX ENGINE
       ====================================================================== */
    class GameAudioEngine {
        constructor(onTrackChangedCallback) {
            this.ctx = null;
            this.masterGain = null;
            this.enabled = true;
            this.isPlayingMusic = false;
            this.trackIndex = 0;
            this.candidateIndex = 0;
            this.ytPlayer = null;
            this.ytReady = false;
            this.ytLoadRequested = false;
            this.pendingPlay = false;
            this.onTrackChanged = onTrackChangedCallback;
        }

        initWebAudio() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                    this.masterGain = this.ctx.createGain();
                    this.masterGain.gain.value = this.enabled ? 1.0 : 0.0;
                    this.masterGain.connect(this.ctx.destination);
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        ensureYouTubeLoaded() {
            if (this.ytPlayer) return;
            if (window.YT && window.YT.Player) {
                this.ytLoadRequested = true;
                this.createYouTubePlayer();
                return;
            }
            if (this.ytLoadRequested) return;
            this.ytLoadRequested = true;

            const prevCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (typeof prevCallback === 'function') prevCallback();
                if (!this.ytPlayer && window.YT && window.YT.Player) {
                    this.createYouTubePlayer();
                }
            };

            if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                tag.async = true;
                document.head.appendChild(tag);
            }
        }

        syncEqualizerState() {
            const eqBars = document.getElementById('hud-eq-bars');
            if (eqBars) {
                eqBars.classList.toggle('paused', !this.isPlayingMusic || !this.enabled);
            }
        }

        createYouTubePlayer() {
            const firstTrack = SOUNDTRACKS[this.trackIndex];
            const initialVid = firstTrack.ytIds[0];

            this.ytPlayer = new window.YT.Player('yt-radio-player', {
                height: '1',
                width: '1',
                videoId: initialVid,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    start: firstTrack.startSeconds || 0,
                    origin: window.location.origin
                },
                events: {
                    onReady: () => {
                        this.ytReady = true;
                        this.ytPlayer.setVolume(65);
                        if (!this.enabled) {
                            this.ytPlayer.mute();
                        }
                        if (this.pendingPlay) {
                            this.pendingPlay = false;
                            this.startSoundtrack();
                        }
                    },
                    onStateChange: (event) => {
                        // Auto-advance to next song when current song finishes (YT.PlayerState.ENDED === 0)
                        if (event.data === 0) {
                            this.nextTrack(true);
                        }
                    },
                    onError: () => {
                        // If a video ID is embed-restricted (Error 101/150) or unavailable, try next backup ID or next song
                        this.handleYouTubeError();
                    }
                }
            });
        }

        handleYouTubeError() {
            const currentTrack = SOUNDTRACKS[this.trackIndex];
            if (this.candidateIndex + 1 < currentTrack.ytIds.length) {
                this.candidateIndex++;
                const fallbackVid = currentTrack.ytIds[this.candidateIndex];
                if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
                    this.ytPlayer.loadVideoById({
                        videoId: fallbackVid,
                        startSeconds: currentTrack.startSeconds || 0
                    });
                }
            } else {
                // Move to the next song in rotation if all candidate IDs for this track failed
                this.nextTrack(true);
            }
        }

        startSoundtrack() {
            this.initWebAudio();
            this.isPlayingMusic = true;
            this.ensureYouTubeLoaded();
            this.syncEqualizerState();

            if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
                if (this.enabled) {
                    this.ytPlayer.unMute();
                    this.ytPlayer.setVolume(65);
                } else {
                    this.ytPlayer.mute();
                }
                this.ytPlayer.playVideo();
            } else {
                this.pendingPlay = true;
            }
        }

        stopSoundtrack() {
            this.isPlayingMusic = false;
            this.pendingPlay = false;
            this.syncEqualizerState();
            if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
                this.ytPlayer.pauseVideo();
            }
        }

        nextTrack(autoAdvance = false) {
            this.trackIndex = (this.trackIndex + 1) % SOUNDTRACKS.length;
            this.candidateIndex = 0;
            const track = SOUNDTRACKS[this.trackIndex];

            if (this.ytReady && this.ytPlayer && typeof this.ytPlayer.loadVideoById === 'function') {
                if (this.isPlayingMusic) {
                    this.ytPlayer.loadVideoById({
                        videoId: track.ytIds[0],
                        startSeconds: track.startSeconds || 0
                    });
                    if (!this.enabled) {
                        this.ytPlayer.mute();
                    } else {
                        this.ytPlayer.unMute();
                        this.ytPlayer.setVolume(65);
                    }
                } else {
                    this.ytPlayer.cueVideoById({
                        videoId: track.ytIds[0],
                        startSeconds: track.startSeconds || 0
                    });
                }
            }

            if (autoAdvance && typeof this.onTrackChanged === 'function') {
                this.onTrackChanged(track);
            }
            return track;
        }

        toggleMute() {
            this.enabled = !this.enabled;
            this.initWebAudio();

            if (this.masterGain && this.ctx) {
                this.masterGain.gain.setValueAtTime(this.enabled ? 1.0 : 0.0, this.ctx.currentTime);
            }

            if (this.ytReady && this.ytPlayer) {
                if (this.enabled) {
                    this.ytPlayer.unMute();
                    this.ytPlayer.setVolume(65);
                    if (this.isPlayingMusic) {
                        this.ytPlayer.playVideo();
                    }
                } else {
                    this.ytPlayer.mute();
                }
            }

            if (this.enabled) {
                this.playTick();
            }
            return this.enabled;
        }

        getCurrentTrack() {
            return SOUNDTRACKS[this.trackIndex];
        }

        /* Synthesized Console UI Sound Effects */
        playTick() {
            if (!this.enabled) return;
            this.initWebAudio();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.045);

            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.05);
        }

        playSelect() {
            if (!this.enabled) return;
            this.initWebAudio();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const freqs = [440, 659.25, 880];
            freqs.forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, now + idx * 0.025);

                gain.gain.setValueAtTime(0.05, now + idx * 0.025);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.025 + 0.16);

                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now + idx * 0.025);
                osc.stop(now + idx * 0.025 + 0.17);
            });
        }

        playCelebration() {
            if (!this.enabled) return;
            this.initWebAudio();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            // EAFC stadium victory fanfare arpeggio + octave shimmer
            const fanfare = [
                { f: 523.25, t: 0.00, dur: 0.22, vol: 0.055, type: 'triangle' },
                { f: 659.25, t: 0.07, dur: 0.22, vol: 0.055, type: 'triangle' },
                { f: 783.99, t: 0.14, dur: 0.28, vol: 0.065, type: 'triangle' },
                { f: 987.77, t: 0.21, dur: 0.30, vol: 0.065, type: 'triangle' },
                { f: 1046.50, t: 0.28, dur: 0.56, vol: 0.085, type: 'triangle' },
                { f: 1567.98, t: 0.30, dur: 0.48, vol: 0.035, type: 'sine' }
            ];
            fanfare.forEach(({ f, t, dur, vol, type }) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(f, now + t);

                gain.gain.setValueAtTime(vol, now + t);
                gain.gain.exponentialRampToValueAtTime(0.001, now + t + dur);

                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now + t);
                osc.stop(now + t + dur + 0.02);
            });
        }

        playBack() {
            if (!this.enabled) return;
            this.initWebAudio();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(340, now);
            osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);

            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.1);
        }
    }

    const audio = new GameAudioEngine((newTrack) => {
        showNowPlayingChyron(newTrack);
    });

    /* ======================================================================
       4. STADIUM AMBIENT PARTICLE CANVAS
       ====================================================================== */
    const canvas = document.getElementById('stadium-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const particles = [];
            let viewportW = window.innerWidth;
            let viewportH = window.innerHeight;
            let canvasResizeRaf = null;
            let particleRafId = null;

            function resizeCanvas() {
                viewportW = window.innerWidth;
                viewportH = window.innerHeight;
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                canvas.width = Math.floor(viewportW * dpr);
                canvas.height = Math.floor(viewportH * dpr);
                if (typeof ctx.setTransform === 'function') {
                    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                }
            }
            resizeCanvas();

            for (let i = 0; i < 38; i++) {
                particles.push({
                    x: Math.random() * viewportW,
                    y: Math.random() * viewportH,
                    r: Math.random() * 1.8 + 0.5,
                    vx: (Math.random() - 0.5) * 0.35,
                    vy: -Math.random() * 0.4 - 0.1,
                    alpha: Math.random() * 0.45 + 0.1
                });
            }

            let lastParticleTheme = activeSiteTheme;

            function drawParticleFrame(advance = true) {
                ctx.clearRect(0, 0, viewportW, viewportH);
                const isDark = activeSiteTheme === 'dark';
                lastParticleTheme = activeSiteTheme;
                particles.forEach((p, idx) => {
                    if (advance) {
                        p.x += p.vx;
                        p.y += p.vy;
                        if (p.y < 0) p.y = viewportH;
                        if (p.x < 0) p.x = viewportW;
                        if (p.x > viewportW) p.x = 0;
                    }

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    if (isDark) {
                        ctx.fillStyle = `rgba(0, 255, 104, ${p.alpha})`;
                    } else {
                        const popAlpha = Math.min(0.32, p.alpha * 0.62);
                        ctx.fillStyle = idx % 3 === 0
                            ? `rgba(0, 175, 86, ${popAlpha})`
                            : `rgba(82, 51, 232, ${popAlpha})`;
                    }
                    ctx.fill();
                });
            }

            function renderStadiumParticles() {
                particleRafId = null;
                if (document.hidden || prefersReducedMotion()) return;
                drawParticleFrame(true);
                particleRafId = requestAnimationFrame(renderStadiumParticles);
            }

            function startParticleLoop() {
                if (prefersReducedMotion()) {
                    drawParticleFrame(false);
                    return;
                }
                if (!document.hidden && particleRafId === null) {
                    particleRafId = requestAnimationFrame(renderStadiumParticles);
                }
            }

            function stopParticleLoop() {
                if (particleRafId !== null) {
                    cancelAnimationFrame(particleRafId);
                    particleRafId = null;
                }
            }

            redrawStaticParticles = () => {
                if (prefersReducedMotion() && activeSiteTheme !== lastParticleTheme) {
                    drawParticleFrame(false);
                }
            };

            window.addEventListener('resize', () => {
                if (canvasResizeRaf !== null) return;
                canvasResizeRaf = requestAnimationFrame(() => {
                    canvasResizeRaf = null;
                    resizeCanvas();
                    if (prefersReducedMotion() && !document.hidden) {
                        drawParticleFrame(false);
                    }
                });
            });

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    stopParticleLoop();
                } else {
                    startParticleLoop();
                }
            });

            if (prefersReducedMotion()) {
                drawParticleFrame(false);
            } else if (document.hidden) {
                drawParticleFrame(false);
            } else {
                renderStadiumParticles();
            }
        }
    }

    /* ======================================================================
       5. APPLICATION STATE & DOM REFERENCES
       ====================================================================== */
    const state = {
        screen: 'boot',             // 'boot' | 'mobile-gate' | 'hub' | 'projects' | 'work'
        lastUnlockedScreen: 'hub',  // Remembers screen when rotating back from portrait
        bootReady: false,
        hasPassedBoot: false,
        activeBladeIndex: 0,        // 0 = projects, 1 = work
        activeClubIndex: 0,         // 0..2
        projectsTab: 'kickoff',     // 'kickoff'
        workTab: 'central'          // 'central' | 'transfers'
    };

    const viewportEl = document.getElementById('console-viewport');
    const screenBoot = document.getElementById('screen-boot');
    const screenMobileGate = document.getElementById('screen-mobile-gate');
    const topHud = document.getElementById('console-top-hud');
    const bottomBar = document.getElementById('console-bottom-bar');

    const screenHub = document.getElementById('screen-hub');
    const screenProjects = document.getElementById('screen-projects');
    const screenWork = document.getElementById('screen-work');
    const projectsViewKickoff = document.getElementById('projects-view-kickoff');
    const workViewCentral = document.getElementById('work-view-central');
    const workViewTransfers = document.getElementById('work-view-transfers');
    const projectsBentoGrid = projectsViewKickoff?.querySelector('.kickoff-bento-grid') || null;
    const centralBentoGrid = workViewCentral?.querySelector('.central-bento-grid') || null;

    const hudCategory = document.getElementById('hud-mode-category');
    const hudTitle = document.getElementById('hud-mode-title');
    const promptBackBtn = document.getElementById('prompt-back-btn');
    const promptBumpers = document.getElementById('prompt-bumpers');
    const promptSelectBtn = document.getElementById('prompt-select-btn');

    const hudTrackName = document.getElementById('hud-track-name');
    const hudEqBars = document.getElementById('hud-eq-bars');
    const traxChyron = document.getElementById('trax-chyron');
    const chyronTrackTitle = document.getElementById('chyron-track-title');
    const chyronTrackArtist = document.getElementById('chyron-track-artist');

    // Sync initial HUD labels with the randomly selected starting song
    const initialTrack = audio.getCurrentTrack();
    if (hudTrackName && initialTrack) hudTrackName.textContent = initialTrack.title;
    if (chyronTrackTitle && initialTrack) chyronTrackTitle.textContent = initialTrack.title;
    if (chyronTrackArtist && initialTrack) chyronTrackArtist.textContent = initialTrack.artist;

    const blades = Array.from(document.querySelectorAll('.fc-blade'));
    const billboards = {
        projects: document.getElementById('preview-projects'),
        work: document.getElementById('preview-work')
    };

    function isPortraitLocked() {
        return window.innerHeight > window.innerWidth && window.innerWidth < DESKTOP_MIN_WIDTH;
    }

    function updateViewportScale() {
        if (!viewportEl) return;
        // In portrait mode, keep 1:1 native mobile scale for both boot and the rotate-device gate
        if (isPortraitLocked()) {
            viewportEl.classList.remove('scaled-landscape');
            viewportEl.style.removeProperty('--ui-scale');
            return;
        }
        // In landscape mode on compact screens (like horizontal phones), scale the 1366x760 console UI proportionally
        if (window.innerWidth < 1366 || window.innerHeight < 760) {
            const scaleX = window.innerWidth / 1366;
            const scaleY = window.innerHeight / 760;
            const scale = Math.max(0.35, Math.min(scaleX, scaleY));
            viewportEl.style.setProperty('--ui-scale', scale.toFixed(4));
            viewportEl.classList.add('scaled-landscape');
        } else {
            viewportEl.classList.remove('scaled-landscape');
            viewportEl.style.removeProperty('--ui-scale');
        }
    }

    let chyronTimer = null;
    function showNowPlayingChyron(track) {
        if (hudTrackName) hudTrackName.textContent = track.title;
        if (chyronTrackTitle) chyronTrackTitle.textContent = track.title;
        if (chyronTrackArtist) chyronTrackArtist.textContent = track.artist;

        if (!traxChyron || isPortraitLocked()) return;

        // Force animation replay even if chyron was already visible
        traxChyron.hidden = false;
        traxChyron.classList.remove('chyron-animate');
        void traxChyron.offsetWidth;
        traxChyron.classList.add('chyron-animate');

        if (chyronTimer) clearTimeout(chyronTimer);
        chyronTimer = setTimeout(() => {
            traxChyron.hidden = true;
        }, 4500);
    }

    /* ======================================================================
       6. BOOT SEQUENCE (0% -> 100% -> START -> MOBILE GATE OR DESKTOP HUB)
       ====================================================================== */
    const bootStatusText = document.getElementById('boot-status-text');
    const bootPercentText = document.getElementById('boot-percent-text');
    const bootProgressFill = document.getElementById('boot-progress-fill');
    const bootTelemetryDetail = document.getElementById('boot-telemetry-detail');
    const bootLoaderBox = document.getElementById('boot-loader-box');
    const bootStartPrompt = document.getElementById('boot-start-prompt');
    const btnPressStart = document.getElementById('btn-press-start');

    const bootThresholds = [
        { minPct: 0, status: 'INITIALIZING PITCH ENGINE...', detail: 'SHADER CACHE: COMPILING STADIUM LIGHTS' },
        { minPct: 25, status: 'INITIALIZING PITCH ENGINE...', detail: 'SHADER CACHE: STADIUM FLOODLIGHTS' },
        { minPct: 55, status: 'LOADING SQUAD FILE: TOMI_GELO_27.PRF...', detail: 'BUFFERING TGFC TRAX SOUNDTRACK STREAM' },
        { minPct: 85, status: 'SYNCING PROJECTS & CAREER DATA...', detail: 'CONNECTING TO BERLIN_EU SERVER' },
        { minPct: 100, status: 'MATCHDAY ENGINE READY', detail: 'ALL SYSTEMS ONLINE // 60 FPS LOCKED' }
    ];

    let bootRafId = null;
    let bootCompleted = false;

    function getBootThresholdForPct(pct) {
        let matched = bootThresholds[0];
        for (let i = 0; i < bootThresholds.length; i++) {
            if (pct >= bootThresholds[i].minPct) {
                matched = bootThresholds[i];
            }
        }
        return matched;
    }

    function finalizeBootLoader(focusStartBtn = true) {
        if (bootRafId !== null) {
            cancelAnimationFrame(bootRafId);
            bootRafId = null;
        }
        bootCompleted = true;
        const doneStep = bootThresholds[bootThresholds.length - 1];
        if (bootStatusText) bootStatusText.textContent = doneStep.status;
        if (bootPercentText) bootPercentText.textContent = '100%';
        if (bootProgressFill) bootProgressFill.style.transform = 'scaleX(1)';
        if (bootTelemetryDetail) bootTelemetryDetail.textContent = doneStep.detail;
        state.bootReady = true;
        if (bootLoaderBox) bootLoaderBox.hidden = true;
        if (bootStartPrompt) bootStartPrompt.hidden = false;
        if (focusStartBtn && btnPressStart) btnPressStart.focus();
    }

    function runBootSequence() {
        let hasSeenBoot = false;
        try {
            hasSeenBoot = window.sessionStorage?.getItem('tgfc-boot-seen') === '1';
        } catch (_) {
            hasSeenBoot = false;
        }
        const duration = (prefersReducedMotion() || hasSeenBoot) ? 120 : 780;

        if (bootProgressFill) bootProgressFill.style.transform = 'scaleX(0)';
        if (bootPercentText) bootPercentText.textContent = '0%';
        const initStep = getBootThresholdForPct(0);
        if (bootStatusText) bootStatusText.textContent = initStep.status;
        if (bootTelemetryDetail) bootTelemetryDetail.textContent = initStep.detail;

        let startTime = null;
        let lastThresholdPct = -1;

        const step = (now) => {
            if (bootCompleted || state.screen !== 'boot') {
                bootRafId = null;
                return;
            }
            const ts = typeof now === 'number' ? now : Date.now();
            if (startTime === null) startTime = ts;
            const elapsed = Math.max(0, ts - startTime);
            const t = duration <= 0 ? 1 : Math.min(1, elapsed / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const pct = Math.min(100, Math.round(eased * 100));

            if (bootProgressFill) {
                bootProgressFill.style.transform = `scaleX(${t >= 1 ? 1 : eased.toFixed(4)})`;
            }
            if (bootPercentText) {
                bootPercentText.textContent = `${pct}%`;
            }

            const stepInfo = getBootThresholdForPct(pct);
            if (stepInfo.minPct !== lastThresholdPct) {
                lastThresholdPct = stepInfo.minPct;
                if (bootStatusText) bootStatusText.textContent = stepInfo.status;
                if (bootTelemetryDetail) bootTelemetryDetail.textContent = stepInfo.detail;
            }

            if (t >= 1) {
                finalizeBootLoader(true);
            } else {
                bootRafId = requestAnimationFrame(step);
            }
        };

        bootRafId = requestAnimationFrame(step);
    }

    runBootSequence();
    updateViewportScale();

    function tryLockLandscapeOrientation() {
        try {
            if (screen.orientation && typeof screen.orientation.lock === 'function') {
                screen.orientation.lock('landscape').catch(() => {});
            }
        } catch (_) {
            // Orientation lock requires fullscreen on most mobile browsers; safe to ignore when unsupported
        }
    }

    function triggerStartFromBoot() {
        if (!state.bootReady || state.screen !== 'boot') return;
        state.hasPassedBoot = true;
        try {
            window.sessionStorage?.setItem('tgfc-boot-seen', '1');
        } catch (_) {
            // Ignore sessionStorage restrictions cleanly
        }
        audio.playSelect();
        tryLockLandscapeOrientation();

        // If device is in portrait mode (< 960px wide and height > width), show the Rotate Phone screen
        if (isPortraitLocked()) {
            navigateToScreen('mobile-gate');
            return;
        }

        // Otherwise (desktop or horizontal phone landscape), start soundtrack and open the Main Menu Hub
        audio.startSoundtrack();
        navigateToScreen('hub');
        showNowPlayingChyron(audio.getCurrentTrack());
    }

    if (btnPressStart) {
        btnPressStart.addEventListener('pointerenter', () => audio.ensureYouTubeLoaded(), { once: true });
        btnPressStart.addEventListener('focus', () => audio.ensureYouTubeLoaded(), { once: true });
        btnPressStart.addEventListener('click', triggerStartFromBoot);
    }

    screenBoot?.addEventListener('click', () => {
        if (state.screen !== 'boot') return;
        if (!state.bootReady) {
            finalizeBootLoader(false);
        }
        triggerStartFromBoot();
    });

    // Handle device rotation between Portrait (locked with Rotate animation) and Landscape (unlocked widescreen)
    function handleViewportOrOrientationChange() {
        updateViewportScale();
        if (typeof isSettingsMenuOpen === 'function' && isSettingsMenuOpen()) {
            syncSettingsMenuPosition();
        }
        if (!state.hasPassedBoot) return;

        if (isPortraitLocked() && state.screen !== 'mobile-gate') {
            if (state.screen === 'hub' || state.screen === 'projects' || state.screen === 'work') {
                state.lastUnlockedScreen = state.screen;
            }
            audio.stopSoundtrack();
            if (traxChyron) traxChyron.hidden = true;
            navigateToScreen('mobile-gate');
        } else if (!isPortraitLocked() && state.screen === 'mobile-gate') {
            const resumeScreen = state.lastUnlockedScreen || 'hub';
            audio.startSoundtrack();
            navigateToScreen(resumeScreen);
            showNowPlayingChyron(audio.getCurrentTrack());
        }
    }

    window.addEventListener('resize', handleViewportOrOrientationChange);
    window.addEventListener('orientationchange', () => {
        setTimeout(handleViewportOrOrientationChange, 120);
    });

    /* ======================================================================
       7. SCREEN NAVIGATION & MAIN MENU BLADES
       ====================================================================== */
    function setActiveBlade(index, playSound = true) {
        const clamped = (index + blades.length) % blades.length;
        if (state.activeBladeIndex !== clamped && playSound) {
            audio.playTick();
        }
        state.activeBladeIndex = clamped;

        blades.forEach((blade, idx) => {
            const isActive = idx === clamped;
            blade.classList.toggle('active', isActive);
            const previewKey = blade.getAttribute('data-preview');
            if (billboards[previewKey]) {
                billboards[previewKey].hidden = !isActive;
                billboards[previewKey].classList.toggle('active', isActive);
            }
        });
    }

    blades.forEach((blade, index) => {
        blade.addEventListener('mouseenter', () => {
            if (state.screen === 'hub') {
                setActiveBlade(index, true);
            }
        });

        blade.addEventListener('click', () => {
            setActiveBlade(index, false);
            const target = blade.getAttribute('data-target-screen');
            audio.playSelect();
            navigateToScreen(target);
        });
    });

    document.querySelectorAll('[data-enter-screen]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-enter-screen');
            audio.playSelect();
            navigateToScreen(target);
        });
    });

    document.querySelectorAll('[data-back-to-hub]').forEach(btn => {
        btn.addEventListener('click', () => {
            audio.playBack();
            navigateToScreen('hub');
        });
    });

    const hudHomeBtn = document.getElementById('hud-home-btn');
    if (hudHomeBtn) {
        hudHomeBtn.addEventListener('click', () => {
            if (state.screen !== 'hub') {
                audio.playBack();
                navigateToScreen('hub');
            }
        });
    }

    const bentoEnterTimers = new WeakMap();
    function triggerBentoEntrance(container) {
        if (!container) return;
        const existingTimer = bentoEnterTimers.get(container);
        if (existingTimer) {
            clearTimeout(existingTimer);
            bentoEnterTimers.delete(container);
        }
        container.classList.remove('bento-enter');
        if (prefersReducedMotion()) return;
        void container.offsetWidth;
        container.classList.add('bento-enter');
        const timerId = setTimeout(() => {
            container.classList.remove('bento-enter');
            bentoEnterTimers.delete(container);
        }, 600);
        bentoEnterTimers.set(container, timerId);
    }

    function navigateToScreen(targetScreen) {
        if (isPortraitLocked() && targetScreen !== 'boot') {
            targetScreen = 'mobile-gate';
        }
        if (targetScreen === 'hub' || targetScreen === 'projects' || targetScreen === 'work') {
            state.lastUnlockedScreen = targetScreen;
        }
        if (typeof closeSettingsMenu === 'function') {
            closeSettingsMenu(false);
        }

        state.screen = targetScreen;
        viewportEl.setAttribute('data-active-screen', targetScreen);
        updateViewportScale();

        screenBoot.hidden = targetScreen !== 'boot';
        screenMobileGate.hidden = targetScreen !== 'mobile-gate';
        screenHub.hidden = targetScreen !== 'hub';
        screenProjects.hidden = targetScreen !== 'projects';
        screenWork.hidden = targetScreen !== 'work';

        const showHud = targetScreen === 'hub' || targetScreen === 'projects' || targetScreen === 'work';
        topHud.hidden = !showHud;
        bottomBar.hidden = !showHud;

        if (targetScreen === 'hub') {
            hudCategory.textContent = 'TGFC 27';
            hudTitle.textContent = 'MAIN MENU HUB';
            promptBackBtn.hidden = true;
            promptBumpers.hidden = true;
            setActiveBlade(state.activeBladeIndex, false);
        } else if (targetScreen === 'projects') {
            hudCategory.textContent = 'PROJECTS // KICK OFF';
            hudTitle.textContent = 'KICK OFF: SELECT CLUB';
            promptBackBtn.hidden = false;
            promptBumpers.hidden = true;
            triggerBentoEntrance(projectsBentoGrid);
        } else if (targetScreen === 'work') {
            hudCategory.textContent = 'WORK // CAREER MODE';
            hudTitle.textContent = state.workTab === 'transfers'
                ? 'CAREER TRANSFER LEDGER (10)'
                : 'MANAGER CAREER CENTRAL';
            promptBackBtn.hidden = false;
            promptBumpers.hidden = false;
            if (state.workTab === 'central') {
                triggerBentoEntrance(centralBentoGrid);
            }
        }
    }

    /* ======================================================================
       8. PROJECTS MODE: KICK-OFF CLUB SELECTOR & BUMPER TABS
       ====================================================================== */
    const clubCards = Array.from(document.querySelectorAll('.club-select-card'));
    const clubCounterLabel = document.getElementById('club-counter-label');
    const previewClubLeague = document.getElementById('preview-club-league');
    const previewClubStatus = document.getElementById('preview-club-status');
    const previewClubCrest = document.getElementById('preview-club-crest');
    const previewClubWatermark = document.getElementById('preview-club-watermark');
    const previewClubOvr = document.getElementById('preview-club-ovr');
    const previewDialArc = document.getElementById('preview-dial-arc');
    const previewDialNeedle = document.getElementById('preview-dial-needle');
    const previewClubStars = document.getElementById('preview-club-stars');
    const previewClubStadium = document.getElementById('preview-club-stadium');
    const previewClubName = document.getElementById('preview-club-name');
    const previewClubNamePrimary = document.getElementById('preview-club-name-primary');
    const previewClubNameOutline = document.getElementById('preview-club-name-outline');
    const previewClubDesc = document.getElementById('preview-club-desc');
    const previewClubAtt = document.getElementById('preview-club-att');
    const previewClubMid = document.getElementById('preview-club-mid');
    const previewClubDef = document.getElementById('preview-club-def');
    const previewBarAtt = document.getElementById('preview-bar-att');
    const previewBarMid = document.getElementById('preview-bar-mid');
    const previewBarDef = document.getElementById('preview-bar-def');
    const previewClubFormation = document.getElementById('preview-club-formation');
    const previewClubStack = document.getElementById('preview-club-stack');
    const previewClubSeason = document.getElementById('preview-club-season');
    const previewClubLink = document.getElementById('preview-club-link');
    const previewClubCta = document.getElementById('preview-club-cta');

    const statAnimFrames = new WeakMap();
    function animateStatNumber(el, toVal, suffix = '', duration = 260, animate = true) {
        if (!el) return;
        const prevRaf = statAnimFrames.get(el);
        if (prevRaf !== undefined) {
            cancelAnimationFrame(prevRaf);
            statAnimFrames.delete(el);
        }

        if (el.style) {
            el.style.fontVariantNumeric = 'tabular-nums';
        }

        const target = Number(toVal);
        const parsedFrom = el.dataset && el.dataset.val !== undefined
            ? Number(el.dataset.val)
            : parseInt(el.textContent, 10);
        const fromVal = Number.isFinite(parsedFrom) ? parsedFrom : target;

        if (!animate || prefersReducedMotion() || duration <= 0 || fromVal === target) {
            if (el.dataset) el.dataset.val = String(target);
            el.textContent = `${target}${suffix}`;
            return;
        }

        let startTime = null;
        const step = (now) => {
            const ts = typeof now === 'number' ? now : Date.now();
            if (startTime === null) startTime = ts;
            const progress = Math.min(1, Math.max(0, (ts - startTime) / duration));
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(fromVal + (target - fromVal) * eased);
            if (el.dataset) el.dataset.val = String(current);
            el.textContent = `${current}${suffix}`;

            if (progress < 1) {
                const id = requestAnimationFrame(step);
                statAnimFrames.set(el, id);
            } else {
                if (el.dataset) el.dataset.val = String(target);
                el.textContent = `${target}${suffix}`;
                statAnimFrames.delete(el);
            }
        };

        const id = requestAnimationFrame(step);
        statAnimFrames.set(el, id);
    }

    function selectProjectClub(index, playSound = true) {
        if (!PROJECT_CLUBS.length) return;
        const clamped = (index + PROJECT_CLUBS.length) % PROJECT_CLUBS.length;
        if (state.activeClubIndex !== clamped && playSound) {
            audio.playTick();
        }
        state.activeClubIndex = clamped;
        const club = PROJECT_CLUBS[clamped];

        clubCards.forEach((card, idx) => {
            const isSelected = idx === clamped;
            card.classList.toggle('active', isSelected);
            card.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });

        if (clubCounterLabel) clubCounterLabel.textContent = `CLUB 0${clamped + 1} / 0${PROJECT_CLUBS.length}`;
        if (previewClubLeague) previewClubLeague.textContent = club.league;
        if (previewClubStatus && club.statusPill) previewClubStatus.textContent = club.statusPill;
        if (previewClubCrest) {
            previewClubCrest.textContent = club.code;
            previewClubCrest.className = `club-crest-giant ${club.crestClass}`;
        }
        if (previewClubWatermark) previewClubWatermark.textContent = club.code;

        if (playSound && !prefersReducedMotion()) {
            [previewClubCrest, previewClubWatermark].forEach(el => {
                if (!el) return;
                el.classList.remove('crest-swap-pop');
                void el.offsetWidth;
                el.classList.add('crest-swap-pop');
            });
        } else {
            previewClubWatermark?.classList.remove('crest-swap-pop');
        }

        const numericOvr = parseInt(club.ovr, 10) || 70;
        animateStatNumber(previewClubOvr, numericOvr, ' OVR', 260, playSound);

        const clampedOvr = Math.max(70, Math.min(99, numericOvr));
        const ovrNorm = (clampedOvr - 70) / 29;
        const dialFill = 20 + ovrNorm * 80;
        const dialOffset = (100 - dialFill).toFixed(1);
        const needleDeg = (-72 + ovrNorm * 144).toFixed(1);
        if (previewDialArc) {
            previewDialArc.setAttribute('stroke-dashoffset', dialOffset);
            previewDialArc.style.strokeDashoffset = dialOffset;
        }
        if (previewDialNeedle) {
            previewDialNeedle.style.transform = `rotate(${needleDeg}deg)`;
        }

        if (previewClubStars) {
            previewClubStars.textContent = club.stars;
            const starCount = (club.stars.match(/★/g) || []).length;
            previewClubStars.setAttribute('aria-label', `${starCount} out of 5 stars`);
        }
        if (previewClubStadium && club.stadium) previewClubStadium.textContent = club.stadium;

        if (previewClubNamePrimary && previewClubNameOutline) {
            const parts = club.name ? club.name.split(' ') : ['PROJECT', 'CLUB'];
            const fallbackPrimary = parts.slice(0, -1).join(' ') || club.name || '';
            const fallbackOutline = parts.length > 1 ? parts[parts.length - 1] : '';
            previewClubNamePrimary.textContent = club.namePrimary || fallbackPrimary;
            previewClubNameOutline.textContent = club.nameOutline || fallbackOutline;
            if (previewClubName) {
                previewClubName.setAttribute('aria-label', club.name);
            }
        } else if (previewClubName) {
            previewClubName.textContent = club.name;
        }

        if (previewClubDesc) previewClubDesc.textContent = club.desc;

        animateStatNumber(previewClubAtt, club.att, '', 260, playSound);
        animateStatNumber(previewClubMid, club.mid, '', 260, playSound);
        animateStatNumber(previewClubDef, club.def, '', 260, playSound);
        if (previewBarAtt) previewBarAtt.style.height = `${club.att}%`;
        if (previewBarMid) previewBarMid.style.height = `${club.mid}%`;
        if (previewBarDef) previewBarDef.style.height = `${club.def}%`;

        if (previewClubFormation) previewClubFormation.textContent = club.formation;
        if (previewClubStack) previewClubStack.textContent = club.stack;
        if (previewClubSeason) previewClubSeason.textContent = club.season;
        if (previewClubCta && club.ctaLabel) previewClubCta.textContent = club.ctaLabel;
        if (previewClubLink && club.url) {
            previewClubLink.setAttribute('href', club.url);
            previewClubLink.setAttribute('target', '_blank');
            previewClubLink.setAttribute('rel', 'noopener noreferrer');
        }
    }

    clubCards.forEach((card, idx) => {
        card.addEventListener('click', () => selectProjectClub(idx, true));
    });

    if (previewClubLink) {
        previewClubLink.addEventListener('click', () => {
            try {
                audio.playSelect();
            } catch (_) {
                // Keep external navigation unblocked if Web Audio is unavailable
            }
        });
    }

    selectProjectClub(0, false);

    const projectsTabBtns = Array.from(document.querySelectorAll('[data-projects-tab]'));

    function switchProjectsTab() {
        state.projectsTab = 'kickoff';
        projectsTabBtns.forEach(btn => {
            const isTarget = btn.getAttribute('data-projects-tab') === 'kickoff';
            btn.classList.toggle('active', isTarget);
            btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
        });
        if (projectsViewKickoff) projectsViewKickoff.hidden = false;
        hudTitle.textContent = 'KICK OFF: SELECT CLUB';
    }

    projectsTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.projectsTab !== 'kickoff') {
                audio.playTick();
                switchProjectsTab();
            }
        });
    });

    /* ======================================================================
       9. WORK MODE: CAREER BUMPER TABS
       ====================================================================== */
    const WORK_TABS = ['central', 'transfers'];
    const workTabBtns = Array.from(document.querySelectorAll('[data-work-tab]'));

    function switchWorkTab(tabName) {
        const prevTab = state.workTab;
        const nextTab = WORK_TABS.includes(tabName) ? tabName : 'central';
        audio.playTick();
        state.workTab = nextTab;
        workTabBtns.forEach(btn => {
            const isTarget = btn.getAttribute('data-work-tab') === nextTab;
            btn.classList.toggle('active', isTarget);
            btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
        });
        if (workViewCentral) workViewCentral.hidden = nextTab !== 'central';
        if (workViewTransfers) workViewTransfers.hidden = nextTab !== 'transfers';

        hudTitle.textContent = nextTab === 'transfers'
            ? 'CAREER TRANSFER LEDGER (10)'
            : 'MANAGER CAREER CENTRAL';

        if (nextTab === 'central' && prevTab !== 'central') {
            triggerBentoEntrance(centralBentoGrid);
        }
    }

    workTabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchWorkTab(btn.getAttribute('data-work-tab')));
    });

    document.getElementById('work-lb-btn')?.addEventListener('click', () => {
        const currIdx = WORK_TABS.indexOf(state.workTab);
        const prevIdx = (currIdx - 1 + WORK_TABS.length) % WORK_TABS.length;
        switchWorkTab(WORK_TABS[prevIdx]);
    });
    document.getElementById('work-rb-btn')?.addEventListener('click', () => {
        const currIdx = WORK_TABS.indexOf(state.workTab);
        const nextIdx = (currIdx + 1) % WORK_TABS.length;
        switchWorkTab(WORK_TABS[nextIdx]);
    });

    /* ======================================================================
       10. SOUNDTRACK CONTROLS, SETTINGS POPOVER & SITE THEME PICKER
       ====================================================================== */
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const btnAudioToggle = document.getElementById('btn-audio-toggle');
    const audioStatusLabel = document.getElementById('audio-status-label');
    const btnNextTrack = document.getElementById('btn-next-track');
    const promptNextTrackBtn = document.getElementById('prompt-next-track-btn');

    const btnSettingsToggle = document.getElementById('btn-settings-toggle');
    const btnSettingsClose = document.getElementById('btn-settings-close');
    const hudSettingsMenu = document.getElementById('hud-settings-menu');
    const settingsAudioToggle = document.getElementById('settings-audio-toggle');
    const settingsAudioLabel = document.getElementById('settings-audio-label');
    const settingsNextTrack = document.getElementById('settings-next-track');
    const themeOptionBtns = Array.from(document.querySelectorAll('[data-bento-theme-option]'));

    function applySiteTheme(themeName, persist = true, origin = null) {
        const theme = themeName === 'dark' ? 'dark' : 'pop';

        const applyThemeDom = () => {
            activeSiteTheme = theme;
            document.documentElement.setAttribute('data-theme', theme);
            if (themeColorMeta) {
                themeColorMeta.setAttribute('content', theme === 'dark' ? '#06080c' : '#f4f3ef');
            }
            themeOptionBtns.forEach(btn => {
                const isSelected = btn.getAttribute('data-bento-theme-option') === theme;
                btn.classList.toggle('active', isSelected);
                btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
                btn.setAttribute('tabindex', isSelected ? '0' : '-1');
            });
            redrawStaticParticles?.();
        };

        if (persist) {
            try {
                window.localStorage.setItem(THEME_STORAGE_KEY, theme);
            } catch (_) {
                // Ignore storage quota/privacy-mode errors cleanly
            }
        }

        if (persist && typeof document.startViewTransition === 'function' && !prefersReducedMotion()) {
            const root = document.documentElement;
            let rx = window.innerWidth * 0.9;
            let ry = 40;
            if (origin && Number.isFinite(origin.x) && Number.isFinite(origin.y)) {
                rx = origin.x;
                ry = origin.y;
            } else if (btnSettingsToggle && typeof btnSettingsToggle.getBoundingClientRect === 'function') {
                const rect = btnSettingsToggle.getBoundingClientRect();
                if (rect && (rect.width > 0 || rect.height > 0 || rect.left !== 0 || rect.top !== 0)) {
                    rx = rect.left + rect.width / 2;
                    ry = rect.top + rect.height / 2;
                }
            }

            const maxX = Math.max(rx, window.innerWidth - rx);
            const maxY = Math.max(ry, window.innerHeight - ry);
            const radius = Math.hypot(maxX, maxY);

            root.style.setProperty('--ripple-x', `${rx}px`);
            root.style.setProperty('--ripple-y', `${ry}px`);
            root.style.setProperty('--ripple-r', `${Math.ceil(radius)}px`);
            root.classList.add('theme-transitioning');

            let transition;
            try {
                transition = document.startViewTransition(() => {
                    applyThemeDom();
                });
            } catch (_) {
                root.classList.remove('theme-transitioning');
                applyThemeDom();
                return;
            }

            Promise.resolve(transition && transition.finished).finally(() => {
                root.classList.remove('theme-transitioning');
            });
            return;
        }

        applyThemeDom();
    }

    applySiteTheme(activeSiteTheme, false);

    function syncAudioButtonsUI(isOn) {
        const text = isOn ? 'AUDIO: ON' : 'AUDIO: MUTED';
        const pressed = isOn ? 'true' : 'false';
        if (audioStatusLabel) audioStatusLabel.textContent = text;
        if (btnAudioToggle) btnAudioToggle.setAttribute('aria-pressed', pressed);
        if (settingsAudioLabel) settingsAudioLabel.textContent = text;
        if (settingsAudioToggle) settingsAudioToggle.setAttribute('aria-pressed', pressed);
        if (hudEqBars) {
            hudEqBars.classList.toggle('paused', !isOn || !audio.isPlayingMusic);
        }
    }

    function isSettingsMenuOpen() {
        return Boolean(hudSettingsMenu && !hudSettingsMenu.hidden);
    }

    function syncSettingsMenuPosition() {
        if (!hudSettingsMenu || !topHud) return;
        const topOffset = topHud.offsetTop + topHud.offsetHeight + 8;
        if (topOffset > 8) {
            hudSettingsMenu.style.top = `${topOffset}px`;
        } else {
            hudSettingsMenu.style.removeProperty('top');
        }
    }

    function openSettingsMenu(playSound = true) {
        if (!hudSettingsMenu || topHud?.hidden) return;
        if (playSound) audio.playTick();
        syncSettingsMenuPosition();
        hudSettingsMenu.hidden = false;
        btnSettingsToggle?.setAttribute('aria-expanded', 'true');
        btnSettingsToggle?.classList.add('is-open');
        const activeThemeBtn = themeOptionBtns.find(
            btn => btn.classList.contains('active') || btn.getAttribute('aria-checked') === 'true'
        ) || themeOptionBtns[0];
        activeThemeBtn?.focus();
    }

    function closeSettingsMenu(playSound = false) {
        if (!hudSettingsMenu || hudSettingsMenu.hidden) return;
        const hadFocusInside = Boolean(
            document.activeElement &&
            typeof hudSettingsMenu.contains === 'function' &&
            hudSettingsMenu.contains(document.activeElement)
        );
        if (playSound) audio.playTick();
        hudSettingsMenu.hidden = true;
        btnSettingsToggle?.setAttribute('aria-expanded', 'false');
        btnSettingsToggle?.classList.remove('is-open');
        if (hadFocusInside) {
            btnSettingsToggle?.focus();
        }
    }

    function toggleSettingsMenu() {
        if (isSettingsMenuOpen()) {
            closeSettingsMenu(true);
        } else {
            openSettingsMenu(true);
        }
    }

    function handleAudioToggle() {
        const isOn = audio.toggleMute();
        syncAudioButtonsUI(isOn);
    }

    function handleNextTrack() {
        audio.playTick();
        const next = audio.nextTrack(false);
        showNowPlayingChyron(next);
    }

    btnAudioToggle?.addEventListener('click', handleAudioToggle);
    settingsAudioToggle?.addEventListener('click', handleAudioToggle);
    btnNextTrack?.addEventListener('click', handleNextTrack);
    settingsNextTrack?.addEventListener('click', handleNextTrack);
    promptNextTrackBtn?.addEventListener('click', handleNextTrack);

    btnSettingsToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSettingsMenu();
    });

    btnSettingsClose?.addEventListener('click', () => {
        closeSettingsMenu(true);
        btnSettingsToggle?.focus();
    });

    themeOptionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTheme = btn.getAttribute('data-bento-theme-option');
            audio.playTick();
            const hasPointerCoords = Boolean(
                e && typeof e.clientX === 'number' && typeof e.clientY === 'number' &&
                (e.clientX !== 0 || e.clientY !== 0)
            );
            let origin = null;
            if (hasPointerCoords) {
                origin = { x: e.clientX, y: e.clientY };
            } else if (typeof btn.getBoundingClientRect === 'function') {
                const rect = btn.getBoundingClientRect();
                if (rect && (rect.width > 0 || rect.height > 0 || rect.left !== 0 || rect.top !== 0)) {
                    origin = {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    };
                }
            }
            applySiteTheme(targetTheme, true, origin);
        });
    });

    if (hasFinePointer() && !prefersReducedMotion()) {
        const glintContainers = document.querySelectorAll('.kickoff-bento-grid, .central-bento-grid, .hub-showcase-stage');
        let pendingGlint = null;
        let glintRafId = null;

        const applyTileGlint = () => {
            glintRafId = null;
            const current = pendingGlint;
            pendingGlint = null;
            if (!current || prefersReducedMotion() || !hasFinePointer()) return;
            const { card, clientX, clientY } = current;
            if (!card || typeof card.getBoundingClientRect !== 'function') return;
            const rect = card.getBoundingClientRect();
            if (!rect || rect.width <= 0 || rect.height <= 0) return;
            const mx = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
            const my = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
            card.style.setProperty('--mx', `${mx.toFixed(1)}%`);
            card.style.setProperty('--my', `${my.toFixed(1)}%`);
        };

        glintContainers.forEach(container => {
            container.addEventListener('pointermove', (e) => {
                if (prefersReducedMotion() || !hasFinePointer()) return;
                const target = e.target;
                if (!(target instanceof Element) || typeof target.closest !== 'function') return;
                const card = target.closest('.bento-tile, .showcase-billboard');
                if (!card || !container.contains(card)) return;
                pendingGlint = {
                    card,
                    clientX: e.clientX,
                    clientY: e.clientY
                };
                if (glintRafId === null) {
                    glintRafId = requestAnimationFrame(applyTileGlint);
                }
            });
        });
    }

    document.addEventListener('click', (e) => {
        if (!isSettingsMenuOpen()) return;
        const target = e.target;
        if (
            target instanceof Node &&
            !hudSettingsMenu.contains(target) &&
            !btnSettingsToggle?.contains(target)
        ) {
            closeSettingsMenu(false);
        }
    });

    window.addEventListener('resize', () => {
        if (isSettingsMenuOpen()) {
            syncSettingsMenuPosition();
        }
    });

    promptBackBtn?.addEventListener('click', () => {
        if (state.screen === 'projects' || state.screen === 'work') {
            audio.playBack();
            navigateToScreen('hub');
        }
    });

    promptSelectBtn?.addEventListener('click', () => {
        if (state.screen === 'hub') {
            const target = blades[state.activeBladeIndex].getAttribute('data-target-screen');
            audio.playSelect();
            navigateToScreen(target);
        }
    });

    /* ======================================================================
       11. GLOBAL KEYBOARD / CONTROLLER SHORTCUTS
       ====================================================================== */
    function matchesOrClosest(el, selector) {
        if (!(el instanceof Element)) return false;
        if (typeof el.closest === 'function') return Boolean(el.closest(selector));
        if (typeof el.matches === 'function') return el.matches(selector);
        return false;
    }

    function isTypingTarget(target) {
        if (!(target instanceof Element)) return false;
        const tag = target.tagName;
        return (
            tag === 'INPUT' ||
            tag === 'TEXTAREA' ||
            tag === 'SELECT' ||
            target.isContentEditable ||
            Boolean(target.closest('[contenteditable="true"]'))
        );
    }

    window.addEventListener('keydown', (e) => {
        // 1. Boot Screen: Enter/Space skips during loading; any key starts once loaded
        if (state.screen === 'boot') {
            if (!state.bootReady) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    finalizeBootLoader(false);
                    triggerStartFromBoot();
                }
            } else {
                e.preventDefault();
                triggerStartFromBoot();
            }
            return;
        }

        // 2. Mobile Gate Screen: Lock navigation on mobile
        if (state.screen === 'mobile-gate') {
            return;
        }

        if (isTypingTarget(e.target)) {
            return;
        }

        // Escape closes open Settings popover first without navigating back
        if (e.key === 'Escape' && isSettingsMenuOpen()) {
            e.preventDefault();
            e.stopPropagation();
            closeSettingsMenu(true);
            btnSettingsToggle?.focus();
            return;
        }

        const hasModifier = e.ctrlKey || e.metaKey || e.altKey;

        // Settings & Theme Picker shortcut (O)
        if (!hasModifier && (e.key === 'o' || e.key === 'O')) {
            e.preventDefault();
            toggleSettingsMenu();
            return;
        }

        // Audio mute shortcut (M)
        if (!hasModifier && (e.key === 'm' || e.key === 'M')) {
            e.preventDefault();
            handleAudioToggle();
            return;
        }

        // Next Soundtrack Song shortcut (N)
        if (!hasModifier && (e.key === 'n' || e.key === 'N')) {
            e.preventDefault();
            handleNextTrack();
            return;
        }

        // Prevent screen navigation behind open Settings popover
        if (isSettingsMenuOpen()) {
            const activeOptIdx = themeOptionBtns.indexOf(document.activeElement);
            if (activeOptIdx !== -1 && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                e.preventDefault();
                const delta = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
                const nextBtn = themeOptionBtns[(activeOptIdx + delta + themeOptionBtns.length) % themeOptionBtns.length];
                audio.playTick();
                applySiteTheme(nextBtn.getAttribute('data-bento-theme-option'), true);
                nextBtn.focus();
            }
            return;
        }

        // 3. Main Menu Hub Navigation
        if (state.screen === 'hub') {
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                e.preventDefault();
                setActiveBlade(state.activeBladeIndex + 1, true);
            } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                setActiveBlade(state.activeBladeIndex - 1, true);
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const target = blades[state.activeBladeIndex].getAttribute('data-target-screen');
                audio.playSelect();
                navigateToScreen(target);
            }
            return;
        }

        // 4. Projects Screen Navigation
        if (state.screen === 'projects') {
            if (e.key === 'Escape' || e.key === 'Backspace') {
                e.preventDefault();
                audio.playBack();
                navigateToScreen('hub');
            } else if (state.projectsTab === 'kickoff') {
                if (e.key === 'ArrowDown' || (!hasModifier && (e.key === 's' || e.key === 'S'))) {
                    e.preventDefault();
                    selectProjectClub(state.activeClubIndex + 1, true);
                } else if (e.key === 'ArrowUp' || (!hasModifier && (e.key === 'w' || e.key === 'W'))) {
                    e.preventDefault();
                    selectProjectClub(state.activeClubIndex - 1, true);
                } else if (!hasModifier && (e.key === 'Enter' || e.key === ' ')) {
                    const target = e.target;
                    const isLaunchLink = Boolean(
                        previewClubLink &&
                        (target === previewClubLink ||
                            (target instanceof Element &&
                                typeof previewClubLink.contains === 'function' &&
                                previewClubLink.contains(target)))
                    );
                    if (isLaunchLink) {
                        if (e.key === ' ') {
                            e.preventDefault();
                            previewClubLink.click();
                        }
                        return;
                    }
                    const isOtherInteractive = target instanceof Element &&
                        matchesOrClosest(target, 'a, button, [role="button"]') &&
                        !matchesOrClosest(target, '.club-select-card');
                    if (isOtherInteractive) {
                        return;
                    }
                    e.preventDefault();
                    previewClubLink?.click();
                }
            }
            return;
        }

        // 5. Work Screen Navigation
        if (state.screen === 'work') {
            if (e.key === 'Escape' || e.key === 'Backspace') {
                e.preventDefault();
                audio.playBack();
                navigateToScreen('hub');
            } else if (e.key === 'q' || e.key === 'Q') {
                e.preventDefault();
                const currIdx = WORK_TABS.indexOf(state.workTab);
                const prevIdx = (currIdx - 1 + WORK_TABS.length) % WORK_TABS.length;
                switchWorkTab(WORK_TABS[prevIdx]);
            } else if (e.key === 'e' || e.key === 'E') {
                e.preventDefault();
                const currIdx = WORK_TABS.indexOf(state.workTab);
                const nextIdx = (currIdx + 1) % WORK_TABS.length;
                switchWorkTab(WORK_TABS[nextIdx]);
            }
        }
    });

    // Expose SFX hooks for Frostbite 2.5D Broadcast Stage & Telemetry Engine
    window.tgfcPlaySelectSfx = () => audio.playSelect();
    window.tgfcPlayCelebrationSfx = () => audio.playCelebration();
});
