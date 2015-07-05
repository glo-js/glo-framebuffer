#version 100
precision mediump float;
varying vec2 vUv;
uniform sampler2D iChannel0;
uniform float near;
uniform float far;

float linearDepth(float z, float near, float far) {
  return (2.0 * near) / (far + near - z * (far - near));
}

void main() {
  vec4 texColor = texture2D(iChannel0, vUv);
  // gl_FragColor = vec4(vec3(linearDepth(texColor.r, near, far)), 1.0);
  gl_FragColor = texColor;
}