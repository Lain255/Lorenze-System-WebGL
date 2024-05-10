import { rotationMatrix, matrixVectorMultiply } from "./matrix.js";

let camera = {
    movementInput: {
        forward: 0,
        right: 0,
        up: 0,
        back: 0,
        left: 0,
        down: 0
    },
    position: [0.0, 0.0, -2.0, 0],
    rotation: [0, 0],
    fov: 1,
    aspect: 1,
    near: 0.1,
    far: 1000,
    shifted: false
}
let directionDict = {
    "w": "forward",
    "s": "back",
    "a": "left",
    "d": "right",
    "q": "down",
    "e": "up"
}
let movementHandler = (event) => {
    let strength = (event.type === "keydown" ? 10 : 0)
    
    if (event.key.toLowerCase() in directionDict) {
        camera.movementInput[directionDict[event.key.toLowerCase()]] = strength;
    }
    if (event.key.toLowerCase() === "r") {
        camera.position = [0,0,0,0];
        camera.rotation = [0,0];
    }
    if (event.key.toLowerCase() === "shift") {
        camera.shifted = event.type === "keydown";
    }
}
let mouseHandler = (canvas) => (event) => {
    if (globalThis.document.pointerLockElement === canvas) {
        camera.rotation[0] += event.movementX / 1000;
        if (camera.rotation[1] + event.movementY / 1000 < Math.PI / 2 && camera.rotation[1] + event.movementY / 1000 > -Math.PI / 2) {
            camera.rotation[1] += event.movementY / 1000;

        }
    }
}
let addCameraInputListeners = (canvas) => {
    canvas.addEventListener("click", async () => {
        await canvas.requestPointerLock();
    });
    globalThis.document.addEventListener("keydown", movementHandler)
    globalThis.document.addEventListener("keyup", movementHandler);
    globalThis.document.addEventListener("mousemove", mouseHandler(canvas));
}
let moveCamera = (dt) => {
    let movementVector = [
        camera.movementInput.right - camera.movementInput.left, 
        camera.movementInput.up - camera.movementInput.down, 
        camera.movementInput.forward - camera.movementInput.back,
        0
    ];
    let cameraRotationMatrix = rotationMatrix(camera.rotation[0], camera.rotation[1])
    let rotatedMovementVector = matrixVectorMultiply(cameraRotationMatrix, movementVector);
    camera.position = camera.position.map((v, i) => v + rotatedMovementVector[i] * (camera.shifted ? 5 : 1) * dt/ 1000.0);
}

export { camera, movementHandler, mouseHandler, addCameraInputListeners, moveCamera};