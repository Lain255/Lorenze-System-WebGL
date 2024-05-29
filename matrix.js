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


let quaternionMultiply = (q1, q2) => [
    q1[0] * q2[0] - q1[1] * q2[1] - q1[2] * q2[2] - q1[3] * q2[3],
    q1[0] * q2[1] + q1[1] * q2[0] + q1[2] * q2[3] - q1[3] * q2[2],
    q1[0] * q2[2] - q1[1] * q2[3] + q1[2] * q2[0] + q1[3] * q2[1],
    q1[0] * q2[3] + q1[1] * q2[2] - q1[2] * q2[1] + q1[3] * q2[0]
]
let quaternionInverse = (q) => [q[0], -q[1], -q[2], -q[3]]
let quaternionRotate = (q, v) => {
    let p = [0, ...v];
    let qInverse = quaternionInverse(q);
    let result = quaternionMultiply(quaternionMultiply(q, p), qInverse);
    return result.slice(1);
}
let quaternionFromAxisAngle = (axis, angle) => {
    let q = [Math.cos(angle / 2), ...axis.map(x => Math.sin(angle / 2) * x)];
    return q;
}
let quaternionFromEuler = (x, y, z) => {
    let q = quaternionMultiply(quaternionMultiply(
        [Math.cos(x / 2), Math.sin(x / 2), 0, 0],
        [Math.cos(y / 2), 0, Math.sin(y / 2), 0]
    ),  [Math.cos(z / 2), 0, 0, Math.sin(z / 2)]);
    return q;
}

let quaternionToMatrix = (q) => {
    let x = [1, 0, 0];
    let y = [0, 1, 0];
    let z = [0, 0, 1];
    let xx = quaternionRotate(q, x);
    let yy = quaternionRotate(q, y);
    let zz = quaternionRotate(q, z);
    return [
        ...xx, 0,
        ...yy, 0,
        ...zz, 0,
        0, 0, 0, 1
    ]
}


export { rotationMatrix, matrixVectorMultiply, quaternionInverse, quaternionMultiply, quaternionRotate, quaternionFromAxisAngle, quaternionFromEuler, quaternionToMatrix};