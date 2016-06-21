import Ractive from 'ractive';
import nth from './nth';
import eventList from './event-list';
import moment from 'moment';

const EVENT_INTERVAL = 360; // rotate displayed event every N frames

let ractive;
let currentEvent = 0; // event index

const rotateEvent = nth(() => {
    currentEvent += 1;
    currentEvent %= eventList.length;
    ractive.set('currentEvent', currentEvent);
}, EVENT_INTERVAL);

function start() {
    ractive = new Ractive({
        el: document.querySelector('#events'),
        template: document.querySelector('#events-template').textContent,
        data: {
            eventList,
            moment,
            currentEvent,
        },
    });
}

function update() {
    rotateEvent();
}

export default {
    start,
    update,
};
