precision highp float;

#define PI 3.14159265359
#define HALF_PI 1.5707963267948966
#define GROW_DURATION 62.0

uniform float size;

attribute vec3 color;
attribute float alive;
attribute float timer;

varying float vAlive;
varying vec3 vColor;

float backOut(float t) {
    float f = 1.0 - t;
    return 1.0 - (pow(f, 3.0) - f * sin(f * PI));
}

float grow(float time) {
    if (time > GROW_DURATION) {
        return 1.0;
    }
    else {
        /* return 0.5; */
        float t = time / GROW_DURATION;
        return backOut(t);// -1.2*cos(1.2*PI * time / GROW_DURATION) / 2.0 + 0.5;
    }
}

void main() {
    vAlive = alive;
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    /* gl_PointSize = size * grow(timer); */
    gl_PointSize = grow(timer) * size / (cameraPosition.z / 1000.0);
    gl_Position = projectionMatrix * mvPosition;
}
