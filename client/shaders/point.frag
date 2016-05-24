varying float vAlive;
varying vec3 vColor;
varying vec2 vUv;
uniform sampler2D texture1;

void main(void) {
    if (vAlive == 0.0) discard;
    float alpha = 1.0;
    vec4 texture_pixel = texture2D(texture1, vUv);
    gl_FragColor = texture_pixel; // * vec4(vColor, alpha);
    /* gl_FragColor = vec4(texture2D(texture1, vUv), alpha); */
}
