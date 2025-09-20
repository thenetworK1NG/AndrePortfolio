// Three.js 3D Background Scenes for Portfolio
class ThreeJSScenes {
    constructor() {
        this.scenes = {};
        this.renderers = {};
        this.cameras = {};
        this.animationFrames = {};
        this.isAnimating = {};
        
        // Animation system for artistic scene
        this.artisticMixer = null;
        this.artisticClock = new THREE.Clock();
        this.artisticAnimationActions = new Map();
        this.cameraAnimating = false;
        this.cameraAnimationFrame = null;
        
        // Keyframe animation data from viewer.js
        this.keyframes = [
            {
                "index": 1,
                "position": { "x": -2, "y": 5, "z": -3 },
                "target": { "x": 0, "y": 0, "z": 0 },
                "zoom": 4,
                "duration": 2000
            },
            {
                "index": 2,
                "position": { "x": 2, "y": 1, "z": -4 },
                "target": { "x": 0, "y": 0, "z": 0 },
                "zoom": 5,
                "duration": 2000
            },
            {
                "index": 3,
                "position": { "x": 0, "y": 2, "z": 10 },
                "target": { "x": 0, "y": 0, "z": 0 },
                "zoom": 8,
                "duration": 3000
            }
        ];
        
        this.init();
    }

    init() {
        this.createNetworkScene();
        this.createBlendScene();
        this.createArtisticScene();
        this.startAnimations();
    }

    // Animation helper functions (from viewer.js)
    lerpVec3(a, b, t) {
        return new THREE.Vector3(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t,
            a.z + (b.z - a.z) * t
        );
    }

    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    slerpQuat(a, b, t) {
        return a.clone().slerp(b, t);
    }

    // Camera keyframe animation function
    animateKeyframes(keyframes, controls, camera) {
        console.log('animateKeyframes called with', keyframes.length, 'keyframes');
        if (this.cameraAnimating || keyframes.length < 2) {
            console.log('Animation blocked - already animating:', this.cameraAnimating, 'or insufficient keyframes:', keyframes.length);
            return;
        }
        this.cameraAnimating = true;
        console.log('Starting camera keyframe animation...');
        let i = 0;
        
        const animateToNext = () => {
            if (i >= keyframes.length - 1) {
                this.cameraAnimating = false;
                return;
            }
            
            const start = keyframes[i];
            const end = keyframes[i + 1];
            const duration = end.duration || 1200;
            const startTime = performance.now();
            
            const step = (now) => {
                let t = Math.min((now - startTime) / duration, 1);
                
                // Interpolate camera properties
                const newTarget = this.lerpVec3(
                    new THREE.Vector3(start.target.x, start.target.y, start.target.z),
                    new THREE.Vector3(end.target.x, end.target.y, end.target.z),
                    t
                );
                const newZoom = this.lerp(start.zoom, end.zoom, t);
                
                controls.target.copy(newTarget);
                
                // Spherical interpolation for camera position
                const startOffset = new THREE.Vector3(start.position.x, start.position.y, start.position.z).sub(newTarget);
                const endOffset = new THREE.Vector3(end.position.x, end.position.y, end.position.z).sub(newTarget);
                const startSph = new THREE.Spherical().setFromVector3(startOffset);
                const endSph = new THREE.Spherical().setFromVector3(endOffset);
                const theta = this.lerp(startSph.theta, endSph.theta, t);
                const phi = this.lerp(startSph.phi, endSph.phi, t);
                const sph = new THREE.Spherical(newZoom, phi, theta);
                const newOffset = new THREE.Vector3().setFromSpherical(sph);
                camera.position.copy(newTarget.clone().add(newOffset));
                
                controls.update();
                
                if (t < 1) {
                    this.cameraAnimationFrame = requestAnimationFrame(step);
                } else {
                    i++;
                    animateToNext();
                }
            };
            this.cameraAnimationFrame = requestAnimationFrame(step);
        };
        animateToNext();
    }

