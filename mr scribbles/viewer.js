// 3D Model Viewer - Generated from Scene Export
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene Data (exported from your scene)
const SCENE_DATA = {
  "camera": {
    "fov": 75,
    "near": 0.01,
    "far": 1510.076887276399,
    "position": {
      "x": -1.2750409537646115,
      "y": 1.0295902327787947,
      "z": -3.792924147970236
    },
    "target": {
      "x": -0.07883052271716412,
      "y": 0.3360704559867562,
      "z": 0.8871007370289408
    },
    "quaternion": {
      "x": 0.008890133252373415,
      "y": 0.9896618026834797,
      "z": 0.07068126777679389,
      "w": -0.12447746874637781
    }
  },
  "keyframes": [
    {
      "index": 1,
      "position": {
        "x": -1.2817197670010732,
        "y": 4.92574530816598,
        "z": -2.713385126243671
      },
      "target": {
        "x": -0.19222678091840356,
        "y": 4.92574530816598,
        "z": 0.9062142346788523
      },
      "zoom": 3.7800125000208755,
      "fov": 75,
      "near": 0.01,
      "far": 1510.076887276399,
      "quaternion": {
        "x": 0,
        "y": 0.9893338167547585,
        "z": 0,
        "w": -0.14566605309907235
      },
      "duration": 1200,
      "modelAnimTime": 0
    },
    {
      "index": 2,
      "position": {
        "x": -1.0497150855104285,
        "y": 0.19841902329339658,
        "z": -2.7832181319646305
      },
      "target": {
        "x": 0.03977798683770295,
        "y": 0.19841902329339636,
        "z": 0.8363812029921417
      },
      "zoom": 3.780012500020877,
      "fov": 75,
      "near": 0.01,
      "far": 1510.076887276399,
      "quaternion": {
        "x": 4.27834085587703e-18,
        "y": 0.989333815018938,
        "z": 2.9057607097018964e-17,
        "w": -0.14566606488840733
      },
      "duration": 1200,
      "modelAnimTime": 0
    },
    {
      "index": 3,
      "position": {
        "x": -1.2750409537646117,
        "y": 1.029590232778795,
        "z": -3.7929241479702367
      },
      "target": {
        "x": -0.07883052271716412,
        "y": 0.3360704559867562,
        "z": 0.8871007370289408
      },
      "zoom": 4.880012500020872,
      "fov": 75,
      "near": 0.01,
      "far": 1510.076887276399,
      "quaternion": {
        "x": 0.00889013325237342,
        "y": 0.9896618026834798,
        "z": 0.0706812677767939,
        "w": -0.1244774687463778
      },
      "duration": 2000,
      "modelAnimTime": 0
    }
  ],
  "lighting": {
    "hemisphere": {
      "intensity": 1.2,
      "color": 16777215,
      "groundColor": 8947848
    },
    "directional": {
      "intensity": 0.8,
      "color": 16777215
    }
  },
  "background": 0,
  "settings": {
    "animationSpeed": 1200,
    "autoPlayCamera": false,
    "autoPlayModel": false
  },
  "deviceTarget": "universal"
};

// Model file to load automatically
const MODEL_FILE = 'halloween_potion.glb';

// Global variables
let scene, camera, renderer, controls, model;
let mixer = null;
let clock = new THREE.Clock();
let gltfClips = [];
let animationActions = new Map();
let animating = false;
let animFrame = null;

