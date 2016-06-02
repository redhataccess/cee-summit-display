precision highp float;

varying float vAlive;
varying vec3 vColor;
varying float vTimer;
varying float vRotation;
varying mat2 vRotationMat;
varying float vSpriteNum;

uniform sampler2D spriteSheet;

void main(void) {
    if (vAlive == 0.0) discard;
    float alpha = 1.0;
    vec2 p = gl_PointCoord;
    vec2 center = vec2(0.5, 0.5);
    vec2 rot_coord = vRotationMat * (p - center) + center;
    rot_coord.x /= 4.0;
    rot_coord.x += vSpriteNum * 0.25;
    vec4 sprite_color = texture2D(spriteSheet, rot_coord);

    /* float x = gl_PointCoord.x; */
    /* float y = gl_PointCoord.y; */
    /* vec2 rotated = vec2(cos(vRotation) * (gl_PointCoord.x - 0.5) + 0.5, sin(vRotation) * (gl_PointCoord.y - 0.5) + 0.5); */
    /* vec2 rotated = vec2( x * sin(vRotation) - y * sin(vRotation), x * sin(vRotation) + y * cos(vRotation)); */
    /* vec2 rotated = vRotationMat * p; */
    /* rotated = gl_PointCoord; */
    /* rotated += 0.0; */
    /* rotated /= 1.0; */
    gl_FragColor = vec4(vColor, 1.0) * sprite_color;
}
