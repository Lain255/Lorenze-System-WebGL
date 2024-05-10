main();

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("An error occurred compiling the shader:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function linkProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program
}

function createBuffer(gl, data, hint) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, hint);
    return buffer;
}

function resizeCanvasToDisplaySize(canvas) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // Check if the canvas is not the same size.
    const needResize = canvas.width  !== displayWidth ||
                       canvas.height !== displayHeight;
    
    if (needResize) {
        // Make the canvas the same size
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
    }
  
    return [displayWidth, displayHeight];
}

async function main() {
    const canvas = document.querySelector("#glcanvas");
    // Initialize the GL context
    const gl = canvas.getContext("webgl2");

    canvas.addEventListener("click", async () => {
        await canvas.requestPointerLock();
    });
    
    let camera = {
        position: [0.0, 0.0, -2.0],
        rotation: [0, 0],
        fov: 1,
        aspect: 1,
        near: 0.1,
        far: 1000
    }
    let rotationMatrix = (theta, phi) => {
        let cosTheta = Math.cos(theta);
        let sinTheta = Math.sin(theta);
        let cosPhi = Math.cos(phi);
        let sinPhi = Math.sin(phi);

        let matrix = [
            cosTheta, 0, -sinTheta, 0,
            sinTheta * sinPhi, cosPhi, cosTheta * sinPhi, 0,
            sinTheta * cosPhi, -sinPhi, cosTheta * cosPhi, 0,
            0, 0, 0, 1

        ]
        return matrix
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "w") {
            camera.position[2] += 0.01;
        }
        if (event.key === "s") {
            camera.position[2] -= 0.01;
        }
        if (event.key === "a") {
            camera.position[0] -= 0.01;
        }
        if (event.key === "d") {
            camera.position[0] += 0.01;
        }
        if (event.key === "q") {
            camera.position[1] -= 0.01;
        }
        if (event.key === "e") {
            camera.position[1] += 0.01;
        }
    });

    document.addEventListener("mousemove", (event) => {
        if (document.pointerLockElement === canvas) {
            camera.rotation[0] += event.movementX / 1000;
            if (camera.rotation[1] + event.movementY / 1000 < Math.PI / 2 && camera.rotation[1] + event.movementY / 1000 > -Math.PI / 2) {
                camera.rotation[1] += event.movementY / 1000;

            }
        }

    })

    // Only continue if WebGL is available and working
    if (gl === null) {
      alert(
        "Unable to initialize WebGL. Your browser or machine may not support it."
      );
      return;
    }

    const vsSource = await fetch("./vert.glsl").then(res => res.text())
    const fsSource = await fetch("./frag.glsl").then(res => res.text())

    let vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    let fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

    let program = linkProgram(gl, vertexShader, fragmentShader)

    let positions = Array(100).fill(0).flatMap(() => [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, 1]);
    console.log(positions)

    let uniforms = {
        u_cameraRotation: gl.getUniformLocation(program, "u_cameraRotation"),
        u_cameraPosition: gl.getUniformLocation(program, "u_cameraPosition"),
        u_cameraFov: gl.getUniformLocation(program, "u_cameraFov"),
        u_cameraAspect: gl.getUniformLocation(program, "u_cameraAspect"),
        u_cameraNear: gl.getUniformLocation(program, "u_cameraNear"),
        u_cameraFar: gl.getUniformLocation(program, "u_cameraFar")
    }
    let positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    console.log(positionAttributeLocation)
    let positionBuffer = createBuffer(gl, new Float32Array(positions), gl.STATIC_DRAW);

    let dt = 16;
    setInterval(() => {
        let [w, h] = resizeCanvasToDisplaySize(gl.canvas);
        camera.aspect = w / h;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(program)
        
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        let size = 4;          // 2 components per iteration
        let type = gl.FLOAT;   // the data is 32bit floats
        let normalize = false; // don't normalize the data
        let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        let offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)
        
        gl.uniformMatrix4fv(uniforms.u_cameraRotation, true, rotationMatrix(camera.rotation[0], camera.rotation[1]));
        gl.uniform4fv(uniforms.u_cameraPosition, [...camera.position, 0]);
        gl.uniform1f(uniforms.u_cameraFov, camera.fov);
        gl.uniform1f(uniforms.u_cameraAspect, camera.aspect);
        gl.uniform1f(uniforms.u_cameraNear, camera.near);
        gl.uniform1f(uniforms.u_cameraFar, camera.far);
        
        let primitiveType = gl.POINTS;
        offset = 0;
        let count = 100;
        gl.drawArrays(primitiveType, offset, count);
    }, dt);
}