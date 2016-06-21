import model from './model';
import net from './net';
import view from './view';
import events from './events';

function update() {
    requestAnimationFrame(update);

    const newData = net.get();

    model.update(newData);

    events.update();
}

function init() {
    events.start();
    model.onUpdateNode(view.updateNode);
    update(); // start the update loop
}

init();
