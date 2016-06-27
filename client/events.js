import Ractive from 'ractive';
import throttle from 'lodash/throttle';
import delay from 'lodash/delay';
import random from 'lodash/random';
import each from 'lodash/each';
import eventList from './event-list';
import moment from 'moment';

const EVENT_INTERVAL = 16180; // ms
const EVENT_HIDE_DELAY = 3618; // ms

let ractive;
let currentEvent = 0; // event index

function repositionEvent(event) {
    event.positionX = `${random(5, 65)}vw`;
    event.positionY = `${random(5, 30)}vh`;
}

function hideEvents() {
    ractive.set('currentEvent', -1);
}

const rotateEvent = throttle(() => {
    let show = true;
    currentEvent += 1;
    currentEvent %= eventList.length;
    if (eventList[currentEvent].date) {
        const eventDate = moment(new Date(eventList[currentEvent].date));
        const timeUntil = eventDate.diff();
        if (timeUntil < 0) {
            show = false;
            rotateEvent();
        }
        else {
            ractive.set(`eventList[${currentEvent}].fromNow`, eventDate.fromNow());
        }
    }
    if (show) {
        ractive.set('currentEvent', currentEvent);
    }
    delay(hideEvents, EVENT_INTERVAL - EVENT_HIDE_DELAY);
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
    each(eventList, repositionEvent);
}

function update() {
    rotateEvent();
}

export default {
    start,
    update,
};
