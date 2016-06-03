import ReconnectingWebSocket from 'reconnectingwebsocket';
import each from 'lodash/each';
import config from './config';

const buffer = [];
let nodeCount = 0;

function push(d) {
    if (nodeCount < config.MAX_NODES) {
        buffer.push(d);
        nodeCount++;
    }
}

function add(data) {
    each(data, push);
}

function handleMessage(msg) {
    // console.log(`message received: ${msg.data}`);
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
