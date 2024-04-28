#version 300 es

in vec4 a_position;

uniform vec4 u_cameraPosition;

void main() {
    gl_Position = a_position - vec4(u_cameraPosition.xyz, 0.0);
}