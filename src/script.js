/**
 * EA Sports FC Tab Navigation & Keyboard Handling
 * Zero-dependency, lightweight, accessible.
 */
document.addEventListener('DOMContentLoaded', () => {
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

    function resolveHash(rawHash) {
        const hash = (rawHash || '').replace('#', '').toLowerCase();
        if (hash === 'tactics') return 'manager';
        return hash;
    }

    function activateTab(tab, setFocus = true) {
        if (!tab) return;
        const targetPanelId = tab.getAttribute('aria-controls');

        tabs.forEach(t => {
            const isTarget = t === tab;
            t.setAttribute('aria-selected', isTarget ? 'true' : 'false');
            t.setAttribute('tabindex', isTarget ? '0' : '-1');
            t.classList.toggle('active', isTarget);
        });

        panels.forEach(p => {
            const isTarget = p.id === targetPanelId;
            p.hidden = !isTarget;
            p.classList.toggle('active', isTarget);
        });

        if (setFocus) {
            tab.focus();
        }

        // Update URL hash without scroll jumping
        const hash = tab.getAttribute('data-hash');
        if (hash && window.location.hash !== `#${hash}`) {
            history.replaceState(null, '', `#${hash}`);
        }
    }

    function activateByHashName(hashName, setFocus = false) {
        const targetHash = resolveHash(hashName);
        const matchingTab = tabs.find(t => t.getAttribute('data-hash') === targetHash);
        if (matchingTab) {
            activateTab(matchingTab, setFocus);
            return true;
        }
        return false;
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            activateTab(tab, true);
        });

        tab.addEventListener('keydown', (e) => {
            let nextIndex = null;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                nextIndex = (index + 1) % tabs.length;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                nextIndex = (index - 1 + tabs.length) % tabs.length;
            } else if (e.key === 'Home') {
                nextIndex = 0;
            } else if (e.key === 'End') {
                nextIndex = tabs.length - 1;
            }

            if (nextIndex !== null) {
                e.preventDefault();
                activateTab(tabs[nextIndex], true);
            }
        });
    });

    // Check URL hash on initial page load (with fallback to default squad tab)
    const initialHash = resolveHash(window.location.hash);
    if (initialHash) {
        const found = activateByHashName(initialHash, false);
        if (!found && tabs.length > 0) {
            activateTab(tabs[0], false);
        }
    } else if (tabs.length > 0) {
        activateTab(tabs[0], false);
    }

    // Support browser Back/Forward navigation and in-page anchor jumps
    window.addEventListener('hashchange', () => {
        const newHash = resolveHash(window.location.hash);
        if (newHash) {
            activateByHashName(newHash, false);
        }
    });

    // Quick routing from HUD Manager pill and Squad strip to Manager's Office
    const hudMgrBtn = document.getElementById('hud-mgr-pill');
    if (hudMgrBtn) {
        hudMgrBtn.addEventListener('click', (e) => {
            e.preventDefault();
            activateByHashName('manager', true);
        });
    }

    const squadMgrLink = document.getElementById('squad-to-mgr-link');
    if (squadMgrLink) {
        squadMgrLink.addEventListener('click', (e) => {
            e.preventDefault();
            activateByHashName('manager', true);
        });
    }

    // Optional Quick Project Filter pills
    const filterBtns = document.querySelectorAll('.filter-pill');
    const projectCards = document.querySelectorAll('.squad-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');

            projectCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});
