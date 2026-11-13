/**
 * TGFC 26 — EAFC Frostbite 2.5D Broadcast Stage + 3D Telemetry Engine
 * Renders photorealistic career-dugout-trio.jpg through a depth-parallax GLSL
 * ShaderMaterial with living stadium floodlight atmosphere, aspect-safe
 * cover-biased framing, smooth focus zoom/pan, and a pixel-locked 3D
 * Perspective Pitch & HUD Telemetry layer (rings, spinning chevrons, dust motes,
 * pyro sparks, DPR-crisp gamertags, and celebration popups).
 */
(function () {
    'use strict';

    const IMG_WIDTH = 1376;
    const IMG_HEIGHT = 768;
    const IMG_ASPECT = IMG_WIDTH / IMG_HEIGHT;

    const DEPTH_W = 512;
    const DEPTH_H = 288;
    const PIVOT_DEPTH = 0.62;

    // Measured normalized landmarks (top-left origin: u in [0..1], vTop in [0..1])
    const HORIZON_V_TOP = 0.6940;
    const TOUCHLINE_V_TOP = 0.8802;

    // Six measured stadium floodlight clusters in bottom-left UV space
    const FLOODLIGHTS_UV = [
        [0.0203, 0.9284],
        [0.1548, 0.7956],
        [0.3001, 0.7409],
        [0.6977, 0.7409],
        [0.8408, 0.7969],
        [0.9760, 0.9245]
    ];

    // Combined bounding box protecting Son's raised left hand, Dog's tail/paws,
    // Dad's hair top, and underfoot turf rings across all stage aspect ratios.
    const TRIO_SAFE_BOX = {
        minU: 0.095,
        maxU: 0.915,
        minVtop: 0.048,
        maxVtop: 0.938
    };

    const ACTORS = {
        son: {
            id: 'son',
            label: 'JR. TACTICIAN #7',
            color: '#F5C451',
            colorHex: 0xf5c451,
            colorRgb: [0.961, 0.769, 0.318],
            popupText: '👶 GOAL CELEBRATION +99!',
            footU: 0.215,
            footVtop: 0.886,
            chevU: 0.2049,
            chevVtop: 0.362,
            headTopVtop: 0.4180,
            faceBox: { minU: 0.180, maxU: 0.229, minVtop: 0.424, maxVtop: 0.525 },
            spotlightU: 0.205,
            spotlightVtop: 0.650,
            hitbox: { minU: 0.110, maxU: 0.305, minVtop: 0.340, maxVtop: 0.930 },
            focusCenter: [0.215, 0.630],
            focusBox: { minU: 0.095, maxU: 0.320, minVtop: 0.270, maxVtop: 0.938 },
            ringRadius: 0.37
        },
        dad: {
            id: 'dad',
            label: 'GELO #10',
            color: '#00FF68',
            colorHex: 0x00ff68,
            colorRgb: [0.0, 1.0, 0.408],
            popupText: '⚽ RAINBOW JUGGLE +99!',
            footU: 0.492,
            footVtop: 0.884,
            chevU: 0.5051,
            chevVtop: 0.044,
            chevFallback: [0.562, 0.185],
            headTopVtop: 0.0755,
            faceBox: { minU: 0.480, maxU: 0.530, minVtop: 0.080, maxVtop: 0.205 },
            spotlightU: 0.504,
            spotlightVtop: 0.480,
            hitbox: { minU: 0.405, maxU: 0.590, minVtop: 0.055, maxVtop: 0.928 },
            focusCenter: [0.498, 0.485],
            focusBox: { minU: 0.395, maxU: 0.605, minVtop: 0.052, maxVtop: 0.918 },
            ringRadius: 0.46
        },
        dog: {
            id: 'dog',
            label: 'ASST. GAFFER #1',
            color: '#00E5FF',
            colorHex: 0x00e5ff,
            colorRgb: [0.0, 0.898, 1.0],
            popupText: '🐾 ZOOMIE SPIN +100!',
            footU: 0.805,
            footVtop: 0.892,
            chevU: 0.7544,
            chevVtop: 0.455,
            headTopVtop: 0.5117,
            faceBox: { minU: 0.720, maxU: 0.790, minVtop: 0.515, maxVtop: 0.640 },
            spotlightU: 0.790,
            spotlightVtop: 0.700,
            hitbox: { minU: 0.705, maxU: 0.900, minVtop: 0.440, maxVtop: 0.932 },
            focusCenter: [0.798, 0.680],
            focusBox: { minU: 0.695, maxU: 0.915, minVtop: 0.360, maxVtop: 0.940 },
            ringRadius: 0.41
        }
    };

    const ACTOR_KEYS = ['son', 'dad', 'dog'];

    function clamp(v, lo, hi) {
        return v < lo ? lo : (v > hi ? hi : v);
    }

    function smoothstep(edge0, edge1, x) {
        const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }

    /**
     * Generates a smooth, artifact-free 2.5D depth buffer + linear CanvasTexture
     * aligned to the measured silhouettes, footballs, turf plane, and stands.
     */
    function buildDepthMap(THREE) {
        const w = DEPTH_W;
        const h = DEPTH_H;
        const buf = new Float32Array(w * h);

        // 1. Background sky, stadium bowl, and perspective-sloped turf
        for (let y = 0; y < h; y++) {
            const vTop = (y + 0.5) / h;
            for (let x = 0; x < w; x++) {
                const u = (x + 0.5) / w;
                let d;
                if (vTop <= 0.34) {
                    d = 0.03 + (vTop / 0.34) * 0.10;
                } else if (vTop <= HORIZON_V_TOP) {
                    const t = (vTop - 0.34) / (HORIZON_V_TOP - 0.34);
                    const bowl = 0.042 * Math.pow(2 * u - 1, 2);
                    d = 0.13 + t * 0.23 + bowl * t;
                } else {
                    const t = (vTop - HORIZON_V_TOP) / (1.0 - HORIZON_V_TOP);
                    // Matches ~0.760 at touchline (vTop=0.8802) so feet anchor cleanly
                    d = 0.36 + (0.48 * t + 0.095 * t * t);
                }
                buf[y * w + x] = d;
            }
        }

        function blendEllipse(cu, cvTop, ru, rv, peakDepth, feather, bulge) {
            const padU = ru + feather;
            const padV = rv + feather * IMG_ASPECT;
            const x0 = Math.max(0, Math.floor((cu - padU) * w));
            const x1 = Math.min(w - 1, Math.ceil((cu + padU) * w));
            const y0 = Math.max(0, Math.floor((cvTop - padV) * h));
            const y1 = Math.min(h - 1, Math.ceil((cvTop + padV) * h));
            const fNorm = feather / Math.max(0.001, Math.min(ru, rv));

            for (let y = y0; y <= y1; y++) {
                const dy = ((y + 0.5) / h - cvTop) / rv;
                for (let x = x0; x <= x1; x++) {
                    const dx = ((x + 0.5) / w - cu) / ru;
                    const dist = Math.hypot(dx, dy);
                    if (dist < 1.0 + fNorm) {
                        const alpha = 1.0 - smoothstep(Math.max(0, 1.0 - fNorm * 0.55), 1.0 + fNorm, dist);
                        const dome = bulge * Math.sqrt(Math.max(0, 1.0 - Math.min(1.0, dist * dist)));
                        const idx = y * w + x;
                        const target = peakDepth + dome;
                        const mixed = buf[idx] + (target - buf[idx]) * alpha;
                        if (mixed > buf[idx]) buf[idx] = mixed;
                    }
                }
            }
        }

        function blendCapsule(u0, v0, u1, v1, radiusU, depth0, depth1, feather, bulge) {
            const radiusV = radiusU * IMG_ASPECT;
            const padU = radiusU + feather;
            const padV = radiusV + feather * IMG_ASPECT;
            const minX = Math.max(0, Math.floor((Math.min(u0, u1) - padU) * w));
            const maxX = Math.min(w - 1, Math.ceil((Math.max(u0, u1) + padU) * w));
            const minY = Math.max(0, Math.floor((Math.min(v0, v1) - padV) * h));
            const maxY = Math.min(h - 1, Math.ceil((Math.max(v0, v1) + padV) * h));

            const vx = u1 - u0;
            const vy = (v1 - v0) / IMG_ASPECT;
            const lenSq = Math.max(1e-6, vx * vx + vy * vy);

            for (let y = minY; y <= maxY; y++) {
                const py = (y + 0.5) / h;
                for (let x = minX; x <= maxX; x++) {
                    const px = (x + 0.5) / w;
                    const wx = px - u0;
                    const wy = (py - v0) / IMG_ASPECT;
                    const t = clamp((wx * vx + wy * vy) / lenSq, 0, 1);
                    const dist = Math.hypot(wx - vx * t, wy - vy * t);
                    if (dist < radiusU + feather) {
                        const alpha = 1.0 - smoothstep(Math.max(0, radiusU - feather * 0.35), radiusU + feather, dist);
                        const segDepth = depth0 + (depth1 - depth0) * t;
                        const dome = bulge * (1.0 - Math.min(1.0, (dist / radiusU) * (dist / radiusU)));
                        const idx = y * w + x;
                        const mixed = buf[idx] + (segDepth + dome - buf[idx]) * alpha;
                        if (mixed > buf[idx]) buf[idx] = mixed;
                    }
                }
            }
        }

        // 2. Dad (#10, center) — feet seamlessly match ~0.76 turf line depth
        blendEllipse(0.505, 0.145, 0.024, 0.068, 0.785, 0.012, 0.025); // head & hair
        blendCapsule(0.504, 0.220, 0.503, 0.460, 0.044, 0.790, 0.805, 0.014, 0.028); // torso
        blendEllipse(0.502, 0.520, 0.044, 0.088, 0.795, 0.012, 0.020); // shorts
        blendCapsule(0.456, 0.245, 0.431, 0.515, 0.016, 0.785, 0.780, 0.010, 0.014); // left arm
        blendCapsule(0.552, 0.245, 0.568, 0.520, 0.016, 0.785, 0.780, 0.010, 0.014); // right arm
        blendCapsule(0.472, 0.535, 0.448, 0.788, 0.021, 0.805, 0.818, 0.010, 0.016); // raised leg on ball
        blendCapsule(0.528, 0.545, 0.533, 0.878, 0.021, 0.792, 0.762, 0.010, 0.014); // planted leg
        blendEllipse(0.443, 0.846, 0.027, 0.045, 0.805, 0.010, 0.032); // Dad's match ball

        // 3. Son (#7, left) — slightly closer on touchline
        blendEllipse(0.204, 0.475, 0.028, 0.060, 0.790, 0.012, 0.025); // curly head
        blendCapsule(0.200, 0.545, 0.200, 0.720, 0.034, 0.795, 0.802, 0.012, 0.022); // torso & shorts
        blendCapsule(0.174, 0.560, 0.128, 0.475, 0.014, 0.788, 0.795, 0.010, 0.012); // raised left arm
        blendCapsule(0.226, 0.560, 0.282, 0.472, 0.014, 0.788, 0.795, 0.010, 0.012); // raised right arm
        blendCapsule(0.184, 0.735, 0.188, 0.885, 0.017, 0.790, 0.768, 0.010, 0.012); // planted right leg
        blendCapsule(0.218, 0.710, 0.244, 0.808, 0.017, 0.805, 0.815, 0.010, 0.014); // leg on mini ball
        blendEllipse(0.246, 0.861, 0.022, 0.039, 0.810, 0.010, 0.028); // Son's mini ball

        // 4. Dog (#1, Schnoodle, right)
        blendEllipse(0.752, 0.580, 0.038, 0.070, 0.805, 0.012, 0.026); // head & snout
        blendCapsule(0.775, 0.675, 0.848, 0.738, 0.056, 0.802, 0.782, 0.014, 0.022); // chest/bandana/body
        blendCapsule(0.856, 0.700, 0.852, 0.590, 0.015, 0.775, 0.765, 0.010, 0.010); // curved tail
        blendCapsule(0.758, 0.760, 0.752, 0.896, 0.016, 0.790, 0.730, 0.009, 0.010); // front left paw
        blendCapsule(0.795, 0.760, 0.795, 0.900, 0.016, 0.790, 0.732, 0.009, 0.010); // front right paw
        blendCapsule(0.844, 0.770, 0.842, 0.876, 0.016, 0.772, 0.715, 0.009, 0.010); // back left paw
        blendCapsule(0.874, 0.770, 0.878, 0.878, 0.016, 0.772, 0.718, 0.009, 0.010); // back right paw

        // 5. Two-pass separable box blur for C2 silky-smooth parallax transitions
        const tmp = new Float32Array(w * h);
        const radius = 2;
        for (let pass = 0; pass < 2; pass++) {
            for (let y = 0; y < h; y++) {
                const rowOff = y * w;
                for (let x = 0; x < w; x++) {
                    let sum = 0;
                    let cnt = 0;
                    const xa = Math.max(0, x - radius);
                    const xb = Math.min(w - 1, x + radius);
                    for (let ix = xa; ix <= xb; ix++) {
                        sum += buf[rowOff + ix];
                        cnt++;
                    }
                    tmp[rowOff + x] = sum / cnt;
                }
            }
            for (let y = 0; y < h; y++) {
                const ya = Math.max(0, y - radius);
                const yb = Math.min(h - 1, y + radius);
                for (let x = 0; x < w; x++) {
                    let sum = 0;
                    let cnt = 0;
                    for (let iy = ya; iy <= yb; iy++) {
                        sum += tmp[iy * w + x];
                        cnt++;
                    }
                    buf[y * w + x] = sum / cnt;
                }
            }
        }

        // Write into linear CanvasTexture
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        const imgData = ctx.createImageData(w, h);
        const px = imgData.data;
        for (let i = 0; i < w * h; i++) {
            const v = Math.round(clamp(buf[i], 0, 1) * 255);
            const p = i * 4;
            px[p] = v;
            px[p + 1] = v;
            px[p + 2] = v;
            px[p + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);

        const tex = new THREE.CanvasTexture(c);
        tex.encoding = THREE.LinearEncoding;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.generateMipmaps = false;

        function sample(u, vUv) {
            const fx = clamp(u, 0, 1) * (w - 1);
            const fy = clamp(1.0 - vUv, 0, 1) * (h - 1);
            const x0 = Math.floor(fx);
            const y0 = Math.floor(fy);
            const x1 = Math.min(w - 1, x0 + 1);
            const y1 = Math.min(h - 1, y0 + 1);
            const tx = fx - x0;
            const ty = fy - y0;
            const a = buf[y0 * w + x0];
            const b = buf[y0 * w + x1];
            const c0 = buf[y1 * w + x0];
            const d0 = buf[y1 * w + x1];
            return (a * (1 - tx) + b * tx) * (1 - ty) + (c0 * (1 - tx) + d0 * tx) * ty;
        }

        return { texture: tex, sample };
    }

    function createGlowSpriteTexture(THREE) {
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 64;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
        g.addColorStop(0.28, 'rgba(255, 255, 255, 0.72)');
        g.addColorStop(0.65, 'rgba(255, 255, 255, 0.16)');
        g.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        const tex = new THREE.CanvasTexture(c);
        tex.encoding = THREE.sRGBEncoding;
        return tex;
    }

    function createPlayerRing3D(THREE, colorHex, radius) {
        const group = new THREE.Group();
        group.position.y = 0.008;

        const ringGeo = new THREE.RingGeometry(radius * 0.85, radius, 48);
        const ringMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.88,
            depthTest: false
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        group.add(ringMesh);

        const innerGeo = new THREE.RingGeometry(radius * 0.60, radius * 0.69, 36, 1, 0, Math.PI * 1.35);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.58,
            depthTest: false
        });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        innerMesh.rotation.x = -Math.PI / 2;
        group.add(innerMesh);

        const ptrGeo = new THREE.ConeGeometry(radius * 0.15, radius * 0.27, 3);
        const ptrMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.92,
            depthTest: false
        });
        const ptrMesh = new THREE.Mesh(ptrGeo, ptrMat);
        ptrMesh.rotation.x = Math.PI / 2;
        ptrMesh.position.set(0, 0.008, radius * 1.12);
        group.add(ptrMesh);

        return { group, ringMesh, innerMesh, ringMat, innerMat, ptrMat };
    }

    function createOverheadChevron3D(THREE, colorHex) {
        const group = new THREE.Group();
        const coneGeo = new THREE.ConeGeometry(0.088, 0.165, 4);
        const coneMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            emissive: colorHex,
            emissiveIntensity: 0.72,
            roughness: 0.22,
            metalness: 0.28
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.rotation.x = Math.PI;
        cone.rotation.y = Math.PI / 4;
        group.add(cone);
        return { group, cone, coneMat };
    }

    function createFrostbiteShaderMaterial(THREE, depthTex) {
        const uniforms = {
            uColorMap: { value: null },
            uDepthMap: { value: depthTex },
            uViewCenter: { value: new THREE.Vector2(0.503, 0.512) },
            uViewSpan: { value: new THREE.Vector2(0.96, 0.96) },
            uParallax: { value: new THREE.Vector2(0, 0) },
            uPivotDepth: { value: PIVOT_DEPTH },
            uTime: { value: 0 },
            uReducedMotion: { value: 0 },
            uActorFocusUv: { value: new THREE.Vector2(0.504, 0.520) },
            uActorFootUv: { value: new THREE.Vector2(0.492, 0.116) },
            uActorColor: { value: new THREE.Vector3(0.0, 1.0, 0.408) },
            uActorIntensity: { value: 0.35 },
            uCelebrateBurst: { value: 0.0 },
            uShockwave: { value: 0.0 },
            uStageAspect: { value: IMG_ASPECT }
        };

        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position.xy, 0.0, 1.0);
            }
        `;

        const fragmentShader = `
            precision highp float;
            uniform sampler2D uColorMap;
            uniform sampler2D uDepthMap;
            uniform vec2 uViewCenter;
            uniform vec2 uViewSpan;
            uniform vec2 uParallax;
            uniform float uPivotDepth;
            uniform float uTime;
            uniform float uReducedMotion;
            uniform vec2 uActorFocusUv;
            uniform vec2 uActorFootUv;
            uniform vec3 uActorColor;
            uniform float uActorIntensity;
            uniform float uCelebrateBurst;
            uniform float uShockwave;
            uniform float uStageAspect;
            varying vec2 vUv;

            vec3 sRGBToLinearVec3(vec3 c) {
                vec3 lo = c * 0.0773993808;
                vec3 hi = pow(max(c * 0.9478672986 + vec3(0.0521327014), vec3(0.0)), vec3(2.4));
                return mix(hi, lo, vec3(lessThanEqual(c, vec3(0.04045))));
            }

            vec3 linearToSRGBVec3(vec3 c) {
                vec3 lo = c * 12.92;
                vec3 hi = pow(max(c, vec3(0.0)), vec3(0.4166667)) * 1.055 - vec3(0.055);
                return mix(hi, lo, vec3(lessThanEqual(c, vec3(0.0031308))));
            }

            void main() {
                vec2 baseUv = uViewCenter + (vUv - 0.5) * uViewSpan;

                // Smoothly attenuate parallax near image edges so void/tearing never occurs
                vec2 borderFade = smoothstep(0.0, 0.05, baseUv) * (1.0 - smoothstep(0.95, 1.0, baseUv));
                vec2 localParallax = uParallax * (borderFade.x * borderFade.y);

                float d0 = texture2D(uDepthMap, clamp(baseUv, 0.002, 0.998)).r;
                vec2 uv1 = baseUv + localParallax * (d0 - uPivotDepth);
                float d1 = texture2D(uDepthMap, clamp(uv1, 0.002, 0.998)).r;
                float depth = 0.5 * (d0 + d1);

                vec2 sampleUv = baseUv + localParallax * (depth - uPivotDepth);
                vec2 clampedUv = clamp(sampleUv, 0.002, 0.998);

                float outDist = max(
                    max(-sampleUv.x, sampleUv.x - 1.0),
                    max(-sampleUv.y, sampleUv.y - 1.0)
                );
                float inBounds = 1.0 - smoothstep(0.0, 0.055, outDist);

                vec3 texLinear = sRGBToLinearVec3(texture2D(uColorMap, clampedUv).rgb);
                vec3 outTurf = vec3(0.005, 0.020, 0.007);
                vec3 outSky = vec3(0.003, 0.006, 0.013);
                vec3 edgeAtmos = mix(outTurf, outSky, smoothstep(0.24, 0.38, sampleUv.y));
                vec3 col = mix(edgeAtmos, texLinear, inBounds);

                vec3 accentLin = sRGBToLinearVec3(uActorColor);
                float motion = 1.0 - step(0.5, uReducedMotion);

                // 1. Living stadium atmosphere: drifting volumetric floodlight rays above horizon
                float horizonMask = smoothstep(0.26, 0.54, sampleUv.y);
                vec2 lights[6];
                lights[0] = vec2(${FLOODLIGHTS_UV[0][0].toFixed(4)}, ${FLOODLIGHTS_UV[0][1].toFixed(4)});
                lights[1] = vec2(${FLOODLIGHTS_UV[1][0].toFixed(4)}, ${FLOODLIGHTS_UV[1][1].toFixed(4)});
                lights[2] = vec2(${FLOODLIGHTS_UV[2][0].toFixed(4)}, ${FLOODLIGHTS_UV[2][1].toFixed(4)});
                lights[3] = vec2(${FLOODLIGHTS_UV[3][0].toFixed(4)}, ${FLOODLIGHTS_UV[3][1].toFixed(4)});
                lights[4] = vec2(${FLOODLIGHTS_UV[4][0].toFixed(4)}, ${FLOODLIGHTS_UV[4][1].toFixed(4)});
                lights[5] = vec2(${FLOODLIGHTS_UV[5][0].toFixed(4)}, ${FLOODLIGHTS_UV[5][1].toFixed(4)});

                float rayAccum = 0.0;
                float strobeAccum = 0.0;
                float tDrift = uTime * motion;
                for (int i = 0; i < 6; i++) {
                    vec2 lp = lights[i];
                    vec2 toFrag = sampleUv - lp;
                    toFrag.x *= 1.7917;
                    float dist = length(toFrag);
                    vec2 beamTarget = vec2(mix(0.50, lp.x, 0.38), 0.14);
                    vec2 beamDir = normalize(vec2((beamTarget.x - lp.x) * 1.7917, beamTarget.y - lp.y));
                    vec2 fragDir = toFrag / max(dist, 0.0001);
                    float cone = pow(max(dot(fragDir, beamDir), 0.0), 10.0);
                    float wave = 0.74 + 0.26 * sin(fragDir.x * 16.0 + tDrift * 0.55 + float(i) * 1.4);
                    float falloff = exp(-dist * 1.85);
                    rayAccum += cone * wave * falloff * 0.055;

                    if (uCelebrateBurst > 0.001 && motion > 0.5) {
                        float pulse = 0.55 + 0.45 * sin(uTime * 19.0 + float(i) * 1.7);
                        float halo = exp(-dist * 7.5) * pulse;
                        strobeAccum += halo;
                    }
                }
                col += vec3(0.45, 0.72, 0.85) * rayAccum * horizonMask * inBounds;
                col += mix(vec3(0.85, 0.95, 1.0), accentLin, 0.22) * strobeAccum * min(1.0, uCelebrateBurst) * 0.24;

                // 2. Per-actor subtle silhouette rim light + turf ground bounce
                vec2 texelStep = vec2(1.0 / 512.0, 1.0 / 288.0);
                float dL = texture2D(uDepthMap, clamp(clampedUv - vec2(texelStep.x, 0.0), 0.002, 0.998)).r;
                float dR = texture2D(uDepthMap, clamp(clampedUv + vec2(texelStep.x, 0.0), 0.002, 0.998)).r;
                float dD = texture2D(uDepthMap, clamp(clampedUv - vec2(0.0, texelStep.y), 0.002, 0.998)).r;
                float dU = texture2D(uDepthMap, clamp(clampedUv + vec2(0.0, texelStep.y), 0.002, 0.998)).r;
                float depthEdge = clamp((abs(dR - dL) + abs(dU - dD)) * 10.0, 0.0, 1.0);
                float actorSilhouette = smoothstep(0.68, 0.79, depth);

                vec2 deltaFocus = (sampleUv - uActorFocusUv) * vec2(1.7917, 0.90);
                float actorProx = exp(-dot(deltaFocus, deltaFocus) * 18.0);
                float rimBoost = depthEdge * actorSilhouette * actorProx * uActorIntensity * 0.55;
                col += accentLin * rimBoost;

                // Soft turf bounce glow around active actor's feet
                vec2 deltaFoot = (sampleUv - uActorFootUv) * vec2(1.7917, 4.2);
                float turfGlow = exp(-dot(deltaFoot, deltaFoot) * 28.0) * (1.0 - smoothstep(0.28, 0.33, sampleUv.y));
                col += accentLin * turfGlow * (0.10 + uActorIntensity * 0.14);

                // 3. Expanding turf shockwave ring during celebration burst
                if (uShockwave > 0.001 && uShockwave < 1.0 && motion > 0.5) {
                    vec2 swDelta = (sampleUv - vec2(0.495, 0.120)) * vec2(1.7917, 3.8);
                    float swDist = length(swDelta);
                    float swRadius = uShockwave * 1.15;
                    float ring = exp(-pow((swDist - swRadius) / 0.036, 2.0));
                    float turfOnly = 1.0 - smoothstep(0.27, 0.32, sampleUv.y);
                    float fade = (1.0 - uShockwave) * smoothstep(0.0, 0.08, uShockwave);
                    vec3 swColor = mix(vec3(0.0, 1.0, 0.25), accentLin, 0.45);
                    col += swColor * ring * turfOnly * fade * 0.55;
                }

                // 4. Subtle broadcast vignette framing
                vec2 vigUv = (vUv - 0.5) * vec2(1.08, 1.0);
                float vig = mix(1.0, 0.84, smoothstep(0.28, 0.88, length(vigUv)));
                col *= vig;

                gl_FragColor = vec4(linearToSRGBVec3(clamp(col, 0.0, 1.0)), 1.0);
            }
        `;

        return new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            depthTest: false,
            depthWrite: false,
            toneMapped: false
        });
    }

    /**
     * Computes an aspect-safe cover-biased framing window (centerU, centerV_uv, visW, visH)
     * ensuring the required safeBox never clips at any stage aspect ratio and bounds
     * remain clean inside [0, 1] whenever possible.
     */
    function computeFramingWindow(stageAspect, targetCenterU, targetCenterVtop, zoom, safeBox) {
        const ratio = Math.max(0.4, stageAspect) / IMG_ASPECT;
        const safeSpanU = safeBox.maxU - safeBox.minU;
        const safeSpanV = safeBox.maxVtop - safeBox.minVtop;

        // Wide baseline cover-biased span (leaves 2% parallax margin inside [0..1])
        let wideW;
        let wideH;
        if (ratio >= 1.0) {
            wideW = 0.96;
            wideH = wideW / ratio;
            if (wideH < TRIO_SAFE_BOX.maxVtop - TRIO_SAFE_BOX.minVtop) {
                wideH = TRIO_SAFE_BOX.maxVtop - TRIO_SAFE_BOX.minVtop;
                wideW = wideH * ratio;
            }
        } else {
            wideH = 0.96;
            wideW = wideH * ratio;
            if (wideW < TRIO_SAFE_BOX.maxU - TRIO_SAFE_BOX.minU) {
                wideW = TRIO_SAFE_BOX.maxU - TRIO_SAFE_BOX.minU;
                wideH = wideW / ratio;
            }
        }

        // Apply requested push-in zoom while clamping to the required safeBox
        let visW = wideW / zoom;
        let visH = wideH / zoom;
        if (visW < safeSpanU) {
            visW = safeSpanU;
            visH = visW / ratio;
        }
        if (visH < safeSpanV) {
            visH = safeSpanV;
            visW = visH * ratio;
        }

        const safeMinVuv = 1.0 - safeBox.maxVtop;
        const safeMaxVuv = 1.0 - safeBox.minVtop;
        const targetCenterVuv = 1.0 - targetCenterVtop;

        // Keep center inside image bounds when vis <= 1.0, and strictly enclosing safeBox
        const marginU = visW <= 0.985 ? 0.005 : 0.0;
        let minCU = visW <= 1.0 ? visW * 0.5 + marginU : 0.505;
        let maxCU = visW <= 1.0 ? 1.0 - visW * 0.5 - marginU : 0.505;
        minCU = Math.max(minCU, safeBox.maxU - visW * 0.5);
        maxCU = Math.min(maxCU, safeBox.minU + visW * 0.5);
        const centerU = minCU <= maxCU
            ? clamp(targetCenterU, minCU, maxCU)
            : (safeBox.minU + safeBox.maxU) * 0.5;

        const marginV = visH <= 0.985 ? 0.005 : 0.0;
        let minCV = visH <= 1.0 ? visH * 0.5 + marginV : 0.515;
        let maxCV = visH <= 1.0 ? 1.0 - visH * 0.5 - marginV : 0.515;
        minCV = Math.max(minCV, safeMaxVuv - visH * 0.5);
        maxCV = Math.min(maxCV, safeMinVuv + visH * 0.5);
        const centerVuv = minCV <= maxCV
            ? clamp(targetCenterVuv, minCV, maxCV)
            : (safeMinVuv + safeMaxVuv) * 0.5;

        return { centerU, centerVuv, visW, visH };
    }

    function initFrostbiteTrioStage() {
        const stageEl = document.getElementById('fc-trio-stage');
        const sourceImg = document.getElementById('fc-trio-source-img');
        const glCanvas = document.getElementById('fc-trio-webgl-canvas');
        const hudCanvas = document.getElementById('fc-trio-hud-canvas');
        const celebrateBtn = document.getElementById('fc-stage-celebrate-btn');
        const calloutBtns = document.querySelectorAll('.fc-roster-callout[data-trio-actor]');

        if (!stageEl || !glCanvas || !hudCanvas || typeof window.THREE === 'undefined') {
            return;
        }

        const THREE = window.THREE;
        const ctx2d = hudCanvas.getContext('2d');
        if (!ctx2d) return;

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: glCanvas,
                antialias: true,
                alpha: false,
                powerPreference: 'high-performance'
            });
        } catch (err) {
            console.warn('Frostbite WebGLRenderer init error:', err);
            return;
        }

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.autoClear = false;

        glCanvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            stageEl.classList.remove('webgl-ready');
        });

        // =====================================================================
        // 1. REDUCED MOTION & SCENE SETUP (2.5D BG PASS + 3D TELEMETRY PASS)
        // =====================================================================
        const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
        let reducedMotion = Boolean(motionQuery && motionQuery.matches);
        if (motionQuery) {
            const onMotionChange = (ev) => {
                reducedMotion = Boolean(ev.matches);
            };
            if (typeof motionQuery.addEventListener === 'function') {
                motionQuery.addEventListener('change', onMotionChange);
            } else if (typeof motionQuery.addListener === 'function') {
                motionQuery.addListener(onMotionChange);
            }
        }

        const depthBuffer = buildDepthMap(THREE);
        const glowSpriteTex = createGlowSpriteTexture(THREE);

        // Pass 1: Full-stage 2.5D background shader quad
        const bgScene = new THREE.Scene();
        const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const bgMat = createFrostbiteShaderMaterial(THREE, depthBuffer.texture);
        const bgUniforms = bgMat.uniforms;
        const bgQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
        bgQuad.frustumCulled = false;
        bgQuad.renderOrder = -10;
        bgScene.add(bgQuad);

        // Pass 2: True 3D Perspective Telemetry Scene (rings, chevrons, motes, sparks)
        const telemetryScene = new THREE.Scene();
        const telemetryCam = new THREE.PerspectiveCamera(34, IMG_ASPECT, 0.1, 40);
        telemetryCam.position.set(0, 1.05, 4.35);
        telemetryCam.lookAt(0, 0.12, 0);

        const hemiLight = new THREE.HemisphereLight(0xe4f5ff, 0x0a2515, 0.9);
        telemetryScene.add(hemiLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.15);
        dirLight.position.set(2.2, 4.5, 3.8);
        telemetryScene.add(dirLight);

        const rings = {
            son: createPlayerRing3D(THREE, ACTORS.son.colorHex, ACTORS.son.ringRadius),
            dad: createPlayerRing3D(THREE, ACTORS.dad.colorHex, ACTORS.dad.ringRadius),
            dog: createPlayerRing3D(THREE, ACTORS.dog.colorHex, ACTORS.dog.ringRadius)
        };
        const chevrons = {
            son: createOverheadChevron3D(THREE, ACTORS.son.colorHex),
            dad: createOverheadChevron3D(THREE, ACTORS.dad.colorHex),
            dog: createOverheadChevron3D(THREE, ACTORS.dog.colorHex)
        };
        ACTOR_KEYS.forEach((k) => {
            telemetryScene.add(rings[k].group);
            telemetryScene.add(chevrons[k].group);
        });

        // Floating 3D stadium floodlight dust motes
        const MOTE_COUNT = 84;
        const motePositions = new Float32Array(MOTE_COUNT * 3);
        const moteColors = new Float32Array(MOTE_COUNT * 3);
        const moteSeeds = [];
        for (let i = 0; i < MOTE_COUNT; i++) {
            const bx = (Math.random() - 0.5) * 4.4;
            const by = 0.08 + Math.random() * 1.95;
            const bz = -1.2 + Math.random() * 2.2;
            motePositions[i * 3] = bx;
            motePositions[i * 3 + 1] = by;
            motePositions[i * 3 + 2] = bz;
            moteSeeds.push({
                bx,
                by,
                bz,
                phase: Math.random() * Math.PI * 2,
                speed: 0.4 + Math.random() * 0.7,
                amp: 0.04 + Math.random() * 0.07
            });
            const tint = i % 3 === 0 ? [0.2, 1.0, 0.55] : (i % 3 === 1 ? [0.25, 0.9, 1.0] : [0.95, 0.92, 0.72]);
            moteColors[i * 3] = tint[0];
            moteColors[i * 3 + 1] = tint[1];
            moteColors[i * 3 + 2] = tint[2];
        }
        const moteGeo = new THREE.BufferGeometry();
        moteGeo.setAttribute('position', new THREE.Float32BufferAttribute(motePositions, 3));
        moteGeo.setAttribute('color', new THREE.Float32BufferAttribute(moteColors, 3));
        const moteMat = new THREE.PointsMaterial({
            size: 0.055,
            map: glowSpriteTex,
            vertexColors: true,
            transparent: true,
            opacity: 0.42,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false
        });
        const motePoints = new THREE.Points(moteGeo, moteMat);
        telemetryScene.add(motePoints);

        // Celebration 3D pyro sparks
        const SPARK_COUNT = 120;
        const sparkPos = new Float32Array(SPARK_COUNT * 3);
        const sparkCol = new Float32Array(SPARK_COUNT * 3);
        const sparkMeta = [];
        for (let i = 0; i < SPARK_COUNT; i++) {
            sparkPos[i * 3 + 1] = -99;
            sparkMeta.push({ vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, r: 1, g: 1, b: 1 });
        }
        const sparkGeo = new THREE.BufferGeometry();
        sparkGeo.setAttribute('position', new THREE.Float32BufferAttribute(sparkPos, 3));
        sparkGeo.setAttribute('color', new THREE.Float32BufferAttribute(sparkCol, 3));
        const sparkMat = new THREE.PointsMaterial({
            size: 0.085,
            map: glowSpriteTex,
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false
        });
        const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
        telemetryScene.add(sparkPoints);

        function emitSparks(originVec, rgb, count) {
            if (reducedMotion) return;
            let spawned = 0;
            for (let i = 0; i < SPARK_COUNT && spawned < count; i++) {
                const m = sparkMeta[i];
                if (m.life > 0) continue;
                const ang = Math.random() * Math.PI * 2;
                const spd = 0.45 + Math.random() * 1.15;
                sparkPos[i * 3] = originVec.x + (Math.random() - 0.5) * 0.18;
                sparkPos[i * 3 + 1] = originVec.y + 0.04;
                sparkPos[i * 3 + 2] = originVec.z + (Math.random() - 0.5) * 0.14;
                m.vx = Math.cos(ang) * spd * 0.65;
                m.vy = 1.15 + Math.random() * 1.55;
                m.vz = Math.sin(ang) * spd * 0.45;
                m.maxLife = 0.75 + Math.random() * 0.55;
                m.life = m.maxLife;
                m.r = rgb[0];
                m.g = rgb[1];
                m.b = rgb[2];
                sparkCol[i * 3] = m.r;
                sparkCol[i * 3 + 1] = m.g;
                sparkCol[i * 3 + 2] = m.b;
                spawned++;
            }
            sparkGeo.attributes.position.needsUpdate = true;
            sparkGeo.attributes.color.needsUpdate = true;
        }

        // =====================================================================
        // 2. STATE MACHINE (CAMERA FOCUS, DRAG ORBIT, PARALLAX, CELEBRATION)
        // =====================================================================
        let textureReady = false;
        let activeActor = 'dad';
        let cameraFocus = 'wide'; // 'wide' | 'son' | 'dad' | 'dog'
        const bursts = { son: 0, dad: 0, dog: 0 };
        let celebrateGlobalBurst = 0;
        let shockwaveClock = -1;
        const popups = [];

        let userYaw = 0;
        let isDragging = false;
        let dragStartX = 0;
        let dragMoved = false;
        const pointerHover = { x: 0, y: 0 };
        const smoothHover = { x: 0, y: 0 };

        // Current smooth camera window in image UV space (bottom-left origin)
        const currentView = {
            centerU: 0.505,
            centerVuv: 0.510,
            visW: 0.96,
            visH: 0.96,
            parallaxX: 0,
            parallaxY: 0
        };

        let stageLayoutW = 0;
        let stageLayoutH = 0;
        let stageDpr = 1;
        let hudBarBoxes = [];
        let hudSafeTopPx = 34;

        function measureStageHudObstacles() {
            const stageRect = stageEl.getBoundingClientRect();
            if (stageRect.width < 10 || stageRect.height < 10) return;

            const scaleX = hudCanvas.width / stageRect.width;
            const scaleY = hudCanvas.height / stageRect.height;
            const pad = 4 * stageDpr;

            const boxes = [];
            let maxBottom = 28 * stageDpr;
            const topBar = stageEl.querySelector('.fc-stage-hud-top');
            if (topBar) {
                const items = topBar.querySelectorAll('.fc-stage-engine-pill, .fc-stage-celebrate-btn');
                items.forEach((el) => {
                    const r = el.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0) {
                        const left = (r.left - stageRect.left) * scaleX - pad;
                        const right = (r.right - stageRect.left) * scaleX + pad;
                        const top = (r.top - stageRect.top) * scaleY - pad;
                        const bottom = (r.bottom - stageRect.top) * scaleY + pad;
                        boxes.push({ left, right, top, bottom });
                        if (bottom > maxBottom) maxBottom = bottom;
                    }
                });
            }
            hudBarBoxes = boxes;
            hudSafeTopPx = Math.max(30 * stageDpr, maxBottom + 2 * stageDpr);
        }

        function syncStageSize() {
            const rect = stageEl.getBoundingClientRect();
            const layoutW = stageEl.clientWidth || rect.width;
            const layoutH = stageEl.clientHeight || rect.height;
            if (layoutW < 10 || layoutH < 10 || rect.width < 10 || rect.height < 10) {
                return false;
            }

            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            if (stageLayoutW !== layoutW || stageLayoutH !== layoutH || stageDpr !== dpr) {
                stageLayoutW = layoutW;
                stageLayoutH = layoutH;
                stageDpr = dpr;
                renderer.setPixelRatio(dpr);
                renderer.setSize(layoutW, layoutH, false);
                hudCanvas.width = glCanvas.width;
                hudCanvas.height = glCanvas.height;
                telemetryCam.aspect = layoutW / layoutH;
                telemetryCam.updateProjectionMatrix();
            }

            measureStageHudObstacles();
            return true;
        }

        /**
         * Unified screen-space projection matching the GLSL 2.5D depth parallax
         * and camera window pixel-for-pixel.
         */
        function imageUvToScreen(u, vTop, depthOverride) {
            const vUv = 1.0 - vTop;
            const depth = depthOverride !== undefined ? depthOverride : depthBuffer.sample(u, vUv);

            const bx = clamp((u - (currentView.centerU - currentView.visW * 0.5)) / currentView.visW, 0, 1);
            const by = clamp((vUv - (currentView.centerVuv - currentView.visH * 0.5)) / currentView.visH, 0, 1);
            const fadeU = smoothstep(0.0, 0.05, u) * (1.0 - smoothstep(0.95, 1.0, u));
            const fadeV = smoothstep(0.0, 0.05, vUv) * (1.0 - smoothstep(0.95, 1.0, vUv));
            const edgeFade = fadeU * fadeV;

            const baseU = u - currentView.parallaxX * edgeFade * (depth - PIVOT_DEPTH);
            const baseVuv = vUv - currentView.parallaxY * edgeFade * (depth - PIVOT_DEPTH);

            const screenU = 0.5 + (baseU - currentView.centerU) / currentView.visW;
            const screenV = 0.5 + (baseVuv - currentView.centerVuv) / currentView.visH;

            return {
                screenU,
                screenV,
                ndcX: screenU * 2.0 - 1.0,
                ndcY: screenV * 2.0 - 1.0,
                hudX: screenU * hudCanvas.width,
                hudY: (1.0 - screenV) * hudCanvas.height,
                bx,
                by
            };
        }

        const _rayPoint = new THREE.Vector3();
        const _rayDir = new THREE.Vector3();

        function ndcToTurfPlane(ndcX, ndcY, outVec) {
            _rayPoint.set(ndcX, ndcY, 0.5).unproject(telemetryCam);
            _rayDir.copy(_rayPoint).sub(telemetryCam.position).normalize();
            if (_rayDir.y < -0.02) {
                const t = (0.008 - telemetryCam.position.y) / _rayDir.y;
                outVec.copy(telemetryCam.position).addScaledVector(_rayDir, t);
            } else {
                outVec.set(ndcX * 1.5, 0.008, 0);
            }
            return outVec;
        }

        function ndcToVerticalPlane(ndcX, ndcY, planeZ, outVec) {
            _rayPoint.set(ndcX, ndcY, 0.5).unproject(telemetryCam);
            _rayDir.copy(_rayPoint).sub(telemetryCam.position).normalize();
            const denom = Math.abs(_rayDir.z) > 1e-4 ? _rayDir.z : -1e-4;
            const t = (planeZ - telemetryCam.position.z) / denom;
            outVec.copy(telemetryCam.position).addScaledVector(_rayDir, t);
            return outVec;
        }

        const _projVec = new THREE.Vector3();
        function worldToHud(vec3) {
            _projVec.copy(vec3).project(telemetryCam);
            return {
                x: (_projVec.x * 0.5 + 0.5) * hudCanvas.width,
                y: (-_projVec.y * 0.5 + 0.5) * hudCanvas.height
            };
        }

        function overlapsHudBar(cx, cy, halfW, halfH) {
            for (let i = 0; i < hudBarBoxes.length; i++) {
                const b = hudBarBoxes[i];
                if (cx + halfW > b.left && cx - halfW < b.right && cy + halfH > b.top && cy - halfH < b.bottom) {
                    return true;
                }
            }
            return cy - halfH < 4 * stageDpr;
        }

        function updateCalloutHighlight() {
            calloutBtns.forEach((btn) => {
                const actor = btn.getAttribute('data-trio-actor');
                btn.classList.toggle('active-actor', actor === activeActor);
            });
        }

        function queuePopup(actorKey, delay) {
            const actor = ACTORS[actorKey];
            if (!actor) return;
            if (popups.length >= 6) {
                popups.shift();
            }
            popups.push({
                actor: actorKey,
                text: actor.popupText,
                color: actor.color,
                life: 1.45,
                delay: delay || 0
            });
        }

        function selectActor(actorKey, focusZoom = true) {
            const actor = ACTORS[actorKey];
            if (!actor) return;
            activeActor = actorKey;
            cameraFocus = focusZoom ? actorKey : 'wide';
            bursts[actorKey] = 1.6;
            queuePopup(actorKey, 0);
            updateCalloutHighlight();
            emitSparks(rings[actorKey].group.position, actor.colorRgb, 48);
            if (typeof window.tgfcPlaySelectSfx === 'function') {
                window.tgfcPlaySelectSfx();
            }
            ensureAnimating();
        }

        function triggerFullCelebration() {
            activeActor = 'dad';
            cameraFocus = 'wide';
            userYaw = 0;
            celebrateGlobalBurst = 1.85;
            shockwaveClock = 0.001;
            ACTOR_KEYS.forEach((k, idx) => {
                bursts[k] = 1.85;
                queuePopup(k, idx * 0.08);
                emitSparks(rings[k].group.position, ACTORS[k].colorRgb, 36);
            });
            updateCalloutHighlight();
            if (typeof window.tgfcPlayCelebrationSfx === 'function') {
                window.tgfcPlayCelebrationSfx();
            } else if (typeof window.tgfcPlaySelectSfx === 'function') {
                window.tgfcPlaySelectSfx();
            }
            ensureAnimating();
        }

        function resetToWideFraming() {
            cameraFocus = 'wide';
            userYaw = 0;
            ensureAnimating();
        }

        // =====================================================================
        // 3. POINTER, DRAG ORBIT, HIT-TESTING & BUTTON BINDINGS
        // =====================================================================
        stageEl.addEventListener('pointerdown', (e) => {
            if (e.target.closest('#fc-stage-celebrate-btn')) return;
            isDragging = true;
            dragMoved = false;
            dragStartX = e.clientX;
            stageEl.classList.add('is-dragging');
        });

        window.addEventListener('pointermove', (e) => {
            const rect = stageEl.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                pointerHover.x = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
                pointerHover.y = clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
            }
            if (isDragging) {
                const dx = e.clientX - dragStartX;
                if (Math.abs(dx) > 4) dragMoved = true;
                userYaw = clamp(userYaw + dx * 0.0045, -1.0, 1.0);
                dragStartX = e.clientX;
                ensureAnimating();
            }
        });

        function endDrag() {
            if (!isDragging) return;
            isDragging = false;
            stageEl.classList.remove('is-dragging');
        }
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);

        stageEl.addEventListener('click', (e) => {
            if (e.target.closest('#fc-stage-celebrate-btn') || dragMoved) return;
            const rect = stageEl.getBoundingClientRect();
            if (rect.width < 10 || rect.height < 10) return;

            const clickHudX = ((e.clientX - rect.left) / rect.width) * hudCanvas.width;
            const clickHudY = ((e.clientY - rect.top) / rect.height) * hudCanvas.height;
            const hitMargin = 14 * stageDpr;

            let hitActor = null;
            let bestDist = Infinity;

            ACTOR_KEYS.forEach((key) => {
                const a = ACTORS[key];
                const topLeft = imageUvToScreen(a.hitbox.minU, a.hitbox.minVtop);
                const botRight = imageUvToScreen(a.hitbox.maxU, a.hitbox.maxVtop);
                const minX = Math.min(topLeft.hudX, botRight.hudX) - hitMargin;
                const maxX = Math.max(topLeft.hudX, botRight.hudX) + hitMargin;
                const minY = Math.min(topLeft.hudY, botRight.hudY) - hitMargin;
                const maxY = Math.max(topLeft.hudY, botRight.hudY) + hitMargin;

                if (clickHudX >= minX && clickHudX <= maxX && clickHudY >= minY && clickHudY <= maxY) {
                    const cx = (minX + maxX) * 0.5;
                    const cy = (minY + maxY) * 0.5;
                    const dist = Math.hypot(clickHudX - cx, clickHudY - cy);
                    if (dist < bestDist) {
                        bestDist = dist;
                        hitActor = key;
                    }
                }
            });

            if (hitActor) {
                selectActor(hitActor, true);
            } else {
                resetToWideFraming();
            }
        });

        celebrateBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerFullCelebration();
        });

        calloutBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const actor = btn.getAttribute('data-trio-actor');
                if (actor && ACTORS[actor]) {
                    userYaw = 0;
                    selectActor(actor, true);
                }
            });
        });

        // =====================================================================
        // 4. RENDER LOOP, LIFECYCLE PAUSING & 2D HUD TELEMETRY
        // =====================================================================
        function isStageVisible() {
            if (document.hidden) return false;
            const workScreen = document.getElementById('screen-work');
            const centralView = document.getElementById('work-view-central');
            return Boolean(workScreen && !workScreen.hidden && centralView && !centralView.hidden);
        }

        function drawHudPill(ctx, cx, cy, label, color, isSel, dpr) {
            ctx.save();
            ctx.font = `800 ${Math.round((isSel ? 9.5 : 8.2) * dpr)}px "JetBrains Mono", monospace`;
            const tw = ctx.measureText(label).width + 12 * dpr;
            const th = (isSel ? 15 : 13) * dpr;
            const x = cx - tw * 0.5;
            const y = cy - th * 0.5;

            ctx.fillStyle = isSel ? 'rgba(4, 8, 15, 0.92)' : 'rgba(4, 8, 15, 0.74)';
            ctx.strokeStyle = color;
            ctx.lineWidth = (isSel ? 1.6 : 1.0) * dpr;
            ctx.fillRect(x, y, tw, th);
            ctx.strokeRect(x, y, tw, th);

            // Crisp tactical left accent strip
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 2.5 * dpr, th);

            ctx.fillStyle = isSel ? '#FFFFFF' : 'rgba(255, 255, 255, 0.84)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, cx + 1 * dpr, cy + 0.5 * dpr);
            ctx.restore();
            return { tw, th };
        }

        let rafId = 0;
        let lastTime = performance.now();
        const _hitVec = new THREE.Vector3();

        function renderFrame(now) {
            if (!textureReady) return;
            if (!syncStageSize()) return;

            const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) * 0.001));
            lastTime = now;
            const t = now * 0.001;

            // Smooth hover damping (frozen on reduced motion)
            if (reducedMotion) {
                smoothHover.x = 0;
                smoothHover.y = 0;
            } else {
                const hLerp = Math.min(1, dt * 6.0);
                smoothHover.x += (pointerHover.x - smoothHover.x) * hLerp;
                smoothHover.y += (pointerHover.y - smoothHover.y) * hLerp;
            }

            // Decay celebration bursts and shockwave
            celebrateGlobalBurst = Math.max(0, celebrateGlobalBurst - dt * 0.85);
            ACTOR_KEYS.forEach((k) => {
                bursts[k] = Math.max(0, bursts[k] - dt * 0.85);
            });
            if (shockwaveClock >= 0) {
                shockwaveClock += dt * 1.15;
                if (shockwaveClock >= 1.0) shockwaveClock = -1;
            }

            // Compute target framing window (wide trio or ~1.14x actor focus)
            const stageAspect = stageLayoutW / stageLayoutH;
            const focusedActor = cameraFocus !== 'wide' ? ACTORS[cameraFocus] : null;
            const targetFraming = focusedActor
                ? computeFramingWindow(
                    stageAspect,
                    focusedActor.focusCenter[0],
                    focusedActor.focusCenter[1],
                    1.14,
                    focusedActor.focusBox
                )
                : computeFramingWindow(stageAspect, 0.505, 0.492, 1.0, TRIO_SAFE_BOX);

            // Smoothly interpolate framing + apply bounded drag-orbit pan
            const camLerp = reducedMotion ? 1.0 : Math.min(1, dt * 6.2);
            const maxPanMarginU = Math.max(0, (1.0 - targetFraming.visW) * 0.42);
            const targetOrbitPanU = userYaw * Math.min(0.022, maxPanMarginU);
            const goalCenterU = targetFraming.centerU + targetOrbitPanU;

            currentView.centerU += (goalCenterU - currentView.centerU) * camLerp;
            currentView.centerVuv += (targetFraming.centerVuv - currentView.centerVuv) * camLerp;
            currentView.visW += (targetFraming.visW - currentView.visW) * camLerp;
            currentView.visH += (targetFraming.visH - currentView.visH) * camLerp;

            const idleBreathX = reducedMotion ? 0 : Math.sin(t * 0.55) * 0.0022;
            const idleBreathY = reducedMotion ? 0 : Math.cos(t * 0.42) * 0.0012;
            const targetParallaxX = (reducedMotion ? userYaw * 0.012 : (userYaw * 0.020 + smoothHover.x * 0.013)) + idleBreathX;
            const targetParallaxY = (reducedMotion ? 0 : -smoothHover.y * 0.008) + idleBreathY;
            currentView.parallaxX += (targetParallaxX - currentView.parallaxX) * camLerp;
            currentView.parallaxY += (targetParallaxY - currentView.parallaxY) * camLerp;

            // Update Background Frostbite Shader Uniforms
            const selActor = ACTORS[activeActor] || ACTORS.dad;
            const selSpotlightUv = [selActor.spotlightU, 1.0 - selActor.spotlightVtop];
            const selFootUv = [selActor.footU, 1.0 - selActor.footVtop];
            const selBurst = bursts[activeActor] || 0;

            bgUniforms.uViewCenter.value.set(currentView.centerU, currentView.centerVuv);
            bgUniforms.uViewSpan.value.set(currentView.visW, currentView.visH);
            bgUniforms.uParallax.value.set(currentView.parallaxX, currentView.parallaxY);
            bgUniforms.uTime.value = t;
            bgUniforms.uReducedMotion.value = reducedMotion ? 1.0 : 0.0;
            bgUniforms.uActorFocusUv.value.set(selSpotlightUv[0], selSpotlightUv[1]);
            bgUniforms.uActorFootUv.value.set(selFootUv[0], selFootUv[1]);
            bgUniforms.uActorColor.value.set(selActor.colorRgb[0], selActor.colorRgb[1], selActor.colorRgb[2]);
            bgUniforms.uActorIntensity.value = 0.42 + selBurst * 0.65 + (focusedActor ? 0.25 : 0);
            bgUniforms.uCelebrateBurst.value = Math.max(celebrateGlobalBurst, selBurst * 0.55);
            bgUniforms.uShockwave.value = shockwaveClock >= 0 ? shockwaveClock : 0.0;
            bgUniforms.uStageAspect.value = stageAspect;

            // Update 3D Telemetry Camera with subtle drag-orbit perspective tilt
            const orbitCamX = userYaw * 0.24 + (reducedMotion ? 0 : smoothHover.x * 0.09);
            telemetryCam.position.set(orbitCamX, 1.05, 4.35);
            telemetryCam.lookAt(orbitCamX * 0.14, 0.12, 0);
            telemetryCam.updateMatrixWorld();

            const telemetryScale = 0.96 / Math.max(0.45, currentView.visH);

            // Place 3D underfoot rings & 3D spinning overhead chevrons pixel-locked to image anchors
            const chevHudCoords = {};
            ACTOR_KEYS.forEach((key, idx) => {
                const actor = ACTORS[key];
                const isSel = activeActor === key;
                const bVal = bursts[key] || 0;
                const ring = rings[key];
                const chev = chevrons[key];

                // Underfoot ring on turf plane y=0
                const footProj = imageUvToScreen(actor.footU, actor.footVtop);
                ndcToTurfPlane(footProj.ndcX, footProj.ndcY, _hitVec);
                ring.group.position.set(_hitVec.x, 0.008, _hitVec.z);

                const pulseScale = (isSel ? 1.06 : 0.90) + (reducedMotion ? 0 : bVal * 0.16);
                ring.group.scale.setScalar(telemetryScale * pulseScale);
                ring.ringMat.opacity = isSel ? 0.92 : 0.40;
                ring.innerMat.opacity = isSel ? 0.82 : 0.28;
                ring.ptrMat.opacity = isSel ? 0.95 : 0.45;
                if (!reducedMotion) {
                    ring.innerMesh.rotation.z = t * (isSel ? 2.1 : 0.75) + idx * 1.1;
                }

                // Overhead 3D chevron (test static anchor against HUD bar so bob never oscillates)
                const bobVtop = reducedMotion ? 0 : Math.sin(t * 4.2 + idx * 1.4) * 0.008;
                const chevHalf = 10 * stageDpr;
                const chevCheckHalf = chevHalf + 4 * stageDpr;
                const baseChevProj = imageUvToScreen(actor.chevU, actor.chevVtop);
                let chevProj = imageUvToScreen(actor.chevU, actor.chevVtop + bobVtop);
                const headProj = imageUvToScreen(actor.chevU, actor.headTopVtop);
                const headInView =
                    headProj.hudX >= -8 * stageDpr &&
                    headProj.hudX <= hudCanvas.width + 8 * stageDpr &&
                    headProj.hudY >= -2 * stageDpr &&
                    headProj.hudY <= hudCanvas.height + 8 * stageDpr;

                if (
                    headInView &&
                    overlapsHudBar(baseChevProj.hudX, baseChevProj.hudY, chevCheckHalf, chevCheckHalf)
                ) {
                    if (actor.chevFallback) {
                        chevProj = imageUvToScreen(actor.chevFallback[0], actor.chevFallback[1] + bobVtop);
                    }
                    if (
                        overlapsHudBar(chevProj.hudX, chevProj.hudY, chevHalf, chevHalf) ||
                        (actor.chevFallback && chevProj.hudY - chevHalf < hudSafeTopPx)
                    ) {
                        const clampedHudY = Math.max(chevProj.hudY, hudSafeTopPx + chevHalf);
                        chevProj.hudY = clampedHudY;
                        chevProj.ndcY = 1.0 - (2.0 * clampedHudY) / hudCanvas.height;
                    }
                }

                ndcToVerticalPlane(chevProj.ndcX, chevProj.ndcY, ring.group.position.z, _hitVec);
                chev.group.position.copy(_hitVec);
                chev.group.scale.setScalar(telemetryScale * (isSel ? 1.10 : 0.76));
                chev.coneMat.emissiveIntensity = isSel ? 0.95 : 0.36;
                chev.cone.rotation.y = reducedMotion ? Math.PI / 4 : t * (isSel ? 3.2 : 1.4);

                const chevHud = worldToHud(chev.group.position);
                chevHudCoords[key] = chevHud;
                chev.group.visible = !(
                    chevHud.x < -8 * stageDpr ||
                    chevHud.x > hudCanvas.width + 8 * stageDpr ||
                    chevHud.y < -8 * stageDpr ||
                    chevHud.y > hudCanvas.height + 8 * stageDpr
                );
            });

            // Animate 3D dust motes
            if (!reducedMotion) {
                const posArr = moteGeo.attributes.position.array;
                for (let i = 0; i < MOTE_COUNT; i++) {
                    const s = moteSeeds[i];
                    posArr[i * 3] = s.bx + Math.sin(t * s.speed + s.phase) * s.amp;
                    posArr[i * 3 + 1] = s.by + Math.cos(t * s.speed * 0.8 + s.phase) * s.amp * 0.75;
                }
                moteGeo.attributes.position.needsUpdate = true;
            }
            moteMat.opacity = reducedMotion ? 0.25 : 0.38 + Math.min(0.25, celebrateGlobalBurst * 0.16);

            // Animate 3D celebration pyro sparks
            let activeSparks = false;
            const sPosArr = sparkGeo.attributes.position.array;
            const sColArr = sparkGeo.attributes.color.array;
            for (let i = 0; i < SPARK_COUNT; i++) {
                const m = sparkMeta[i];
                if (m.life <= 0) {
                    sPosArr[i * 3 + 1] = -99;
                    continue;
                }
                activeSparks = true;
                m.life -= dt;
                if (m.life <= 0) {
                    sPosArr[i * 3 + 1] = -99;
                    continue;
                }
                m.vy -= 2.8 * dt;
                m.vx *= 1.0 - 0.9 * dt;
                m.vz *= 1.0 - 0.9 * dt;
                sPosArr[i * 3] += m.vx * dt;
                sPosArr[i * 3 + 1] += m.vy * dt;
                sPosArr[i * 3 + 2] += m.vz * dt;

                const fade = clamp(m.life / m.maxLife, 0, 1);
                sColArr[i * 3] = m.r * fade;
                sColArr[i * 3 + 1] = m.g * fade;
                sColArr[i * 3 + 2] = m.b * fade;
            }
            if (activeSparks) {
                sparkGeo.attributes.position.needsUpdate = true;
                sparkGeo.attributes.color.needsUpdate = true;
            }

            // Two-pass WebGL render: 2.5D background -> clearDepth -> 3D telemetry
            renderer.clear(true, true, true);
            renderer.render(bgScene, bgCam);
            renderer.clearDepth();
            renderer.render(telemetryScene, telemetryCam);

            if (!stageEl.classList.contains('webgl-ready')) {
                stageEl.classList.add('webgl-ready');
            }

            // =================================================================
            // 5. DPR-CRISP 2D GAMERTAG PILLS & CELEBRATION POPUPS
            // =================================================================
            const w = hudCanvas.width;
            const h = hudCanvas.height;
            const dpr = stageDpr;
            ctx2d.clearRect(0, 0, w, h);

            ACTOR_KEYS.forEach((key) => {
                const actor = ACTORS[key];
                const isSel = activeActor === key;
                const pt = chevHudCoords[key];
                if (
                    !pt ||
                    pt.x < -8 * dpr ||
                    pt.x > w + 8 * dpr ||
                    pt.y < -8 * dpr ||
                    pt.y > h + 8 * dpr
                ) {
                    return;
                }

                ctx2d.save();
                ctx2d.font = `800 ${Math.round((isSel ? 9.5 : 8.2) * dpr)}px "JetBrains Mono", monospace`;
                const tw = ctx2d.measureText(actor.label).width + 12 * dpr;
                const th = (isSel ? 15 : 13) * dpr;
                ctx2d.restore();

                let px = clamp(pt.x, tw * 0.5 + 6 * dpr, w - tw * 0.5 - 6 * dpr);
                let py = pt.y - 16 * dpr;
                let leaderFromChev = false;

                // Clamp strictly below .fc-stage-hud-top and avoid sitting over the chevron or Dad's face
                if (py - th * 0.5 < hudSafeTopPx || overlapsHudBar(px, py, tw * 0.5, th * 0.5)) {
                    const clampedPy = clamp(
                        Math.max(py, hudSafeTopPx + th * 0.5),
                        hudSafeTopPx + th * 0.5,
                        h - th * 0.5 - 6 * dpr
                    );
                    if (Math.abs(clampedPy - pt.y) < th * 0.5 + 9 * dpr) {
                        const rightBeside = pt.x + tw * 0.5 + 14 * dpr;
                        const leftBeside = pt.x - tw * 0.5 - 14 * dpr;
                        const sidePy = clamp(pt.y, hudSafeTopPx + th * 0.5, h - th * 0.5 - 6 * dpr);
                        if (
                            rightBeside + tw * 0.5 <= w - 6 * dpr &&
                            !overlapsHudBar(rightBeside, sidePy, tw * 0.5, th * 0.5)
                        ) {
                            px = rightBeside;
                            py = sidePy;
                            leaderFromChev = true;
                        } else if (
                            leftBeside - tw * 0.5 >= 6 * dpr &&
                            !overlapsHudBar(leftBeside, sidePy, tw * 0.5, th * 0.5)
                        ) {
                            px = leftBeside;
                            py = sidePy;
                            leaderFromChev = true;
                        } else {
                            py = clampedPy;
                        }
                    } else {
                        py = clampedPy;
                    }
                }
                py = clamp(py, hudSafeTopPx + th * 0.5, h - th * 0.5 - 6 * dpr);

                const fTL = imageUvToScreen(actor.faceBox.minU, actor.faceBox.minVtop);
                const fBR = imageUvToScreen(actor.faceBox.maxU, actor.faceBox.maxVtop);
                const fLeft = Math.min(fTL.hudX, fBR.hudX) - 6 * dpr;
                const fRight = Math.max(fTL.hudX, fBR.hudX) + 6 * dpr;
                const fTop = Math.min(fTL.hudY, fBR.hudY) - 4 * dpr;
                const fBot = Math.max(fTL.hudY, fBR.hudY) + 4 * dpr;

                if (px + tw * 0.5 > fLeft && px - tw * 0.5 < fRight && py + th * 0.5 > fTop && py - th * 0.5 < fBot) {
                    const rightOpt = fRight + tw * 0.5 + 8 * dpr;
                    const leftOpt = fLeft - tw * 0.5 - 8 * dpr;
                    if (rightOpt + tw * 0.5 <= w - 6 * dpr) {
                        px = rightOpt;
                    } else if (leftOpt - tw * 0.5 >= 6 * dpr) {
                        px = leftOpt;
                    }
                    leaderFromChev = true;
                }

                if (leaderFromChev) {
                    // Subtle broadcast callout leader line back to chevron
                    ctx2d.save();
                    ctx2d.strokeStyle = actor.color;
                    ctx2d.globalAlpha = isSel ? 0.72 : 0.42;
                    ctx2d.lineWidth = 1.2 * dpr;
                    ctx2d.beginPath();
                    ctx2d.moveTo(pt.x, pt.y);
                    ctx2d.lineTo(px < pt.x ? px + tw * 0.5 : px - tw * 0.5, py);
                    ctx2d.stroke();
                    ctx2d.restore();
                }

                drawHudPill(ctx2d, px, py, actor.label, actor.color, isSel, dpr);
            });

            // Rising celebration telemetry popups
            for (let i = popups.length - 1; i >= 0; i--) {
                const p = popups[i];
                if (p.delay > 0) {
                    p.delay -= dt;
                    continue;
                }
                p.life -= dt * (reducedMotion ? 1.2 : 0.85);
                if (p.life <= 0) {
                    popups.splice(i, 1);
                    continue;
                }
                const pt = chevHudCoords[p.actor];
                if (
                    !pt ||
                    pt.x < -8 * dpr ||
                    pt.x > w + 8 * dpr ||
                    pt.y < -8 * dpr ||
                    pt.y > h + 8 * dpr
                ) {
                    continue;
                }
                const risePx = reducedMotion ? 18 * dpr : (20 + (1.45 - p.life) * 30) * dpr;

                ctx2d.save();
                ctx2d.globalAlpha = clamp(p.life * 1.4, 0, 1);
                ctx2d.font = `900 ${Math.round(10.2 * dpr)}px "JetBrains Mono", monospace`;
                const tw = ctx2d.measureText(p.text).width + 14 * dpr;
                const th = 18 * dpr;
                const px = clamp(pt.x, tw * 0.5 + 6 * dpr, w - tw * 0.5 - 6 * dpr);
                const py = clamp(pt.y - risePx, hudSafeTopPx + th * 0.5 + 2 * dpr, h - th * 0.5 - 6 * dpr);

                ctx2d.fillStyle = 'rgba(4, 8, 15, 0.94)';
                ctx2d.strokeStyle = p.color;
                ctx2d.lineWidth = 1.6 * dpr;
                ctx2d.fillRect(px - tw * 0.5, py - th * 0.5, tw, th);
                ctx2d.strokeRect(px - tw * 0.5, py - th * 0.5, tw, th);
                ctx2d.fillStyle = p.color;
                ctx2d.textAlign = 'center';
                ctx2d.textBaseline = 'middle';
                ctx2d.fillText(p.text, px, py + 0.5 * dpr);
                ctx2d.restore();
            }
        }

        function animate(now) {
            rafId = 0;
            if (!isStageVisible()) {
                lastTime = now;
                return;
            }
            renderFrame(now);
            rafId = requestAnimationFrame(animate);
        }

        function ensureAnimating() {
            if (!textureReady || !isStageVisible()) return;
            if (!rafId) {
                lastTime = performance.now();
                rafId = requestAnimationFrame(animate);
            }
        }

        function pauseAnimation() {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = 0;
            }
        }

        function handleVisibilityOrRoute() {
            if (isStageVisible()) {
                ensureAnimating();
            } else {
                pauseAnimation();
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityOrRoute);
        window.addEventListener('resize', () => {
            if (isStageVisible() && textureReady) {
                syncStageSize();
                renderFrame(performance.now());
            }
        });

        const workScreenEl = document.getElementById('screen-work');
        const centralViewEl = document.getElementById('work-view-central');
        if (typeof MutationObserver !== 'undefined') {
            const obs = new MutationObserver(handleVisibilityOrRoute);
            if (workScreenEl) obs.observe(workScreenEl, { attributes: true, attributeFilter: ['hidden'] });
            if (centralViewEl) obs.observe(centralViewEl, { attributes: true, attributeFilter: ['hidden'] });
        }

        // Load photorealistic Frostbite plate via TextureLoader (sRGBEncoding),
        // rendering the first frame before adding .webgl-ready to prevent black flash.
        updateCalloutHighlight();
        const imgUrl = (sourceImg && (sourceImg.currentSrc || sourceImg.getAttribute('src'))) || 'career-dugout-trio.jpg?v=tgfc21';
        const loader = new THREE.TextureLoader();
        loader.load(
            imgUrl,
            (tex) => {
                tex.encoding = THREE.sRGBEncoding;
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.wrapS = THREE.ClampToEdgeWrapping;
                tex.wrapT = THREE.ClampToEdgeWrapping;
                tex.generateMipmaps = false;
                bgUniforms.uColorMap.value = tex;
                textureReady = true;

                if (isStageVisible() && syncStageSize()) {
                    lastTime = performance.now();
                    renderFrame(lastTime);
                    ensureAnimating();
                }
            },
            undefined,
            (err) => {
                console.warn('Frostbite stage texture load error:', err);
            }
        );
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFrostbiteTrioStage);
    } else {
        initFrostbiteTrioStage();
    }
})();
