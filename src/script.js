/**
 * EA SPORTS FC™ 26 — Tomi Gelo Portfolio Edition (Iteration 1)
 * Widescreen Console State Machine, Boot Loader, Blade Menu & Web Audio SFX
 */

document.addEventListener('DOMContentLoaded', () => {
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
       2. PROCEDURAL WEB AUDIO UI SYNTHESIZER (ZERO EXTERNAL ASSETS)
       ====================================================================== */
    class FCSoundEngine {
        constructor() {
            this.ctx = null;
            this.enabled = true;
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

        toggle() {
            this.enabled = !this.enabled;
            if (this.enabled) {
                this.playTick();
            }
            return this.enabled;
        }

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
            gain.connect(this.ctx.destination);
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
                gain.connect(this.ctx.destination);
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
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        }
    }

    const sfx = new FCSoundEngine();

    /* ======================================================================
       3. STADIUM AMBIENT PARTICLE CANVAS
       ====================================================================== */
    const canvas = document.getElementById('stadium-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];

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
        screen: 'boot',        // 'boot' | 'notice' | 'hub' | 'projects' | 'work'
        bootReady: false,
        activeBladeIndex: 0,   // 0 = projects, 1 = work
        activeClubIndex: 0,    // 0..2
        projectsTab: 'kickoff',// 'kickoff' | 'pitch'
        workTab: 'central'     // 'central' | 'transfers'
    };

    const viewportEl = document.getElementById('console-viewport');
    const screenBoot = document.getElementById('screen-boot');
    const modalNotice = document.getElementById('modal-desktop-notice');
    const narrowWarning = document.getElementById('narrow-screen-warning');
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

    const blades = Array.from(document.querySelectorAll('.fc-blade'));
    const billboards = {
        projects: document.getElementById('preview-projects'),
        work: document.getElementById('preview-work')
    };

    /* ======================================================================
       5. BOOT SEQUENCE (0% -> 100% -> PRESS START -> DESKTOP NOTICE)
       ====================================================================== */
    const bootStatusText = document.getElementById('boot-status-text');
    const bootPercentText = document.getElementById('boot-percent-text');
    const bootProgressFill = document.getElementById('boot-progress-fill');
    const bootTelemetryDetail = document.getElementById('boot-telemetry-detail');
    const bootLoaderBox = document.getElementById('boot-loader-box');
    const bootStartPrompt = document.getElementById('boot-start-prompt');
    const btnPressStart = document.getElementById('btn-press-start');
    const btnDismissNotice = document.getElementById('btn-dismiss-notice');

    const bootSteps = [
        { pct: 18, status: 'INITIALIZING PERSONALITY ENGINE...', detail: 'SHADER CACHE: STADIUM FLOODLIGHTS' },
        { pct: 46, status: 'LOADING SQUAD FILE: TOMI_GELO_26.PRF...', detail: 'VERIFYING WIDESCREEN 16:9 SAFE ZONE' },
        { pct: 78, status: 'SYNCING MATCHES & CAREER DATA...', detail: 'CONNECTING TO EA SERVERS [BERLIN_EU]' },
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
        }, 380);
    }

    runBootSequence();

    function checkViewportWarning() {
        if (narrowWarning) {
            narrowWarning.hidden = window.innerWidth >= 960;
        }
    }
    window.addEventListener('resize', checkViewportWarning);

    function triggerStartFromBoot() {
        if (!state.bootReady || state.screen !== 'boot') return;
        sfx.playSelect();
        checkViewportWarning();
        state.screen = 'notice';
        modalNotice.hidden = false;
        btnDismissNotice.focus();
    }

    function dismissDesktopNotice() {
        if (state.screen !== 'notice') return;
        sfx.playSelect();
        modalNotice.hidden = true;
        navigateToScreen('hub');
    }

    btnPressStart.addEventListener('click', triggerStartFromBoot);
    btnDismissNotice.addEventListener('click', dismissDesktopNotice);

    /* ======================================================================
       6. SCREEN NAVIGATION & MAIN MENU BLADES
       ====================================================================== */
    function setActiveBlade(index, playSound = true) {
        const clamped = (index + blades.length) % blades.length;
        if (state.activeBladeIndex !== clamped && playSound) {
            sfx.playTick();
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
            sfx.playSelect();
            navigateToScreen(target);
        });
    });

    document.querySelectorAll('[data-enter-screen]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-enter-screen');
            sfx.playSelect();
            navigateToScreen(target);
        });
    });

    document.querySelectorAll('[data-back-to-hub]').forEach(btn => {
        btn.addEventListener('click', () => {
            sfx.playBack();
            navigateToScreen('hub');
        });
    });

    const hudHomeBtn = document.getElementById('hud-home-btn');
    if (hudHomeBtn) {
        hudHomeBtn.addEventListener('click', () => {
            if (state.screen !== 'hub') {
                sfx.playBack();
                navigateToScreen('hub');
            }
        });
    }

    function navigateToScreen(targetScreen) {
        state.screen = targetScreen;
        viewportEl.setAttribute('data-active-screen', targetScreen);

        screenBoot.hidden = targetScreen !== 'boot';
        screenHub.hidden = targetScreen !== 'hub';
        screenProjects.hidden = targetScreen !== 'projects';
        screenWork.hidden = targetScreen !== 'work';

        const showHud = targetScreen === 'hub' || targetScreen === 'projects' || targetScreen === 'work';
        topHud.hidden = !showHud;
        bottomBar.hidden = !showHud;

        if (targetScreen === 'hub') {
            hudCategory.textContent = 'EA SPORTS FC™ 26';
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
            sfx.playTick();
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

    // Projects Bumper Tabs (Kick Off vs Team Sheet Pitch)
    const projectsTabBtns = Array.from(document.querySelectorAll('[data-projects-tab]'));
    const projectsViewKickoff = document.getElementById('projects-view-kickoff');
    const projectsViewPitch = document.getElementById('projects-view-pitch');

    function switchProjectsTab(tabName) {
        sfx.playTick();
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
        sfx.playTick();
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
       9. BOTTOM CONTROLLER LEGEND & AUDIO MUTE CONTROLS
       ====================================================================== */
    const btnAudioToggle = document.getElementById('btn-audio-toggle');
    const audioStatusLabel = document.getElementById('audio-status-label');

    function handleAudioToggle() {
        const isOn = sfx.toggle();
        audioStatusLabel.textContent = isOn ? 'SFX: ON' : 'SFX: MUTED';
        btnAudioToggle.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    }

    if (btnAudioToggle) {
        btnAudioToggle.addEventListener('click', handleAudioToggle);
    }

    if (promptBackBtn) {
        promptBackBtn.addEventListener('click', () => {
            if (state.screen === 'projects' || state.screen === 'work') {
                sfx.playBack();
                navigateToScreen('hub');
            }
        });
    }

    if (promptSelectBtn) {
        promptSelectBtn.addEventListener('click', () => {
            if (state.screen === 'hub') {
                const target = blades[state.activeBladeIndex].getAttribute('data-target-screen');
                sfx.playSelect();
                navigateToScreen(target);
            }
        });
    }

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

        // 2. Post-Loading System Notice Modal
        if (state.screen === 'notice') {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                e.preventDefault();
                dismissDesktopNotice();
            }
            return;
        }

        // Audio toggle shortcut (M)
        if (e.key === 'm' || e.key === 'M') {
            e.preventDefault();
            handleAudioToggle();
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
                sfx.playSelect();
                navigateToScreen(target);
            }
            return;
        }

        // 4. Projects Screen Navigation
        if (state.screen === 'projects') {
            if (e.key === 'Escape' || e.key === 'Backspace') {
                e.preventDefault();
                sfx.playBack();
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
                sfx.playBack();
                navigateToScreen('hub');
            } else if (e.key === 'q' || e.key === 'Q' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
                switchWorkTab(state.workTab === 'central' ? 'transfers' : 'central');
            }
        }
    });
});
