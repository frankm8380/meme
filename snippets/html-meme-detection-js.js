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
    try {
        hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.55,
            minTrackingConfidence: 0.5,
        });

        await hands.initialize();
        console.log("✅ MediaPipe Hands model loaded");
    } catch (error) {
        console.error("ERROR: Failed to initialize MediaPipe Hands:", error);
        // Option 1: Reload the page after a short delay
        setTimeout(() => {
            console.warn("Reloading page to attempt to recover from WASM initialization error.");
            location.reload();
        }, 3000);

        // Option 2: Alternatively, display a user message and prompt them to refresh manually.
        // document.getElementById("result").innerText = "An error occurred loading the hand detection module. Please refresh the page.";
    }
}

// Returns the gesture parameters based on the document title.
function getGestureInfo() {
    if (document.title.includes("NOT")) {
        console.log("DEBUG: Gesture Info set to Middle Finger detection.");
        return {
            gestureCheck: checkMiddleFinger,
            detectionEmoji: "🖕",
            noGestureText: "No Middle Finger Detected.",
            successText: "Middle Finger Detected!"
        };
    } else {
        console.log("DEBUG: Gesture Info set to Thumbs Up detection.");
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
    console.log("DEBUG: Starting camera...");
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
    if (!hands || detectionStopped) {
        console.log("DEBUG: Hands not ready or detection stopped.");
        return;
    }
    const { gestureCheck, detectionEmoji, successText, noGestureText } = getGestureInfo();

    async function detect() {
        if (detectionStopped) {
            console.log("DEBUG: Detection is stopped; exiting detect loop.");
            return;
        }

        // Capture the current frame
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        console.log("DEBUG: Captured a frame from video.");

        // Run MediaPipe Hands on the frame
        hands.onResults((results) => {
            console.log("DEBUG: Received results from MediaPipe:", results);
            let gestureDetectedLocal = false;

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                results.multiHandLandmarks.forEach((landmarks, idx) => {
                    console.log(`DEBUG: Processing landmarks for hand ${idx}:`, landmarks);
                    if (gestureCheck(landmarks)) {
                        console.log(`DEBUG: Gesture detected on hand ${idx}.`);
                        gestureDetectedLocal = true;
                        if (!isGestureDetected) {
                            isGestureDetected = true;
                            detectionStartTime = Date.now();
                            console.log("DEBUG: Gesture detection started.");
                        } else {
                            const elapsedTime = (Date.now() - detectionStartTime) / 1000;
                            document.getElementById("result").innerText = `${detectionEmoji} ${successText} Taking picture in ${2 - Math.floor(elapsedTime)}s...`;
                            document.getElementById("result").style.color = "green";
                            console.log(`DEBUG: Gesture detected for ${elapsedTime.toFixed(2)} seconds.`);
                            if (elapsedTime >= 2) {
                                captureImage();
                                detectionStopped = true;
                                console.log("DEBUG: Detection duration met; capturing image and stopping detection.");
                                return;
                            }
                        }
                    } else {
                        console.log(`DEBUG: Gesture not detected for hand ${idx}.`);
                    }
                });
            } else {
                console.log("DEBUG: No hand landmarks detected.");
            }

            if (!gestureDetectedLocal) {
                resetDetectionMessage();
            }

            requestAnimationFrame(detect);
        });

        hands.send({ image: canvas });
        console.log("DEBUG: Sent canvas frame to MediaPipe.");
    }

    detect();
}

// Resets the live detection UI and state.
function resetDetectionMessage() {
    console.log("DEBUG: Resetting detection message and state.");
    isGestureDetected = false;
    detectionStartTime = null;
    const { noGestureText } = getGestureInfo();
    document.getElementById("result").innerText = noGestureText;
    document.getElementById("result").style.color = "red";
}

// Capture an image from the video stream
function captureImage() {
    console.log("DEBUG: Capturing image from video stream.");
    const video = document.getElementById("webcam");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataURL = canvas.toDataURL("image/png");
    console.log("📸 Image captured:", imageDataURL);
}

// Improved Middle Finger Detection with additional debugging
function checkMiddleFingerImproved(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    console.log("DEBUG: Insufficient landmarks for middle finger detection.");
    return false;
  }
  
  // Tolerances for checking:
  const extTolerance = 0.05;    // For middle finger extension
  const foldTolerance = 0.025;  // For checking that the index finger is folded
  const obscuredThreshold = 0.03; // If index finger tip - pip is less than this, consider it obscured
  
  // Middle finger landmarks
  const middle_tip = landmarks[12];
  const middle_pip = landmarks[10];
  
  // Index finger landmarks
  const index_tip = landmarks[8];
  const index_pip = landmarks[6];
  
  // Check middle finger extension:
  const middleExtended = middle_tip.y < (middle_pip.y - extTolerance);
  
  // Compute the vertical distance for the index finger:
  const indexDistance = index_tip.y - index_pip.y;
  let indexFolded;
  if (indexDistance < obscuredThreshold) {
    console.log("DEBUG: Index finger appears to be obscured; ignoring index folded check.");
    indexFolded = true;
  } else {
    indexFolded = index_tip.y > (index_pip.y + foldTolerance);
  }
  
  console.log(`DEBUG: checkMiddleFingerImproved -> middleExtended: ${middleExtended}, indexDistance: ${indexDistance.toFixed(3)}, indexFolded: ${indexFolded}`);
  
  return middleExtended && indexFolded;
}

function checkMiddleFingerImproved2(landmarks) {
    if (!landmarks || landmarks.length < 21) {
        console.log("DEBUG: Insufficient landmarks for middle finger detection.");
        return false;
    }
    // Tolerances for checking:
    const extTolerance = 0.05;    // For checking middle finger extension
    const foldTolerance = 0.02;  // For checking that the index and ring fingers are folded

    // Middle finger landmarks
    const middle_tip = landmarks[12];
    const middle_pip = landmarks[10];

    // Index finger landmarks
    const index_tip = landmarks[8];
    const index_pip = landmarks[6];

    // Ring finger landmarks
    const ring_tip = landmarks[16];
    const ring_pip = landmarks[14];

    // Check that the middle finger is extended:
    const middleExtended = middle_tip.y < (middle_pip.y - extTolerance);
    // Check that the index finger is folded (its tip is below its pip by at least the tolerance):
    const indexFolded = index_tip.y > (index_pip.y + foldTolerance);
    // Check that the ring finger is folded (its tip is below its pip by at least the tolerance):
    const ringFolded = ring_tip.y > (ring_pip.y + foldTolerance);

    console.log(`DEBUG: checkMiddleFingerImproved -> middleExtended: ${middleExtended}, indexFolded: ${indexFolded}, ringFolded: ${ringFolded}`);

    return middleExtended && indexFolded && ringFolded;
}

// Updated for MediaPipe landmarks (normalized coordinates)
function checkMiddleFinger(landmarks) {
    // Use improved version
    return checkMiddleFingerImproved(landmarks);
    
    // Original code below (currently unreachable)
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

    return middleExtended && !indexExtended; // Adjust further if you want to reject when index is extended
}

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

// // Additional finger-check functions...
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
