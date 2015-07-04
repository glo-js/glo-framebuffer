#version 100
precision mediump float;
attribute vec2 uv;
attribute vec4 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = position;
  gl_PointSize = 1.0;
}