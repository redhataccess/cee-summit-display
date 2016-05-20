import model from './model';
import net from './net';
import view from './view';

function update() {
    requestAnimationFrame(update);

    const newData = net.get();

    model.update(newData);
    view.update(model.graph);
}

function init() {
    model.updateNode(view.updateNode);
    update(); // start the update loop
}

init();
