/**
 * TGFC 26 — Tomi Gelo Football Club Portfolio (Iteration 1)
 * Widescreen Console State Machine, Boot Loader, Procedural Soundtrack Radio & Blade Menu
 */

document.addEventListener('DOMContentLoaded', () => {
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
            ovr: '94 OVR',
            stars: '★★★★★',
            desc: 'Placeholder description for Project 03. Showcases a 5-star Open Source club item with top-tier backend and developer experience ratings.',
            att: 95,
            mid: 96,
            def: 92,
            formation: '3-4-3 DIAMOND',
            stack: 'LLM CONTEXT CLI // PLACEHOLDER',
            season: '2026 SEASON',
            url: '#projects'
        }
    ];

    /* ======================================================================
       2. TGFC TRAX SOUNDTRACK & UI AUDIO ENGINE (100% ORIGINAL WEB AUDIO)
       ====================================================================== */
    const SOUNDTRACKS = [
        {
            title: 'NEON FLOODLIGHTS',
            artist: 'BERLIN INDIE CLUB • 122 BPM',
            bpm: 122,
            // Upbeat Indie-Electro / Festival Synth-Pop (Fmaj7 -> G6 -> Em7 -> Am7)
            chords: [
                [174.61, 220.00, 261.63, 329.63],
                [196.00, 246.94, 293.66, 329.63],
                [164.81, 196.00, 246.94, 293.66],
                [220.00, 261.63, 329.63, 392.00]
            ],
            bass: [87.31, 98.00, 82.41, 110.00],
            arp: [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 440.00],
            kickPattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
            hatPattern:  [0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0]
        },
        {
            title: 'TERRACE ECHOES',
            artist: 'SPREEWALD COLLECTIVE • 126 BPM',
            bpm: 126,
            // UK Garage / Melodic 2-Step (Dm9 -> Bbmaj7 -> Gm7 -> A7sus4)
            chords: [
                [146.83, 174.61, 220.00, 261.63, 329.63],
                [116.54, 174.61, 220.00, 293.66],
                [196.00, 233.08, 293.66, 349.23],
                [220.00, 293.66, 329.63, 392.00]
            ],
            bass: [73.42, 58.27, 98.00, 110.00],
            arp: [587.33, 523.25, 440.00, 523.25, 698.46, 587.33, 523.25, 440.00],
            kickPattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
            hatPattern:  [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1]
        },
        {
            title: 'SOLAR KICKOFF',
            artist: 'KREUZBERG ANALOG • 118 BPM',
            bpm: 118,
            // Balearic / Stadium Electro-Funk (Cmaj7 -> Am9 -> Dm7 -> G13)
            chords: [
                [130.81, 164.81, 196.00, 246.94],
                [220.00, 246.94, 261.63, 329.63],
                [146.83, 174.61, 220.00, 261.63],
                [196.00, 246.94, 293.66, 329.63]
            ],
            bass: [65.41, 110.00, 73.42, 98.00],
            arp: [659.25, 783.99, 523.25, 659.25, 587.33, 493.88, 523.25, 392.00],
            kickPattern: [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0],
            hatPattern:  [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0]
        }
    ];

    class GameAudioEngine {
        constructor() {
            this.ctx = null;
            this.masterGain = null;
            this.enabled = true;
            this.isPlayingMusic = false;
            this.trackIndex = 0;
            this.stepIndex = 0;
            this.stepTimer = null;
        }

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                    this.masterGain = this.ctx.createGain();
                    this.masterGain.gain.value = 1.0;
                    this.masterGain.connect(this.ctx.destination);
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        toggleMute() {
            this.enabled = !this.enabled;
            this.init();
            if (this.masterGain && this.ctx) {
                this.masterGain.gain.setValueAtTime(this.enabled ? 1.0 : 0.0, this.ctx.currentTime);
            }
            if (this.enabled) {
                this.playTick();
            }
            return this.enabled;
        }

        startSoundtrack() {
            this.init();
            if (!this.ctx || this.isPlayingMusic) return;
            this.isPlayingMusic = true;
            this.stepIndex = 0;
            this.scheduleLoop();
        }

        stopSoundtrack() {
            this.isPlayingMusic = false;
            if (this.stepTimer) {
                clearTimeout(this.stepTimer);
                this.stepTimer = null;
            }
        }

        nextTrack() {
            this.trackIndex = (this.trackIndex + 1) % SOUNDTRACKS.length;
            this.stepIndex = 0;
            if (this.isPlayingMusic) {
                clearTimeout(this.stepTimer);
                this.scheduleLoop();
            }
            return SOUNDTRACKS[this.trackIndex];
        }

        getCurrentTrack() {
            return SOUNDTRACKS[this.trackIndex];
        }

        scheduleLoop() {
            if (!this.isPlayingMusic || !this.ctx) return;
            const track = SOUNDTRACKS[this.trackIndex];
            const sixteenthMs = (60 / track.bpm / 4) * 1000;

            if (this.enabled) {
                this.triggerMusicStep(track, this.stepIndex, sixteenthMs / 1000);
            }

            this.stepIndex = (this.stepIndex + 1) % 64;
            this.stepTimer = setTimeout(() => this.scheduleLoop(), sixteenthMs);
        }

        triggerMusicStep(track, step, stepDurSec) {
            const now = this.ctx.currentTime;
            const barIdx = Math.floor(step / 16) % 4;
            const stepInBar = step % 16;

            // 1. Warm Filtered Poly Synth Pad on beat 0 and syncopated beat 6 of each bar
            if (stepInBar === 0 || stepInBar === 6 || stepInBar === 12) {
                const chord = track.chords[barIdx];
                const padDur = stepInBar === 0 ? stepDurSec * 5.5 : stepDurSec * 3.5;
                chord.forEach(freq => {
                    const osc = this.ctx.createOscillator();
                    const filter = this.ctx.createBiquadFilter();
                    const gain = this.ctx.createGain();

                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, now);

                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(1150, now);
                    filter.frequency.exponentialRampToValueAtTime(420, now + padDur);

                    gain.gain.setValueAtTime(0.014, now);
                    gain.gain.exponentialRampToValueAtTime(0.0008, now + padDur);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.masterGain);

                    osc.start(now);
                    osc.stop(now + padDur + 0.02);
                });
            }

            // 2. Bouncy Synth Bassline on offbeats & downbeats
            if (stepInBar % 2 === 0) {
                const bassFreq = track.bass[barIdx] * (stepInBar === 6 || stepInBar === 14 ? 2 : 1);
                const osc = this.ctx.createOscillator();
                const filter = this.ctx.createBiquadFilter();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(bassFreq, now);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(480, now);

                gain.gain.setValueAtTime(0.045, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + stepDurSec * 1.8);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);

                osc.start(now);
                osc.stop(now + stepDurSec * 1.9);
            }

            // 3. Melodic Indie Synth Pluck / Arpeggio
            if (stepInBar % 2 === 1) {
                const arpNote = track.arp[Math.floor(stepInBar / 2) % track.arp.length];
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(arpNote, now);

                gain.gain.setValueAtTime(0.018, now);
                gain.gain.exponentialRampToValueAtTime(0.0008, now + stepDurSec * 1.5);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(now);
                osc.stop(now + stepDurSec * 1.6);
            }

            // 4. Punchy Electronic Kick Drum
            if (track.kickPattern[stepInBar]) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(125, now);
                osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);

                gain.gain.setValueAtTime(0.09, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(now);
                osc.stop(now + 0.12);
            }

            // 5. Crisp Hi-Hat Tick
            if (track.hatPattern[stepInBar]) {
                const osc = this.ctx.createOscillator();
                const filter = this.ctx.createBiquadFilter();
                const gain = this.ctx.createGain();

                osc.type = 'square';
                osc.frequency.setValueAtTime(6400, now);

                filter.type = 'highpass';
                filter.frequency.setValueAtTime(5000, now);

                gain.gain.setValueAtTime(0.009, now);
                gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.03);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);

                osc.start(now);
                osc.stop(now + 0.035);
            }
        }

        /* UI Sound Effects */
        playTick() {
            if (!this.enabled) return;
            this.init();
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
            this.init();
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

        playBack() {
            if (!this.enabled) return;
            this.init();
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

    const audio = new GameAudioEngine();

    /* ======================================================================
       3. STADIUM AMBIENT PARTICLE CANVAS
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
       4. APPLICATION STATE & DOM REFERENCES
       ====================================================================== */
    const state = {
        screen: 'boot',         // 'boot' | 'mobile-gate' | 'hub' | 'projects' | 'work'
        bootReady: false,
        hasPassedBoot: false,
        activeBladeIndex: 0,    // 0 = projects, 1 = work
        activeClubIndex: 0,     // 0..2
        projectsTab: 'kickoff', // 'kickoff' | 'pitch'
        workTab: 'central'      // 'central' | 'transfers'
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

    const blades = Array.from(document.querySelectorAll('.fc-blade'));
    const billboards = {
        projects: document.getElementById('preview-projects'),
        work: document.getElementById('preview-work')
    };

    let chyronTimer = null;
    function showNowPlayingChyron(track) {
        if (!traxChyron || window.innerWidth < DESKTOP_MIN_WIDTH) return;
        if (hudTrackName) hudTrackName.textContent = track.title;
        if (chyronTrackTitle) chyronTrackTitle.textContent = track.title;
        if (chyronTrackArtist) chyronTrackArtist.textContent = track.artist;

        traxChyron.hidden = false;
        if (chyronTimer) clearTimeout(chyronTimer);
        chyronTimer = setTimeout(() => {
            traxChyron.hidden = true;
        }, 4400);
    }

    /* ======================================================================
       5. BOOT SEQUENCE (0% -> 100% -> START -> MOBILE GATE OR DESKTOP HUB)
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
        { pct: 54, status: 'LOADING SQUAD FILE: TOMI_GELO_26.PRF...', detail: 'CUEING TGFC TRAX SOUNDTRACK RADIO' },
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

    function isMobileViewport() {
        return window.innerWidth < DESKTOP_MIN_WIDTH;
    }

    function triggerStartFromBoot() {
        if (!state.bootReady || state.screen !== 'boot') return;
        state.hasPassedBoot = true;
        audio.playSelect();

        // On mobile/narrow viewports (< 960px), NEVER open the menu: show the locked Mobile Gate screen
        if (isMobileViewport()) {
            navigateToScreen('mobile-gate');
            return;
        }

        // On desktop (>= 960px), start the stadium soundtrack and open the Main Menu Hub
        audio.startSoundtrack();
        navigateToScreen('hub');
        showNowPlayingChyron(audio.getCurrentTrack());
    }

    btnPressStart.addEventListener('click', triggerStartFromBoot);

    // Enforce Mobile Gate if viewport is resized across the 960px threshold after boot
    window.addEventListener('resize', () => {
        if (!state.hasPassedBoot) return;
        if (isMobileViewport() && state.screen !== 'mobile-gate') {
            audio.stopSoundtrack();
            if (traxChyron) traxChyron.hidden = true;
            navigateToScreen('mobile-gate');
        } else if (!isMobileViewport() && state.screen === 'mobile-gate') {
            audio.startSoundtrack();
            navigateToScreen('hub');
            showNowPlayingChyron(audio.getCurrentTrack());
        }
    });

    /* ======================================================================
       6. SCREEN NAVIGATION & MAIN MENU BLADES
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
        // Hard guard: never allow hub/projects/work on mobile viewports
        if (isMobileViewport() && targetScreen !== 'boot') {
            targetScreen = 'mobile-gate';
        }

        state.screen = targetScreen;
        viewportEl.setAttribute('data-active-screen', targetScreen);

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
            hudTitle.textContent = state.workTab === 'central' ? 'MANAGER CAREER CENTRAL' : 'CAREER CONTRACT HISTORY';
            promptBackBtn.hidden = false;
            promptBumpers.hidden = false;
        }
    }

    /* ======================================================================
       7. PROJECTS MODE: KICK-OFF CLUB SELECTOR & BUMPER TABS
       ====================================================================== */
    const clubCards = Array.from(document.querySelectorAll('.club-select-card'));
    const clubCounterLabel = document.getElementById('club-counter-label');
    const previewClubLeague = document.getElementById('preview-club-league');
    const previewClubCrest = document.getElementById('preview-club-crest');
    const previewClubOvr = document.getElementById('preview-club-ovr');
    const previewClubStars = document.getElementById('preview-club-stars');
    const previewClubName = document.getElementById('preview-club-name');
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

    function selectProjectClub(index, playSound = true) {
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

        clubCounterLabel.textContent = `CLUB 0${clamped + 1} / 0${PLACEHOLDER_CLUBS.length}`;
        previewClubLeague.textContent = club.league;
        previewClubCrest.textContent = club.code;
        previewClubCrest.className = `club-crest-giant ${club.crestClass}`;
        previewClubOvr.textContent = club.ovr;
        previewClubStars.textContent = club.stars;
        previewClubName.textContent = club.name;
        previewClubDesc.textContent = club.desc;

        previewClubAtt.textContent = club.att;
        previewClubMid.textContent = club.mid;
        previewClubDef.textContent = club.def;
        previewBarAtt.style.width = `${club.att}%`;
        previewBarMid.style.width = `${club.mid}%`;
        previewBarDef.style.width = `${club.def}%`;

        previewClubFormation.textContent = club.formation;
        previewClubStack.textContent = club.stack;
        previewClubSeason.textContent = club.season;
    }

    clubCards.forEach((card, idx) => {
        card.addEventListener('click', () => selectProjectClub(idx, true));
    });

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
       8. WORK MODE: CAREER BUMPER TABS
       ====================================================================== */
    const workTabBtns = Array.from(document.querySelectorAll('[data-work-tab]'));
    const workViewCentral = document.getElementById('work-view-central');
    const workViewTransfers = document.getElementById('work-view-transfers');

    function switchWorkTab(tabName) {
        audio.playTick();
        state.workTab = tabName;
        workTabBtns.forEach(btn => {
            const isTarget = btn.getAttribute('data-work-tab') === tabName;
            btn.classList.toggle('active', isTarget);
            btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
        });
        workViewCentral.hidden = tabName !== 'central';
        workViewTransfers.hidden = tabName !== 'transfers';
        hudTitle.textContent = tabName === 'central' ? 'MANAGER CAREER CENTRAL' : 'CAREER CONTRACT HISTORY';
    }

    workTabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchWorkTab(btn.getAttribute('data-work-tab')));
    });

    document.getElementById('work-lb-btn')?.addEventListener('click', () => {
        switchWorkTab(state.workTab === 'central' ? 'transfers' : 'central');
    });
    document.getElementById('work-rb-btn')?.addEventListener('click', () => {
        switchWorkTab(state.workTab === 'central' ? 'transfers' : 'central');
    });

    /* ======================================================================
       9. SOUNDTRACK CONTROLS & BOTTOM CONTROLLER LEGEND
       ====================================================================== */
    const btnAudioToggle = document.getElementById('btn-audio-toggle');
    const audioStatusLabel = document.getElementById('audio-status-label');
    const btnNextTrack = document.getElementById('btn-next-track');
    const promptNextTrackBtn = document.getElementById('prompt-next-track-btn');

    function handleAudioToggle() {
        const isOn = audio.toggleMute();
        audioStatusLabel.textContent = isOn ? 'AUDIO: ON' : 'AUDIO: MUTED';
        btnAudioToggle.setAttribute('aria-pressed', isOn ? 'true' : 'false');
        if (hudEqBars) {
            hudEqBars.classList.toggle('paused', !isOn);
        }
    }

    function handleNextTrack() {
        audio.playTick();
        const next = audio.nextTrack();
        showNowPlayingChyron(next);
    }

    btnAudioToggle?.addEventListener('click', handleAudioToggle);
    btnNextTrack?.addEventListener('click', handleNextTrack);
    promptNextTrackBtn?.addEventListener('click', handleNextTrack);

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
       10. GLOBAL KEYBOARD / CONTROLLER SHORTCUTS
       ====================================================================== */
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

        // Audio mute shortcut (M)
        if (e.key === 'm' || e.key === 'M') {
            e.preventDefault();
            handleAudioToggle();
            return;
        }

        // Next Soundtrack Song shortcut (N)
        if (e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            handleNextTrack();
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
                if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                    e.preventDefault();
                    selectProjectClub(state.activeClubIndex + 1, true);
                } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
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
            } else if (e.key === 'q' || e.key === 'Q' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
                switchWorkTab(state.workTab === 'central' ? 'transfers' : 'central');
            }
        }
    });
});
