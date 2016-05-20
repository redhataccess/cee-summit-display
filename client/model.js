import Springy from 'springy';
import noop from 'lodash/noop';
import each from 'lodash/each';
import filter from 'lodash/filter';
import partial from 'lodash/partial';

const graph = new Springy.Graph();

const layout = new Springy.Layout.ForceDirected(
    graph,
    150,
    2500,
    0.1
);

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
    const friendNodes = filter(graph.nodes, { data: { group: node.data.group } });
    each(friendNodes, partial(connect, newNode));
    return newNode;
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
