#version 300 es
in vec4 a_oldPosition;
in vec4 a_initialPosition;

uniform float u_deltaTime;
uniform float u_beta;
uniform float u_sigma;
uniform float u_rho;

out vec4 v_newPosition;

void main() {
    vec4 velocity = vec4(u_sigma * (a_oldPosition.y - a_oldPosition.x),
                         a_oldPosition.x * (u_rho - a_oldPosition.z) - a_oldPosition.y,
                         a_oldPosition.x * a_oldPosition.y - u_beta * a_oldPosition.z,
                         0.0);
    
    vec4 tempPos = a_oldPosition + velocity * u_deltaTime;
    if(isnan(tempPos.x) || isnan(tempPos.y) || isnan(tempPos.z) || isnan(tempPos.w)) {
        v_newPosition = a_initialPosition;
        return;
    }

    v_newPosition = tempPos;
}
