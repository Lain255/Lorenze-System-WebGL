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
            
            camera.rotation[0] = -(event.alpha-initialOrientation.alpha) * Math.PI / 180;
            camera.rotation[1] = (event.beta-initialOrientation.beta) * Math.PI / 180 % (Math.PI);
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
                camera.movementInput.left = dx;
                camera.movementInput.up = dy;
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