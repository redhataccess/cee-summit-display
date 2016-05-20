const nodes = {};
const container = document.querySelector('#graph');

let HEIGHT;
let WIDTH;
let HALF_HEIGHT;
let HALF_WIDTH;

function update() {}

function moveNode(node, pos) {
    const x = pos.x * 20 + HALF_WIDTH;
    const y = pos.y * 20 + HALF_HEIGHT;
    nodes[node.id].el.style.left = `${x}px`;
    nodes[node.id].el.style.top = `${y}px`;
}

function createNode(node, pos) {
    const el = document.createElement('div');
    el.classList.add('node');
    el.classList.add(`group-${node.data.group}`);
    container.appendChild(el);
    return { node, pos, el };
}

function addNode(node, pos) {
    nodes[node.id] = createNode(node, pos);
}

function nodeExists(id) {
    return nodes.hasOwnProperty(id);
}

function updateNode(node, p) {
    if (!nodeExists(node.id)) {
        addNode(node, p);
    }
    else {
        moveNode(node, p);
    }
}

function updateSize() {
    HEIGHT      = window.innerHeight;
    WIDTH       = window.innerWidth;
    HALF_HEIGHT = HEIGHT / 2;
    HALF_WIDTH  = WIDTH / 2;
}

updateSize();
window.addEventListener('resize', updateSize);

export default { update, updateNode };
