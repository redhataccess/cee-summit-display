varying float vAlive;
varying vec3 vColor;

void main(void) {
    if (vAlive == 0.0) discard;
    float alpha = 1.0;
    gl_FragColor = vec4(vColor, alpha);
}
