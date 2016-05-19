import Springy from 'springy';
import noop from 'lodash/noop';

const graph = new Springy.Graph();

const a1 = graph.newNode({ label: 'A1', group: 'a' });
const a2 = graph.newNode({ label: 'A2', group: 'a' });
const a3 = graph.newNode({ label: 'A3', group: 'a' });
const a4 = graph.newNode({ label: 'A4', group: 'a' });
const b1 = graph.newNode({ label: 'B1', group: 'b' });
const b2 = graph.newNode({ label: 'B2', group: 'b' });
const b3 = graph.newNode({ label: 'B3', group: 'b' });

graph.newEdge(a1, a2);
graph.newEdge(a1, a3);
graph.newEdge(a1, a4);
graph.newEdge(a2, a3);
graph.newEdge(a2, a4);
graph.newEdge(a3, a4);

graph.newEdge(b1, b2);
graph.newEdge(b2, b3);

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

function update(data) {
}

function updateNode(func) {
    renderer.drawNode = func;
}

window.layout = layout;
window.graph = graph;
window.renderer = renderer;

export default { graph, update, updateNode };
