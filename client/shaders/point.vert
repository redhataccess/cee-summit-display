precision highp float;

#define PI 3.14159265359
#define TWO_PI 6.283185307179586
#define HALF_PI 1.5707963267948966
#define QRTR_PI 0.7853981633974483
#define GROW_DURATION 0.62
#define ROTATION_START QRTR_PI
#define ROTATION_END (TWO_PI + ROTATION_START)
#define ROTATION_DUR 2.05

uniform float uSize;

attribute vec3 color;
attribute float alive;
attribute float timer;
attribute float rotating;
attribute float spriteNum;

varying float vAlive;
varying vec3 vColor;
varying float vTimer;
varying mat2 vRotationMat;
varying float vSpriteNum;

float backOut(float t) {
    float f = 1.0 - t;
    return 1.0 - (pow(f, 3.0) - f * sin(f * PI));
}

float backInOut(float t) {
    float f = t < 0.5
        ? 2.0 * t
        : 1.0 - (2.0 * t - 1.0);

    float g = pow(f, 3.0) - f * sin(f * PI);

    return t < 0.5
        ? 0.5 * g
        : 0.5 * (1.0 - g) + 0.5;
}

float elasticInOut(float t) {
  return t < 0.5
    ? 0.5 * sin(+13.0 * HALF_PI * 2.0 * t) * pow(2.0, 10.0 * (2.0 * t - 1.0))
    : 0.5 * sin(-13.0 * HALF_PI * ((2.0 * t - 1.0) + 1.0)) * pow(2.0, -10.0 * (2.0 * t - 1.0)) + 1.0;
}

float grow(float time) {
    if (time > GROW_DURATION) {
        return 1.0;
    }
    else {
        float t = time / GROW_DURATION;
        return backOut(t);
    }
}

void main() {
    float rotation = ROTATION_START;

    vAlive = alive;
    vColor = color;
    vTimer = timer;
    vSpriteNum = spriteNum;

    // apply rotation if this node is marked as rotating
    if (rotating > 0.0) {
        float rot_time = timer - rotating;
        float rot_prog = rot_time / ROTATION_DUR;
        float rot_easing   = backInOut(rot_prog);
        if (rot_prog <= 1.0) {
            rotation = (1.0 - rot_easing) * ROTATION_START + rot_easing * ROTATION_END;
        }
        else {
            rotation = ROTATION_START;
        }

    }

    vRotationMat = mat2( cos(rotation), -sin(rotation),
                         sin(rotation), cos(rotation));

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    /* gl_PointSize = uSize * grow(timer); */
    gl_PointSize = grow(timer) * uSize / (cameraPosition.z / 2300.0);
    gl_Position = projectionMatrix * mvPosition;
}
