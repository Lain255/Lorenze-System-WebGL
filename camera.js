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
    far: 1000
}
let movementHandler = (strength) => (event) => {
    if (event.key === "w") {
        camera.movementInput.forward = strength;
    }
    if (event.key === "s") {
        camera.movementInput.back = strength;
    }
    if (event.key === "a") {
        camera.movementInput.left = strength;
    }
    if (event.key === "d") {
        camera.movementInput.right = strength;
    }
    if (event.key === "q") {
        camera.movementInput.down = strength;
    }
    if (event.key === "e") {
        camera.movementInput.up = strength;
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
    globalThis.document.addEventListener("keydown", movementHandler(5))
    globalThis.document.addEventListener("keyup", movementHandler(0));
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
    camera.position = camera.position.map((v, i) => v + rotatedMovementVector[i] * dt/ 1000.0);
}

export { camera, movementHandler, mouseHandler, addCameraInputListeners, moveCamera};