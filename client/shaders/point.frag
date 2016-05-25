precision highp float;

varying float vAlive;
varying vec3 vColor;

uniform sampler2D texture;

void main(void) {
    if (vAlive == 0.0) discard;
    float alpha = 1.0;
    gl_FragColor = vec4(vColor, 1.0) * texture2D(texture, gl_PointCoord);
}
