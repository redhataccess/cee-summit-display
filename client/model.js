import Springy from './springy';
import noop from 'lodash/noop';
import each from 'lodash/each';
import filter from 'lodash/filter';
import partial from 'lodash/partial';

const graph = new Springy.Graph();

const STIFFNESS = 25;
const REPULSION = 30;
const DAMPENING = 0.05;
const MAX_VELOCITY = 0.7;

const layout = new Springy.Layout.ForceDirected(graph, STIFFNESS, REPULSION, DAMPENING, null, MAX_VELOCITY);
const groups = {};
const renderer = new Springy.Renderer(
    layout,
    noop, // clear screen
    noop, // draw edge
    noop  // draw node
);

renderer.start();

function connect(node1, node2) {
    graph.newEdge(node1, node2);
}

function createNode(node) {
    const newNode = graph.newNode(node.data);
    groupRegister(node, newNode);
    const friendNodes = groups[node.data.group]; //filter(graph.nodes, { data: { group: node.data.group } });
    each(friendNodes, partial(connect, newNode));
    return newNode;
}

function groupRegister(node, graphNode) {
    var group = groups[node.data.group];
    if (group) {
        group.push(graphNode);
    }
    else {
        groups[node.data.group] = [graphNode];
    }
}

function update(data) {
    each(data, createNode);
}

function updateNode(func) {
    renderer.drawNode = func;
}

window.layout = layout;
window.graph = graph;
window.renderer = renderer;

export default { graph, update, updateNode };
