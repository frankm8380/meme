// ✅ Initialize Face Detector Instances
let faceDetectorVideo;
let faceDetectorImage;

// ✅ Function to Create Face Detector with Mode
async function createFaceDetector(mode = "VIDEO") {
    console.log("DEBUG: Initializing MediaPipe Face Detector in", mode, "mode...");
    
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    const options = {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: "GPU"
        },
        runningMode: mode
    };

    if (mode === "IMAGE") {
        faceDetectorImage = await FaceDetector.createFromOptions(vision, options);
    } else {
        faceDetectorVideo = await FaceDetector.createFromOptions(vision, options);
    }

    console.log("DEBUG: Face Detector is ready for", mode, "mode.");
}

// ✅ Function to Start Face Detection from Webcam
async function detectFaceFromWebcam() {
    console.log("DEBUG: Running detectFaceFromWebcam...");

    let video;
    let canvas;
    let ctx;
    let isRunning = true;

    try {
        // ✅ Create Video Element
        video = document.createElement("video");
        video.autoplay = true;
        video.style.display = "none";
        document.body.appendChild(video);

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        await new Promise((resolve) => (video.onloadeddata = resolve));

        // ✅ Create Canvas
        canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        ctx = canvas.getContext("2d");

        if (!faceDetectorVideo) {
            await createFaceDetector("VIDEO");
        }

        async function processFrame() {
            if (!isRunning || video.paused || video.ended) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const results = faceDetectorVideo.detectForVideo(video, performance.now()).detections;
            displayFaceDetections(results, ctx);

            requestAnimationFrame(processFrame);
        }

        processFrame();

        // ✅ Open Popup for Face Detection
        const popup = window.open("", "_blank", "width=650,height=500");
        if (popup) {
            popup.document.write(`
                <html>
                    <head>
                        <title>Face Detection</title>
                        <style>
                            body { margin: 0; display: flex; align-items: center; justify-content: center; background: #eee; }
                            canvas { border: 1px solid #ccc; }
                        </style>
                    </head>
                    <body></body>
                </html>
            `);
            popup.document.body.appendChild(canvas);

            // ✅ Monitor Popup Closure to Stop Detection
            let popupInterval = setInterval(() => {
                if (popup.closed) {
                    console.log("DEBUG: Popup closed. Stopping face detection...");
                    stopFaceDetection();
                    clearInterval(popupInterval);
                }
            }, 500);
        } else {
            console.error("ERROR: Popup blocked! Allow popups for this site.");
        }
    } catch (error) {
        console.error("ERROR: Unable to access webcam.", error);
    }

    function stopFaceDetection() {
        console.log("DEBUG: Stopping face detection...");
        isRunning = false;

        // ✅ Stop webcam stream
        if (video && video.srcObject) {
            let tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }

        if (video) video.remove();
        if (canvas) canvas.remove();
    }
}

// ✅ Function to Process an Uploaded Image and Detect Faces
async function detectFaceFromFile() {
    console.log("DEBUG: Image file processing started...");

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    document.body.appendChild(input);

    input.addEventListener("change", async function (event) {
        const file = event.target.files[0];

        if (!file) {
            console.error("ERROR: No file selected.");
            return;
        }

        const reader = new FileReader();

        reader.onload = async function (e) {
            const image = new Image();
            image.src = e.target.result;

            image.onload = async function () {
                console.log("DEBUG: Image loaded, processing for face detection...");

                // ✅ Create Canvas to Draw Image
                const canvas = document.createElement("canvas");
                canvas.width = image.width;
                canvas.height = image.height;
                const ctx = canvas.getContext("2d");

                ctx.drawImage(image, 0, 0, image.width, image.height);

                if (!faceDetectorImage) {
                    await createFaceDetector("IMAGE");
                }

                // ✅ Run Face Detection
                const results = faceDetectorImage.detect(image).detections;

                displayFaceDetections(results, ctx);

                // ✅ Open Popup to Display Processed Image
                const popup = window.open("", "_blank", "width=" + image.width + ",height=" + image.height);
                if (popup) {
                    popup.document.write(`
                        <html>
                            <head>
                                <title>Face Detection on Image</title>
                                <style>
                                    body { margin: 0; display: flex; align-items: center; justify-content: center; background: #eee; }
                                    canvas { border: 1px solid #ccc; }
                                </style>
                            </head>
                            <body></body>
                        </html>
                    `);
                    popup.document.body.appendChild(canvas);
                } else {
                    console.error("ERROR: Popup blocked! Please allow popups for this site.");
                }
            };
        };

        reader.readAsDataURL(file);
    });

    input.click();
    setTimeout(() => input.remove(), 1000);
}

// ✅ Function to Display Face Detection Results
function displayFaceDetections(detections, ctx) {
    detections.forEach(detection => {
        const x = detection.boundingBox.originX;
        const y = detection.boundingBox.originY;
        const width = detection.boundingBox.width;
        const height = detection.boundingBox.height;

        console.log(`DEBUG: Face Bounding Box -> X:${x}, Y:${y}, Width:${width}, Height:${height}`);

        // ✅ Draw Bounding Box
        ctx.strokeStyle = "limegreen";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // ✅ Draw Confidence Score
        const confidence = Math.round(detection.categories[0].score * 100);
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(x, y - 25, 80, 20);
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(`Conf: ${confidence}%`, x + 5, y - 10);
    });
}
