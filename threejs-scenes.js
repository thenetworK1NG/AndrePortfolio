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
        
        // Force create lighting controls immediately
        this.createLightingControls();
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
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 2.0; // MAX EXPOSURE FOR BRIGHTNESS

        // Add lighting for the GLB model (MAX BRIGHTNESS BY DEFAULT)
        const ambientLight = new THREE.AmbientLight(0x404040, 3.0);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Add additional directional light from opposite side to reduce shadows
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 2.0);
        directionalLight2.position.set(-5, 3, -5);
        scene.add(directionalLight2);

        // Add point lights for dramatic effect (pink/red theme) - MAX BRIGHTNESS
        const pointLight1 = new THREE.PointLight(0xff006e, 2.0, 15);
        pointLight1.position.set(-3, 2, -2);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xfb5607, 2.0, 12);
        pointLight2.position.set(3, -1, 2);
        scene.add(pointLight2);

        // Add additional point lights for better coverage - MAX BRIGHTNESS
        const pointLight3 = new THREE.PointLight(0xffffff, 1.5, 10);
        pointLight3.position.set(0, 4, 0);
        scene.add(pointLight3);

        const pointLight4 = new THREE.PointLight(0xff6b9d, 1.5, 8);
        pointLight4.position.set(0, -2, 4);
        scene.add(pointLight4);

        // Store blend elements and model
        const blendElements = [];
        let clawCardModel = null;
        let blendMixer = null;
        let blendAnimationActions = new Map();
        let blendClock = new THREE.Clock(); // Dedicated clock for blend animations

        // Load the GLB model
        const loader = new THREE.GLTFLoader();
        loader.load(
            './blend optimum/claw card.glb',
            (gltf) => {
                clawCardModel = gltf.scene;
                
                // Setup animations if they exist
                if (gltf.animations && gltf.animations.length) {
                    blendMixer = new THREE.AnimationMixer(clawCardModel);
                    gltf.animations.forEach((clip, i) => {
                        const action = blendMixer.clipAction(clip);
                        action.clampWhenFinished = true;
                        action.setLoop(THREE.LoopOnce, 1);
                        action.enabled = true;
                        blendAnimationActions.set(i, action);
                    });
                    
                    // Make mixer and actions globally accessible
                    window.blendMixer = blendMixer;
                    window.blendAnimationActions = blendAnimationActions;
                    
                    // Update the scene object with the loaded animation components
                    this.scenes.blend.blendMixer = blendMixer;
                    this.scenes.blend.blendAnimationActions = blendAnimationActions;
                    this.scenes.blend.blendClock = blendClock;
                    
                } else {
                    console.log('❌ No animations found in GLB file');
                }
                
                // Extract and add lights from the GLB scene
                const glbLights = [];
                clawCardModel.traverse((child) => {
                    if (child.isLight) {
                        // Clone the light to avoid issues with scene graph
                        let clonedLight;
                        if (child.isDirectionalLight) {
                            clonedLight = new THREE.DirectionalLight(child.color, child.intensity);
                            clonedLight.position.copy(child.position);
                            clonedLight.target.position.copy(child.target.position);
                            clonedLight.castShadow = child.castShadow;
                        } else if (child.isPointLight) {
                            clonedLight = new THREE.PointLight(child.color, child.intensity, child.distance, child.decay);
                            clonedLight.position.copy(child.position);
                            clonedLight.castShadow = child.castShadow;
                        } else if (child.isSpotLight) {
                            clonedLight = new THREE.SpotLight(child.color, child.intensity, child.distance, child.angle, child.penumbra, child.decay);
                            clonedLight.position.copy(child.position);
                            clonedLight.target.position.copy(child.target.position);
                            clonedLight.castShadow = child.castShadow;
                        } else if (child.isAmbientLight) {
                            clonedLight = new THREE.AmbientLight(child.color, child.intensity);
                        }
                        
                        if (clonedLight) {
                            scene.add(clonedLight);
                            glbLights.push(clonedLight);
                            console.log(`Added ${child.type} from GLB model with intensity ${child.intensity}`);
                        }
                    }
                });
                
                if (glbLights.length > 0) {
                    console.log(`Total lights extracted from GLB: ${glbLights.length}`);
                } else {
                    console.log('No lights found in GLB model');
                }
                
                // Check if mobile device
                const isMobile = window.innerWidth <= 768;
                
                // Scale and position the model based on device
                if (isMobile) {
                    clawCardModel.scale.setScalar(1.0); // Smaller on mobile
                    clawCardModel.position.set(0, -1.8, 0); // Lower position on mobile
                } else {
                    clawCardModel.scale.setScalar(1.5); // Original size on desktop
                    clawCardModel.position.set(0, -1, 0); // Original position on desktop
                }
                
                // Add some rotation
                clawCardModel.rotation.y = Math.PI * 0.25;
                
                scene.add(clawCardModel);
                console.log('Claw card model loaded successfully!');
            },
            (progress) => {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading GLB model:', error);
                
                // Fallback: create a simple card-like object
                const isMobile = window.innerWidth <= 768;
                
                const cardGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.05);
                const cardMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xff006e,
                    transparent: true,
                    opacity: 0.8
                });
                const fallbackCard = new THREE.Mesh(cardGeometry, cardMaterial);
                
                // Position fallback card responsively
                if (isMobile) {
                    fallbackCard.position.set(0, -1.3, 0); // Lower on mobile
                    fallbackCard.scale.setScalar(0.7); // Smaller on mobile
                } else {
                    fallbackCard.position.set(0, -0.5, 0); // Original position
                    fallbackCard.scale.setScalar(1.0); // Original size
                }
                scene.add(fallbackCard);
                blendElements.push({ mesh: fallbackCard, type: 'card' });
            }
        );

        // Create particle system with blend theme
        const particleCount = 500; // Reduced to not overwhelm the model
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            // Positions - spread around the model
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 3 + Math.random() * 2;
            positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
            positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 2;

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
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            });
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);

        camera.position.set(0, 1, 12);
        camera.lookAt(0, 0, 0);

        // Add OrbitControls for mouse interaction
        const controls = new THREE.OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.enablePan = false; // Disable panning to keep focus on model
        controls.minDistance = 1.5;
        controls.maxDistance = 100; // Increased from 50 to 100 for more zoom out
        controls.maxPolarAngle = Math.PI * 0.75; // Limit vertical rotation
        controls.minPolarAngle = Math.PI * 0.25;
        controls.autoRotate = false; // Disabled auto-rotation
        controls.autoRotateSpeed = 0.5; // Slow rotation speed
        controls.target.set(0, 0, 0);
        
        // Ensure canvas can receive mouse events
        canvas.style.pointerEvents = 'auto';
        canvas.style.cursor = 'grab';
        
        // Basic event listeners for cursor feedback
        canvas.addEventListener('mousedown', (e) => {
            canvas.style.cursor = 'grabbing';
        });
        
        canvas.addEventListener('mouseup', (e) => {
            canvas.style.cursor = 'grab';
        });
        
        canvas.addEventListener('mouseleave', (e) => {
            canvas.style.cursor = 'grab';
        });

        // Click detection for playing animations
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let animationState = 'at_start'; // 'at_start', 'playing_forward', 'at_end', 'playing_reverse'
        let savedCameraDistance = 12; // Store the camera distance before animation
        let currentReverseInterval = null; // Store reference to reverse interval
        
        function smoothZoomTo(targetDistance, duration = 1000) {
            const startDistance = camera.position.distanceTo(controls.target);
            const startTime = Date.now();
            
            function animateZoom() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Smooth easing function
                const easeProgress = progress * progress * (3 - 2 * progress);
                
                const currentDistance = startDistance + (targetDistance - startDistance) * easeProgress;
                
                // Update camera position maintaining the same direction
                const direction = camera.position.clone().sub(controls.target).normalize();
                camera.position.copy(controls.target).add(direction.multiplyScalar(currentDistance));
                
                controls.update();
                
                if (progress < 1) {
                    requestAnimationFrame(animateZoom);
                }
            }
            
            animateZoom();
        }
        
        function handleInteraction(event) {
            console.log('🔥 Interaction detected! Event type:', event.type);
            
            // Handle both mouse and touch events
            let clientX, clientY;
            
            if (event.type === 'click') {
                clientX = event.clientX;
                clientY = event.clientY;
                console.log('👆 Mouse click detected');
            } else if (event.type === 'touchend') {
                // Prevent default touch behavior
                event.preventDefault();
                
                // Get touch coordinates from the last touch point
                const touch = event.changedTouches[0];
                clientX = touch.clientX;
                clientY = touch.clientY;
                console.log('📱 Touch tap detected');
            } else {
                console.log('❌ Unknown event type');
                return;
            }
            
            // Calculate mouse position in normalized device coordinates (-1 to +1)
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
            
            // Update the raycaster with the camera and mouse position
            raycaster.setFromCamera(mouse, camera);
            
            // Use a more generous intersection detection
            raycaster.params.Points.threshold = 0.1; // Increase point detection threshold
            raycaster.params.Line.threshold = 1; // Increase line detection threshold
            
            // Check for intersections with the scene
            const intersects = raycaster.intersectObjects(scene.children, true);
            console.log('🎯 Intersection check - found', intersects.length, 'objects');
            
            if (intersects.length > 0) {
                console.log('🔍 First intersected object name:', intersects[0].object.name || 'unnamed');
                
                // Check if the clicked object or its parent has the name "button"
                let clickedObject = intersects[0].object;
                let searchDepth = 0;
                let buttonFound = false;
                
                while (clickedObject && searchDepth < 10) {
                    console.log(`🔍 Checking object depth ${searchDepth}: "${clickedObject.name || 'unnamed'}" (type: ${clickedObject.type})`);
                    
                    // Check ONLY for objects specifically named "button" (case-insensitive)
                    if (clickedObject.name && clickedObject.name.toLowerCase() === 'button') {
                        buttonFound = true;
                        console.log('✅ BUTTON FOUND at depth', searchDepth);
                        break;
                    }
                    clickedObject = clickedObject.parent;
                    searchDepth++;
                }
                
                console.log('🎯 Button search result:', buttonFound);
                
                // Only proceed if we found an object specifically named "button"
                if (buttonFound) {
                    console.log('Button tapped! Current animation state:', animationState);
                    
                    const mixer = blendMixer || window.blendMixer;
                    const actions = blendAnimationActions || window.blendAnimationActions;
                    
                    if (mixer && actions && actions.size > 0) {
                        const duration = Math.max(...Array.from(actions.values()).map(action => action._clip.duration));
                        console.log('Animation duration:', duration);
                        
                        if (animationState === 'at_start') {
                            console.log('Starting forward animation...');
                            // Save current camera distance
                            savedCameraDistance = camera.position.distanceTo(controls.target);
                            
                            // Zoom out to maximum distance smoothly
                            smoothZoomTo(controls.maxDistance, 800);
                            
                            // Play forward from start to end
                            animationState = 'playing_forward';
                            actions.forEach((action) => {
                                action.stop();
                                action.reset();
                                action.setEffectiveWeight(1.0);
                                action.setLoop(THREE.LoopOnce, 1);
                                action.clampWhenFinished = true;
                                action.timeScale = 1.0;
                                action.play();
                            });
                            
                            // Set timer to freeze at last frame and zoom back
                            setTimeout(() => {
                                animationState = 'at_end';
                                console.log('Forward animation completed, state now:', animationState);
                                // Zoom back to saved position
                                smoothZoomTo(savedCameraDistance, 800);
                            }, duration * 1000);
                            
                        } else if (animationState === 'at_end') {
                            console.log('Starting reverse animation...');
                            // Clear any existing reverse interval
                            if (currentReverseInterval) {
                                clearInterval(currentReverseInterval);
                                currentReverseInterval = null;
                            }
                            
                            // Save current camera distance
                            savedCameraDistance = camera.position.distanceTo(controls.target);
                            
                            // Zoom out to maximum distance smoothly
                            smoothZoomTo(controls.maxDistance, 800);
                            
                            // Play reverse from end to start
                            animationState = 'playing_reverse';
                            
                            // Ensure all actions are properly set to end position first
                            actions.forEach((action) => {
                                action.time = action._clip.duration;
                                action.enabled = true;
                            });
                            mixer.update(0); // Force update to apply end position
                            
                            // Start reverse animation with fresh timing
                            const startTime = Date.now();
                            currentReverseInterval = setInterval(() => {
                                const elapsed = (Date.now() - startTime) / 1000;
                                const progress = elapsed / duration;
                                
                                if (progress >= 1.0) {
                                    // Animation complete - set to start position and stop
                                    actions.forEach((action) => {
                                        action.time = 0;
                                        action.enabled = true;
                                    });
                                    mixer.update(0); // Force update to apply position
                                    clearInterval(currentReverseInterval);
                                    currentReverseInterval = null;
                                    animationState = 'at_start';
                                    console.log('Reverse animation completed, state now:', animationState);
                                    
                                    // Zoom back to saved position
                                    smoothZoomTo(savedCameraDistance, 800);
                                    return;
                                }
                                
                                // Update each action's time in reverse (from end to start)
                                actions.forEach((action) => {
                                    action.time = action._clip.duration * (1.0 - progress);
                                    action.enabled = true;
                                });
                                
                                // Force mixer update to apply the time changes
                                mixer.update(0);
                            }, 16); // ~60 FPS
                        } else {
                            console.log('Button tapped while animation is playing. Current state:', animationState);
                        }
                        // Ignore clicks while animations are playing
                    }
                }
                // If no "button" object was clicked, do nothing
            } else {
                console.log('❌ No intersections found - nothing was clicked');
                
                // FALLBACK: If we're at_end state and user tapped but no intersections, 
                // assume they meant to tap the button for reverse animation
                if (animationState === 'at_end') {
                    console.log('🔄 FALLBACK: Triggering reverse animation since we are at_end state');
                    
                    const mixer = blendMixer || window.blendMixer;
                    const actions = blendAnimationActions || window.blendAnimationActions;
                    
                    if (mixer && actions && actions.size > 0) {
                        const duration = Math.max(...Array.from(actions.values()).map(action => action._clip.duration));
                        
                        console.log('🔄 Starting fallback reverse animation...');
                        
                        // Clear any existing reverse interval
                        if (currentReverseInterval) {
                            clearInterval(currentReverseInterval);
                            currentReverseInterval = null;
                        }
                        
                        // Save current camera distance
                        savedCameraDistance = camera.position.distanceTo(controls.target);
                        
                        // Zoom out to maximum distance smoothly
                        smoothZoomTo(controls.maxDistance, 800);
                        
                        // Play reverse from end to start
                        animationState = 'playing_reverse';
                        
                        // Ensure all actions are properly set to end position first
                        actions.forEach((action) => {
                            action.time = action._clip.duration;
                            action.enabled = true;
                        });
                        mixer.update(0); // Force update to apply end position
                        
                        // Start reverse animation with fresh timing
                        const startTime = Date.now();
                        currentReverseInterval = setInterval(() => {
                            const elapsed = (Date.now() - startTime) / 1000;
                            const progress = elapsed / duration;
                            
                            if (progress >= 1.0) {
                                // Animation complete - set to start position and stop
                                actions.forEach((action) => {
                                    action.time = 0;
                                    action.enabled = true;
                                });
                                mixer.update(0); // Force update to apply position
                                clearInterval(currentReverseInterval);
                                currentReverseInterval = null;
                                animationState = 'at_start';
                                console.log('✅ Fallback reverse animation completed, state now:', animationState);
                                
                                // Zoom back to saved position
                                smoothZoomTo(savedCameraDistance, 800);
                                return;
                            }
                            
                            // Update each action's time in reverse (from end to start)
                            actions.forEach((action) => {
                                action.time = action._clip.duration * (1.0 - progress);
                                action.enabled = true;
                            });
                            
                            // Force mixer update to apply the time changes
                            mixer.update(0);
                        }, 16); // ~60 FPS
                    }
                }
            }
        }
        
        // Add both mouse and touch event listeners
        canvas.addEventListener('click', handleInteraction);
        canvas.addEventListener('touchend', handleInteraction, { passive: false });
        
        // Add manual test function for debugging reverse animation
        window.forceReverseAnimation = () => {
            console.log('🚨 FORCING REVERSE ANIMATION MANUALLY');
            const mixer = blendMixer || window.blendMixer;
            const actions = blendAnimationActions || window.blendAnimationActions;
            
            if (mixer && actions && actions.size > 0) {
                animationState = 'at_end'; // Force state to trigger reverse
                console.log('🔧 Set state to at_end, starting manual reverse...');
                
                const duration = Math.max(...Array.from(actions.values()).map(action => action._clip.duration));
                
                // Clear any existing interval
                if (currentReverseInterval) {
                    clearInterval(currentReverseInterval);
                    currentReverseInterval = null;
                }
                
                // Start reverse animation
                animationState = 'playing_reverse';
                
                // Set to end position first
                actions.forEach((action) => {
                    action.time = action._clip.duration;
                    action.enabled = true;
                });
                mixer.update(0);
                console.log('🔧 Set all actions to end position');
                
                // Start reverse
                const startTime = Date.now();
                currentReverseInterval = setInterval(() => {
                    const elapsed = (Date.now() - startTime) / 1000;
                    const progress = elapsed / duration;
                    
                    if (progress >= 1.0) {
                        actions.forEach((action) => {
                            action.time = 0;
                            action.enabled = true;
                        });
                        mixer.update(0);
                        clearInterval(currentReverseInterval);
                        currentReverseInterval = null;
                        animationState = 'at_start';
                        console.log('✅ Manual reverse completed');
                        return;
                    }
                    
                    actions.forEach((action) => {
                        action.time = action._clip.duration * (1.0 - progress);
                        action.enabled = true;
                    });
                    mixer.update(0);
                }, 16);
            } else {
                console.log('❌ No mixer/actions for manual reverse');
            }
        };

        // Create GUI controls for lighting adjustments
        let gui;
        
        console.log('Checking for dat.GUI...', typeof dat);
        
        // Try to create dat.GUI, fall back to console controls if not available
        if (typeof dat !== 'undefined' && dat.GUI) {
            console.log('dat.GUI found, creating control panel...');
            try {
                gui = new dat.GUI();
                gui.domElement.style.position = 'fixed';
                gui.domElement.style.top = '10px';
                gui.domElement.style.right = '10px';
                gui.domElement.style.zIndex = '1000';
                gui.domElement.style.width = '300px';
                console.log('GUI created successfully!');
            } catch (error) {
                console.error('Error creating dat.GUI:', error);
                gui = null;
            }
        } else {
            console.log('dat.GUI not available. Use browser console to adjust lighting:');
            console.log('Example: window.lightSettings.ambientIntensity = 2.0');
            gui = null;
        }
        
        const lightSettings = {
            ambientIntensity: 3.0,
            directionalIntensity: 3.0,
            directional2Intensity: 2.0,
            pointLight1Intensity: 2.0,
            pointLight2Intensity: 2.0,
            pointLight3Intensity: 1.5,
            pointLight4Intensity: 1.5,
            toneMappingExposure: 2.0,
            modelScale: window.innerWidth <= 768 ? 1.0 : 1.5,
            backgroundColor: '#000000',
            particleOpacity: 0.6
        };
        
        // Make settings available globally for console access
        window.lightSettings = lightSettings;
        window.updateBlendLights = () => {
            ambientLight.intensity = lightSettings.ambientIntensity;
            directionalLight.intensity = lightSettings.directionalIntensity;
            directionalLight2.intensity = lightSettings.directional2Intensity;
            pointLight1.intensity = lightSettings.pointLight1Intensity;
            pointLight2.intensity = lightSettings.pointLight2Intensity;
            pointLight3.intensity = lightSettings.pointLight3Intensity;
            pointLight4.intensity = lightSettings.pointLight4Intensity;
            renderer.toneMappingExposure = lightSettings.toneMappingExposure;
            if (clawCardModel) {
                clawCardModel.scale.setScalar(lightSettings.modelScale);
            }
            renderer.setClearColor(lightSettings.backgroundColor);
            particleMaterial.opacity = lightSettings.particleOpacity;
            console.log('Lights updated!');
        };
        
        if (gui) {
            const lightFolder = gui.addFolder('Lighting');
            lightFolder.add(lightSettings, 'ambientIntensity', 0, 3).onChange((value) => {
                ambientLight.intensity = value;
            });
            lightFolder.add(lightSettings, 'directionalIntensity', 0, 3).onChange((value) => {
                directionalLight.intensity = value;
            });
            lightFolder.add(lightSettings, 'directional2Intensity', 0, 3).onChange((value) => {
                directionalLight2.intensity = value;
            });
            lightFolder.add(lightSettings, 'pointLight1Intensity', 0, 3).onChange((value) => {
                pointLight1.intensity = value;
            });
            lightFolder.add(lightSettings, 'pointLight2Intensity', 0, 3).onChange((value) => {
                pointLight2.intensity = value;
            });
            lightFolder.add(lightSettings, 'pointLight3Intensity', 0, 3).onChange((value) => {
                pointLight3.intensity = value;
            });
            lightFolder.add(lightSettings, 'pointLight4Intensity', 0, 3).onChange((value) => {
                pointLight4.intensity = value;
            });
            lightFolder.add(lightSettings, 'toneMappingExposure', 0, 3).onChange((value) => {
                renderer.toneMappingExposure = value;
            });
            lightFolder.open();
            
            const modelFolder = gui.addFolder('Model');
            modelFolder.add(lightSettings, 'modelScale', 0.1, 3).onChange((value) => {
                if (clawCardModel) {
                    clawCardModel.scale.setScalar(value);
                }
            });
            
            const sceneFolder = gui.addFolder('Scene');
            sceneFolder.addColor(lightSettings, 'backgroundColor').onChange((value) => {
                renderer.setClearColor(value);
            });
            sceneFolder.add(lightSettings, 'particleOpacity', 0, 1).onChange((value) => {
                particleMaterial.opacity = value;
            });
            
            // Add preset buttons
            const presets = {
                'Bright': () => {
                    lightSettings.ambientIntensity = 2.0;
                    lightSettings.directionalIntensity = 2.5;
                    lightSettings.directional2Intensity = 1.5;
                    lightSettings.toneMappingExposure = 1.5;
                    window.updateBlendLights();
                    gui.updateDisplay();
                },
                'Dramatic': () => {
                    lightSettings.ambientIntensity = 0.8;
                    lightSettings.directionalIntensity = 2.0;
                    lightSettings.pointLight1Intensity = 1.5;
                    lightSettings.pointLight2Intensity = 1.2;
                    lightSettings.toneMappingExposure = 1.2;
                    window.updateBlendLights();
                    gui.updateDisplay();
                },
                'Soft': () => {
                    lightSettings.ambientIntensity = 1.8;
                    lightSettings.directionalIntensity = 1.0;
                    lightSettings.directional2Intensity = 1.0;
                    lightSettings.toneMappingExposure = 0.8;
                    window.updateBlendLights();
                    gui.updateDisplay();
                }
            };
            
            Object.keys(presets).forEach(presetName => {
                sceneFolder.add(presets, presetName);
            });
        } else {
            // Create a simple HTML control panel as fallback
            console.log('Creating HTML fallback controls...');
            gui = this.createHTMLControls(lightSettings, ambientLight, directionalLight, directionalLight2, pointLight1, pointLight2, pointLight3, pointLight4, renderer, particleMaterial, clawCardModel);
        }

        this.scenes.blend = { scene, camera, renderer, particleSystem, velocities, blendElements, clawCardModel, pointLight1, pointLight2, pointLight3, pointLight4, controls, blendMixer, blendAnimationActions, blendClock, gui };
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
        
        const { scene, camera, renderer, particleSystem, velocities, controls, blendMixer } = this.scenes.blend;
        
        const positions = particleSystem.geometry.attributes.position.array;
        const colors = particleSystem.geometry.attributes.color.array;
        
        for (let i = 0; i < velocities.length; i++) {
            // Update positions
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;
            
            // Boundary checks (smaller boundaries to keep particles around the model)
            if (Math.abs(positions[i * 3]) > 6) velocities[i].x *= -1;
            if (Math.abs(positions[i * 3 + 1]) > 6) velocities[i].y *= -1;
            if (Math.abs(positions[i * 3 + 2]) > 6) velocities[i].z *= -1;
            
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
        
        // Update animation mixer - try multiple sources to ensure we get it
        const sceneBlendMixer = this.scenes.blend?.blendMixer;
        const globalBlendMixer = blendMixer || window.blendMixer;
        const activeMixer = sceneBlendMixer || globalBlendMixer;
        
        if (activeMixer) {
            const delta = this.scenes.blend?.blendClock ? this.scenes.blend.blendClock.getDelta() : this.artisticClock.getDelta();
            activeMixer.update(delta);
        }
        
        // Update controls instead of manual camera rotation
        if (controls) {
            controls.update();
        }

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
    
    createHTMLControls(lightSettings, ambientLight, directionalLight, directionalLight2, pointLight1, pointLight2, pointLight3, pointLight4, renderer, particleMaterial, clawCardModel) {
        // Create HTML control panel
        const controlPanel = document.createElement('div');
        controlPanel.id = 'blend-controls';
        controlPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 1000;
            max-width: 250px;
            border: 1px solid #333;
        `;
        
        controlPanel.innerHTML = `
            <h3 style="margin-top: 0; color: #ff006e;">Blend Scene Controls</h3>
            
            <div style="margin-bottom: 10px;">
                <label>Ambient Light: <span id="ambient-value">1.2</span></label><br>
                <input type="range" id="ambient-slider" min="0" max="3" step="0.1" value="1.2" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 10px;">
                <label>Directional Light: <span id="directional-value">1.5</span></label><br>
                <input type="range" id="directional-slider" min="0" max="3" step="0.1" value="1.5" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 10px;">
                <label>Secondary Light: <span id="directional2-value">0.8</span></label><br>
                <input type="range" id="directional2-slider" min="0" max="3" step="0.1" value="0.8" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 10px;">
                <label>Point Light 1: <span id="point1-value">1.0</span></label><br>
                <input type="range" id="point1-slider" min="0" max="3" step="0.1" value="1.0" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 10px;">
                <label>Exposure: <span id="exposure-value">1.0</span></label><br>
                <input type="range" id="exposure-slider" min="0" max="3" step="0.1" value="1.0" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 10px;">
                <label>Model Scale: <span id="scale-value">${lightSettings.modelScale}</span></label><br>
                <input type="range" id="scale-slider" min="0.1" max="3" step="0.1" value="${lightSettings.modelScale}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <button id="preset-bright" style="margin-right: 5px; padding: 5px; background: #ff006e; color: white; border: none; border-radius: 4px; cursor: pointer;">Bright</button>
                <button id="preset-dramatic" style="margin-right: 5px; padding: 5px; background: #fb5607; color: white; border: none; border-radius: 4px; cursor: pointer;">Dramatic</button>
                <button id="preset-soft" style="padding: 5px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Soft</button>
            </div>
            
            <div style="text-align: center;">
                <button id="close-controls" style="padding: 5px 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
            </div>
        `;
        
        document.body.appendChild(controlPanel);
        
        // Add event listeners
        const setupSlider = (sliderId, valueId, property, target, callback) => {
            const slider = document.getElementById(sliderId);
            const valueDisplay = document.getElementById(valueId);
            
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                lightSettings[property] = value;
                valueDisplay.textContent = value.toFixed(1);
                if (callback) callback(value);
                else if (target) target[property] = value;
            });
        };
        
        setupSlider('ambient-slider', 'ambient-value', 'ambientIntensity', null, (value) => {
            ambientLight.intensity = value;
        });
        
        setupSlider('directional-slider', 'directional-value', 'directionalIntensity', null, (value) => {
            directionalLight.intensity = value;
        });
        
        setupSlider('directional2-slider', 'directional2-value', 'directional2Intensity', null, (value) => {
            directionalLight2.intensity = value;
        });
        
        setupSlider('point1-slider', 'point1-value', 'pointLight1Intensity', null, (value) => {
            pointLight1.intensity = value;
        });
        
        setupSlider('exposure-slider', 'exposure-value', 'toneMappingExposure', null, (value) => {
            renderer.toneMappingExposure = value;
        });
        
        setupSlider('scale-slider', 'scale-value', 'modelScale', null, (value) => {
            if (clawCardModel) {
                clawCardModel.scale.setScalar(value);
            }
        });
        
        // Preset buttons
        document.getElementById('preset-bright').addEventListener('click', () => {
            this.applyPreset('bright', lightSettings, ambientLight, directionalLight, directionalLight2, pointLight1, renderer, controlPanel);
        });
        
        document.getElementById('preset-dramatic').addEventListener('click', () => {
            this.applyPreset('dramatic', lightSettings, ambientLight, directionalLight, directionalLight2, pointLight1, renderer, controlPanel);
        });
        
        document.getElementById('preset-soft').addEventListener('click', () => {
            this.applyPreset('soft', lightSettings, ambientLight, directionalLight, directionalLight2, pointLight1, renderer, controlPanel);
        });
        
        document.getElementById('close-controls').addEventListener('click', () => {
            controlPanel.remove();
        });
        
        return { domElement: controlPanel };
    }
    
    applyPreset(preset, lightSettings, ambientLight, directionalLight, directionalLight2, pointLight1, renderer, controlPanel) {
        let settings;
        
        switch(preset) {
            case 'bright':
                settings = { ambient: 2.0, directional: 2.5, directional2: 1.5, point1: 1.0, exposure: 1.5 };
                break;
            case 'dramatic':
                settings = { ambient: 0.8, directional: 2.0, directional2: 0.5, point1: 1.5, exposure: 1.2 };
                break;
            case 'soft':
                settings = { ambient: 1.8, directional: 1.0, directional2: 1.0, point1: 0.6, exposure: 0.8 };
                break;
        }
        
        // Apply settings
        ambientLight.intensity = settings.ambient;
        directionalLight.intensity = settings.directional;
        directionalLight2.intensity = settings.directional2;
        pointLight1.intensity = settings.point1;
        renderer.toneMappingExposure = settings.exposure;
        
        // Update sliders and displays
        document.getElementById('ambient-slider').value = settings.ambient;
        document.getElementById('ambient-value').textContent = settings.ambient.toFixed(1);
        document.getElementById('directional-slider').value = settings.directional;
        document.getElementById('directional-value').textContent = settings.directional.toFixed(1);
        document.getElementById('directional2-slider').value = settings.directional2;
        document.getElementById('directional2-value').textContent = settings.directional2.toFixed(1);
        document.getElementById('point1-slider').value = settings.point1;
        document.getElementById('point1-value').textContent = settings.point1.toFixed(1);
        document.getElementById('exposure-slider').value = settings.exposure;
        document.getElementById('exposure-value').textContent = settings.exposure.toFixed(1);
        
        console.log(`Applied ${preset} preset`);
    }
    
    createLightingControls() {
        // Create immediate lighting controls - no waiting for scene creation
        const controlPanel = document.createElement('div');
        controlPanel.id = 'lighting-controls';
        controlPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 9999;
            width: 280px;
            border: 2px solid #ff006e;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;
        
        controlPanel.innerHTML = `
            <h3 style="margin-top: 0; color: #ff006e; text-align: center;">🎨 LIGHTING CONTROLS</h3>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">🌟 Ambient Light: <span id="ambient-val" style="color: #ff006e;">3.0</span></label>
                <input type="range" id="ambient-ctrl" min="0" max="5" step="0.1" value="3.0" style="width: 100%; height: 8px;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">☀️ Main Light: <span id="main-val" style="color: #ff006e;">3.0</span></label>
                <input type="range" id="main-ctrl" min="0" max="5" step="0.1" value="3.0" style="width: 100%; height: 8px;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">💡 Fill Light: <span id="fill-val" style="color: #ff006e;">2.0</span></label>
                <input type="range" id="fill-ctrl" min="0" max="5" step="0.1" value="2.0" style="width: 100%; height: 8px;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">🔥 Accent Light: <span id="accent-val" style="color: #ff006e;">2.0</span></label>
                <input type="range" id="accent-ctrl" min="0" max="5" step="0.1" value="2.0" style="width: 100%; height: 8px;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">📸 Exposure: <span id="exposure-val" style="color: #ff006e;">2.0</span></label>
                <input type="range" id="exposure-ctrl" min="0" max="3" step="0.1" value="2.0" style="width: 100%; height: 8px;">
            </div>
            
            <div style="margin-bottom: 20px; text-align: center;">
                <button id="bright-btn" style="margin: 5px; padding: 8px 12px; background: #ff006e; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">🔥 BRIGHT</button>
                <button id="dramatic-btn" style="margin: 5px; padding: 8px 12px; background: #fb5607; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">🎭 DRAMATIC</button>
                <button id="soft-btn" style="margin: 5px; padding: 8px 12px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">😎 SOFT</button>
            </div>
            
            <div style="text-align: center;">
                <button id="close-btn" style="padding: 8px 15px; background: #333; color: white; border: none; border-radius: 5px; cursor: pointer;">❌ Close</button>
            </div>
        `;
        
        document.body.appendChild(controlPanel);
        
        // Add event listeners that work immediately
        const updateValue = (controllerId, valueId, callback) => {
            const control = document.getElementById(controllerId);
            const valueSpan = document.getElementById(valueId);
            
            control.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueSpan.textContent = value.toFixed(1);
                callback(value);
            });
        };
        
        updateValue('ambient-ctrl', 'ambient-val', (value) => {
            if (this.scenes.blend && this.scenes.blend.scene) {
                const ambientLight = this.scenes.blend.scene.children.find(child => child.type === 'AmbientLight');
                if (ambientLight) ambientLight.intensity = value;
            }
        });
        
        updateValue('main-ctrl', 'main-val', (value) => {
            if (this.scenes.blend && this.scenes.blend.scene) {
                const directionalLight = this.scenes.blend.scene.children.find(child => child.type === 'DirectionalLight');
                if (directionalLight) directionalLight.intensity = value;
            }
        });
        
        updateValue('fill-ctrl', 'fill-val', (value) => {
            if (this.scenes.blend && this.scenes.blend.scene) {
                const directionalLights = this.scenes.blend.scene.children.filter(child => child.type === 'DirectionalLight');
                if (directionalLights[1]) directionalLights[1].intensity = value;
            }
        });
        
        updateValue('accent-ctrl', 'accent-val', (value) => {
            if (this.scenes.blend && this.scenes.blend.scene) {
                const pointLight = this.scenes.blend.scene.children.find(child => child.type === 'PointLight');
                if (pointLight) pointLight.intensity = value;
            }
        });
        
        updateValue('exposure-ctrl', 'exposure-val', (value) => {
            if (this.scenes.blend && this.scenes.blend.renderer) {
                this.scenes.blend.renderer.toneMappingExposure = value;
            }
        });
        
        // Preset buttons
        document.getElementById('bright-btn').addEventListener('click', () => {
            document.getElementById('ambient-ctrl').value = 3.0;
            document.getElementById('main-ctrl').value = 3.0;
            document.getElementById('fill-ctrl').value = 2.0;
            document.getElementById('accent-ctrl').value = 2.0;
            document.getElementById('exposure-ctrl').value = 2.0;
            
            // Trigger change events
            ['ambient-ctrl', 'main-ctrl', 'fill-ctrl', 'accent-ctrl', 'exposure-ctrl'].forEach(id => {
                document.getElementById(id).dispatchEvent(new Event('input'));
            });
        });
        
        document.getElementById('dramatic-btn').addEventListener('click', () => {
            document.getElementById('ambient-ctrl').value = 0.5;
            document.getElementById('main-ctrl').value = 2.5;
            document.getElementById('fill-ctrl').value = 0.3;
            document.getElementById('accent-ctrl').value = 2.0;
            document.getElementById('exposure-ctrl').value = 1.5;
            
            // Trigger change events
            ['ambient-ctrl', 'main-ctrl', 'fill-ctrl', 'accent-ctrl', 'exposure-ctrl'].forEach(id => {
                document.getElementById(id).dispatchEvent(new Event('input'));
            });
        });
        
        document.getElementById('soft-btn').addEventListener('click', () => {
            document.getElementById('ambient-ctrl').value = 2.5;
            document.getElementById('main-ctrl').value = 1.5;
            document.getElementById('fill-ctrl').value = 1.5;
            document.getElementById('accent-ctrl').value = 1.0;
            document.getElementById('exposure-ctrl').value = 1.2;
            
            // Trigger change events
            ['ambient-ctrl', 'main-ctrl', 'fill-ctrl', 'accent-ctrl', 'exposure-ctrl'].forEach(id => {
                document.getElementById(id).dispatchEvent(new Event('input'));
            });
        });
        
        document.getElementById('close-btn').addEventListener('click', () => {
            controlPanel.remove();
        });
        
        console.log('🎨 LIGHTING CONTROLS CREATED AND VISIBLE!');
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