import { compileShader, linkProgram, createBuffer, resizeCanvasToDisplaySize, getUniformLocations, getAttribLocations } from "./gl.js";
import { rotationMatrix } from "./matrix.js";
import { camera, movementHandler, mouseHandler, moveCamera, addCameraInputListeners } from "./camera.js";

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

    const vsSource = await fetch("./vert.glsl").then(res => res.text())
    const fsSource = await fetch("./frag.glsl").then(res => res.text())

    let vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    let fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

    let program = linkProgram(gl, vertexShader, fragmentShader)

    let positions = Array(100).fill(0).flatMap(() => [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, 1]);
    console.log(positions)

    let uniforms = getUniformLocations(gl, program, ["u_cameraRotation", "u_cameraPosition", "u_cameraFov", "u_cameraAspect", "u_cameraNear", "u_cameraFar"])
    let attributes = getAttribLocations(gl, program, ["a_position"]);

    let positionBuffer = createBuffer(gl, new Float32Array(positions), gl.STATIC_DRAW);

    let dt = 16;
    while(true) {
        let timeStart = Date.now();

        let [w, h] = resizeCanvasToDisplaySize(gl.canvas);
        camera.aspect = w / h;

        moveCamera(dt);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(program)
        
        gl.enableVertexAttribArray(attributes.a_position);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        let size = 4;          // 2 components per iteration
        let type = gl.FLOAT;   // the data is 32bit floats
        let normalize = false; // don't normalize the data
        let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        let offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(attributes.a_position, size, type, normalize, stride, offset)
        
        gl.uniformMatrix4fv(uniforms.u_cameraRotation, false, rotationMatrix(camera.rotation[0], camera.rotation[1]));
        gl.uniform4fv(uniforms.u_cameraPosition, camera.position);
        gl.uniform1f(uniforms.u_cameraFov, camera.fov);
        gl.uniform1f(uniforms.u_cameraAspect, camera.aspect);
        gl.uniform1f(uniforms.u_cameraNear, camera.near);
        gl.uniform1f(uniforms.u_cameraFar, camera.far);

        let primitiveType = gl.POINTS;
        offset = 0;
        let count = 100;
        gl.drawArrays(primitiveType, offset, count);

        let timeEnd = Date.now();
        if (timeEnd - timeStart < dt) {
            await new Promise((resolve) => setTimeout(resolve, dt - (timeEnd - timeStart)));
        }
    }
}

main();