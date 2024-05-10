import { compileShader, linkProgram, createBuffer, resizeCanvasToDisplaySize, getUniformLocations, getAttribLocations } from "./gl.js";
import { rotationMatrix } from "./matrix.js";
import { camera, movementHandler, mouseHandler, moveCamera, addCameraInputListeners } from "./camera.js";

let lorenzeParams = {
    sigma : 10,
    beta : 8.0/3.0,
    rho : 28
}
let lorenzeInputs = {
    sigmaMinus: 0,
    sigmaPlus: 0,
    betaMinus: 0,
    betaPlus: 0,
    rhoMinus: 0,
    rhoPlus: 0
}
let lorenzeDict = {
    "b": "sigmaMinus",
    "g": "sigmaPlus",
    "n": "betaMinus",
    "h": "betaPlus",
    "m": "rhoMinus",
    "j": "rhoPlus"
}
let lorenzeShifted = false;
let lorenzeHandler = (event) => {
    let strength = (event.type === "keydown" ? 0.5 : 0)
    
    if (event.key.toLowerCase() in lorenzeDict) {
        lorenzeInputs[lorenzeDict[event.key.toLowerCase()]] = strength;
    }
    if (event.key.toLowerCase() === "r") {
        for (let i = 0; i < positions.length; i += 4) {
            positions[i + 0] = Math.random() * 2 - 1;
            positions[i + 1] = Math.random() * 2 - 1;
            positions[i + 2] = Math.random() * 2 - 1;
            positions[i + 3] = 1;
            lorenzeParams.sigma = 10;
            lorenzeParams.beta = 8.0/3.0;
            lorenzeParams.rho = 28;
        }
    }
    if (event.key.toLowerCase() === "shift") {
        lorenzeShifted = event.type === "keydown";
    }
}
let lorenzeMoveParams = (dt) => {
    let strength = lorenzeShifted ? 10 : 1;
    lorenzeParams.sigma += (lorenzeInputs.sigmaPlus - lorenzeInputs.sigmaMinus) * strength * dt/1000;
    lorenzeParams.beta += (lorenzeInputs.betaPlus - lorenzeInputs.betaMinus) * strength * dt/1000;
    lorenzeParams.rho += (lorenzeInputs.rhoPlus - lorenzeInputs.rhoMinus) * strength * dt/1000;
}

let step = (position, dt) => {
    let [x, y, z, w] = position;
    let velocity = [lorenzeParams.sigma * (y - x), (x * (lorenzeParams.rho - z) - y), (x * y - lorenzeParams.beta * z), 0]
    let newPos = position.map((pos, i) => pos + velocity[i] * dt)
    if (newPos.some(isNaN)) {newPos = randomPoint()}
    return newPos;
}
let randomPoint = () => {
    let x = Math.random() * 2 - 1;
    let y = Math.random() * 2 - 1;
    let z = Math.random() * 2 - 1;
    let w = 1;
    return [x, y, z, w];

}

let positions
const numPoints = 10000;

let main = async () => {
    const canvas = document.querySelector("#glcanvas");
    // Initialize the GL context
    const gl = canvas.getContext("webgl2");

    // Only continue if WebGL is available and working
    if (gl === null) {
      alert(
        "Unable to initialize WebGL. Your browser or machine may not support it."
      );
      return;
    }

    addCameraInputListeners(canvas)
    document.addEventListener("keydown", lorenzeHandler)
    document.addEventListener("keyup", lorenzeHandler)

    const vsSource = await fetch("./vert.glsl").then(res => res.text())
    const fsSource = await fetch("./frag.glsl").then(res => res.text())

    let vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    let fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

    let program = linkProgram(gl, vertexShader, fragmentShader)

    positions = Array(numPoints).fill(0).flatMap(() => [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, 1]);

    let uniforms = getUniformLocations(gl, program, ["u_cameraRotation", "u_cameraPosition", "u_cameraFov", "u_cameraAspect", "u_cameraNear", "u_cameraFar"])
    let attributes = getAttribLocations(gl, program, ["a_position"]);

    let positionBuffer = createBuffer(gl, new Float32Array(positions), gl.DYNAMIC_DRAW);

    let dt = 16;
    while(true) {
        let timeStart = Date.now();

        let [w, h] = resizeCanvasToDisplaySize(gl.canvas);
        camera.aspect = w / h;

        moveCamera(dt);
        lorenzeMoveParams(dt);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(program)
        
        for (let i = 0; i < positions.length; i += 4) {
            let newPos = step(positions.slice(i, i + 4), dt / 1000); 
            positions[i] = newPos[0];
            positions[i + 1] = newPos[1];
            positions[i + 2] = newPos[2];
            positions[i + 3] = newPos[3];
        }

        gl.enableVertexAttribArray(attributes.a_position);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        let size = 4;          // 2 components per iteration
        let type = gl.FLOAT;   // the data is 32bit floats
        let normalize = false; // don't normalize the data
        let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        let offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(attributes.a_position, size, type, normalize, stride, offset)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
        
        gl.uniformMatrix4fv(uniforms.u_cameraRotation, false, rotationMatrix(camera.rotation[0], camera.rotation[1]));
        gl.uniform4fv(uniforms.u_cameraPosition, camera.position);
        gl.uniform1f(uniforms.u_cameraFov, camera.fov);
        gl.uniform1f(uniforms.u_cameraAspect, camera.aspect);
        gl.uniform1f(uniforms.u_cameraNear, camera.near);
        gl.uniform1f(uniforms.u_cameraFar, camera.far);

        let primitiveType = gl.POINTS;
        offset = 0;
        let count = numPoints;
        gl.drawArrays(primitiveType, offset, count);

        let timeEnd = Date.now();
        if (timeEnd - timeStart < dt) {
            console.log(timeEnd - timeStart)
            await new Promise((resolve) => setTimeout(resolve, dt - (timeEnd - timeStart)));
        }
    }
}

main();