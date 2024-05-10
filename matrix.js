let rotationMatrix = (theta, phi) => {
    let cosTheta = Math.cos(theta);
    let sinTheta = Math.sin(theta);
    let cosPhi = Math.cos(phi);
    let sinPhi = Math.sin(phi);

    let matrix = [
        cosTheta, sinTheta*sinPhi, sinTheta*cosPhi, 0,
        0, cosPhi, -sinPhi, 0,
        -sinTheta, cosTheta*sinPhi, cosTheta * cosPhi, 0,
        0, 0, 0, 1

    ]
    return matrix
}
let matrixVectorMultiply = (matrix, vector) => {
    let result = Array(4).fill(0);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            result[i] += matrix[4 * i + j] * vector[j];
        }
    }
    return result;
}

export { rotationMatrix, matrixVectorMultiply};