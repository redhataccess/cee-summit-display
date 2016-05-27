import THREE from 'three';
import map from 'lodash/map';

const MAX_PARTICLE_COUNT = 1000;
const ALIVE              = 1;
const DEAD               = 0;

const COLOR_BUCKET = [
    new THREE.Color(0x990000),
    new THREE.Color(0xCFE2F3),
    new THREE.Color(0x666666),
    new THREE.Color(0xF1C232),
    new THREE.Color(0x134F5C),
    new THREE.Color(0x000000),
    new THREE.Color(0xCC0000),
    new THREE.Color(0x76A5AF),
    new THREE.Color(0xE5E310),
    new THREE.Color(0x76E0EE),
];

const GROUP_COLORS = {};

let HEIGHT;
let WIDTH;

let camera;
let scene;
let renderer;
let particleGeometry;
let particleSystem;
let timescale;
let uniforms;
let clock;

let particleCount = 0;

function initParticles() {
    const textureLoader = new THREE.TextureLoader();
    const nodeTexture = textureLoader.load('./client/img/particle.png');

    uniforms = {
        texture: {
            type : 't',
            value : nodeTexture,
        },
        size: { type : 'f', value : 15 },
    };

    const shaderMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader:   document.getElementById('point-vert').textContent,
        fragmentShader: document.getElementById('point-frag').textContent,
        // blending:       THREE.NoBlending,
        // depthTest:      false,
        transparent:    true,
    });

    particleGeometry = new THREE.BufferGeometry();
    window.particleGeometry = particleGeometry;

    const alive        = new Float32Array(MAX_PARTICLE_COUNT);
    const positions    = new Float32Array(MAX_PARTICLE_COUNT * 3);
    const colors       = new Float32Array(MAX_PARTICLE_COUNT * 3);
    const timers       = new Float32Array(MAX_PARTICLE_COUNT);
    const rotating     = new Float32Array(MAX_PARTICLE_COUNT);

    particleGeometry.addAttribute('alive', new THREE.BufferAttribute(alive, 1));
    particleGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.addAttribute('timer', new THREE.BufferAttribute(timers, 1));
    particleGeometry.addAttribute('rotating', new THREE.BufferAttribute(rotating, 1));

    particleSystem = new THREE.Points(particleGeometry, shaderMaterial);

    scene.add(particleSystem);
}

function updateParticleTimer(v, i, a) {
    let newTime;
    if (v !== 0) {
        newTime = v - timescale;
        if (newTime <= 0) {
            newTime = 0;
            particleSystem.geometry.attributes.alive.array[i] = DEAD;
        }
    }
    a[i] = newTime;
}

function updateParticleTimers() {
    const arr = particleGeometry.attributes.timer.array;
    let i = 0;
    const l = arr.length;
    while (i < l && particleGeometry.attributes.alive.array[i] === ALIVE) {
        arr[i] += 1;
        i++;
    }
}

function spinRandomParticle() {
    const i = Math.floor(Math.random() * particleCount);
    particleGeometry.attributes.rotating.array[i] = particleGeometry.attributes.timer.array[i];
}
window.spinRandomParticle = spinRandomParticle;

function updateParticles() {
    updateParticleTimers();

    particleGeometry.attributes.alive.needsUpdate = true;
    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.timer.needsUpdate = true;
    particleGeometry.attributes.color.needsUpdate = true;
    particleGeometry.attributes.rotating.needsUpdate = true;
}

function getColor(group) {
    const color = GROUP_COLORS[group] || COLOR_BUCKET.shift();
    GROUP_COLORS[group] = color;
    return color;
}

function moveNode(node, pos) {
    const x  = pos.x * 20;
    const y  = pos.y * 20;
    const i3 = node.id * 3;
    particleSystem.geometry.attributes.position.array[i3 + 0] = x;
    particleSystem.geometry.attributes.position.array[i3 + 1] = y;
    particleSystem.geometry.attributes.position.array[i3 + 2] = 1;
}

