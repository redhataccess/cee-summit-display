importScripts('./springy.js');

const graph = new Springy.Graph();

const STIFFNESS = 25;
const REPULSION = 30;
const DAMPENING = 0.05;
const MAX_VELOCITY = 0.7;
const BASE_WANDER_THRESHOLD = 3000000;
const WANDER_DURATION = 20000;

let counter = 0;
let wanderThreshold = BASE_WANDER_THRESHOLD;

function wander() {
    const wanderingNode = graph.nodes[Math.floor(Math.random() * graph.nodes.length)];
    const randomNode = graph.nodes[Math.floor(Math.random() * graph.nodes.length)];
    if (wanderingNode === randomNode) return;
    graph.detachNode(wanderingNode);
    groupConnect(randomNode, wanderingNode);
    setTimeout(() => {
        graph.detachNode(wanderingNode);
        groupConnect(wanderingNode, wanderingNode);
    }, WANDER_DURATION);
}

const layout = new Springy.Layout.ForceDirected(
    graph,
    STIFFNESS,
    REPULSION,
    DAMPENING,
    null,
    MAX_VELOCITY
);
const groups = {};
const renderer = new Springy.Renderer(
    layout,
    () => {}, // clear screen
    () => {}, // draw edge
    (node, p) => {
        counter += 1;
        if (counter > wanderThreshold) {
            counter = 0;
            wander();
        }
        postMessage({ node, p });
    } // draw node
);

renderer.start();

function connect(node1, node2) {
    graph.newEdge(node1, node2);
}

function groupRegister(node, graphNode) {
    const group = groups[node.data.group];
    if (group) {
        group.push(graphNode);
    }
    else {
        groups[node.data.group] = [graphNode];
    }
}

function groupConnect(node, graphNode) {
    const friendNodes = groups[node.data.group];
    friendNodes.forEach(n => connect(n, graphNode));
}

function createNode(node) {
    const newNode = graph.newNode(node.data);
    groupRegister(node, newNode);
    groupConnect(node, newNode);
    layout.repulsion = graph.nodes.length;
    wanderThreshold = BASE_WANDER_THRESHOLD / graph.nodes.length;
    return newNode;
}

function update(data) {
    data.forEach(createNode);
    // postMessage(`worker updated ${data.length} nodes`);
}

onmessage = function(e) {
    update(e.data);
};
