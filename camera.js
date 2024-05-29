import { rotationMatrix, matrixVectorMultiply, quaternionFromAxisAngle, quaternionFromEuler, quaternionMultiply, quaternionToMatrix, quaternionRotate } from "./matrix.js";

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
    rotationQuaternion: [1, 0, 0, 0],
    deviceOrientationQuaternion: [1, 0, 0, 0],
    mouseQuaternion: [1, 0, 0, 0],
    rotationMatrix: [
        1, 0, 0, 0, 
        0, 1, 0, 0, 
        0, 0, 1, 0, 
        0, 0, 0, 1
    ],
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
let addCameraInputListeners = (canvas, dt) => {
    let mobileTouchscreen = true;
    let deviceOrientation = true;
    let deviceMotion = false;


    canvas.addEventListener("click", () => {
        if (globalThis.document.pointerLockElement !== canvas) {
            canvas.requestPointerLock();
        }
    });
    if(globalThis.document.fullscreenEnabled) {
        canvas.addEventListener("click", () => {
            canvas.requestFullscreen();
        })
    }


    globalThis.document.addEventListener("keydown", movementHandler)
    globalThis.document.addEventListener("keyup", movementHandler);
    globalThis.document.addEventListener("mousemove", mouseHandler(canvas));
    globalThis.document.addEventListener("keydown", (event) => {
        if (event.key.toLowerCase() === "f") {
            canvas.requestFullscreen().catch(console.error);
        }
    })

    
    


    if (deviceOrientation && globalThis.DeviceOrientationEvent) {
        let initialOrientation = {}
        globalThis.addEventListener("deviceorientationabsolute", (event) => {
            initialOrientation.alpha = initialOrientation.alpha ?? event.alpha;
            initialOrientation.beta = initialOrientation.beta ?? event.beta;
            initialOrientation.gamma = initialOrientation.gamma ?? event.gamma;

            let q = [1,0,0,0]
            q = quaternionMultiply(q, quaternionFromAxisAngle(quaternionRotate(q, [0, 1, 0]), (event.gamma) * Math.PI / 180));
            q = quaternionMultiply(q, quaternionFromAxisAngle(quaternionRotate(q, [1, 0, 0]), (event.beta) * Math.PI / 180));
            q = quaternionMultiply(q, quaternionFromAxisAngle(quaternionRotate(q, [0, 0, 1]), (-event.alpha) * Math.PI / 180));
            //q = quaternionMultiply(q, quaternionFromAxisAngle([1, 0, 0], Math.PI));

            camera.deviceOrientationQuaternion = q;
        });
    }

    if (deviceMotion && globalThis.DeviceMotionEvent) {
        globalThis.addEventListener("devicemotion", (event) => {
            console.log(event.interval)
            camera.rotation[0] += -(event.interval/10000) * event.rotationRate.beta * Math.PI / 180;
            camera.rotation[1] += -(event.interval/10000) * event.rotationRate.alpha * Math.PI / 180;
        });
    }


    if (mobileTouchscreen) {
        let touchID = undefined
        let touchStartX = 0;
        let touchStartY = 0;

        canvas.addEventListener("touchmove", (evt) => {
            let dx = evt.touches[0].clientX - touchStartX
            let dy = evt.touches[0].clientY - touchStartY
            touchStartX = evt.touches[0].clientX
            touchStartY = evt.touches[0].clientY
        
            if (evt.touches[0].identifier === touchID) {
                touchID = undefined
                camera.rotation[0] += dx / 100;
                camera.rotation[1] += dy / 100;
            }
            else {
                touchID = evt.touches[0].identifier
            }
        })
        canvas.addEventListener("touchend", (event) => {
            if (event.touches.length === 0) {
                touchID = undefined;
            }
        }, false)

    }

}
let moveCamera = (dt) => {
    let mouseQuaternion = quaternionMultiply(quaternionFromAxisAngle([1, 0, 0], -camera.rotation[1]), quaternionFromAxisAngle([0, 1, 0], -camera.rotation[0]));
    let deviceOrientationQuaternion = camera.deviceOrientationQuaternion;
    camera.rotationQuaternion = quaternionMultiply( deviceOrientationQuaternion, mouseQuaternion);
    camera.rotationMatrix = quaternionToMatrix(camera.rotationQuaternion);

    let movementVector = [
        camera.movementInput.right - camera.movementInput.left, 
        camera.movementInput.up - camera.movementInput.down, 
        camera.movementInput.forward - camera.movementInput.back,
        0
    ];
    let rotatedMovementVector = matrixVectorMultiply(camera.rotationMatrix, movementVector);
    camera.position = camera.position.map((v, i) => v + rotatedMovementVector[i] * (camera.shifted ? 5 : 1) * dt/ 1000.0);

    
}

export { camera, movementHandler, mouseHandler, addCameraInputListeners, moveCamera};