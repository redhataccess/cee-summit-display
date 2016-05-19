import Springy from 'springy';
import noop from 'lodash/noop';
import each from 'lodash/each';
import filter from 'lodash/filter';
import partial from 'lodash/partial';

const graph = new Springy.Graph();

// const a1 = graph.newNode({ label: 'a1', group: 'a' });
// const a2 = graph.newNode({ label: 'a2', group: 'a' });
// const a3 = graph.newNode({ label: 'a3', group: 'a' });
// const a4 = graph.newNode({ label: 'a4', group: 'a' });
// const b1 = graph.newNode({ label: 'b1', group: 'b' });
// const b2 = graph.newNode({ label: 'b2', group: 'b' });
// const b3 = graph.newNode({ label: 'b3', group: 'b' });

// graph.newEdge(a1, a2);
// graph.newEdge(a1, a3);
// graph.newEdge(a1, a4);
// graph.newEdge(a2, a3);
// graph.newEdge(a2, a4);
// graph.newEdge(a3, a4);

// graph.newEdge(b1, b2);
// graph.newEdge(b2, b3);

const layout = new Springy.Layout.ForceDirected(
    graph,
    250,
    800,
    0.3
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
    console.log('new node', newNode);
    console.log('friend nodes', friendNodes);
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
