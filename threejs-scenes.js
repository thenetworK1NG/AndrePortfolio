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
        
        // User interaction tracking for auto-rotation
        this.userInteracting = false;
        this.interactionTimeout = null;
        this.lastInteractionTime = 0;
        
        // Bobbing animation properties
        this.bobbingEnabled = true;
        this.bobbingTime = 0;
        this.artisticAnimationStarted = false; // Debug flag
        this.potionModelFound = false; // Debug flag
        this.potionModelNotFoundLogged = false; // Debug flag
        
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
        console.log('Artistic scene activated - OrbitControls auto-rotation will handle rotation');
        
        // Keep camera keyframe animations disabled for manual interaction
        // this.animateKeyframes(this.keyframes, controls, camera);
        
        // Keep model animations disabled - model will be static but interactable
        if (this.artisticMixer && this.artisticAnimationActions.size > 0) {
            console.log('Model animations found but keeping disabled for static display:', this.artisticAnimationActions.size, 'actions');
            // Don't start the animations - keep them paused
            this.artisticAnimationActions.forEach(action => {
                action.reset();
                action.paused = true; // Keep paused
                // Don't call action.play()
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

        // Add lighting for the GLB model
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Add point lights for dramatic effect
        const pointLight1 = new THREE.PointLight(0x00f2fe, 0.8, 10);
        pointLight1.position.set(-3, 2, -2);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x4facfe, 0.6, 8);
        pointLight2.position.set(3, -1, 2);
        scene.add(pointLight2);

        // Store art elements and model
        const artElements = [];
        let potionModel = null;

        // Load the GLB model
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
                
                // Check if mobile device
                const isMobile = window.innerWidth <= 768;
                
                // Scale and position the model based on device
                if (isMobile) {
                    potionModel.scale.setScalar(1.0); // Smaller on mobile
                    potionModel.position.set(0, -1.8, 0); // Lower position on mobile
                } else {
                    potionModel.scale.setScalar(1.5); // Original size on desktop
                    potionModel.position.set(0, -1, 0); // Original position on desktop
                }
                
                // Add some rotation
                potionModel.rotation.y = Math.PI * 0.25;
                
                scene.add(potionModel);
                console.log('Halloween potion model loaded successfully!');
            },
            (progress) => {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading GLB model:', error);
                
                // Fallback: create a simple potion-like object
                const isMobile = window.innerWidth <= 768;
                
                const potionGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
                const potionMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x4facfe,
                    transparent: true,
                    opacity: 0.8
                });
                const fallbackPotion = new THREE.Mesh(potionGeometry, potionMaterial);
                
                // Position fallback potion responsively
                if (isMobile) {
                    fallbackPotion.position.set(0, -1.3, 0); // Lower on mobile
                    fallbackPotion.scale.setScalar(0.7); // Smaller on mobile
                } else {
                    fallbackPotion.position.set(0, -0.5, 0); // Original position
                    fallbackPotion.scale.setScalar(1.0); // Original size
                }
                scene.add(fallbackPotion);
                artElements.push({ mesh: fallbackPotion, type: 'potion' });
            }
        );

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

        // Magic particles
        for (let i = 0; i < 20; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color().setHSL(
                    0.5 + Math.random() * 0.3, // Blue-cyan range
                    0.9,
                    0.7
                ),
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            particle.position.set(
                (Math.random() - 0.5) * 4,
                Math.random() * 3,
                (Math.random() - 0.5) * 4
            );
            
            scene.add(particle);
            artElements.push({ 
                mesh: particle, 
                type: 'particle',
                velocity: {
                    x: (Math.random() - 0.5) * 0.02,
                    y: Math.random() * 0.01 + 0.005,
                    z: (Math.random() - 0.5) * 0.02
                }
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
        controls.autoRotate = true; // Enable built-in auto-rotation
        controls.autoRotateSpeed = 0.5; // Slow rotation speed
        controls.target.set(0, 0, 0);
        
        console.log('OrbitControls created for canvas3 with auto-rotation enabled:', controls);
        
        // Ensure canvas can receive mouse events
        canvas.style.pointerEvents = 'auto';
        canvas.style.cursor = 'grab';
        
        // Basic event listeners for cursor feedback and interaction tracking
        canvas.addEventListener('mousedown', (e) => {
            canvas.style.cursor = 'grabbing';
            this.userInteracting = true;
            this.bobbingEnabled = false;
            this.lastInteractionTime = Date.now();
        });
        
        canvas.addEventListener('mouseup', (e) => {
            canvas.style.cursor = 'grab';
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (this.userInteracting) {
                this.lastInteractionTime = Date.now();
            }
        });
        
        canvas.addEventListener('wheel', (e) => {
            this.userInteracting = true;
            this.bobbingEnabled = false;
            this.lastInteractionTime = Date.now();
        });
        
        canvas.addEventListener('mouseleave', (e) => {
            canvas.style.cursor = 'grab';
            this.userInteracting = false;
            // Re-enable bobbing after 3 seconds of no interaction
            setTimeout(() => {
                if (Date.now() - this.lastInteractionTime > 3000) {
                    this.bobbingEnabled = true;
                    this.bobbingTime = 0; // Reset bobbing animation
                }
            }, 3000);
        });
        
        // Re-enable bobbing after 3 seconds of no interaction
        setInterval(() => {
            if (!this.userInteracting && Date.now() - this.lastInteractionTime > 3000) {
                this.bobbingEnabled = true;
            }
        }, 1000);

        this.scenes.artistic = { scene, camera, renderer, artElements, potionModel, pointLight1, pointLight2, controls };
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
        
        // Debug: log once when animation starts
        if (!this.artisticAnimationStarted) {
            console.log('animateArtistic() function is now running');
            this.artisticAnimationStarted = true;
        }
        
        const { scene, camera, renderer, artElements, potionModel, pointLight1, pointLight2, controls } = this.scenes.artistic;
        
        // Update controls for smooth interaction
        if (controls) {
            controls.update();
        }
        
        // Don't update animation mixer since we want the model to be static
        // if (this.artisticMixer) {
        //     this.artisticMixer.update(this.artisticClock.getDelta());
        // }
        
        // Keep the potion model with bobbing animation (OrbitControls handles rotation)
        if (potionModel) {
            // Debug: log once when potion model is found
            if (!this.potionModelFound) {
                console.log('Potion model found - OrbitControls will handle camera auto-rotation, model will bob');
                this.potionModelFound = true;
            }
            
            // Base position - responsive to device size
            const isMobile = window.innerWidth <= 768;
            const baseY = isMobile ? -1.8 : -1;
            
            // Add bobbing motion if enabled
            if (this.bobbingEnabled) {
                this.bobbingTime += 0.05; // Faster bobbing speed
                const bobbingOffset = Math.sin(this.bobbingTime) * 0.3; // Larger bobbing amplitude
                potionModel.position.y = baseY + bobbingOffset;
            } else {
                // Keep at base position when bobbing is disabled
                potionModel.position.y = baseY;
            }
            
            // No manual rotation needed - OrbitControls handles this automatically
        } else {
            // Debug: log if potion model is not found
            if (!this.potionModelNotFoundLogged) {
                console.log('Potion model not found in animation loop');
                this.potionModelNotFoundLogged = true;
            }
        }
        
        // Animate art elements
        artElements.forEach((element, index) => {
            const { mesh, type } = element;
            
            if (type === 'brush') {
                // Orbit around the potion
                element.angle += 0.01;
                mesh.position.x = Math.cos(element.angle) * element.radius;
                mesh.position.z = Math.sin(element.angle) * element.radius;
                mesh.position.y += Math.sin(Date.now() * 0.001 + index) * 0.002;
                
                mesh.rotation.x += 0.01;
                mesh.rotation.y += 0.005;
            } else if (type === 'particle') {
                // Magic particle movement
                mesh.position.add(new THREE.Vector3(
                    element.velocity.x,
                    element.velocity.y,
                    element.velocity.z
                ));
                
                // Reset particles that go too high
                if (mesh.position.y > 4) {
                    mesh.position.y = -1;
                    mesh.position.x = (Math.random() - 0.5) * 2;
                    mesh.position.z = (Math.random() - 0.5) * 2;
                }
                
                mesh.rotation.y += 0.02;
                
                // Pulsing glow effect
                const scale = 1 + Math.sin(Date.now() * 0.003 + index) * 0.3;
                mesh.scale.setScalar(scale);
            } else if (type === 'potion') {
                // Fallback potion - add bobbing motion (camera auto-rotation handles rotation)
                const isMobile = window.innerWidth <= 768;
                const baseY = isMobile ? -1.3 : -0.5;
                
                // Add bobbing motion if enabled
                if (this.bobbingEnabled) {
                    const bobbingOffset = Math.sin(this.bobbingTime) * 0.3; // Larger amplitude to match main model
                    mesh.position.y = baseY + bobbingOffset;
                } else {
                    // Keep at base position when bobbing is disabled
                    mesh.position.y = baseY;
                }
                
                // No manual rotation needed - OrbitControls handles camera rotation
            }
        });

        // Animate point lights
        if (pointLight1) {
            pointLight1.position.x = -3 + Math.sin(Date.now() * 0.0008) * 1;
            pointLight1.position.y = 2 + Math.cos(Date.now() * 0.0006) * 0.5;
            pointLight1.intensity = 0.8 + Math.sin(Date.now() * 0.002) * 0.3;
        }
        
        if (pointLight2) {
            pointLight2.position.x = 3 + Math.cos(Date.now() * 0.0007) * 1;
            pointLight2.position.z = 2 + Math.sin(Date.now() * 0.0009) * 1;
            pointLight2.intensity = 0.6 + Math.cos(Date.now() * 0.0015) * 0.2;
        }

        // Camera is now controlled by OrbitControls, no manual movement needed

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
        
        // Update potion model positioning for mobile/desktop
        this.updatePotionModelPosition();
    }
    
    updatePotionModelPosition() {
        if (this.scenes.artistic && this.scenes.artistic.potionModel) {
            const isMobile = window.innerWidth <= 768;
            const potionModel = this.scenes.artistic.potionModel;
            
            if (isMobile) {
                potionModel.scale.setScalar(1.0);
                potionModel.position.set(0, -1.8, 0);
            } else {
                potionModel.scale.setScalar(1.5);
                potionModel.position.set(0, -1, 0);
            }
        }
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