
const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const http = require('http');
require('console-stamp')(console);

function node(group) {
    return { group };
}

function randomTraffic() {
    // ids.sort(shuffler);
    const id = Math.floor(Math.random() * (ids.length));
    return node(ids[id]);
}

function startSpam() {
    const payload = JSON.stringify(randomTraffic());
    const post = http.request({
        host: 'localhost',
        // host: 'traffic-server-demo.apps.demo.aws.paas.ninja',
        port: 8808,
        path: '/record',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
        },
    }, res => {
        res.setEncoding('utf8');
    });
    post.write(payload);
    post.end();
    console.log(`POST ${payload}`);
}

setInterval(startSpam, 400);