    // Start camera and model animations for artistic scene
    playArtisticAnimations() {
        console.log('playArtisticAnimations called!');
        if (!this.scenes.artistic) {
            console.log('No artistic scene found!');
            return;
        }
        
        const { controls, camera } = this.scenes.artistic;
        console.log('Starting keyframe animation with', this.keyframes.length, 'keyframes');
        
        // Start camera keyframe animation
        this.animateKeyframes(this.keyframes, controls, camera);
        
        // Start model animations if available
        if (this.artisticMixer && this.artisticAnimationActions.size > 0) {
            console.log('Starting model animations:', this.artisticAnimationActions.size, 'actions');
            this.artisticAnimationActions.forEach(action => {
                action.reset();
                action.paused = false;
                action.play();
            });
        } else {
            console.log('No model animations found. Mixer:', !!this.artisticMixer, 'Actions:', this.artisticAnimationActions.size);
        }
    }

    // Stop all artistic animations
    stopArtisticAnimations() {
        if (this.cameraAnimationFrame) {
            cancelAnimationFrame(this.cameraAnimationFrame);
            this.cameraAnimationFrame = null;
        }
        this.cameraAnimating = false;
        
        if (this.artisticAnimationActions.size > 0) {
            this.artisticAnimationActions.forEach(action => action.stop());
        }
    }

