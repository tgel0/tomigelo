/**
 * TGFC 26 — Real-Time Three.js 3D Match Pitch & Articulated Trio Engine
 * Builds articulated 3D character rigs for:
 *  1. Tomi Gelo (#10, Tall white mid-30s dad, short black hair, full TGFC kit)
 *  2. Junior Tactician (#7, 1-year-old son, curly light-brown hair, mini TGFC kit)
 *  3. Assistant Gaffer (#1, 7-year-old black Schnauzer-Poodle mix with volt bandana)
 * Includes continuous 60fps 3D skeletal animations, ball juggling, camera orbit/focus,
 * and full 3D goal celebrations triggered by the stage HUD buttons & player clicks.
 */
(function () {
    'use strict';

    function initThreeJsTrioStage() {
        const stageEl = document.getElementById('fc-trio-stage');
        const glCanvas = document.getElementById('fc-trio-webgl-canvas');
        const hudCanvas = document.getElementById('fc-trio-hud-canvas');
        const celebrateBtn = document.getElementById('fc-stage-celebrate-btn');
        const calloutBtns = document.querySelectorAll('.fc-roster-callout[data-trio-actor]');

        if (!stageEl || !glCanvas || !hudCanvas || typeof window.THREE === 'undefined') {
            return;
        }

        const THREE = window.THREE;
        const ctx2d = hudCanvas.getContext('2d');

        // =====================================================================
        // 1. SCENE, CAMERA & RENDERER
        // =====================================================================
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050912);
        scene.fog = new THREE.FogExp2(0x050912, 0.065);

        const camera = new THREE.PerspectiveCamera(36, 1.5, 0.1, 100);
        camera.position.set(0, 1.35, 5.2);

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: glCanvas,
                antialias: true,
                alpha: false,
                powerPreference: 'high-performance'
            });
        } catch (err) {
            console.warn('Three.js WebGLRenderer init error:', err);
            return;
        }

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;

        // =====================================================================
        // 2. STADIUM LIGHTING (Floodlights + Neon Volt & Cyan Rim Lights)
        // =====================================================================
        const hemiLight = new THREE.HemisphereLight(0xdff4ff, 0x0a2916, 0.75);
        hemiLight.position.set(0, 10, 0);
        scene.add(hemiLight);

        const keyLight = new THREE.DirectionalLight(0xfffbf0, 1.35);
        keyLight.position.set(2.8, 5.5, 4.2);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 15;
        const d = 2.6;
        keyLight.shadow.camera.left = -d;
        keyLight.shadow.camera.right = d;
        keyLight.shadow.camera.top = d;
        keyLight.shadow.camera.bottom = -d;
        keyLight.shadow.bias = -0.0008;
        scene.add(keyLight);

        // EAFC signature neon volt left rim light
        const voltRimLight = new THREE.SpotLight(0x00ff68, 2.2, 12, Math.PI / 3, 0.5, 1.5);
        voltRimLight.position.set(-3.5, 3.2, -1.8);
        scene.add(voltRimLight);

        // Stadium cyan right rim light
        const cyanRimLight = new THREE.SpotLight(0x00e5ff, 1.9, 12, Math.PI / 3, 0.5, 1.5);
        cyanRimLight.position.set(3.5, 3.2, -1.8);
        scene.add(cyanRimLight);

        // Front fill light for faces
        const fillLight = new THREE.PointLight(0xd8ecff, 0.55, 8);
        fillLight.position.set(0, 1.6, 3.2);
        scene.add(fillLight);

        /**
         * Injects EA Sports FC Frostbite-style dual-color grazing Fresnel rim lighting:
         * - Left silhouette edge (-X view normal) glows Neon Volt (#00FF68)
         * - Right silhouette edge (+X view normal) glows Stadium Cyan (#00E5FF)
         * Essential for separating the jet-black Schnoodle's curls and player silhouettes.
         */
        function applyEafcRimShader(material, opts) {
            const rimIntensity = (opts && opts.rimIntensity !== undefined) ? opts.rimIntensity : 0.45;
            const rimPower = (opts && opts.rimPower !== undefined) ? opts.rimPower : 2.6;

            material.onBeforeCompile = function (shader) {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <dithering_fragment>',
                    `
                    vec3 viewDir = normalize(vViewPosition);
                    float fresnel = pow(1.0 - clamp( abs(dot(normal, viewDir)), 0.0, 1.0 ), ${rimPower.toFixed(2)});
                    vec3 voltRim = vec3(0.0, 1.0, 0.408);
                    vec3 cyanRim = vec3(0.0, 0.898, 1.0);
                    float sideBlend = smoothstep(-0.35, 0.35, normal.x);
                    vec3 rimGlow = mix(voltRim, cyanRim, sideBlend) * fresnel * ${rimIntensity.toFixed(3)};
                    gl_FragColor.rgb += rimGlow;
                    #include <dithering_fragment>
                    `
                );
            };
            material.needsUpdate = true;
            return material;
        }

        // =====================================================================
        // 3. PROCEDURAL CANVAS TEXTURES (Pitch Turf, Jersey Crest, Ball Panels)
        // =====================================================================
        function createPitchTexture() {
            const c = document.createElement('canvas');
            c.width = 1024;
            c.height = 1024;
            const ctx = c.getContext('2d');

            // Mowed stadium grass stripes
            const stripes = 16;
            for (let i = 0; i < stripes; i++) {
                ctx.fillStyle = i % 2 === 0 ? '#0d3b1e' : '#114825';
                ctx.fillRect(0, (i * c.height) / stripes, c.width, c.height / stripes);
            }

            // Subtle turf blade noise
            ctx.fillStyle = 'rgba(0, 255, 104, 0.03)';
            for (let i = 0; i < 4000; i++) {
                const x = (i * 73) % c.width;
                const y = (i * 137) % c.height;
                ctx.fillRect(x, y, 2, 4);
            }

            // Crisp white pitch touchline & center circle markings
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(0, 560);
            ctx.lineTo(1024, 560);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(512, 560, 190, 0, Math.PI * 2);
            ctx.stroke();

            const tex = new THREE.CanvasTexture(c);
            tex.encoding = THREE.sRGBEncoding;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            return tex;
        }

        function createJerseyTexture(numberStr) {
            const c = document.createElement('canvas');
            c.width = 512;
            c.height = 512;
            const ctx = c.getContext('2d');

            // Obsidian charcoal technical fabric base
            ctx.fillStyle = '#151a24';
            ctx.fillRect(0, 0, 512, 512);

            // Subtle diagonal carbon-weave chevron pattern
            ctx.strokeStyle = 'rgba(0, 255, 104, 0.08)';
            ctx.lineWidth = 14;
            for (let y = 80; y < 440; y += 70) {
                ctx.beginPath();
                ctx.moveTo(120, y);
                ctx.lineTo(256, y + 48);
                ctx.lineTo(392, y);
                ctx.stroke();
            }

            // Neon volt side piping
            ctx.fillStyle = '#00ff68';
            ctx.fillRect(40, 0, 14, 512);
            ctx.fillRect(458, 0, 14, 512);

            // TGFC Shield Crest on left chest
            ctx.save();
            ctx.translate(310, 135);
            ctx.fillStyle = '#0b1018';
            ctx.strokeStyle = '#00ff68';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(0, -32);
            ctx.lineTo(28, -20);
            ctx.lineTo(24, 14);
            ctx.lineTo(0, 34);
            ctx.lineTo(-24, 14);
            ctx.lineTo(-28, -20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#00ff68';
            ctx.font = '900 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('TG', 0, -2);
            ctx.restore();

            // Gold squad number on chest
            ctx.fillStyle = '#f5c451';
            ctx.font = '900 54px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(numberStr, 195, 155);

            // Subtle sponsor bar ("TIKI-DATA")
            ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
            ctx.font = '800 32px monospace';
            ctx.fillText('TIKI // DATA', 256, 255);

            const tex = new THREE.CanvasTexture(c);
            tex.encoding = THREE.sRGBEncoding;
            return tex;
        }

        function createSoccerBallTexture() {
            const c = document.createElement('canvas');
            c.width = 512;
            c.height = 256;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#f4f7fa';
            ctx.fillRect(0, 0, 512, 256);

            // Classic pro match ball pentagons + neon volt accents
            const spots = [
                [64, 64], [192, 64], [320, 64], [448, 64],
                [128, 160], [256, 160], [384, 160], [500, 160],
                [64, 220], [192, 220], [320, 220], [448, 220]
            ];
            spots.forEach(([x, y], idx) => {
                ctx.fillStyle = idx % 4 === 0 ? '#00ff68' : '#101520';
                ctx.beginPath();
                for (let a = 0; a < 5; a++) {
                    const ang = (a * Math.PI * 2) / 5 - Math.PI / 2;
                    const px = x + Math.cos(ang) * 26;
                    const py = y + Math.sin(ang) * 26;
                    if (a === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
            });

            const tex = new THREE.CanvasTexture(c);
            tex.encoding = THREE.sRGBEncoding;
            return tex;
        }

        function createFaceTexture(opts) {
            const isToddler = Boolean(opts && opts.isToddler);
            const c = document.createElement('canvas');
            c.width = 512;
            c.height = 512;
            const ctx = c.getContext('2d');

            // 1. Base Subsurface Skin Tone
            const baseSkin = isToddler ? '#f6ccb0' : '#ecc0a0';
            ctx.fillStyle = baseSkin;
            ctx.fillRect(0, 0, 512, 512);

            // Subtle cranial crown & neck ambient occlusion gradient
            const vertGrad = ctx.createLinearGradient(0, 0, 0, 512);
            vertGrad.addColorStop(0.0, 'rgba(20, 14, 12, 0.18)');
            vertGrad.addColorStop(0.22, 'rgba(255, 220, 200, 0.06)');
            vertGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.0)');
            vertGrad.addColorStop(1.0, 'rgba(35, 18, 14, 0.28)');
            ctx.fillStyle = vertGrad;
            ctx.fillRect(0, 0, 512, 512);

            // 2. Subsurface Cheek & Nose Warmth / Blush
            const blushY = isToddler ? 275 : 265;
            const blushSpanX = isToddler ? 44 : 50;
            const blushR = isToddler ? 38 : 34;

            [-1, 1].forEach((side) => {
                const bx = 256 + side * blushSpanX;
                const blushG = ctx.createRadialGradient(bx, blushY, 2, bx, blushY, blushR);
                blushG.addColorStop(0.0, isToddler ? 'rgba(240, 115, 115, 0.38)' : 'rgba(215, 110, 95, 0.26)');
                blushG.addColorStop(0.65, isToddler ? 'rgba(240, 125, 115, 0.18)' : 'rgba(215, 120, 100, 0.12)');
                blushG.addColorStop(1.0, 'rgba(240, 125, 115, 0.0)');
                ctx.fillStyle = blushG;
                ctx.beginPath();
                ctx.arc(bx, blushY, blushR, 0, Math.PI * 2);
                ctx.fill();
            });

            // 3. Dad's Neat Dark Stubble Beard Pattern & Mustache Shadow
            if (!isToddler) {
                ctx.save();
                // Subtle jawline/chin shadow
                const jawGrad = ctx.createRadialGradient(256, 350, 20, 256, 350, 85);
                jawGrad.addColorStop(0.0, 'rgba(18, 20, 26, 0.40)');
                jawGrad.addColorStop(0.7, 'rgba(24, 26, 34, 0.22)');
                jawGrad.addColorStop(1.0, 'rgba(30, 32, 40, 0.0)');
                ctx.fillStyle = jawGrad;
                ctx.beginPath();
                ctx.ellipse(256, 342, 72, 64, 0, 0, Math.PI);
                ctx.fill();

                // Mustache shadow arch above upper lip
                ctx.strokeStyle = 'rgba(22, 24, 30, 0.36)';
                ctx.lineWidth = 10;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(228, 314);
                ctx.quadraticCurveTo(256, 302, 284, 314);
                ctx.stroke();

                // Fine procedural hair follicle stippling across jaw & chin
                ctx.fillStyle = 'rgba(18, 20, 26, 0.28)';
                for (let i = 0; i < 420; i++) {
                    const a = (i * 1.6180339) * Math.PI * 2;
                    const r = Math.sqrt(i / 420) * 64;
                    const sx = 256 + Math.cos(a) * r * 1.05;
                    const sy = 336 + Math.sin(a) * r * 0.72;
                    if (sy > 296 && sy < 395) {
                        ctx.fillRect(sx, sy, 1.5, 2.2);
                    }
                }
                ctx.restore();
            }

            // 4. Multi-Layered Eyes (Socket AO, Sclera, Iris, Pupil, Dual Catchlights, Eyelids)
            const eyeY = isToddler ? 248 : 232;
            const eyeSpanX = isToddler ? 33 : 31;
            const eyeRx = isToddler ? 15 : 13.5;
            const eyeRy = isToddler ? 13.5 : 10.5;

            [-1, 1].forEach((side) => {
                const ex = 256 + side * eyeSpanX;

                // Eye socket soft shadow
                const sockG = ctx.createRadialGradient(ex, eyeY, 4, ex, eyeY, eyeRx * 1.6);
                sockG.addColorStop(0, 'rgba(95, 55, 42, 0.22)');
                sockG.addColorStop(1, 'rgba(95, 55, 42, 0)');
                ctx.fillStyle = sockG;
                ctx.beginPath();
                ctx.arc(ex, eyeY, eyeRx * 1.6, 0, Math.PI * 2);
                ctx.fill();

                // Sclera
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                ctx.ellipse(ex, eyeY, eyeRx, eyeRy, 0, 0, Math.PI * 2);
                ctx.fill();

                // Iris (warm dark brown/hazel)
                const irisR = isToddler ? 8.8 : 7.4;
                const irisG = ctx.createRadialGradient(ex, eyeY, 1, ex, eyeY, irisR);
                irisG.addColorStop(0.0, isToddler ? '#4a2c16' : '#331d10');
                irisG.addColorStop(0.7, isToddler ? '#6e4425' : '#4d2e1c');
                irisG.addColorStop(1.0, isToddler ? '#2a170b' : '#1c1008');
                ctx.fillStyle = irisG;
                ctx.beginPath();
                ctx.arc(ex, eyeY, irisR, 0, Math.PI * 2);
                ctx.fill();

                // Pupil
                ctx.fillStyle = '#06080d';
                ctx.beginPath();
                ctx.arc(ex, eyeY, irisR * 0.48, 0, Math.PI * 2);
                ctx.fill();

                // Primary & secondary specular catchlights
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(ex + 2.6, eyeY - 2.6, isToddler ? 2.6 : 2.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(ex - 2.2, eyeY + 2.2, 1.1, 0, Math.PI * 2);
                ctx.fill();

                // Upper lash line / eyelid crease
                ctx.strokeStyle = isToddler ? '#3a2518' : '#14171f';
                ctx.lineWidth = isToddler ? 2.8 : 3.2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(ex, eyeY + 1, eyeRx, Math.PI * 1.08, Math.PI * 1.92);
                ctx.stroke();

                // Tapered Eyebrow
                ctx.strokeStyle = isToddler ? '#6e4726' : '#12151d';
                ctx.lineWidth = isToddler ? 4.5 : 6.2;
                ctx.beginPath();
                ctx.moveTo(ex - side * (eyeRx + 3), eyeY - eyeRy - (isToddler ? 7 : 6));
                ctx.quadraticCurveTo(
                    ex,
                    eyeY - eyeRy - (isToddler ? 13 : 11),
                    ex + side * (eyeRx + 4),
                    eyeY - eyeRy - (isToddler ? 5 : 4)
                );
                ctx.stroke();
            });

            // 5. Shaded Nose Contour & Nostrils
            const noseBottomY = isToddler ? 282 : 278;
            ctx.strokeStyle = 'rgba(130, 75, 58, 0.35)';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.arc(256, noseBottomY, isToddler ? 8 : 9.5, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();

            // 6. Confident Smile with Teeth Highlight
            const mouthY = isToddler ? 312 : 320;
            const mouthW = isToddler ? 22 : 25;
            ctx.fillStyle = '#7a2828';
            ctx.beginPath();
            ctx.arc(256, mouthY, mouthW, 0.05 * Math.PI, 0.95 * Math.PI, false);
            ctx.closePath();
            ctx.fill();

            // Upper teeth strip
            ctx.fillStyle = '#f4f6fa';
            ctx.beginPath();
            ctx.arc(256, mouthY, mouthW * 0.84, 0.12 * Math.PI, 0.88 * Math.PI, false);
            ctx.closePath();
            ctx.fill();

            const tex = new THREE.CanvasTexture(c);
            tex.encoding = THREE.sRGBEncoding;
            return tex;
        }

        function createJerseyBumpTexture() {
            const c = document.createElement('canvas');
            c.width = 512;
            c.height = 512;
            const ctx = c.getContext('2d');

            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, 512, 512);

            // 1. Micro Dri-FIT honeycomb breathable knit pattern
            ctx.fillStyle = '#969696';
            for (let y = 0; y < 512; y += 6) {
                const offset = (y / 6) % 2 === 0 ? 0 : 3;
                for (let x = offset; x < 512; x += 6) {
                    ctx.fillRect(x, y, 2, 2);
                }
            }

            // 2. Diagonal cloth tension creases across chest
            ctx.strokeStyle = '#686868';
            ctx.lineWidth = 4;
            for (let cy = 120; cy < 420; cy += 45) {
                ctx.beginPath();
                ctx.moveTo(140, cy);
                ctx.quadraticCurveTo(256, cy + 18, 372, cy);
                ctx.stroke();
            }

            const tex = new THREE.CanvasTexture(c);
            tex.encoding = THREE.sRGBEncoding;
            return tex;
        }

        const sharedJerseyBumpTex = createJerseyBumpTexture();

        /**
         * Creates an organic anatomical limb or torso segment via SplineCurve + LatheGeometry.
         * Expects radiiFromTopToBottom = [topRadius, upperMid, lowerMid, bottomRadius].
         * Automatically builds bottom-to-top so normals face outward and top is at y = 0
         * (extending downward to y = -length, matching existing bone pivots!).
         */
        function createAnatomicalSegmentGeo(radiiTopToBot, length, radialSegs = 20) {
            const n = radiiTopToBot.length;
            const pts = [];
            // Build from bottom (y = -length) to top (y = 0) so y is ascending
            for (let i = 0; i < n; i++) {
                const t = i / (n - 1); // 0 at bottom, 1 at top
                const r = radiiTopToBot[n - 1 - i];
                const y = -length * (1 - t);
                pts.push(new THREE.Vector2(Math.max(0.001, r), y));
            }
            const curve = new THREE.SplineCurve(pts);
            return new THREE.LatheGeometry(curve.getPoints(20), radialSegs, Math.PI, Math.PI * 2);
        }

        // =====================================================================
        // 4. 3D STADIUM PITCH, GOALPOSTS & FLOODLIGHT TOWERS
        // =====================================================================
        const pitchGeo = new THREE.PlaneGeometry(18, 18);
        const pitchMat = new THREE.MeshStandardMaterial({
            map: createPitchTexture(),
            roughness: 0.78,
            metalness: 0.05
        });
        const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
        pitchMesh.rotation.x = -Math.PI / 2;
        pitchMesh.receiveShadow = true;
        scene.add(pitchMesh);

        // Background 3D Goalposts on the pitch
        const goalGroup = new THREE.Group();
        goalGroup.position.set(0, 0, -5.2);
        const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.5 });
        const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 12), postMat);
        leftPost.position.set(-2.2, 0.95, 0);
        const rightPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 12), postMat);
        rightPost.position.set(2.2, 0.95, 0);
        const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.48, 12), postMat);
        crossbar.rotation.z = Math.PI / 2;
        crossbar.position.set(0, 1.9, 0);
        goalGroup.add(leftPost, rightPost, crossbar);
        scene.add(goalGroup);

        // Stadium Floodlight Halo Nodes in upper background
        const floodlightGroup = new THREE.Group();
        [-3.6, -1.8, 1.8, 3.6].forEach((fx, idx) => {
            const glowMat = new THREE.MeshBasicMaterial({
                color: idx % 2 === 0 ? 0xdff8ff : 0x00ff68
            });
            const bank = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.08), glowMat);
            bank.position.set(fx, 3.6, -5.5);
            floodlightGroup.add(bank);
        });
        scene.add(floodlightGroup);

        // =====================================================================
        // 5. 3D UNDERFOOT EAFC SELECTION RINGS & OVERHEAD 3D CHEVRONS (▼)
        // =====================================================================
        function createPlayerRing3D(colorHex, radius) {
            const group = new THREE.Group();
            group.position.y = 0.012;

            // Outer glowing torus ring on the grass
            const ringGeo = new THREE.RingGeometry(radius * 0.86, radius, 48);
            const ringMat = new THREE.MeshBasicMaterial({
                color: colorHex,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.85
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.rotation.x = -Math.PI / 2;
            group.add(ringMesh);

            // Inner segmented radar arc
            const innerGeo = new THREE.RingGeometry(radius * 0.62, radius * 0.70, 32, 1, 0, Math.PI * 1.35);
            const innerMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.55
            });
            const innerMesh = new THREE.Mesh(innerGeo, innerMat);
            innerMesh.rotation.x = -Math.PI / 2;
            group.add(innerMesh);

            // Forward direction pointer triangle on turf
            const ptrGeo = new THREE.ConeGeometry(radius * 0.16, radius * 0.28, 3);
            const ptrMat = new THREE.MeshBasicMaterial({ color: colorHex });
            const ptrMesh = new THREE.Mesh(ptrGeo, ptrMat);
            ptrMesh.rotation.x = Math.PI / 2;
            ptrMesh.position.set(0, 0.01, radius * 1.12);
            group.add(ptrMesh);

            return { group, ringMesh, innerMesh, ringMat, innerMat };
        }

        function createOverheadChevron3D(colorHex) {
            const group = new THREE.Group();
            // Inverted 3D pyramid (authentic EAFC overhead player indicator ▼)
            const coneGeo = new THREE.ConeGeometry(0.11, 0.20, 4);
            const coneMat = new THREE.MeshStandardMaterial({
                color: colorHex,
                emissive: colorHex,
                emissiveIntensity: 0.65,
                roughness: 0.2,
                metalness: 0.3
            });
            const cone = new THREE.Mesh(coneGeo, coneMat);
            cone.rotation.x = Math.PI; // point downward
            cone.rotation.y = Math.PI / 4;
            group.add(cone);
            return { group, cone, coneMat };
        }

        // =====================================================================
        // 6. BUILD ARTICULATED 3D FOOTBALL PLAYER RIG (DAD & 1-YEAR-OLD SON)
        // =====================================================================
        const skinMatDad = new THREE.MeshStandardMaterial({ color: 0xf0c2a2, roughness: 0.52, metalness: 0.04 });
        applyEafcRimShader(skinMatDad, { rimIntensity: 0.32, rimPower: 2.6 });

        const skinMatSon = new THREE.MeshStandardMaterial({ color: 0xf6ccb0, roughness: 0.48, metalness: 0.02 });
        applyEafcRimShader(skinMatSon, { rimIntensity: 0.30, rimPower: 2.6 });

        const hairMatBlack = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.65 });
        applyEafcRimShader(hairMatBlack, { rimIntensity: 0.38, rimPower: 2.4 });

        const hairMatLightBrown = new THREE.MeshStandardMaterial({ color: 0x8b5e38, roughness: 0.55 });
        applyEafcRimShader(hairMatLightBrown, { rimIntensity: 0.35, rimPower: 2.4 });

        const shortsMat = new THREE.MeshStandardMaterial({ color: 0x12161f, roughness: 0.6 });
        applyEafcRimShader(shortsMat, { rimIntensity: 0.36, rimPower: 2.5 });

        const sockMat = new THREE.MeshStandardMaterial({ color: 0x141923, roughness: 0.6 });
        applyEafcRimShader(sockMat, { rimIntensity: 0.36, rimPower: 2.5 });

        const voltMat = new THREE.MeshStandardMaterial({
            color: 0x00ff68,
            emissive: 0x00ff68,
            emissiveIntensity: 0.25,
            roughness: 0.35
        });
        const bootMat = new THREE.MeshStandardMaterial({ color: 0x0c0f14, roughness: 0.3, metalness: 0.25 });
        applyEafcRimShader(bootMat, { rimIntensity: 0.40, rimPower: 2.5 });
        const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x161920 });
        const smileMat = new THREE.MeshBasicMaterial({ color: 0x9e4747 });

        function buildHumanPlayerRig(opts) {
            const {
                scale = 1.0,
                isToddler = false,
                numberStr = '10',
                skinMat = skinMatDad,
                hairMat = hairMatBlack
            } = opts;

            const root = new THREE.Group();
            root.scale.setScalar(scale);

            const pelvis = new THREE.Group();
            pelvis.position.y = isToddler ? 0.48 : 0.92;
            root.add(pelvis);

            // Shorts / Hip block
            const pelvisMesh = new THREE.Mesh(
                new THREE.CylinderGeometry(0.16, 0.15, 0.16, 16),
                shortsMat
            );
            pelvisMesh.castShadow = true;
            pelvis.add(pelvisMesh);

            // Torso group
            const torso = new THREE.Group();
            torso.position.y = 0.06;
            pelvis.add(torso);

            const torsoHeight = isToddler ? 0.34 : 0.48;
            const torsoTopR = isToddler ? 0.165 : 0.195;

            // Sculpted V-Taper Torso with LatheGeometry
            const torsoPts = isToddler
                ? [
                    new THREE.Vector2(0.145, 0.0),
                    new THREE.Vector2(0.150, torsoHeight * 0.35),
                    new THREE.Vector2(0.162, torsoHeight * 0.75),
                    new THREE.Vector2(0.165, torsoHeight)
                ]
                : [
                    new THREE.Vector2(0.155, 0.0), // hem
                    new THREE.Vector2(0.160, torsoHeight * 0.28), // waist taper
                    new THREE.Vector2(0.185, torsoHeight * 0.70), // chest volume
                    new THREE.Vector2(0.195, torsoHeight) // broad athletic shoulders
                ];
            const torsoCurve = new THREE.SplineCurve(torsoPts);
            const torsoGeo = new THREE.LatheGeometry(torsoCurve.getPoints(24), 24, Math.PI, Math.PI * 2);
            torsoGeo.scale(1.0, 1.0, 0.88); // subtle front-to-back flatter chest/ribcage

            const jerseyMat = new THREE.MeshStandardMaterial({
                map: createJerseyTexture(numberStr),
                bumpMap: sharedJerseyBumpTex,
                bumpScale: 0.007,
                roughness: 0.44,
                metalness: 0.10
            });
            applyEafcRimShader(jerseyMat, { rimIntensity: 0.42 });

            const torsoMesh = new THREE.Mesh(torsoGeo, jerseyMat);
            torsoMesh.castShadow = true;
            torso.add(torsoMesh);

            // Rounded chest/shoulder cap with neon volt collar ring
            const collarRing = new THREE.Mesh(
                new THREE.TorusGeometry(isToddler ? 0.085 : 0.095, 0.014, 10, 24),
                voltMat
            );
            collarRing.rotation.x = Math.PI / 2;
            collarRing.position.y = torsoHeight + 0.01;
            torso.add(collarRing);

            // Neck & Head Group
            const neckGroup = new THREE.Group();
            neckGroup.position.y = torsoHeight + 0.02;
            torso.add(neckGroup);

            const neckMesh = new THREE.Mesh(
                new THREE.CylinderGeometry(0.055, 0.062, 0.07, 14),
                skinMat
            );
            neckMesh.position.y = 0.025;
            neckGroup.add(neckMesh);

            const headGroup = new THREE.Group();
            headGroup.position.y = 0.055;
            neckGroup.add(headGroup);

            const headFaceMat = new THREE.MeshStandardMaterial({
                map: createFaceTexture({ isToddler }),
                roughness: 0.48,
                metalness: 0.04
            });
            applyEafcRimShader(headFaceMat, { rimIntensity: 0.36 });

            const headR = isToddler ? 0.152 : 0.138;

            const headProfile = isToddler
                ? [
                    new THREE.Vector2(0.001, 0.00),
                    new THREE.Vector2(headR * 0.48, headR * 0.12),
                    new THREE.Vector2(headR * 0.88, headR * 0.45),
                    new THREE.Vector2(headR * 0.96, headR * 0.95),
                    new THREE.Vector2(headR * 0.94, headR * 1.45),
                    new THREE.Vector2(headR * 0.62, headR * 1.82),
                    new THREE.Vector2(0.001, headR * 1.96)
                ]
                : [
                    new THREE.Vector2(0.001, 0.00),
                    new THREE.Vector2(headR * 0.42, headR * 0.10),
                    new THREE.Vector2(headR * 0.78, headR * 0.42),
                    new THREE.Vector2(headR * 0.88, headR * 0.88),
                    new THREE.Vector2(headR * 0.90, headR * 1.32),
                    new THREE.Vector2(headR * 0.82, headR * 1.72),
                    new THREE.Vector2(headR * 0.48, headR * 2.00),
                    new THREE.Vector2(0.001, headR * 2.10)
                ];

            const headCurve = new THREE.SplineCurve(headProfile);
            const headLatheGeo = new THREE.LatheGeometry(headCurve.getPoints(28), 32, Math.PI, Math.PI * 2);
            headLatheGeo.scale(1.0, 1.0, 1.06);

            const headMesh = new THREE.Mesh(headLatheGeo, headFaceMat);
            headMesh.castShadow = true;
            headGroup.add(headMesh);

            // Subtle 3D nose bridge contour so profile views have real 3D relief
            const noseBridge = new THREE.Mesh(
                new THREE.CylinderGeometry(headR * 0.045, headR * 0.085, headR * 0.30, 12),
                skinMat
            );
            noseBridge.position.set(0, headR * (isToddler ? 0.86 : 0.96), headR * 0.92);
            noseBridge.rotation.x = -0.22;
            headGroup.add(noseBridge);

            // Sculpted Ears
            [-1, 1].forEach((side) => {
                const ear = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.19, 12, 12), skinMat);
                ear.scale.set(0.42, 1.05, 0.68);
                ear.position.set(side * headR * 0.88, headR * (isToddler ? 0.88 : 0.96), -0.01);
                headGroup.add(ear);
            });

            // 3D Sculpted Hair
            if (!isToddler) {
                // Dad: Short black hair with neat crown & side fade
                const hairCap = new THREE.Mesh(
                    new THREE.SphereGeometry(headR * 0.98, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.58),
                    hairMat
                );
                hairCap.scale.set(0.95, 1.12, 0.98);
                hairCap.position.y = headR * 0.94;
                hairCap.rotation.x = -0.18;
                headGroup.add(hairCap);

                // Textured front quiff / fringe
                for (let i = -2; i <= 2; i++) {
                    const tuft = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.24, 10, 10), hairMat);
                    tuft.scale.set(1.1, 0.65, 0.9);
                    tuft.position.set(i * headR * 0.18, headR * 1.72, headR * 0.55 - Math.abs(i) * 0.012);
                    headGroup.add(tuft);
                }
            } else {
                // 1-Year-Old Son: Soft wavy light-brown toddler curls
                const curlBase = new THREE.Mesh(
                    new THREE.SphereGeometry(headR * 0.96, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.55),
                    hairMat
                );
                curlBase.position.y = headR * 0.95;
                curlBase.rotation.x = -0.15;
                headGroup.add(curlBase);

                const curlPositions = [
                    [0, 1.72, 0.45], [-0.35, 1.65, 0.38], [0.35, 1.65, 0.38],
                    [-0.62, 1.42, 0.15], [0.62, 1.42, 0.15], [0, 1.78, 0.1],
                    [-0.22, 1.74, 0.52], [0.22, 1.74, 0.52]
                ];
                curlPositions.forEach(([cx, cy, cz]) => {
                    const curl = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.24, 10, 10), hairMat);
                    curl.position.set(cx * headR, cy * headR, cz * headR);
                    headGroup.add(curl);
                });
            }

            // Articulated Arms (Shoulder -> UpperArm -> Elbow -> Forearm -> Hand)
            function buildArm(side) {
                const shoulder = new THREE.Group();
                shoulder.position.set(side * (torsoTopR + 0.035), torsoHeight - 0.04, 0);
                torso.add(shoulder);

                // Short sleeve with neon volt cuff
                const sleeveLen = isToddler ? 0.11 : 0.16;
                const sleeve = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.058, 0.052, sleeveLen, 14),
                    shortsMat
                );
                sleeve.position.y = -sleeveLen / 2;
                sleeve.castShadow = true;
                shoulder.add(sleeve);

                const cuff = new THREE.Mesh(
                    new THREE.TorusGeometry(0.053, 0.008, 8, 18),
                    voltMat
                );
                cuff.rotation.x = Math.PI / 2;
                cuff.position.y = -sleeveLen;
                shoulder.add(cuff);

                const upperLen = isToddler ? 0.14 : 0.23;
                const upperArm = new THREE.Mesh(
                    createAnatomicalSegmentGeo(
                        isToddler ? [0.046, 0.048, 0.042, 0.038] : [0.048, 0.052, 0.044, 0.038],
                        upperLen
                    ),
                    skinMat
                );
                shoulder.add(upperArm);

                const elbow = new THREE.Group();
                elbow.position.y = -upperLen;
                shoulder.add(elbow);

                const elbowCap = new THREE.Mesh(new THREE.SphereGeometry(isToddler ? 0.040 : 0.042, 12, 12), skinMat);
                elbow.add(elbowCap);

                const foreLen = isToddler ? 0.13 : 0.21;
                const forearm = new THREE.Mesh(
                    createAnatomicalSegmentGeo(
                        isToddler ? [0.042, 0.044, 0.036, 0.032] : [0.044, 0.048, 0.038, 0.032],
                        foreLen
                    ),
                    skinMat
                );
                elbow.add(forearm);

                const hand = new THREE.Mesh(
                    new THREE.SphereGeometry(isToddler ? 0.044 : 0.042, 12, 12),
                    skinMat
                );
                hand.scale.set(0.85, 1.15, 0.65);
                hand.position.y = -foreLen - 0.02;
                elbow.add(hand);

                return { shoulder, elbow, hand };
            }

            const leftArm = buildArm(-1);
            const rightArm = buildArm(1);

            // Articulated Legs (Hip -> Thigh -> Knee -> Shin/Sock -> Cleat)
            function buildLeg(side) {
                const hip = new THREE.Group();
                hip.position.set(side * (isToddler ? 0.085 : 0.098), -0.04, 0);
                pelvis.add(hip);

                const shortLegLen = isToddler ? 0.11 : 0.20;
                const shortLeg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.078, 0.068, shortLegLen, 14),
                    shortsMat
                );
                shortLeg.position.y = -shortLegLen / 2;
                shortLeg.castShadow = true;
                hip.add(shortLeg);

                const thighLen = isToddler ? 0.16 : 0.36;
                const thigh = new THREE.Mesh(
                    createAnatomicalSegmentGeo(
                        isToddler ? [0.066, 0.068, 0.056, 0.050] : [0.074, 0.078, 0.062, 0.052],
                        thighLen
                    ),
                    skinMat
                );
                thigh.castShadow = true;
                hip.add(thigh);

                const knee = new THREE.Group();
                knee.position.y = -thighLen;
                hip.add(knee);

                const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(isToddler ? 0.044 : 0.050, 12, 12), skinMat);
                knee.add(kneeJoint);

                const shinLen = isToddler ? 0.18 : 0.38;
                const sock = new THREE.Mesh(
                    createAnatomicalSegmentGeo(
                        isToddler ? [0.050, 0.056, 0.044, 0.036] : [0.052, 0.062, 0.046, 0.036],
                        shinLen
                    ),
                    sockMat
                );
                sock.castShadow = true;
                knee.add(sock);

                // Triple neon volt sock stripes
                [-0.03, -0.055, -0.08].forEach((sy) => {
                    const stripe = new THREE.Mesh(
                        new THREE.TorusGeometry(0.050, 0.006, 8, 18),
                        voltMat
                    );
                    stripe.rotation.x = Math.PI / 2;
                    stripe.position.y = sy;
                    knee.add(stripe);
                });

                const ankle = new THREE.Group();
                ankle.position.y = -shinLen;
                knee.add(ankle);

                const bootGroup = new THREE.Group();
                ankle.add(bootGroup);

                // Contoured upper boot body (tapered forefoot + anatomical instep)
                const bootUpperGeo = new THREE.CylinderGeometry(0.036, 0.044, 0.165, 16);
                bootUpperGeo.rotateX(Math.PI / 2);
                bootUpperGeo.scale(0.95, 0.68, 1.0);
                const bootUpper = new THREE.Mesh(bootUpperGeo, bootMat);
                bootUpper.position.set(0, -0.022, 0.038);
                bootUpper.castShadow = true;
                bootGroup.add(bootUpper);

                // Rounded aerodynamic toe cap
                const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.041, 14, 14), bootMat);
                toeCap.scale.set(0.92, 0.58, 1.15);
                toeCap.position.set(0, -0.026, 0.115);
                bootGroup.add(toeCap);

                // Sculpted ankle collar & heel cup
                const heelCup = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.041, 0.055, 14), bootMat);
                heelCup.position.set(0, -0.005, -0.025);
                bootGroup.add(heelCup);

                // Neon volt speed-stripe chevron & soleplate
                const solePlate = new THREE.Mesh(new THREE.BoxGeometry(0.076, 0.010, 0.175), voltMat);
                solePlate.position.set(0, -0.048, 0.038);
                bootGroup.add(solePlate);

                // Conical turf studs under soleplate
                [-0.024, 0.024].forEach((sx) => {
                    [-0.02, 0.04, 0.09].forEach((sz) => {
                        const stud = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.014, 6), voltMat);
                        stud.rotation.x = Math.PI;
                        stud.position.set(sx, -0.056, sz);
                        bootGroup.add(stud);
                    });
                });

                return { hip, knee, ankle };
            }

            const leftLeg = buildLeg(-1);
            const rightLeg = buildLeg(1);

            return {
                root,
                pelvis,
                torso,
                neckGroup,
                headGroup,
                leftArm,
                rightArm,
                leftLeg,
                rightLeg
            };
        }

        // =====================================================================
        // 7. BUILD ARTICULATED 3D BLACK SCHNAUZER-POODLE MIX (SCHNOODLE) RIG
        // =====================================================================
        function buildSchnoodleRig() {
            const root = new THREE.Group();

            const furMat = new THREE.MeshStandardMaterial({
                color: 0x121620,
                roughness: 0.62,
                metalness: 0.12
            });
            applyEafcRimShader(furMat, { rimIntensity: 0.68, rimPower: 2.2 });
            const noseMat = new THREE.MeshStandardMaterial({
                color: 0x050608,
                roughness: 0.18,
                metalness: 0.3
            });
            const tongueMat = new THREE.MeshStandardMaterial({
                color: 0xff6b8b,
                roughness: 0.4
            });

            const bodyGroup = new THREE.Group();
            bodyGroup.position.y = 0.34;
            root.add(bodyGroup);

            // Curly torso core + shaggy fur tufts
            const torsoCore = new THREE.Mesh(
                new THREE.CylinderGeometry(0.145, 0.135, 0.44, 16),
                furMat
            );
            torsoCore.rotation.x = Math.PI / 2;
            torsoCore.castShadow = true;
            bodyGroup.add(torsoCore);

            // Add shaggy Schnoodle coat curls along torso & chest
            for (let i = 0; i < 24; i++) {
                const ang = (i * 2.4);
                const zPos = -0.18 + (i / 24) * 0.38;
                const r = 0.065 + (i % 3) * 0.012;
                const tuft = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), furMat);
                tuft.position.set(Math.cos(ang) * 0.10, Math.sin(ang) * 0.09, zPos);
                tuft.castShadow = true;
                bodyGroup.add(tuft);
            }

            // Neon Volt TGFC Team Bandana & Glowing Collar Ring
            const collar = new THREE.Mesh(
                new THREE.TorusGeometry(0.142, 0.016, 10, 24),
                voltMat
            );
            collar.position.set(0, 0.05, 0.19);
            collar.rotation.x = 0.35;
            bodyGroup.add(collar);

            const bandana = new THREE.Mesh(
                new THREE.ConeGeometry(0.11, 0.16, 3),
                voltMat
            );
            bandana.position.set(0, -0.06, 0.24);
            bandana.rotation.x = Math.PI;
            bodyGroup.add(bandana);

            // Neck & Head Group
            const headGroup = new THREE.Group();
            headGroup.position.set(0, 0.14, 0.20);
            bodyGroup.add(headGroup);

            const skull = new THREE.Mesh(new THREE.SphereGeometry(0.135, 18, 18), furMat);
            skull.position.set(0, 0.06, 0.02);
            skull.castShadow = true;
            headGroup.add(skull);

            // Shaggy topknot & schnauzer eyebrows
            [-1, 1].forEach((side) => {
                const browTuft = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), furMat);
                browTuft.scale.set(1.3, 0.7, 1.1);
                browTuft.position.set(side * 0.055, 0.115, 0.115);
                headGroup.add(browTuft);

                // Expressive dark eyes with bright catchlights
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), pupilMat);
                eye.position.set(side * 0.052, 0.085, 0.135);
                headGroup.add(eye);

                const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), eyeWhiteMat);
                catchlight.position.set(side * 0.052 + 0.006, 0.092, 0.154);
                headGroup.add(catchlight);
            });

            // Scruffy Schnauzer-Poodle Muzzle & Beard
            const snout = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.095, 0.14), furMat);
            snout.position.set(0, 0.03, 0.14);
            headGroup.add(snout);

            const beard = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 12), furMat);
            beard.scale.set(1.1, 1.15, 0.9);
            beard.position.set(0, -0.01, 0.15);
            headGroup.add(beard);

            // Shiny wet black nose
            const nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), noseMat);
            nose.scale.set(1.2, 0.9, 0.9);
            nose.position.set(0, 0.062, 0.215);
            headGroup.add(nose);

            // Happy panting pink tongue
            const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.012, 0.065), tongueMat);
            tongue.position.set(0, -0.012, 0.195);
            tongue.rotation.x = 0.35;
            headGroup.add(tongue);

            // Floppy Schnoodle Ears
            const leftEar = new THREE.Group();
            leftEar.position.set(-0.12, 0.11, 0.02);
            const earMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.09), furMat);
            earMeshL.position.y = -0.07;
            leftEar.add(earMeshL);
            leftEar.rotation.z = 0.22;
            headGroup.add(leftEar);

            const rightEar = new THREE.Group();
            rightEar.position.set(0.12, 0.11, 0.02);
            const earMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.09), furMat);
            earMeshR.position.y = -0.07;
            rightEar.add(earMeshR);
            rightEar.rotation.z = -0.22;
            headGroup.add(rightEar);

            // Articulated Curly Tail
            const tailGroup = new THREE.Group();
            tailGroup.position.set(0, 0.08, -0.21);
            bodyGroup.add(tailGroup);

            for (let t = 0; t < 5; t++) {
                const seg = new THREE.Mesh(new THREE.SphereGeometry(0.038 - t * 0.004, 10, 10), furMat);
                seg.position.set(0, t * 0.042, -t * 0.015);
                tailGroup.add(seg);
            }

            // 4 Articulated Furry Legs & Paws
            function buildDogLeg(lx, lz) {
                const legGroup = new THREE.Group();
                legGroup.position.set(lx, -0.06, lz);
                bodyGroup.add(legGroup);

                const legCyl = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.046, 0.038, 0.26, 12),
                    furMat
                );
                legCyl.position.y = -0.13;
                legCyl.castShadow = true;
                legGroup.add(legCyl);

                const paw = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 12), furMat);
                paw.scale.set(1.0, 0.65, 1.25);
                paw.position.set(0, -0.26, 0.015);
                legGroup.add(paw);

                return legGroup;
            }

            const flLeg = buildDogLeg(-0.085, 0.14);
            const frLeg = buildDogLeg(0.085, 0.14);
            const blLeg = buildDogLeg(-0.085, -0.14);
            const brLeg = buildDogLeg(0.085, -0.14);

            return {
                root,
                bodyGroup,
                headGroup,
                tongue,
                leftEar,
                rightEar,
                tailGroup,
                flLeg,
                frLeg,
                blLeg,
                brLeg
            };
        }

        // =====================================================================
        // 8. INSTANTIATE THE TRIO & 3D FOOTBALLS IN A COMPACT, IN-FRAME LINEUP
        // =====================================================================
        const squadGroup = new THREE.Group();
        scene.add(squadGroup);

        // 1. Center: Dad / Manager Tomi Gelo (#10)
        const dadRig = buildHumanPlayerRig({
            scale: 1.0,
            isToddler: false,
            numberStr: '10',
            skinMat: skinMatDad,
            hairMat: hairMatBlack
        });
        dadRig.root.position.set(0, 0, 0);
        squadGroup.add(dadRig.root);

        // 2. Left: 1-Year-Old Son (#7, placed close at x = -0.82 so always in-frame!)
        const sonRig = buildHumanPlayerRig({
            scale: 0.72,
            isToddler: true,
            numberStr: '7',
            skinMat: skinMatSon,
            hairMat: hairMatLightBrown
        });
        sonRig.root.position.set(-0.82, 0, 0.24);
        sonRig.root.rotation.y = 0.18;
        squadGroup.add(sonRig.root);

        // 3. Right: 7-Year-Old Black Schnoodle (placed close at x = +0.82 so always in-frame!)
        const dogRig = buildSchnoodleRig();
        dogRig.root.position.set(0.82, 0, 0.28);
        dogRig.root.rotation.y = -0.22;
        squadGroup.add(dogRig.root);

        // 3D Match Footballs (Dad's juggling match ball + Son's mini ball)
        const ballTex = createSoccerBallTexture();
        const ballMat = new THREE.MeshStandardMaterial({
            map: ballTex,
            roughness: 0.35,
            metalness: 0.1
        });
        const matchBall = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 24), ballMat);
        matchBall.castShadow = true;
        matchBall.position.set(0.16, 0.135, 0.26);
        squadGroup.add(matchBall);

        const miniBall = new THREE.Mesh(new THREE.SphereGeometry(0.095, 20, 20), ballMat);
        miniBall.castShadow = true;
        miniBall.position.set(-0.72, 0.095, 0.46);
        squadGroup.add(miniBall);

        // 3D Underfoot Rings & Overhead Chevrons attached to each player position
        const dadRing = createPlayerRing3D(0x00ff68, 0.44);
        dadRing.group.position.set(0, 0.012, 0.05);
        squadGroup.add(dadRing.group);

        const sonRing = createPlayerRing3D(0xf5c451, 0.34);
        sonRing.group.position.set(-0.82, 0.012, 0.26);
        squadGroup.add(sonRing.group);

        const dogRing = createPlayerRing3D(0x00e5ff, 0.36);
        dogRing.group.position.set(0.82, 0.012, 0.28);
        squadGroup.add(dogRing.group);

        const dadChevron = createOverheadChevron3D(0x00ff68);
        const sonChevron = createOverheadChevron3D(0xf5c451);
        const dogChevron = createOverheadChevron3D(0x00e5ff);
        squadGroup.add(dadChevron.group, sonChevron.group, dogChevron.group);

        // =====================================================================
        // 9. INTERACTIVE CAMERA FOCUS, ORBIT & CELEBRATION STATE MACHINE
        // =====================================================================
        const ACTORS = {
            son: {
                id: 'son',
                label: 'JR. TACTICIAN #7',
                color: '#F5C451',
                targetPos: new THREE.Vector3(-0.32, 0.96, 0.1),
                camOffset: new THREE.Vector3(-0.45, 1.08, 3.85),
                popupText: '👶 GOAL CELEBRATION +99!'
            },
            dad: {
                id: 'dad',
                label: 'GELO #10',
                color: '#00FF68',
                targetPos: new THREE.Vector3(0, 1.05, 0),
                camOffset: new THREE.Vector3(0, 1.25, 4.55),
                popupText: '⚽ RAINBOW JUGGLE +99!'
            },
            dog: {
                id: 'dog',
                label: 'ASST. GAFFER #1',
                color: '#00E5FF',
                targetPos: new THREE.Vector3(0.32, 0.88, 0.1),
                camOffset: new THREE.Vector3(0.45, 1.02, 3.85),
                popupText: '🐾 ZOOMIE SPIN +100!'
            }
        };

        let activeActor = 'dad';
        let bursts = { son: 0, dad: 0, dog: 0 };
        let userYaw = 0;
        let isDragging = false;
        let dragStartX = 0;
        let dragMoved = false;
        let pointerHover = { x: 0, y: 0 };
        const popups = [];

        const currentCamPos = new THREE.Vector3(0, 1.25, 4.65);
        const currentLookAt = new THREE.Vector3(0, 1.02, 0);

        function updateCalloutHighlight() {
            calloutBtns.forEach((btn) => {
                const actor = btn.getAttribute('data-trio-actor');
                btn.classList.toggle('active-actor', actor === activeActor);
            });
        }

        function triggerCelebration(actorKey, celebrateAll = false) {
            if (celebrateAll) {
                activeActor = 'dad';
                bursts.son = 1.8;
                bursts.dad = 1.8;
                bursts.dog = 1.8;
                ['son', 'dad', 'dog'].forEach((k, idx) => {
                    popups.push({
                        actor: k,
                        text: ACTORS[k].popupText,
                        color: ACTORS[k].color,
                        life: 1.4,
                        delay: idx * 0.08
                    });
                });
            } else if (ACTORS[actorKey]) {
                activeActor = actorKey;
                bursts[actorKey] = 1.8;
                popups.push({
                    actor: actorKey,
                    text: ACTORS[actorKey].popupText,
                    color: ACTORS[actorKey].color,
                    life: 1.4,
                    delay: 0
                });
            }
            updateCalloutHighlight();
            if (window.tgfcPlaySelectSfx) {
                window.tgfcPlaySelectSfx();
            }
        }

        // Stage pointer & drag orbit events
        stageEl.addEventListener('pointerdown', (e) => {
            if (e.target.closest('#fc-stage-celebrate-btn')) return;
            isDragging = true;
            dragMoved = false;
            dragStartX = e.clientX;
        });

        window.addEventListener('pointermove', (e) => {
            const rect = stageEl.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                pointerHover.x = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
                pointerHover.y = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
            }
            if (isDragging) {
                const dx = e.clientX - dragStartX;
                if (Math.abs(dx) > 4) dragMoved = true;
                userYaw = Math.max(-0.65, Math.min(0.65, userYaw + dx * 0.007));
                dragStartX = e.clientX;
            }
        });

        window.addEventListener('pointerup', () => {
            isDragging = false;
        });

        stageEl.addEventListener('click', (e) => {
            if (e.target.closest('#fc-stage-celebrate-btn') || dragMoved) return;
            const rect = stageEl.getBoundingClientRect();
            const nx = (e.clientX - rect.left) / rect.width;
            if (nx < 0.35) {
                triggerCelebration('son', false);
            } else if (nx > 0.65) {
                triggerCelebration('dog', false);
            } else {
                triggerCelebration('dad', false);
            }
        });

        celebrateBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            userYaw = 0;
            triggerCelebration('dad', true);
        });

        calloutBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const actor = btn.getAttribute('data-trio-actor');
                if (actor) {
                    userYaw = 0;
                    triggerCelebration(actor, false);
                }
            });
        });

        // =====================================================================
        // 10. RESPONSIVE FRUSTUM SIZING (GUARANTEES ALL 3 PLAYERS ARE IN-FRAME)
        // =====================================================================
        let aspectScaleZ = 1.0;

        function syncStageSize() {
            const rect = stageEl.getBoundingClientRect();
            if (rect.width < 10 || rect.height < 10) return;

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = Math.round(rect.width * dpr);
            const h = Math.round(rect.height * dpr);

            if (glCanvas.width !== w || glCanvas.height !== h) {
                renderer.setSize(rect.width, rect.height, false);
                hudCanvas.width = w;
                hudCanvas.height = h;
                camera.aspect = rect.width / rect.height;
                camera.updateProjectionMatrix();
            }

            // If viewport is narrower than 1.55:1, automatically pull camera back so x: [-1.15 .. +1.15] stays 100% inside frustum!
            const aspect = rect.width / rect.height;
            aspectScaleZ = aspect < 1.55 ? (1.55 / Math.max(aspect, 0.75)) : 1.0;
        }

        window.addEventListener('resize', syncStageSize);

        // Project 3D world position to 2D HUD canvas pixel coordinates
        const tempProj = new THREE.Vector3();
        function worldToHud(x, y, z) {
            tempProj.set(x, y, z);
            tempProj.project(camera);
            return {
                x: (tempProj.x * 0.5 + 0.5) * hudCanvas.width,
                y: (-tempProj.y * 0.5 + 0.5) * hudCanvas.height
            };
        }

        // =====================================================================
        // 11. 60FPS SKELETAL ANIMATION LOOP & 2D TELEMETRY OVERLAY
        // =====================================================================
        let lastTime = performance.now();
        updateCalloutHighlight();

        function animate(now) {
            requestAnimationFrame(animate);

            // Pause rendering when Work -> Central Hub is hidden
            const workScreen = document.getElementById('screen-work');
            const centralView = document.getElementById('work-view-central');
            if (!workScreen || workScreen.hidden || !centralView || centralView.hidden) {
                lastTime = now;
                return;
            }

            syncStageSize();
            const dt = Math.min((now - lastTime) * 0.001, 0.05);
            lastTime = now;
            const t = now * 0.001;

            // Decay celebration bursts
            bursts.son = Math.max(0, bursts.son - dt * 0.85);
            bursts.dad = Math.max(0, bursts.dad - dt * 0.85);
            bursts.dog = Math.max(0, bursts.dog - dt * 0.85);

            const bDad = bursts.dad;
            const bSon = bursts.son;
            const bDog = bursts.dog;

            // -----------------------------------------------------------------
            // A. DAD (#10) SKELETAL ANIMATION: Athletic Bounce + Ball Juggling!
            // -----------------------------------------------------------------
            const dadJuggleCycle = Math.sin(t * 4.4);
            const dadJump = bDad > 0 ? Math.abs(Math.sin(t * 10.0)) * bDad * 0.28 : 0;

            dadRig.pelvis.position.y = 0.92 + Math.abs(Math.sin(t * 4.4)) * 0.035 + dadJump;
            dadRig.pelvis.position.x = Math.sin(t * 2.2) * 0.03;
            dadRig.torso.rotation.y = Math.sin(t * 2.2) * 0.14 + (bDad > 0 ? Math.sin(t * 8.0) * 0.25 : 0);
            dadRig.torso.rotation.z = Math.cos(t * 2.2) * 0.04;
            dadRig.headGroup.rotation.y = Math.sin(t * 1.5) * 0.22;
            dadRig.headGroup.rotation.x = Math.sin(t * 4.4) * 0.06;

            // Dad's arms: athletic counter-swing or double fist-pump during celebration
            if (bDad > 0.2) {
                dadRig.leftArm.shoulder.rotation.z = 2.4 + Math.sin(t * 14.0) * 0.35;
                dadRig.rightArm.shoulder.rotation.z = -2.4 - Math.cos(t * 14.0) * 0.35;
                dadRig.leftArm.elbow.rotation.x = -0.6;
                dadRig.rightArm.elbow.rotation.x = -0.6;
            } else {
                dadRig.leftArm.shoulder.rotation.z = 0.22 + Math.sin(t * 4.4) * 0.08;
                dadRig.leftArm.shoulder.rotation.x = Math.cos(t * 4.4) * 0.28;
                dadRig.leftArm.elbow.rotation.x = -0.55 - Math.sin(t * 4.4) * 0.15;

                dadRig.rightArm.shoulder.rotation.z = -0.22 - Math.sin(t * 4.4) * 0.08;
                dadRig.rightArm.shoulder.rotation.x = -Math.cos(t * 4.4) * 0.28;
                dadRig.rightArm.elbow.rotation.x = -0.55 + Math.sin(t * 4.4) * 0.15;
            }

            // Dad's right leg juggling the 3D match ball continuously!
            const kickLift = Math.max(0, dadJuggleCycle);
            dadRig.rightLeg.hip.rotation.x = -0.15 - kickLift * 0.65;
            dadRig.rightLeg.knee.rotation.x = 0.25 + kickLift * 0.55;
            dadRig.leftLeg.hip.rotation.x = Math.sin(t * 4.4) * 0.06;
            dadRig.leftLeg.knee.rotation.x = 0.08;

            // 3D Match Ball physics: bounces off Dad's juggling right boot (and flies high on celebration!)
            const ballBounce = Math.abs(Math.sin(t * 4.4 - 0.35));
            matchBall.position.y = 0.16 + ballBounce * (0.42 + bDad * 0.65);
            matchBall.position.x = 0.15 + Math.sin(t * 2.2) * 0.05;
            matchBall.rotation.x += dt * 5.5;
            matchBall.rotation.z -= dt * 3.2;

            // -----------------------------------------------------------------
            // B. 1-YEAR-OLD SON (#7) SKELETAL ANIMATION: Toddler Jump, Wave & Kick!
            // -----------------------------------------------------------------
            const sonBounce = Math.abs(Math.sin(t * 5.2));
            const sonJump = bSon > 0 ? Math.abs(Math.sin(t * 11.0)) * bSon * 0.32 : 0;

            sonRig.pelvis.position.y = 0.48 + sonBounce * 0.055 + sonJump;
            sonRig.root.rotation.y = 0.18 + Math.sin(t * 2.6) * 0.16 + (bSon > 0 ? t * 6.0 % (Math.PI * 2) * Math.min(1, bSon) : 0);
            sonRig.torso.rotation.z = Math.sin(t * 2.6) * 0.08;
            sonRig.headGroup.rotation.z = Math.cos(t * 2.6) * 0.10;
            sonRig.headGroup.rotation.y = Math.sin(t * 2.0) * 0.20;

            // Son waving both raised 3D arms cheerfully!
            sonRig.leftArm.shoulder.rotation.z = 2.15 + Math.sin(t * (7.0 + bSon * 6.0)) * 0.42;
            sonRig.rightArm.shoulder.rotation.z = -2.15 + Math.cos(t * (7.0 + bSon * 6.0)) * 0.42;
            sonRig.leftArm.elbow.rotation.z = 0.25;
            sonRig.rightArm.elbow.rotation.z = -0.25;

            // Son kicking his mini 3D football
            const sonKick = Math.sin(t * 5.2);
            sonRig.leftLeg.hip.rotation.x = sonKick * 0.45;
            sonRig.leftLeg.knee.rotation.x = Math.max(0, -sonKick * 0.4);
            sonRig.rightLeg.hip.rotation.x = -sonKick * 0.45;
            sonRig.rightLeg.knee.rotation.x = Math.max(0, sonKick * 0.4);

            miniBall.position.x = -0.72 + Math.sin(t * 2.6) * 0.12;
            miniBall.position.y = 0.095 + Math.abs(Math.sin(t * 5.2)) * (0.14 + bSon * 0.48);
            miniBall.rotation.z -= dt * 6.0;
            miniBall.rotation.x += dt * 4.0;

            // -----------------------------------------------------------------
            // C. 7-YEAR-OLD SCHNOODLE (#1) SKELETAL ANIMATION: Tail Wag, Hop & Spin!
            // -----------------------------------------------------------------
            const dogHop = Math.abs(Math.sin(t * 5.8 + 0.8));
            const dogJump = bDog > 0 ? Math.abs(Math.sin(t * 12.0)) * bDog * 0.30 : 0;

            dogRig.bodyGroup.position.y = 0.34 + dogHop * 0.045 + dogJump;
            dogRig.bodyGroup.rotation.x = Math.sin(t * 5.8 + 0.8) * 0.12;
            dogRig.root.rotation.y = -0.22 + Math.sin(t * 2.1) * 0.14 + (bDog > 0 ? Math.sin(t * 7.0) * bDog * 0.8 : 0);

            // Curious head tilt, floppy ear bounce & happy panting tongue
            dogRig.headGroup.rotation.z = Math.sin(t * 3.2) * 0.18;
            dogRig.headGroup.rotation.x = -0.08 + Math.cos(t * 5.8) * 0.08;
            dogRig.leftEar.rotation.z = 0.24 + dogHop * 0.18;
            dogRig.rightEar.rotation.z = -0.24 - dogHop * 0.18;
            dogRig.tongue.position.y = -0.012 + Math.sin(t * 14.0) * 0.006;

            // High-speed happy tail wag!
            dogRig.tailGroup.rotation.z = Math.sin(t * (14.0 + bDog * 10.0)) * 0.55;
            dogRig.tailGroup.rotation.x = 0.25 + Math.cos(t * 7.0) * 0.12;

            // Prancing paws
            const pawCycle = Math.sin(t * 5.8);
            dogRig.flLeg.rotation.x = pawCycle * 0.38;
            dogRig.brLeg.rotation.x = pawCycle * 0.38;
            dogRig.frLeg.rotation.x = -pawCycle * 0.38;
            dogRig.blLeg.rotation.x = -pawCycle * 0.38;

            // -----------------------------------------------------------------
            // D. ANIMATE 3D UNDERFOOT RINGS & OVERHEAD 3D CHEVRONS (▼)
            // -----------------------------------------------------------------
            const ringPairs = [
                { key: 'dad', ring: dadRing, chev: dadChevron, x: 0, y: 1.98 + dadJump },
                { key: 'son', ring: sonRing, chev: sonChevron, x: -0.82, y: 1.05 + sonJump },
                { key: 'dog', ring: dogRing, chev: dogChevron, x: 0.82, y: 0.88 + dogJump }
            ];

            ringPairs.forEach(({ key, ring, chev, x, y }) => {
                const isSel = activeActor === key;
                const bVal = bursts[key] || 0;
                ring.innerMesh.rotation.z = t * (isSel ? 2.2 : 0.8);
                ring.ringMat.opacity = isSel ? 0.95 : 0.38;
                ring.innerMat.opacity = isSel ? 0.80 : 0.25;
                const s = (isSel ? 1.08 : 0.92) + bVal * 0.18;
                ring.group.scale.setScalar(s);

                chev.group.position.set(x, y + Math.sin(t * 4.5) * 0.045, key === 'dad' ? 0 : 0.26);
                chev.cone.rotation.y = t * (isSel ? 3.2 : 1.4);
                chev.group.scale.setScalar(isSel ? 1.15 : 0.72);
                chev.coneMat.emissiveIntensity = isSel ? 0.95 : 0.35;
            });

            // -----------------------------------------------------------------
            // E. SMOOTH 3D CAMERA FOCUS & ORBIT
            // -----------------------------------------------------------------
            const focusActor = ACTORS[activeActor] || ACTORS.dad;
            const celebrateAllActive = bDad > 0.3 && bSon > 0.3 && bDog > 0.3;

            const desiredLook = celebrateAllActive
                ? new THREE.Vector3(0, 0.98, 0.1)
                : focusActor.targetPos;

            const baseCam = celebrateAllActive
                ? new THREE.Vector3(Math.sin(t * 2.2) * 0.65, 1.18, 4.35)
                : focusActor.camOffset.clone();

            // Apply responsive aspect Z scaling + user drag orbit + pointer parallax
            const totalYaw = userYaw + pointerHover.x * 0.14;
            const radiusZ = baseCam.z * aspectScaleZ;
            const targetCamX = baseCam.x + Math.sin(totalYaw) * radiusZ * 0.45;
            const targetCamZ = Math.cos(totalYaw) * radiusZ;
            const targetCamY = baseCam.y - pointerHover.y * 0.12;

            currentCamPos.x += (targetCamX - currentCamPos.x) * Math.min(1, dt * 5.5);
            currentCamPos.y += (targetCamY - currentCamPos.y) * Math.min(1, dt * 5.5);
            currentCamPos.z += (targetCamZ - currentCamPos.z) * Math.min(1, dt * 5.5);

            currentLookAt.lerp(desiredLook, Math.min(1, dt * 6.0));
            camera.position.copy(currentCamPos);
            camera.lookAt(currentLookAt);

            // Render 3D scene
            renderer.render(scene, camera);

            if (!stageEl.classList.contains('webgl-ready')) {
                stageEl.classList.add('webgl-ready');
            }

            // -----------------------------------------------------------------
            // F. DRAW 2D OVERLAY GAMERTAG PILLS & CELEBRATION POPUPS
            // -----------------------------------------------------------------
            const w = hudCanvas.width;
            const h = hudCanvas.height;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            ctx2d.clearRect(0, 0, w, h);

            ringPairs.forEach(({ key, chev }) => {
                const actor = ACTORS[key];
                const isSel = activeActor === key;
                const pt = worldToHud(
                    chev.group.position.x,
                    chev.group.position.y + 0.16,
                    chev.group.position.z
                );

                ctx2d.save();
                ctx2d.font = `800 ${Math.round((isSel ? 9.5 : 8.0) * dpr)}px "JetBrains Mono", monospace`;
                const tw = ctx2d.measureText(actor.label).width + 10 * dpr;
                const th = (isSel ? 14.5 : 12.5) * dpr;
                const px = Math.max(tw * 0.5 + 4 * dpr, Math.min(w - tw * 0.5 - 4 * dpr, pt.x));
                const py = Math.max(32 * dpr, pt.y);

                ctx2d.fillStyle = isSel ? 'rgba(4, 8, 15, 0.92)' : 'rgba(4, 8, 15, 0.72)';
                ctx2d.strokeStyle = actor.color;
                ctx2d.lineWidth = (isSel ? 1.5 : 1.0) * dpr;
                ctx2d.fillRect(px - tw * 0.5, py - th * 0.5, tw, th);
                ctx2d.strokeRect(px - tw * 0.5, py - th * 0.5, tw, th);

                ctx2d.fillStyle = isSel ? '#FFFFFF' : 'rgba(255, 255, 255, 0.82)';
                ctx2d.textAlign = 'center';
                ctx2d.textBaseline = 'middle';
                ctx2d.fillText(actor.label, px, py + 0.5 * dpr);
                ctx2d.restore();
            });

            // Floating celebration telemetry popups
            for (let i = popups.length - 1; i >= 0; i--) {
                const p = popups[i];
                if (p.delay > 0) {
                    p.delay -= dt;
                    continue;
                }
                p.life -= dt * 0.9;
                if (p.life <= 0) {
                    popups.splice(i, 1);
                    continue;
                }
                const targetChev = p.actor === 'son' ? sonChevron : (p.actor === 'dog' ? dogChevron : dadChevron);
                const pt = worldToHud(
                    targetChev.group.position.x,
                    targetChev.group.position.y + 0.34 + (1.4 - p.life) * 0.25,
                    targetChev.group.position.z
                );
                ctx2d.save();
                ctx2d.globalAlpha = Math.min(1, p.life * 1.3);
                ctx2d.font = `900 ${Math.round(10.5 * dpr)}px "JetBrains Mono", monospace`;
                const tw = ctx2d.measureText(p.text).width + 12 * dpr;
                const th = 18 * dpr;
                const px = Math.max(tw * 0.5 + 6 * dpr, Math.min(w - tw * 0.5 - 6 * dpr, pt.x));
                const py = Math.max(36 * dpr, pt.y);
                ctx2d.fillStyle = 'rgba(4, 8, 15, 0.95)';
                ctx2d.strokeStyle = p.color;
                ctx2d.lineWidth = 1.6 * dpr;
                ctx2d.fillRect(px - tw * 0.5, py - th * 0.5, tw, th);
                ctx2d.strokeRect(px - tw * 0.5, py - th * 0.5, tw, th);
                ctx2d.fillStyle = p.color;
                ctx2d.textAlign = 'center';
                ctx2d.textBaseline = 'middle';
                ctx2d.fillText(p.text, px, py + 1 * dpr);
                ctx2d.restore();
            }
        }

        requestAnimationFrame(animate);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThreeJsTrioStage);
    } else {
        initThreeJsTrioStage();
    }
})();
