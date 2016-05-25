precision highp float;

#define PI 3.14159265359
#define GROW_DURATION 52.0

uniform float size;

attribute vec3 color;
attribute float alive;
attribute float timer;

varying float vAlive;
varying vec3 vColor;

float grow(float time) {
    if (time > GROW_DURATION) {
        return 1.0;
    }
    else {
        /* return 0.5; */
        return -cos(PI * time / GROW_DURATION) / 2.0 + 0.5;
    }
}

void main() {
    vAlive = alive;
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = size * grow(timer);
    /* gl_PointSize = size * -mvPosition.z; */
    gl_Position = projectionMatrix * mvPosition;
}
