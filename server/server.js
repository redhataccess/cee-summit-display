'use strict';

const Hapi = require('hapi');
const HapiWebSocket = require('hapi-plugin-websocket');
const server = new Hapi.Server();

require('console-stamp')(console);

const buffer = [];

const PORT = 8808;
const INTERVAL = 50; // ms

let wsServer;
let lastId = 0;

// TODO: before starting server, fetch all past state from Mongo and add it to
// the initial buffer, so a restarted client app will be caught up with past
// data.

server.connection({ port: PORT });
server.register(HapiWebSocket, () => {
    server.route({
        method: 'GET',
        path: '/pending',
        handler: (request, reply) => {
            reply(buffer);
        },
    });
    server.route({
        method: 'POST',
        path: '/record',
        handler: (request, reply) => {
            buffer.push({ id: ++lastId, data: request.payload });
            reply('recorded');
        },
    });
    server.route({
        method: 'POST',
        path: '/stream',
        config: {
            plugins: {
                websocket: {
                    only: true,
                    connect: (wss, ws) => {
                        console.log('client connected');
                        wsServer = wss;
                    },
                    disconnect: (wss, ws) => {
                    },
                },
            },
        },
        handler: (request, reply) => {},
    });
    server.start(err => {
        if (err) {
            throw err;
        }
        console.log(`server running at ${server.info.uri}`);
    });
});

function broadcast(wss, data) {
    wss.clients.forEach(client => {
        try {
            client.send(data);
        } catch (e) {
            console.error('tried to send websocket message to closed client; ignoring.');
        }
    });
}

function pushBuffer() {
    // broadcast buffer to websocket clients and empty the buffer list
    if (wsServer && buffer.length) {
        console.log(`Relayed ${buffer.length} events`);
        broadcast(wsServer, JSON.stringify(buffer.splice(0)));
    }
}

setInterval(pushBuffer, INTERVAL);
