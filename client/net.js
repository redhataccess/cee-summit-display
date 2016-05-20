import ReconnectingWebSocket from 'reconnectingwebsocket';
import each from 'lodash/each';

const buffer = [];

function push(d) {
    buffer.push(d);
}

function add(data) {
    each(data, push);
}

function handleMessage(msg) {
    console.log(`message received: ${msg.data}`);
    try {
        const obj = JSON.parse(msg.data);
        add(obj);
    }
    catch (e) {
        console.error(e);
    }
}

function get() {
    return buffer.splice(0);
}

const ws = new ReconnectingWebSocket('ws://localhost:8808/stream');

ws.onopen    = () => console.log('websocket connection open');
ws.onmessage = handleMessage;
ws.onclose   = () => console.log('websocket connection closed');

export default { get };