// Initialize the viewer
function init() {
    // Device optimization based on target
    const deviceTarget = SCENE_DATA.deviceTarget || 'universal';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Show device info
    document.getElementById('deviceInfo').textContent = 
        `Optimized for: ${deviceTarget === 'desktop' ? '🖥️ Desktop' : 
        deviceTarget === 'mobile' ? '📱 Mobile' : '🔄 Universal'}`;
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_DATA.background);

    // Camera setup with device-specific optimizations
    camera = new THREE.PerspectiveCamera(
        SCENE_DATA.camera.fov,
        window.innerWidth / window.innerHeight,
        SCENE_DATA.camera.near,
        SCENE_DATA.camera.far
    );
    camera.position.set(
        SCENE_DATA.camera.position.x,
        SCENE_DATA.camera.position.y,
        SCENE_DATA.camera.position.z
    );
    camera.quaternion.set(
        SCENE_DATA.camera.quaternion.x,
        SCENE_DATA.camera.quaternion.y,
        SCENE_DATA.camera.quaternion.z,
        SCENE_DATA.camera.quaternion.w
    );

    // Renderer setup with device-specific settings
    const rendererOptions = { antialias: true };
    
    // Adjust quality based on device target
    let pixelRatio = window.devicePixelRatio;
    if (deviceTarget === 'mobile' || (deviceTarget === 'universal' && isMobile)) {
        pixelRatio = Math.min(pixelRatio, 2); // Limit for mobile performance
    } else if (deviceTarget === 'desktop') {
        pixelRatio = Math.min(pixelRatio, 3); // Higher quality for desktop
    }
    
    renderer = new THREE.WebGLRenderer(rendererOptions);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = true;
    document.body.appendChild(renderer.domElement);

    // Environment
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
    scene.environment = envTex;

    // Lighting
    if (SCENE_DATA.lighting.hemisphere) {
        const hemiLight = new THREE.HemisphereLight(
            SCENE_DATA.lighting.hemisphere.color,
            SCENE_DATA.lighting.hemisphere.groundColor,
            SCENE_DATA.lighting.hemisphere.intensity
        );
        hemiLight.position.set(0, 20, 0);
        scene.add(hemiLight);
    }

    if (SCENE_DATA.lighting.directional) {
        const dirLight = new THREE.DirectionalLight(
            SCENE_DATA.lighting.directional.color,
            SCENE_DATA.lighting.directional.intensity
        );
        dirLight.position.set(3, 10, 10);
        scene.add(dirLight);
    }

    // Controls with device-specific settings
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(
        SCENE_DATA.camera.target.x,
        SCENE_DATA.camera.target.y,
        SCENE_DATA.camera.target.z
    );
    
    // Device-specific control optimizations (reuse deviceTarget from above)
    if (deviceTarget === 'mobile' || (deviceTarget === 'universal' && isMobile)) {
        // Mobile optimizations
        controls.enablePan = true; // Touch panning
        controls.enableZoom = true; // Pinch zoom
        controls.enableRotate = true; // Touch rotation
        controls.rotateSpeed = 0.8; // Slightly slower for touch
        controls.zoomSpeed = 1.2; // Faster zoom for touch
        controls.panSpeed = 1.0;
        controls.autoRotate = false;
        controls.autoRotateSpeed = 2.0;
        
        // Mobile-specific limits
        controls.minDistance = 0.5;
        controls.maxDistance = 50;
        controls.maxPolarAngle = Math.PI; // Allow full rotation
        
    } else if (deviceTarget === 'desktop') {
        // Desktop optimizations
        controls.enablePan = true; // Right-click panning
        controls.enableZoom = true; // Mouse wheel zoom
        controls.enableRotate = true; // Mouse rotation
        controls.rotateSpeed = 1.0; // Standard speed
        controls.zoomSpeed = 1.0;
        controls.panSpeed = 1.0;
        controls.autoRotate = false;
        
        // Desktop-specific limits
        controls.minDistance = 0.1;
        controls.maxDistance = 100;
        controls.maxPolarAngle = Math.PI;
        
    } else {
        // Universal - adaptive settings
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.rotateSpeed = isMobile ? 0.8 : 1.0;
        controls.zoomSpeed = isMobile ? 1.2 : 1.0;
        controls.panSpeed = 1.0;
        controls.autoRotate = false;
        
        controls.minDistance = isMobile ? 0.5 : 0.1;
        controls.maxDistance = isMobile ? 50 : 100;
        controls.maxPolarAngle = Math.PI;
    }
    
    controls.update();

    // Setup drag and drop (as fallback)
    setupDragAndDrop();
    
    // Setup controls
    setupControls();

    // Try to load the included model first
    tryLoadIncludedModel();

    // Start animation loop
    animate();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (mixer) mixer.update(clock.getDelta());
    renderer.render(scene, camera);
}

