uniform float size;

attribute float alive;
attribute vec3 color;

varying float vAlive;
varying vec3 vColor;

void main() {
    vAlive = alive;
    vColor = color;
    gl_PointSize = size;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
