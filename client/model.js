import Springy from 'springy';
import noop from 'lodash/noop';

const graph = new Springy.Graph();

graph.newNode({ label: 'Norway Spruce' });
graph.newNode({ label: 'Sicilian Fir' });

const layout = new Springy.Layout.ForceDirected(
    graph,
    400,
    400,
    0.5
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

function moveNode(func) {
    renderer.drawNode = func;
}

window.layout = layout;
window.graph = graph;
window.renderer = renderer;

export default { graph, update, moveNode };