// Try to load the model that was included with the export
async function tryLoadIncludedModel() {
    try {
        const response = await fetch(MODEL_FILE);
        if (response.ok) {
            const blob = await response.blob();
            const file = new File([blob], MODEL_FILE);
            loadModelFromFile(file);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('dropZone').classList.add('hidden');
            document.getElementById('controls').style.display = 'flex';
            return;
        }
    } catch (e) {
        console.log('Included model not found, showing drop zone');
    }
    
    // If included model fails, show drop zone and hide loading
    document.getElementById('loading').style.display = 'none';
    document.getElementById('dropZone').classList.remove('hidden');
}

// Load 3D model from file
function loadModelFromFile(file) {
    if (model) {
        scene.remove(model);
        if (mixer) mixer.stopAllActions();
    }

    const loader = new GLTFLoader();
    
    // Setup additional loaders
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
    loader.setDRACOLoader(dracoLoader);

    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/');
    ktx2Loader.detectSupport(renderer);
    loader.setKTX2Loader(ktx2Loader);

    loader.setMeshoptDecoder(MeshoptDecoder);

    const reader = new FileReader();
    reader.onload = function(e) {
        loader.parse(e.target.result, '', function(gltf) {
            model = gltf.scene;
            
            // Setup animations
            if (gltf.animations && gltf.animations.length) {
                gltfClips = gltf.animations;
                mixer = new THREE.AnimationMixer(model);
                gltfClips.forEach((clip, i) => {
                    const action = mixer.clipAction(clip);
                    action.clampWhenFinished = true;
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.enabled = true;
                    animationActions.set(i, action);
                });
            }

            // Center model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            scene.add(model);

            // Fit camera if no keyframes
            if (SCENE_DATA.keyframes.length === 0) {
                fitCameraToModel();
            }

            // Hide drop zone and show controls
            document.getElementById('dropZone').classList.add('hidden');
            document.getElementById('controls').style.display = 'flex';
            
        }, function(error) {
            console.error('Error loading model:', error);
            alert('Error loading 3D model. Please check the file format.');
        });
    };
    reader.readAsArrayBuffer(file);
}

// Camera animation functions
function playCamera() {
    if (SCENE_DATA.keyframes.length < 2) {
        alert('No camera animation available');
        return;
    }
    animateKeyframes(SCENE_DATA.keyframes);
}

function playBoth() {
    if (SCENE_DATA.keyframes.length < 2) {
        alert('No camera animation available');
        return;
    }
    
    // Start camera animation
    animateKeyframes(SCENE_DATA.keyframes);
    
    // Start model animations
    if (mixer && gltfClips.length > 0) {
        gltfClips.forEach((_, i) => {
            const action = animationActions.get(i);
            if (action) {
                action.reset();
                action.paused = false;
                action.play();
            }
        });
    }
}

function stopAnimations() {
    if (animFrame) {
        cancelAnimationFrame(animFrame);
        animFrame = null;
    }
    animating = false;
    
    if (animationActions.size > 0) {
        animationActions.forEach(action => action.stop());
    }
}

function resetView() {
    camera.position.set(
        SCENE_DATA.camera.position.x,
        SCENE_DATA.camera.position.y,
        SCENE_DATA.camera.position.z
    );
    controls.target.set(
        SCENE_DATA.camera.target.x,
        SCENE_DATA.camera.target.y,
        SCENE_DATA.camera.target.z
    );
    controls.update();
    stopAnimations();
}