    // Section 1: Network Scene for thenerworKING
    createNetworkScene() {
        const canvas = document.getElementById('canvas1');
        if (!canvas) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: false });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 1); // Black background
        
        // Create network nodes
        const nodeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x667eea });
        const nodes = [];
        const connections = [];

        // Create 50 nodes in 3D space
        for (let i = 0; i < 50; i++) {
            const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
            node.position.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 8
            );
            
            // Random color variations
            node.material.color.setHSL(
                0.6 + Math.random() * 0.2, // Blue-purple range
                0.7,
                0.5 + Math.random() * 0.3
            );
            
            scene.add(node);
            nodes.push(node);
        }

        // Create connections between nearby nodes
        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x764ba2, 
            transparent: true, 
            opacity: 0.3 
        });

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const distance = nodes[i].position.distanceTo(nodes[j].position);
                if (distance < 2.5) {
                    const points = [nodes[i].position, nodes[j].position];
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const line = new THREE.Line(geometry, lineMaterial.clone());
                    scene.add(line);
                    connections.push(line);
                }
            }
        }

        camera.position.z = 5;

        this.scenes.network = { scene, camera, renderer, nodes, connections };
        this.renderers.network = renderer;
        this.cameras.network = camera;
    }

    // Section 2: Particle Blend Scene for Blend Optimum
    createBlendScene() {
        const canvas = document.getElementById('canvas2');
        if (!canvas) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: false });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 1); // Black background

        // Create particle system
        const particleCount = 1000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            // Positions
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

            // Colors (blend between pink and red)
            const color = new THREE.Color();
            color.setHSL(
                Math.random() * 0.1 + 0.85, // Pink to red range
                0.8,
                0.6
            );
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // Velocities
            velocities.push({
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            });
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);

        camera.position.z = 10;

        this.scenes.blend = { scene, camera, renderer, particleSystem, velocities };
        this.renderers.blend = renderer;
        this.cameras.blend = camera;
    }

    // Section 3: Artistic Scene for Mr $cr!bbl3$ with GLB model
    createArtisticScene() {
        const canvas = document.getElementById('canvas3');
        if (!canvas) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: false });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 1); // Black background
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;

        // Add lighting for the crystal formation with enhanced glow
        const ambientLight = new THREE.AmbientLight(0x404080, 0.4);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Enhanced point lights for dramatic crystal glow effect
        const pointLight1 = new THREE.PointLight(0x00f2fe, 1.2, 12);
        pointLight1.position.set(-3, 2, -2);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x4facfe, 1.0, 10);
        pointLight2.position.set(3, -1, 2);
        scene.add(pointLight2);

        // Add crystal core light - emanates from the center
        const coreLight = new THREE.PointLight(0x88ddff, 2.0, 8);
        coreLight.position.set(0, -0.5, 0);
        scene.add(coreLight);

        // Add magical accent lights around the crystal base
        const accentLight1 = new THREE.PointLight(0xaa44ff, 0.8, 6);
        accentLight1.position.set(0, -1.5, 0);
        scene.add(accentLight1);

        const accentLight2 = new THREE.PointLight(0x44ffaa, 0.6, 4);
        accentLight2.position.set(0, 1, 0);
        scene.add(accentLight2);

        // Store art elements and model
        const artElements = [];
        let potionModel = null;
        let crystalFormation = null;

        // Load the GLB model first
        const loader = new THREE.GLTFLoader();
        loader.load(
            './mr scribbles/halloween_potion.glb',
            (gltf) => {
                potionModel = gltf.scene;
                
                // Setup animations if they exist
                if (gltf.animations && gltf.animations.length) {
                    this.artisticMixer = new THREE.AnimationMixer(potionModel);
                    gltf.animations.forEach((clip, i) => {
                        const action = this.artisticMixer.clipAction(clip);
                        action.clampWhenFinished = true;
                        action.setLoop(THREE.LoopRepeat, Infinity);
                        action.enabled = true;
                        this.artisticAnimationActions.set(i, action);
                    });
                    console.log(`Found ${gltf.animations.length} animations in the GLB model`);
                }
                
                // Scale and position the model - place it on the crystal platform
                potionModel.scale.setScalar(1.2);
                potionModel.position.set(0, -0.8, 0);
                
                // Add some rotation
                potionModel.rotation.y = Math.PI * 0.25;
                
                scene.add(potionModel);
                console.log('Halloween potion model loaded successfully and integrated with crystal!');
            },
            (progress) => {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading GLB model:', error);
                
                // Fallback: create a simple potion-like object
                const potionGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
                const potionMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x4facfe,
                    transparent: true,
                    opacity: 0.8
                });
                const fallbackPotion = new THREE.Mesh(potionGeometry, potionMaterial);
                fallbackPotion.position.set(0, -0.8, 0);
                scene.add(fallbackPotion);
                artElements.push({ mesh: fallbackPotion, type: 'potion' });
            }
        );

        // Create mystical crystal formation around the potion
        const createCrystalFormation = () => {
            const crystalGroup = new THREE.Group();
            
            // Smaller satellite crystals positioned closer around the potion
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const radius = 0.8 + Math.random() * 0.2; // Closer to potion
                const height = 0.8 + Math.random() * 0.6;
                
                const smallCrystalGeometry = new THREE.ConeGeometry(0.12, height, 6);
                const hue = 0.5 + Math.random() * 0.2; // Blue to cyan range
                const smallCrystalMaterial = new THREE.MeshPhysicalMaterial({
                    color: new THREE.Color().setHSL(hue, 0.8, 0.6),
                    transparent: true,
                    opacity: 0.8,
                    roughness: 0.2,
                    metalness: 0.2,
                    clearcoat: 0.8,
                    transmission: 0.4,
                    ior: 2.2
                });
                
                const smallCrystal = new THREE.Mesh(smallCrystalGeometry, smallCrystalMaterial);
                smallCrystal.position.set(
                    Math.cos(angle) * radius,
                    -0.8 + Math.random() * 0.2,
                    Math.sin(angle) * radius
                );
                smallCrystal.rotation.set(
                    Math.random() * 0.3,
                    angle + Math.random() * 0.5,
                    Math.random() * 0.2
                );
                
                crystalGroup.add(smallCrystal);
                artElements.push({ 
                    mesh: smallCrystal, 
                    type: 'satellite_crystal',
                    baseY: smallCrystal.position.y,
                    floatOffset: Math.random() * Math.PI * 2
                });
            }
            
            // Add some magical runes/symbols floating around the potion
            for (let i = 0; i < 8; i++) {
                const runeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
                const runeMaterial = new THREE.MeshBasicMaterial({
                    color: 0x44aaff,
                    emissive: 0x2288dd,
                    emissiveIntensity: 0.5
                });
                const rune = new THREE.Mesh(runeGeometry, runeMaterial);
                
                const angle = (i / 8) * Math.PI * 2;
                rune.position.set(
                    Math.cos(angle) * 0.5, // Much closer to potion
                    -0.4 + Math.random() * 0.3, // Closer vertically too
                    Math.sin(angle) * 0.5
                );
                
                crystalGroup.add(rune);
                artElements.push({
                    mesh: rune,
                    type: 'rune',
                    angle: angle,
                    baseY: rune.position.y
                });
            }
            
            crystalGroup.position.set(0, 0, 0);
            scene.add(crystalGroup);
            
            crystalFormation = crystalGroup;
            
            console.log('Mystical crystal formation created around potion!');
        };

        // Create the crystal formation
        createCrystalFormation();

        // Create energy orbs that orbit around the crystal
        for (let i = 0; i < 8; i++) {
            const orbGeometry = new THREE.SphereGeometry(0.08, 16, 16);
            const orbMaterial = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color().setHSL(0.55 + Math.random() * 0.2, 1.0, 0.7),
                transparent: true,
                opacity: 0.9,
                emissive: new THREE.Color().setHSL(0.55 + Math.random() * 0.2, 1.0, 0.3),
                emissiveIntensity: 0.8,
                roughness: 0.1,
                metalness: 0.1
            });
            
            const orb = new THREE.Mesh(orbGeometry, orbMaterial);
            
            // Position orbs in different orbital layers
            const layer = Math.floor(i / 3); // 3 layers
            const angleInLayer = (i % 3) * (Math.PI * 2 / 3);
            const radius = 1.5 + layer * 0.8;
            const height = -0.5 + layer * 0.6;
            
            orb.position.set(
                Math.cos(angleInLayer) * radius,
                height,
                Math.sin(angleInLayer) * radius
            );
            
            scene.add(orb);
            artElements.push({
                mesh: orb,
                type: 'energy_orb',
                orbitAngle: angleInLayer,
                orbitRadius: radius,
                orbitSpeed: 0.008 + Math.random() * 0.004,
                baseHeight: height,
                layer: layer,
                pulseOffset: Math.random() * Math.PI * 2
            });
        }

        // Create floating artistic elements around the potion
        // Paint brushes
        for (let i = 0; i < 12; i++) {
            const brushGeometry = new THREE.CylinderGeometry(0.02, 0.05, 0.6, 8);
            const brushMaterial = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6) 
            });
            const brush = new THREE.Mesh(brushGeometry, brushMaterial);
            
            // Position brushes in a circle around the potion
            const angle = (i / 12) * Math.PI * 2;
            const radius = 3 + Math.random() * 2;
            brush.position.set(
                Math.cos(angle) * radius,
                Math.random() * 2 - 1,
                Math.sin(angle) * radius
            );
            
            brush.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            scene.add(brush);
            artElements.push({ mesh: brush, type: 'brush', angle: angle, radius: radius });
        }

        // Enhanced magic particles with trails and sparks
        for (let i = 0; i < 35; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.02 + Math.random() * 0.03, 8, 8);
            const particleType = Math.random();
            
            let particleMaterial;
            if (particleType < 0.6) {
                // Regular magic particles
                particleMaterial = new THREE.MeshBasicMaterial({ 
                    color: new THREE.Color().setHSL(
                        0.5 + Math.random() * 0.3, // Blue-cyan range
                        0.9,
                        0.7
                    ),
                    transparent: true,
                    opacity: 0.8
                });
            } else if (particleType < 0.85) {
                // Glowing sparks
                particleMaterial = new THREE.MeshBasicMaterial({ 
                    color: new THREE.Color().setHSL(0.15, 1.0, 0.8), // Golden sparks
                    transparent: true,
                    opacity: 0.9
                });
            } else {
                // Energy wisps
                particleMaterial = new THREE.MeshBasicMaterial({ 
                    color: new THREE.Color().setHSL(0.8, 0.7, 0.9), // Purple wisps
                    transparent: true,
                    opacity: 0.6
                });
            }
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            particle.position.set(
                (Math.random() - 0.5) * 5,
                Math.random() * 4 - 1,
                (Math.random() - 0.5) * 5
            );
            
            scene.add(particle);
            
            let particleTypeStr = 'particle';
            if (particleType >= 0.6 && particleType < 0.85) particleTypeStr = 'spark';
            else if (particleType >= 0.85) particleTypeStr = 'wisp';
            
            artElements.push({ 
                mesh: particle, 
                type: particleTypeStr,
                velocity: {
                    x: (Math.random() - 0.5) * 0.02,
                    y: Math.random() * 0.015 + 0.005,
                    z: (Math.random() - 0.5) * 0.02
                },
                lifeTime: Math.random() * 300 + 200,
                age: 0,
                spiralAngle: Math.random() * Math.PI * 2,
                spiralRadius: Math.random() * 0.5 + 0.2
            });
        }

        camera.position.set(0, 1, 6);
        camera.lookAt(0, 0, 0);

        // Add OrbitControls for mouse interaction
        const controls = new THREE.OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.enablePan = false; // Disable panning to keep focus on model
        controls.minDistance = 3;
        controls.maxDistance = 10;
        controls.maxPolarAngle = Math.PI * 0.75; // Limit vertical rotation
        controls.minPolarAngle = Math.PI * 0.25;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5; // Slow auto-rotation
        controls.target.set(0, 0, 0);
        
        // Ensure canvas can receive mouse events
        canvas.style.pointerEvents = 'auto';
        canvas.style.cursor = 'grab';

        this.scenes.artistic = { scene, camera, renderer, artElements, potionModel, crystalFormation, pointLight1, pointLight2, controls, coreLight, accentLight1, accentLight2 };
        this.renderers.artistic = renderer;
        this.cameras.artistic = camera;
    }

    // Animation functions
    animateNetwork() {
        if (!this.scenes.network) return;
        
        const { scene, camera, renderer, nodes, connections } = this.scenes.network;
        
        // Animate nodes
        nodes.forEach((node, index) => {
            node.rotation.y += 0.01;
            node.position.y += Math.sin(Date.now() * 0.001 + index) * 0.001;
            
            // Pulse effect
            const scale = 1 + Math.sin(Date.now() * 0.002 + index) * 0.2;
            node.scale.setScalar(scale);
        });

        // Rotate camera
        camera.position.x = Math.sin(Date.now() * 0.0005) * 2;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
        
        if (this.isAnimating.network) {
            this.animationFrames.network = requestAnimationFrame(() => this.animateNetwork());
        }
    }

    animateBlend() {
        if (!this.scenes.blend) return;
        
        const { scene, camera, renderer, particleSystem, velocities } = this.scenes.blend;
        
        const positions = particleSystem.geometry.attributes.position.array;
        const colors = particleSystem.geometry.attributes.color.array;
        
        for (let i = 0; i < velocities.length; i++) {
            // Update positions
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;
            
            // Boundary checks
            if (Math.abs(positions[i * 3]) > 10) velocities[i].x *= -1;
            if (Math.abs(positions[i * 3 + 1]) > 10) velocities[i].y *= -1;
            if (Math.abs(positions[i * 3 + 2]) > 10) velocities[i].z *= -1;
            
            // Color blending animation
            const time = Date.now() * 0.001;
            const color = new THREE.Color();
            color.setHSL(
                (Math.sin(time + i * 0.1) * 0.1 + 0.9) % 1,
                0.8,
                0.6
            );
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        particleSystem.geometry.attributes.position.needsUpdate = true;
        particleSystem.geometry.attributes.color.needsUpdate = true;
        
        // Rotate camera
        camera.position.x = Math.sin(Date.now() * 0.0003) * 5;
        camera.position.y = Math.cos(Date.now() * 0.0004) * 3;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
        
        if (this.isAnimating.blend) {
            this.animationFrames.blend = requestAnimationFrame(() => this.animateBlend());
        }
    }

    animateArtistic() {
        if (!this.scenes.artistic) return;
        
        const { scene, camera, renderer, artElements, potionModel, crystalFormation, pointLight1, pointLight2, controls, coreLight, accentLight1, accentLight2 } = this.scenes.artistic;
        
        // Update controls for smooth interaction
        if (controls) {
            controls.update();
        }
        
        // Update animation mixer for GLB model animations
        if (this.artisticMixer) {
            this.artisticMixer.update(this.artisticClock.getDelta());
        }
        
        // Animate the potion model
        if (potionModel) {
            potionModel.rotation.y += 0.005;
            potionModel.position.y = -0.8 + Math.sin(Date.now() * 0.001) * 0.08;
        }
        
        // Animate the crystal formation (gentle movement around the potion)
        if (crystalFormation) {
            crystalFormation.rotation.y += 0.002;
            
            // Subtle floating effect for the whole crystal formation
            crystalFormation.position.y = Math.sin(Date.now() * 0.0008) * 0.05;
        }
        
        // Animate art elements
        artElements.forEach((element, index) => {
            const { mesh, type } = element;
            
            if (type === 'brush') {
                // Orbit around the potion/crystal setup
                element.angle += 0.01;
                mesh.position.x = Math.cos(element.angle) * element.radius;
                mesh.position.z = Math.sin(element.angle) * element.radius;
                mesh.position.y += Math.sin(Date.now() * 0.001 + index) * 0.002;
                
                mesh.rotation.x += 0.01;
                mesh.rotation.y += 0.005;
            } else if (type === 'energy_orb') {
                // Orbit around the potion/crystal setup in multiple layers
                element.orbitAngle += element.orbitSpeed;
                
                mesh.position.x = Math.cos(element.orbitAngle) * element.orbitRadius;
                mesh.position.z = Math.sin(element.orbitAngle) * element.orbitRadius;
                mesh.position.y = element.baseHeight + Math.sin(Date.now() * 0.002 + element.pulseOffset) * 0.15;
                
                // Pulsing glow effect
                const pulseScale = 1 + Math.sin(Date.now() * 0.003 + element.pulseOffset) * 0.4;
                mesh.scale.setScalar(pulseScale);
                
                // Color shifting
                const hue = (0.55 + Math.sin(Date.now() * 0.001 + element.pulseOffset) * 0.1) % 1;
                mesh.material.color.setHSL(hue, 1.0, 0.7);
                mesh.material.emissive.setHSL(hue, 1.0, 0.3);
            } else if (type === 'satellite_crystal') {
                // Gentle floating animation for satellite crystals
                mesh.position.y = element.baseY + Math.sin(Date.now() * 0.0008 + element.floatOffset) * 0.06;
                mesh.rotation.y += 0.002;
            } else if (type === 'rune') {
                // Magical runes pulse and rotate
                mesh.position.y = element.baseY + Math.sin(Date.now() * 0.003 + index) * 0.02;
                mesh.rotation.y += 0.01;
                
                // Pulsing glow
                const intensity = 0.5 + Math.sin(Date.now() * 0.004 + index) * 0.3;
                mesh.material.emissiveIntensity = intensity;
                
                // Scale pulsing
                const scale = 1 + Math.sin(Date.now() * 0.005 + index) * 0.2;
                mesh.scale.setScalar(scale);
            } else if (type === 'particle' || type === 'spark' || type === 'wisp') {
                // Enhanced magic particle movement
                element.age++;
                
                if (type === 'spark') {
                    // Sparks move in quick bursts
                    mesh.position.add(new THREE.Vector3(
                        element.velocity.x * 2,
                        element.velocity.y * 1.5,
                        element.velocity.z * 2
                    ));
                    
                    // Sparks fade as they age
                    const fadeRatio = Math.max(0, 1 - element.age / element.lifeTime);
                    mesh.material.opacity = fadeRatio * 0.9;
                    
                } else if (type === 'wisp') {
                    // Wisps move in spirals around the potion/crystal
                    element.spiralAngle += 0.02;
                    const spiralX = Math.cos(element.spiralAngle) * element.spiralRadius;
                    const spiralZ = Math.sin(element.spiralAngle) * element.spiralRadius;
                    
                    mesh.position.add(new THREE.Vector3(
                        element.velocity.x + spiralX * 0.01,
                        element.velocity.y,
                        element.velocity.z + spiralZ * 0.01
                    ));
                    
                    // Wisps pulse gently
                    const pulseScale = 1 + Math.sin(Date.now() * 0.004 + index) * 0.3;
                    mesh.scale.setScalar(pulseScale);
                    
                } else {
                    // Regular particles
                    mesh.position.add(new THREE.Vector3(
                        element.velocity.x,
                        element.velocity.y,
                        element.velocity.z
                    ));
                }
                
                // Reset particles that go too high or fade completely
                if (mesh.position.y > 5 || element.age > element.lifeTime) {
                    mesh.position.y = -1.5;
                    mesh.position.x = (Math.random() - 0.5) * 3;
                    mesh.position.z = (Math.random() - 0.5) * 3;
                    element.age = 0;
                    mesh.material.opacity = type === 'spark' ? 0.9 : 0.8;
                }
                
                mesh.rotation.y += 0.02;
                
                // Regular pulsing glow for particles
                if (type === 'particle') {
                    const scale = 1 + Math.sin(Date.now() * 0.003 + index) * 0.3;
                    mesh.scale.setScalar(scale);
                }
            } else if (type === 'potion') {
                // Fallback potion animation
                mesh.rotation.y += 0.01;
                mesh.position.y = -0.8 + Math.sin(Date.now() * 0.001) * 0.08;
            }
        });

        // Animate enhanced lighting
        if (pointLight1) {
            pointLight1.position.x = -3 + Math.sin(Date.now() * 0.0008) * 1.2;
            pointLight1.position.y = 2 + Math.cos(Date.now() * 0.0006) * 0.8;
            pointLight1.intensity = 1.2 + Math.sin(Date.now() * 0.002) * 0.4;
        }
        
        if (pointLight2) {
            pointLight2.position.x = 3 + Math.cos(Date.now() * 0.0007) * 1.2;
            pointLight2.position.z = 2 + Math.sin(Date.now() * 0.0009) * 1.2;
            pointLight2.intensity = 1.0 + Math.cos(Date.now() * 0.0015) * 0.3;
        }
        
        if (coreLight) {
            coreLight.intensity = 2.0 + Math.sin(Date.now() * 0.003) * 0.8;
            coreLight.position.y = -0.8 + Math.sin(Date.now() * 0.001) * 0.1;
        }
        
        if (accentLight1) {
            accentLight1.intensity = 0.8 + Math.cos(Date.now() * 0.0025) * 0.4;
            const hue = (Date.now() * 0.0001) % 1;
            accentLight1.color.setHSL(hue, 0.8, 0.6);
        }
        
        if (accentLight2) {
            accentLight2.intensity = 0.6 + Math.sin(Date.now() * 0.002) * 0.3;
        }

        renderer.render(scene, camera);
        
        if (this.isAnimating.artistic) {
            this.animationFrames.artistic = requestAnimationFrame(() => this.animateArtistic());
        }
    }

    startAnimations() {
        this.isAnimating.network = true;
        this.isAnimating.blend = true;
        this.isAnimating.artistic = true;
        
        this.animateNetwork();
        this.animateBlend();
        this.animateArtistic();
    }

    stopAnimations() {
        this.isAnimating.network = false;
        this.isAnimating.blend = false;
        this.isAnimating.artistic = false;
        
        if (this.animationFrames.network) cancelAnimationFrame(this.animationFrames.network);
        if (this.animationFrames.blend) cancelAnimationFrame(this.animationFrames.blend);
        if (this.animationFrames.artistic) cancelAnimationFrame(this.animationFrames.artistic);
    }

    // Optimize performance by only animating visible scene
    pauseAllExcept(activeScene) {
        this.isAnimating.network = activeScene === 'network';
        this.isAnimating.blend = activeScene === 'blend';
        this.isAnimating.artistic = activeScene === 'artistic';
    }

    resumeAll() {
        this.startAnimations();
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        Object.values(this.cameras).forEach(camera => {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        });

        Object.values(this.renderers).forEach(renderer => {
            renderer.setSize(width, height);
        });
    }
}

// Initialize 3D scenes when page loads
window.addEventListener('load', () => {
    console.log('Initializing ThreeJS scenes...');
    window.threeJSScenes = new ThreeJSScenes();
    console.log('ThreeJS scenes initialized and attached to window');
});

window.addEventListener('resize', () => {
    if (window.threeJSScenes) {
        window.threeJSScenes.handleResize();
    }
});