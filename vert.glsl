#version 300 es

in vec4 a_position;

uniform mat4 u_cameraRotation;
uniform vec4 u_cameraPosition;
uniform float u_cameraNear;
uniform float u_cameraFar;
uniform float u_cameraAspect;
uniform float u_cameraFov;

void main() {
    vec4 point = u_cameraRotation*(a_position - u_cameraPosition);
    float x = (u_cameraFov*point.x)/(point.z*u_cameraAspect);
    float y = (u_cameraFov*point.y)/(point.z);
    float z = (point.z-u_cameraNear)/(u_cameraFar-u_cameraNear);

    gl_PointSize = 1.0;
    gl_Position = vec4(x, y, z, 1.0) - vec4(0.0, 0.0, 1.0, 0.0);
}