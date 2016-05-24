import THREE from 'three';
import map from 'lodash/map';

const MAX_PARTICLE_COUNT = 5000;
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
    uniforms = {
        texture   : {
            type : 't',
            value : new THREE.TextureLoader().load('./client/img/particle.png'),
        },
        size      : { type : 'f', value : 14 },
    };

    const shaderMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader:   document.getElementById('point-vert').textContent,
        fragmentShader: document.getElementById('point-frag').textContent,
        // blending:       THREE.AdditiveBlending,
        // depthTest:      false,
        // transparent:    true,
        // alphaTest: 0.5,
    });

    particleGeometry = new THREE.BufferGeometry();
    window.particleGeometry = particleGeometry;

    const alive        = new Float32Array(MAX_PARTICLE_COUNT);
    const positions    = new Float32Array(MAX_PARTICLE_COUNT * 3);
    const colors       = new Float32Array(MAX_PARTICLE_COUNT * 3);
    const timers       = new Float32Array(MAX_PARTICLE_COUNT);

    particleGeometry.addAttribute('alive', new THREE.BufferAttribute(alive, 1));
    particleGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.addAttribute('timer', new THREE.BufferAttribute(timers, 1));

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
            particleCount -= 1;
        }
    }
    return newTime;
}

function updateParticleTimers() {
    particleGeometry.attributes.timer.array.map(updateParticleTimer);
}

function updateParticles() {
    updateParticleTimers();

    particleGeometry.attributes.alive.needsUpdate = true;
    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.timer.needsUpdate = true;
    particleGeometry.attributes.color.needsUpdate = true;
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

function animate() {
    requestAnimationFrame(animate);

    updateTimescale();

    updateParticles();

    renderer.render(scene, camera);
}

function init() {
    // camera

    updateWindowSize();

    camera = new THREE.PerspectiveCamera(70, WIDTH / HEIGHT, 1, 1000);
    camera.position.z = 300;
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
