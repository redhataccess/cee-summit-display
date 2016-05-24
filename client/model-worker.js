importScripts('./springy.js');

const graph = new Springy.Graph();

const STIFFNESS = 25;
const REPULSION = 30;
const DAMPENING = 0.05;
const MAX_VELOCITY = 0.7;

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
    () => {}  // draw node
);

renderer.start();

renderer.drawNode = (node, p) => {
    postMessage({ node, p });
};

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

function createNode(node) {
    const newNode = graph.newNode(node.data);
    groupRegister(node, newNode);
    const friendNodes = groups[node.data.group];
    friendNodes.forEach(n => connect(n, newNode));
    return newNode;
}

function update(data) {
    data.forEach(createNode);
    // postMessage(`worker updated ${data.length} nodes`);
}

onmessage = function(e) {
    update(e.data);
};
