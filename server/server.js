'use strict';

const Hapi = require('hapi');
const HapiWebSocket = require('hapi-plugin-websocket');
const request = require('request');
const server = new Hapi.Server();
const _ = require('lodash');

require('console-stamp')(console);

const buffer = [];

const PORT = 8808;
const INTERVAL = 50; // ms

let wsServer;
let lastId = 0;

server.connection({
    port: PORT,
});
server.register(HapiWebSocket, () => {
    server.route({
        method: 'GET',
        path: '/pending',
        handler: (req, reply) => {
            reply(buffer);
        },
    });
    server.route({
        method: 'OPTIONS',
        path: '/record',
        handler: (req, reply) => {
            reply()
            .header('Access-Control-Allow-Origin', '*')
            .header('Access-Control-Allow-Headers', 'charset, content-type')
            .header('Access-Control-Allow-Methods', 'POST, OPTIONS');
        },
    });
    server.route({
        method: 'POST',
        path: '/record',
        handler: (req, reply) => {
            console.log('record received');
            buffer.push({ id: ++lastId, data: req.payload });
            reply('recorded')
                .header('Access-Control-Allow-Origin', '*')
                .header('Access-Control-Allow-Headers', 'charset, content-type')
                .header('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
                        // send any attendees registered before display
                        // launched
                        fetchAttendees(ws.send.bind(ws));
                        wsServer = wss;
                    },
                    disconnect: (wss, ws) => {
                    },
                },
            },
        },
        handler: (req, reply) => {},
    });
    server.start(err => {
        if (err) {
            throw err;
        }
        console.log(`server running at ${server.info.uri}`);
    });
});

function transformAttendees(attendees) {
    return _.chain(attendees)
        .map(attendee => _.pick(attendee, ['challenge', 'color']))
        .map(attendee => {
            return {
                id: ++lastId,
                data: { color: attendee.color, group: attendee.challenge },
            };
        })
        .value();
}

function fetchAttendees(callback) {
    request('http://localhost:3000/attendees', (error, response, attendeesJSON) => {
        try {
            const attendees = JSON.parse(attendeesJSON);
            const xformed = transformAttendees(attendees);
            callback(JSON.stringify(xformed));
        }
        catch (e) {
            console.error(e);
        }
    });
}

function broadcast(wss, data) {
    wss.clients.forEach(client => {
        try {
            client.send(data);
        }
        catch (e) {
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
