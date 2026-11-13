/**
 * TGFC 26 — Tomi Gelo Football Club Portfolio (Iteration 1)
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

    /* ======================================================================
       1. PLACEHOLDER DATA STORE (ITERATION 1)
       ====================================================================== */
    const PLACEHOLDER_CLUBS = [
        {
            id: 'alpha',
            code: 'P1',
            crestClass: 'crest-volt',
            league: 'LEAGUE 01 // AI & ANALYTICS (PLACEHOLDER)',
            name: 'PROJECT ALPHA FC',
            namePrimary: 'PROJECT ALPHA',
            nameOutline: 'FC',
            ovr: '92 OVR',
            stars: '★★★★★',
            desc: 'Placeholder description for Project 01. In Iteration 2, this slot will connect to your real project data, live deployment URLs, and architecture telemetry.',
            att: 94,
            mid: 92,
            def: 90,
            formation: '4-3-3 ATTACKING',
            stack: 'AUTONOMOUS AGENTS // PLACEHOLDER',
            season: '2026 SEASON',
            url: '#projects'
        },
        {
            id: 'beta',
            code: 'P2',
            crestClass: 'crest-cyan',
            league: 'LEAGUE 02 // CONSUMER & AUDIO (PLACEHOLDER)',
            name: 'PROJECT BETA UNITED',
            namePrimary: 'PROJECT BETA',
            nameOutline: 'UNITED',
            ovr: '89 OVR',
            stars: '★★★★☆',
            desc: 'Placeholder description for Project 02. Demonstrates how switching clubs in Kick-Off dynamically updates the ATT / MID / DEF telemetry bars and match facts.',
            att: 91,
            mid: 89,
            def: 88,
            formation: '4-2-3-1 WIDE',
            stack: 'WEB AUDIO & QR // PLACEHOLDER',
            season: '2025 SEASON',
            url: '#projects'
        },
        {
            id: 'gamma',
            code: 'P3',
            crestClass: 'crest-gold',
            league: 'LEAGUE 03 // OPEN SOURCE & DATA (PLACEHOLDER)',
            name: 'PROJECT GAMMA ATHLETIC',
            namePrimary: 'PROJECT GAMMA',
            nameOutline: 'ATHLETIC',
            ovr: '94 OVR',
            stars: '★★★★★',
            desc: 'Placeholder description for Project 03. Showcases a 5-star Open Source club item with top-tier backend and developer experience ratings.',
            att: 95,
            mid: 96,
            def: 92,
            formation: '3-4-3 DIAMOND',
            stack: 'LLM CONTEXT CLI // PLACEHOLDER',
            stackRole: 'CLI',
            season: '2026 SEASON',
            url: '#projects'
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

        preloadYouTubeAPI() {
            if (window.YT && window.YT.Player) {
                this.createYouTubePlayer();
                return;
            }

            const prevCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (typeof prevCallback === 'function') prevCallback();
                this.createYouTubePlayer();
            };

            if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                tag.async = true;
                document.head.appendChild(tag);
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

    // Preload YouTube IFrame API immediately while the boot screen is running
    audio.preloadYouTubeAPI();

    /* ======================================================================
       4. STADIUM AMBIENT PARTICLE CANVAS
       ====================================================================== */
    const canvas = document.getElementById('stadium-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const particles = [];

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        for (let i = 0; i < 38; i++) {
            particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                r: Math.random() * 1.8 + 0.5,
                vx: (Math.random() - 0.5) * 0.35,
                vy: -Math.random() * 0.4 - 0.1,
                alpha: Math.random() * 0.45 + 0.1
            });
        }

        function renderStadiumParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.y < 0) p.y = canvas.height;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 104, ${p.alpha})`;
                ctx.fill();
            });
            requestAnimationFrame(renderStadiumParticles);
        }
        renderStadiumParticles();
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
        projectsTab: 'kickoff',     // 'kickoff' | 'pitch'
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

    const bootSteps = [
        { pct: 22, status: 'INITIALIZING PITCH ENGINE...', detail: 'SHADER CACHE: STADIUM FLOODLIGHTS' },
        { pct: 54, status: 'LOADING SQUAD FILE: TOMI_GELO_26.PRF...', detail: 'BUFFERING TGFC TRAX SOUNDTRACK STREAM' },
        { pct: 84, status: 'SYNCING MATCHES & CAREER DATA...', detail: 'CONNECTING TO BERLIN_EU SERVER' },
        { pct: 100, status: 'MATCHDAY ENGINE READY', detail: 'ALL SYSTEMS ONLINE // 60 FPS LOCKED' }
    ];

    let currentStepIdx = 0;
    function runBootSequence() {
        const timer = setInterval(() => {
            if (currentStepIdx >= bootSteps.length) {
                clearInterval(timer);
                state.bootReady = true;
                bootLoaderBox.hidden = true;
                bootStartPrompt.hidden = false;
                btnPressStart.focus();
                return;
            }
            const step = bootSteps[currentStepIdx];
            bootStatusText.textContent = step.status;
            bootPercentText.textContent = `${step.pct}%`;
            bootProgressFill.style.width = `${step.pct}%`;
            bootTelemetryDetail.textContent = step.detail;
            currentStepIdx++;
        }, 360);
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

    btnPressStart.addEventListener('click', triggerStartFromBoot);

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
            hudCategory.textContent = 'TGFC 26';
            hudTitle.textContent = 'MAIN MENU HUB';
            promptBackBtn.hidden = true;
            promptBumpers.hidden = true;
            setActiveBlade(state.activeBladeIndex, false);
        } else if (targetScreen === 'projects') {
            hudCategory.textContent = 'PROJECTS // MATCHES & TEAMS';
            hudTitle.textContent = state.projectsTab === 'kickoff' ? 'KICK OFF: SELECT CLUB' : '4-3-3 TEAM SHEET';
            promptBackBtn.hidden = false;
            promptBumpers.hidden = false;
        } else if (targetScreen === 'work') {
            hudCategory.textContent = 'WORK // CAREER MODE';
            if (state.workTab === 'central') {
                hudTitle.textContent = 'MANAGER CAREER CENTRAL';
            } else if (state.workTab === 'transfers') {
                hudTitle.textContent = 'CAREER TRANSFER LEDGER (10)';
            } else {
                hudTitle.textContent = 'TACTICS & PLAYSTYLES+';
            }
            promptBackBtn.hidden = false;
            promptBumpers.hidden = false;
        }
    }

    /* ======================================================================
       8. PROJECTS MODE: KICK-OFF CLUB SELECTOR & BUMPER TABS
       ====================================================================== */
    const clubCards = Array.from(document.querySelectorAll('.club-select-card'));
    const clubCounterLabel = document.getElementById('club-counter-label');
    const previewClubLeague = document.getElementById('preview-club-league');
    const previewClubCrest = document.getElementById('preview-club-crest');
    const previewClubWatermark = document.getElementById('preview-club-watermark');
    const previewClubOvr = document.getElementById('preview-club-ovr');
    const previewClubStars = document.getElementById('preview-club-stars');
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

    function selectProjectClub(index, playSound = true) {
        if (!PLACEHOLDER_CLUBS.length) return;
        const clamped = (index + PLACEHOLDER_CLUBS.length) % PLACEHOLDER_CLUBS.length;
        if (state.activeClubIndex !== clamped && playSound) {
            audio.playTick();
        }
        state.activeClubIndex = clamped;
        const club = PLACEHOLDER_CLUBS[clamped];

        clubCards.forEach((card, idx) => {
            const isSelected = idx === clamped;
            card.classList.toggle('active', isSelected);
            card.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        });

        if (clubCounterLabel) clubCounterLabel.textContent = `CLUB 0${clamped + 1} / 0${PLACEHOLDER_CLUBS.length}`;
        if (previewClubLeague) previewClubLeague.textContent = club.league;
        if (previewClubCrest) {
            previewClubCrest.textContent = club.code;
            previewClubCrest.className = `club-crest-giant ${club.crestClass}`;
        }
        if (previewClubWatermark) previewClubWatermark.textContent = club.code;
        if (previewClubOvr) previewClubOvr.textContent = club.ovr;
        if (previewClubStars) {
            previewClubStars.textContent = club.stars;
            const starCount = (club.stars.match(/★/g) || []).length;
            previewClubStars.setAttribute('aria-label', `${starCount} out of 5 stars`);
        }

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

        if (previewClubAtt) previewClubAtt.textContent = club.att;
        if (previewClubMid) previewClubMid.textContent = club.mid;
        if (previewClubDef) previewClubDef.textContent = club.def;
        if (previewBarAtt) previewBarAtt.style.height = `${club.att}%`;
        if (previewBarMid) previewBarMid.style.height = `${club.mid}%`;
        if (previewBarDef) previewBarDef.style.height = `${club.def}%`;

        if (previewClubFormation) previewClubFormation.textContent = club.formation;
        if (previewClubStack) previewClubStack.textContent = club.stack;
        if (previewClubSeason) previewClubSeason.textContent = club.season;
        if (previewClubLink && club.url) previewClubLink.setAttribute('href', club.url);
    }

    clubCards.forEach((card, idx) => {
        card.addEventListener('click', () => selectProjectClub(idx, true));
    });

    selectProjectClub(0, false);

    const projectsTabBtns = Array.from(document.querySelectorAll('[data-projects-tab]'));
    const projectsViewKickoff = document.getElementById('projects-view-kickoff');
    const projectsViewPitch = document.getElementById('projects-view-pitch');

    function switchProjectsTab(tabName) {
        audio.playTick();
        state.projectsTab = tabName;
        projectsTabBtns.forEach(btn => {
            const isTarget = btn.getAttribute('data-projects-tab') === tabName;
            btn.classList.toggle('active', isTarget);
            btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
        });
        projectsViewKickoff.hidden = tabName !== 'kickoff';
        projectsViewPitch.hidden = tabName !== 'pitch';
        hudTitle.textContent = tabName === 'kickoff' ? 'KICK OFF: SELECT CLUB' : '4-3-3 TEAM SHEET';
    }

    projectsTabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchProjectsTab(btn.getAttribute('data-projects-tab')));
    });

    document.getElementById('projects-lb-btn')?.addEventListener('click', () => {
        switchProjectsTab(state.projectsTab === 'kickoff' ? 'pitch' : 'kickoff');
    });
    document.getElementById('projects-rb-btn')?.addEventListener('click', () => {
        switchProjectsTab(state.projectsTab === 'kickoff' ? 'pitch' : 'kickoff');
    });

    /* ======================================================================
       9. WORK MODE: CAREER BUMPER TABS
       ====================================================================== */
    const WORK_TABS = ['central', 'transfers', 'tactics'];
    const workTabBtns = Array.from(document.querySelectorAll('[data-work-tab]'));
    const workViewCentral = document.getElementById('work-view-central');
    const workViewTransfers = document.getElementById('work-view-transfers');
    const workViewTactics = document.getElementById('work-view-tactics');

    function switchWorkTab(tabName) {
        audio.playTick();
        state.workTab = tabName;
        workTabBtns.forEach(btn => {
            const isTarget = btn.getAttribute('data-work-tab') === tabName;
            btn.classList.toggle('active', isTarget);
            btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
        });
        if (workViewCentral) workViewCentral.hidden = tabName !== 'central';
        if (workViewTransfers) workViewTransfers.hidden = tabName !== 'transfers';
        if (workViewTactics) workViewTactics.hidden = tabName !== 'tactics';

        if (tabName === 'central') {
            hudTitle.textContent = 'MANAGER CAREER CENTRAL';
        } else if (tabName === 'transfers') {
            hudTitle.textContent = 'CAREER TRANSFER LEDGER (10)';
        } else if (tabName === 'tactics') {
            hudTitle.textContent = 'TACTICS & PLAYSTYLES+';
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
       10. SOUNDTRACK CONTROLS, SETTINGS POPOVER & BENTO THEME PICKER
       ====================================================================== */
    const THEME_STORAGE_KEY = 'tgfc-central-bento-theme';
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

    function readSavedBentoTheme() {
        try {
            const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
            return raw === 'dark' || raw === 'pop' ? raw : 'pop';
        } catch (_) {
            return 'pop';
        }
    }

    function applyCentralBentoTheme(themeName, persist = true) {
        const theme = themeName === 'dark' ? 'dark' : 'pop';
        if (workViewCentral) {
            workViewCentral.setAttribute('data-bento-theme', theme);
        }
        if (projectsViewKickoff) {
            projectsViewKickoff.setAttribute('data-bento-theme', theme);
        }
        themeOptionBtns.forEach(btn => {
            const isSelected = btn.getAttribute('data-bento-theme-option') === theme;
            btn.classList.toggle('active', isSelected);
            btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
            btn.setAttribute('tabindex', isSelected ? '0' : '-1');
        });
        if (persist) {
            try {
                window.localStorage.setItem(THEME_STORAGE_KEY, theme);
            } catch (_) {
                // Ignore storage quota/privacy-mode errors cleanly
            }
        }
    }

    applyCentralBentoTheme(readSavedBentoTheme(), false);

    function syncAudioButtonsUI(isOn) {
        const text = isOn ? 'AUDIO: ON' : 'AUDIO: MUTED';
        const pressed = isOn ? 'true' : 'false';
        if (audioStatusLabel) audioStatusLabel.textContent = text;
        if (btnAudioToggle) btnAudioToggle.setAttribute('aria-pressed', pressed);
        if (settingsAudioLabel) settingsAudioLabel.textContent = text;
        if (settingsAudioToggle) settingsAudioToggle.setAttribute('aria-pressed', pressed);
        if (hudEqBars) {
            hudEqBars.classList.toggle('paused', !isOn);
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
    }

    function closeSettingsMenu(playSound = false) {
        if (!hudSettingsMenu || hudSettingsMenu.hidden) return;
        if (playSound) audio.playTick();
        hudSettingsMenu.hidden = true;
        btnSettingsToggle?.setAttribute('aria-expanded', 'false');
        btnSettingsToggle?.classList.remove('is-open');
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
        btn.addEventListener('click', () => {
            const targetTheme = btn.getAttribute('data-bento-theme-option');
            audio.playTick();
            applyCentralBentoTheme(targetTheme, true);
        });
    });

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
        // 1. Boot Screen: Any key starts once loaded
        if (state.screen === 'boot') {
            if (state.bootReady) {
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
                applyCentralBentoTheme(nextBtn.getAttribute('data-bento-theme-option'), true);
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
            } else if (e.key === 'q' || e.key === 'Q' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
                switchProjectsTab(state.projectsTab === 'kickoff' ? 'pitch' : 'kickoff');
            } else if (state.projectsTab === 'kickoff') {
                if (e.key === 'ArrowDown' || (!hasModifier && (e.key === 's' || e.key === 'S'))) {
                    e.preventDefault();
                    selectProjectClub(state.activeClubIndex + 1, true);
                } else if (e.key === 'ArrowUp' || (!hasModifier && (e.key === 'w' || e.key === 'W'))) {
                    e.preventDefault();
                    selectProjectClub(state.activeClubIndex - 1, true);
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
