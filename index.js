import { compileShader, linkProgram, createBuffer, resizeCanvasToDisplaySize, getUniformLocations, getAttribLocations, makeVertexArray } from "./gl.js";
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
const numPoints = 100000;

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

    let dt = 16;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    addCameraInputListeners(canvas, dt)
    document.addEventListener("keydown", lorenzeHandler)
    document.addEventListener("keyup", lorenzeHandler)

    const updatePointsVsSource = await fetch("./updatePointsVert.glsl").then(res => res.text())
    const vsSource = await fetch("./vert.glsl").then(res => res.text())
    const fsSource = await fetch("./frag.glsl").then(res => res.text())

    let vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    let fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    let updatePointsVs = compileShader(gl, gl.VERTEX_SHADER, updatePointsVsSource);

    let renderProgram = linkProgram(gl, vertexShader, fragmentShader)
    let updatePointsProgram = linkProgram(gl, updatePointsVs, fragmentShader, ["v_newPosition"])

    let renderLocs = {}
    renderLocs.uniforms = getUniformLocations(gl, renderProgram, ["u_cameraRotation", "u_cameraPosition", "u_cameraFov", "u_cameraAspect", "u_cameraNear", "u_cameraFar"])
    renderLocs.attributes = getAttribLocations(gl, renderProgram, ["a_position"]);

    let updatePointsLocs = {}
    updatePointsLocs.uniforms = getUniformLocations(gl, updatePointsProgram, ["u_deltaTime", "u_sigma", "u_beta", "u_rho"])
    updatePointsLocs.attributes = getAttribLocations(gl, updatePointsProgram, ["a_oldPosition", "a_initialPosition"]);


    positions = Array(numPoints).fill(0).flatMap(() => [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, 1]);
    let position1Buffer = createBuffer(gl, new Float32Array(positions), gl.DYNAMIC_DRAW);
    let position2Buffer = createBuffer(gl, new Float32Array(positions), gl.DYNAMIC_DRAW);
    let initialPointsBuffer = createBuffer(gl, new Float32Array(positions), gl.DYNAMIC_DRAW);



    const updateVA1 = makeVertexArray(
        gl, [
            [position1Buffer, updatePointsLocs.attributes.a_oldPosition],
            [initialPointsBuffer, updatePointsLocs.attributes.a_initialPosition]
        ]
    );
    const updateVA2 = makeVertexArray(
        gl, [
            [position2Buffer, updatePointsLocs.attributes.a_oldPosition],
            [initialPointsBuffer, updatePointsLocs.attributes.a_initialPosition]
        ]
    );
     
    const renderVA1 = makeVertexArray(
        gl, [[position1Buffer, renderLocs.attributes.a_position]]
    );
    const renderVA2 = makeVertexArray(
        gl, [[position2Buffer, renderLocs.attributes.a_position]]
    );

    const initialPointsVA = makeVertexArray(
        gl, [[initialPointsBuffer, updatePointsLocs.attributes.a_initialPosition]]
    );

    function makeTransformFeedback(gl, buffer) {
        const tf = gl.createTransformFeedback();
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer);
        return tf;
    }
       
    const tf1 = makeTransformFeedback(gl, position1Buffer);
    const tf2 = makeTransformFeedback(gl, position2Buffer);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
    
    let current = {
        updateVA: updateVA1,  // read from position1
        tf: tf2,                      // write to position2
        drawVA: renderVA2,              // draw with position2
    };
    let next = {
        updateVA: updateVA2,  // read from position2
        tf: tf1,                      // write to position1
        drawVA: renderVA1,              // draw with position1
    };      

    
    while(true) {
        let timeStart = Date.now();

        let [w, h] = resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        camera.aspect = w / h;

        moveCamera(dt);
        lorenzeMoveParams(dt);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(updatePointsProgram);
        gl.bindVertexArray(current.updateVA);
        gl.uniform1f(updatePointsLocs.uniforms.u_deltaTime, dt/1000);
        gl.uniform1f(updatePointsLocs.uniforms.u_sigma, lorenzeParams.sigma);
        gl.uniform1f(updatePointsLocs.uniforms.u_beta, lorenzeParams.beta);
        gl.uniform1f(updatePointsLocs.uniforms.u_rho, lorenzeParams.rho);

        gl.enable(gl.RASTERIZER_DISCARD);

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.tf);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, numPoints);
        gl.endTransformFeedback();
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
        

        gl.disable(gl.RASTERIZER_DISCARD);
        
        gl.useProgram(renderProgram)
        gl.bindVertexArray(current.drawVA)
        
        gl.uniformMatrix4fv(renderLocs.uniforms.u_cameraRotation, false, camera.rotationMatrix);
        gl.uniform4fv(renderLocs.uniforms.u_cameraPosition, camera.position);
        gl.uniform1f(renderLocs.uniforms.u_cameraFov, camera.fov);
        gl.uniform1f(renderLocs.uniforms.u_cameraAspect, camera.aspect);
        gl.uniform1f(renderLocs.uniforms.u_cameraNear, camera.near);
        gl.uniform1f(renderLocs.uniforms.u_cameraFar, camera.far);

        gl.drawArrays(gl.POINTS, 0, numPoints);
        

        let temp = current
        current = next
        next = temp

        let timeEnd = Date.now();
        if (timeEnd - timeStart < dt) {
            await new Promise((resolve) => setTimeout(resolve, dt - (timeEnd - timeStart)));
        }
    }
}

main();