// Animation helper functions
function lerpVec3(a, b, t) {
    return new THREE.Vector3(
        a.x + (b.x - a.x) * t,
        a.y + (b.y - a.y) * t,
        a.z + (b.z - a.z) * t
    );
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function slerpQuat(a, b, t) {
    return a.clone().slerp(b, t);
}

function animateKeyframes(keyframes) {
    if (animating || keyframes.length < 2) return;
    animating = true;
    let i = 0;
    
    function animateToNext() {
        if (i >= keyframes.length - 1) {
            animating = false;
            return;
        }
        
        const start = keyframes[i];
        const end = keyframes[i + 1];
        const duration = end.duration || 1200;
        const startTime = performance.now();
        
        function step(now) {
            let t = Math.min((now - startTime) / duration, 1);
            
            // Interpolate camera properties
            const newTarget = lerpVec3(
                new THREE.Vector3(start.target.x, start.target.y, start.target.z),
                new THREE.Vector3(end.target.x, end.target.y, end.target.z),
                t
            );
            const newZoom = lerp(start.zoom, end.zoom, t);
            const newFov = lerp(start.fov, end.fov, t);
            const newNear = lerp(start.near, end.near, t);
            const newFar = lerp(start.far, end.far, t);
            
            controls.target.copy(newTarget);
            
            // Spherical interpolation for camera position
            const startOffset = new THREE.Vector3(start.position.x, start.position.y, start.position.z).sub(newTarget);
            const endOffset = new THREE.Vector3(end.position.x, end.position.y, end.position.z).sub(newTarget);
            const startSph = new THREE.Spherical().setFromVector3(startOffset);
            const endSph = new THREE.Spherical().setFromVector3(endOffset);
            const theta = lerp(startSph.theta, endSph.theta, t);
            const phi = lerp(startSph.phi, endSph.phi, t);
            const sph = new THREE.Spherical(newZoom, phi, theta);
            const newOffset = new THREE.Vector3().setFromSpherical(sph);
            camera.position.copy(newTarget.clone().add(newOffset));
            
            // Interpolate camera rotation
            const startQuat = new THREE.Quaternion(start.quaternion.x, start.quaternion.y, start.quaternion.z, start.quaternion.w);
            const endQuat = new THREE.Quaternion(end.quaternion.x, end.quaternion.y, end.quaternion.z, end.quaternion.w);
            const newQuat = slerpQuat(startQuat, endQuat, t);
            camera.quaternion.copy(newQuat);
            
            // Update camera properties
            camera.fov = newFov;
            camera.near = newNear;
            camera.far = newFar;
            camera.updateProjectionMatrix();
            controls.update();
            
            if (t < 1) {
                animFrame = requestAnimationFrame(step);
            } else {
                i++;
                animateToNext();
            }
        }
        animFrame = requestAnimationFrame(step);
    }
    animateToNext();
}

// Fit camera to model
function fitCameraToModel() {
    if (!model) return;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 2.2;
    camera.position.set(0, 0, cameraZ);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.minDistance = Math.max(0.01, maxDim * 0.2);
    controls.maxDistance = cameraZ * 50;
    controls.update();
    camera.far = cameraZ * 200;
    camera.updateProjectionMatrix();
}

// Setup drag and drop (fallback if no model included)
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight(e) {
        dropZone.classList.add('drag-over');
    }
    
    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            if (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf')) {
                loadModelFromFile(file);
            } else {
                alert('Please drop a GLB or GLTF file');
            }
        }
    }
}

// Setup control buttons
function setupControls() {
    document.getElementById('playCamera').addEventListener('click', playCamera);
    document.getElementById('playBoth').addEventListener('click', playBoth);
    document.getElementById('stop').addEventListener('click', stopAnimations);
    document.getElementById('reset').addEventListener('click', resetView);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

// Initialize when page loads
init();