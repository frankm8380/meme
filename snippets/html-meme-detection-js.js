/**************************************
 * detection.js – Live Gesture Detection (MediaPipe Version)
 **************************************/

/* ========= Global Variables ========= */
let videoStream = null;    // The live video stream (for live detection)
let isGestureDetected = false;
let detectionStartTime = null;
let detectionStopped = false;
let hands = null; // MediaPipe Hands instance

// Load MediaPipe Hands
async function loadMediaPipeHands() {
    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.5,
    });

    await hands.initialize();
    console.log("✅ MediaPipe Hands model loaded");
}

// Returns the gesture parameters based on the document title.
function getGestureInfo() {
    if (document.title.includes("NOT")) {
        return {
            gestureCheck: checkMiddleFinger,
            detectionEmoji: "🖕",
            noGestureText: "No Middle Finger Detected.",
            successText: "Middle Finger Detected!"
        };
    } else {
        return {
            gestureCheck: checkThumbsUp,
            detectionEmoji: "👍",
            noGestureText: "No Thumbs Up Detected.",
            successText: "Thumbs Up Detected!"
        };
    }
}

// Starts the camera and begins live gesture detection.
async function startCamera() {
    const video = document.getElementById("webcam");
    
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        video.srcObject = videoStream;
        video.style.display = "block";
        console.log("🎥 Camera started.");

        if (!hands) {
            await loadMediaPipeHands();
        }
        detectHands(video);
    } catch (error) {
        console.error("❌ Error starting camera:", error);
    }
}

// Continuously detects hands from the video stream.
async function detectHands(video) {
    if (!hands || detectionStopped) return;
    const { gestureCheck, detectionEmoji, successText, noGestureText } = getGestureInfo();

    async function detect() {
        if (detectionStopped) return;

        // Capture the current frame
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Run MediaPipe Hands on the frame
        hands.onResults((results) => {
            let gestureDetectedLocal = false;

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                results.multiHandLandmarks.forEach(landmarks => {
                    if (gestureCheck(landmarks)) {
                        gestureDetectedLocal = true;
                        if (!isGestureDetected) {
                            isGestureDetected = true;
                            detectionStartTime = Date.now();
                        } else {
                            const elapsedTime = (Date.now() - detectionStartTime) / 1000;
                            document.getElementById("result").innerText = `${detectionEmoji} ${successText} Taking picture in ${2 - Math.floor(elapsedTime)}s...`;
                            document.getElementById("result").style.color = "green";
                            if (elapsedTime >= 2) {
                                captureImage();
                                detectionStopped = true;
                                return;
                            }
                        }
                    }
                });
            }

            if (!gestureDetectedLocal) {
                resetDetectionMessage();
            }

            requestAnimationFrame(detect);
        });

        hands.send({ image: canvas });
    }

    detect();
}

// Resets the live detection UI and state.
function resetDetectionMessage() {
    isGestureDetected = false;
    detectionStartTime = null;
    const { noGestureText } = getGestureInfo();
    document.getElementById("result").innerText = noGestureText;
    document.getElementById("result").style.color = "red";
}

// Capture an image from the video stream
function captureImage() {
    const video = document.getElementById("webcam");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataURL = canvas.toDataURL("image/png");
    console.log("📸 Image captured:", imageDataURL);
}

// Updated for MediaPipe landmarks (normalized coordinates)
function checkMiddleFinger(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;

    const middle_tip = landmarks[12];
    const middle_pip = landmarks[10];
    const index_tip = landmarks[8];
    const index_pip = landmarks[6];
    const ring_tip = landmarks[16];

    console.log(`🖕 Middle Tip: Y=${middle_tip.y}, PIP: Y=${middle_pip.y}`);
    console.log(`☝️ Index Tip: Y=${index_tip.y}, PIP: Y=${index_pip.y}`);

    const tolerance = 0.05;
    const middleExtended =
        (middle_tip.y < (middle_pip.y + tolerance)) &&
        (middle_tip.y < (index_tip.y - tolerance)) &&
        (middle_tip.y < (ring_tip.y - tolerance));

    const indexExtended = index_tip.y < (index_pip.y - tolerance);

    console.log(`✅ Middle Finger Extended? ${middleExtended}`);
    console.log(`🚨 Index Finger Extended? ${indexExtended} (Threshold: ${tolerance})`);

    return middleExtended; // Adjust further if you want to reject when index is extended
}

// Checks for a thumbs-up gesture
function checkThumbsUp(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;
    const thumb_tip = landmarks[4];
    const thumb_ip = landmarks[3];
    const thumb_mcp = landmarks[2];
    const tolerance = 0.05;
    const thumbExtended = thumb_tip.y < (thumb_ip.y - tolerance) && thumb_ip.y < (thumb_mcp.y - tolerance);
    console.log(`👍 Thumbs Up Detected? ${thumbExtended}`);
    return thumbExtended;
}
// Additional finger-check functions...
function checkIndexFinger(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;
    const index_tip = landmarks[8];
    const index_pip = landmarks[6];
    return index_tip.y < index_pip.y;
}

function checkRingFinger(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;
    const ring_tip = landmarks[16];
    const ring_pip = landmarks[14];
    return ring_tip.y < ring_pip.y;
}

function checkPinkyFinger(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;
    const pinky_tip = landmarks[20];
    const pinky_pip = landmarks[18];
    return pinky_tip.y < pinky_pip.y;
}
function checkHandGesture(landmarks) {
    return checkMiddleFinger(landmarks) && !checkIndexFinger(landmarks);
}
function stopDetection() {
    detectionStopped = true;
    console.log("🛑 Gesture detection stopped.");
}
function resumeDetection() {
    detectionStopped = false;
    console.log("🔄 Gesture detection resumed.");
}
