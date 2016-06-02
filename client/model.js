let moveNode = () => {};

const modelWorker = new Worker('client/model-worker.js');

modelWorker.onmessage = e => {
    moveNode(e.data.node, e.data.p);
};

function update(nodes) {
    modelWorker.postMessage(nodes);
}

function onUpdateNode(func) {
    moveNode = func;
}

export default {
    graph,
    update,
    onUpdateNode,
};
