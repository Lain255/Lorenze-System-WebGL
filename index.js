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
 
  return needResize;
}


async function main() {

  
  

  const canvas = document.querySelector("#glcanvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl2");

  let camera = {
    position: [0.0, 0.0, 0.0, 1.0],
    rotation: [0, 0, 0],
    fov: 90,
    aspect: 1,
    near: 0.1,
    far: 1000
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

  let positions = [
    0, 0, 0, 1,
    0, 0.5, 0, 1,
    0.7, 0, 0, 1,
  ];

  let cameraPositionLocation = gl.getUniformLocation(program, "u_cameraPosition");
  let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  console.log(cameraPositionLocation)
  console.log(positionAttributeLocation)
  let positionBuffer = createBuffer(gl, new Float32Array(positions), gl.STATIC_DRAW);

  let dt = 16;
  setInterval(() => {

    resizeCanvasToDisplaySize(gl.canvas);
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

    gl.uniform4fv(cameraPositionLocation, camera.position);


    let primitiveType = gl.TRIANGLES;
    offset = 0;
    let count = 3;
    gl.drawArrays(primitiveType, offset, count);
  }, dt);
  
  


}