function createNode(node, pos) {
    const color = getColor(node.data.group);
    const i3 = node.id * 3;
    particleSystem.geometry.attributes.alive.array[node.id] = ALIVE;
    particleSystem.geometry.attributes.color.array[i3 + 0] = color.r;
    particleSystem.geometry.attributes.color.array[i3 + 1] = color.g;
    particleSystem.geometry.attributes.color.array[i3 + 2] = color.b;
    particleCount += 1;
    moveNode(node, pos);
    return { node, pos };
}

function addNode(node, pos) {
    return createNode(node, pos);
}

function nodeExists(id) {
    return particleSystem.geometry.attributes.alive.array[id];
}

function updateNode(node, p) {
    if (!nodeExists(node.id)) {
        addNode(node, p);
    }
    else {
        moveNode(node, p);
    }
}

function updateTimescale() {
    timescale = clock.getDelta();
}

function updateWindowSize() {
    HEIGHT      = window.innerHeight;
    WIDTH       = window.innerWidth;
}

function onWindowResize() {
    updateWindowSize();

    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();

    renderer.setSize(WIDTH, HEIGHT);
}

function updateCamera() {
    const ta = 0.9;
    // const ta = 0.999;
    const tb = 1 - ta;
    particleGeometry.computeBoundingBox();
    const x = (particleGeometry.boundingBox.max.x + particleGeometry.boundingBox.min.x) / 2;
    const y = (particleGeometry.boundingBox.max.y + particleGeometry.boundingBox.min.y) / 2;
    const width = particleGeometry.boundingBox.max.x - particleGeometry.boundingBox.min.x;
    const height = particleGeometry.boundingBox.max.y - particleGeometry.boundingBox.min.y;
    const aspect = WIDTH / HEIGHT;
    const padded_height = height + 80;
    const padded_width  = width + 80;
    const z_denom = ( 2 * Math.tan( camera.fov * Math.PI / 360 ) )
    const z_h = padded_height / z_denom;
    const z_w = padded_width / (aspect * z_denom);
    const z = Math.max(z_h, z_w);

    updateCamera.target_x = x;
    updateCamera.target_y = y;
    updateCamera.target_z = z;

    camera.position.x = ta * camera.position.x + tb * updateCamera.target_x;
    camera.position.y = ta * camera.position.y + tb * updateCamera.target_y;
    camera.position.z = ta * camera.position.z + tb * updateCamera.target_z;
    camera.updateProjectionMatrix();
}
updateCamera.target_x = 0;
updateCamera.target_y = 0;
updateCamera.target_z = 0;

function animate() {
    requestAnimationFrame(animate);

    updateTimescale();

    updateParticles();

    updateCamera();

    renderer.render(scene, camera);
}

function init() {
    // camera

    updateWindowSize();

    camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 1, 1000);
    camera.position.z = 40;
    window.camera = camera;

    // clock

    clock = new THREE.Clock();

    // stats

    // stats = new Stats();
    // stats.domElement.style.position = 'absolute';
    // stats.domElement.style.bottom = '0px';
    // stats.domElement.style.right = '0px';
    // stats.domElement.style.zIndex = 100;
    // document.body.appendChild( stats.domElement );

    // scene and renderer

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas: document.querySelector('canvas#graph'),
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setClearColor(0xD0ECF6, 1);

    document.body.appendChild(renderer.domElement);

    //

    initParticles();

    window.addEventListener('resize', onWindowResize, false);

    animate();
}

/**
 * From a `fetch` API response, get the text.
 */
function getResponseText(response) {
    return response.text();
}

/**
 * Return a function which will inject text into an element.
 */
function mkScriptInjector(element) {
    return function scriptInjector(text) {
        /* eslint-disable no-param-reassign */
        element.innerHTML = text;
        /* eslint-enable no-param-reassign */
    };
}

/**
 * Given a script element, fetch its `src` and inject the response into the element.
 */
function fetchInject(el) {
    return fetch(el.src).then(getResponseText).then(mkScriptInjector(el));
}

/**
 * Fetch Ractive templates and GLSL shaders, then init UI.
 */
function fetchThenInit() {
    const scripts = document.querySelectorAll('script[type^=x-shader]');
    Promise.all(map(scripts, fetchInject)).then(init);
}

fetchThenInit();

export default { updateNode };
