import Ractive from 'ractive';
import throttle from 'lodash/throttle';
import eventList from './event-list';
import moment from 'moment';

const EVENT_INTERVAL = 14000; // ms

let ractive;
let currentEvent = 0; // event index

const rotateEvent = throttle(() => {
    let show = true;
    currentEvent += 1;
    if (eventList[currentEvent].date) {
        const eventDate = moment(eventList[currentEvent].date);
        const timeUntil = eventDate.diff();
        if (timeUntil < 0) {
            show = false;
            rotateEvent();
        }
    }
    if (show) {
        ractive.set('currentEvent', currentEvent);
    }
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
