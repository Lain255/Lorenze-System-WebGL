let compileShader = (gl, type, source) => {
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
let linkProgram = (gl, vertexShader, fragmentShader, transformFeedbackVaryings) => {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    if (transformFeedbackVaryings) {
        gl.transformFeedbackVaryings(program, transformFeedbackVaryings, gl.SEPARATE_ATTRIBS);
    }
    gl.linkProgram(program);
    return program
}
let getUniformLocations = (gl, program, positions) => positions.reduce((acc, pos) => { acc[pos] = gl.getUniformLocation(program, pos); return acc; }, {});
let getAttribLocations = (gl, program, positions) => positions.reduce((acc, pos) => { acc[pos] = gl.getAttribLocation(program, pos); return acc; }, {});
let createBuffer = (gl, data, hint) => {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, hint);
    return buffer;
}
let resizeCanvasToDisplaySize = (canvas) => {
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

let makeVertexArray = (gl, bufLocPairs) => {
    const va = gl.createVertexArray();
    gl.bindVertexArray(va);
    for (const [buffer, loc] of bufLocPairs) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(
            loc,      // attribute location
            4,        // number of elements
            gl.FLOAT, // type of data
            false,    // normalize
            0,        // stride (0 = auto)
            0,        // offset
        );
    }
    return va;
}
  

export { compileShader, linkProgram, createBuffer, getUniformLocations, getAttribLocations, resizeCanvasToDisplaySize, makeVertexArray };