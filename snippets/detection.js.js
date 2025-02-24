// Paste Code Below 
/**************************************
 * detection.js – Combined Gesture Detection
 **************************************/

/* ========= Global Variables ========= */
let model = null;          // The handpose model (loaded once)
let videoStream = null;    // The live video stream (for live detection)
let isGestureDetected = false;
let detectionStartTime = null;
let detectionStopped = false;

/* ========= Gesture-Checking Functions ========= */

// Checks if the middle finger is extended.
function checkMiddleFinger(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  const middle_tip = landmarks[12];
  const middle_pip = landmarks[10];
  const middleExtended = middle_tip[1] < middle_pip[1];
  console.log(`Middle Finger Gesture Detected: ${middleExtended}`);
  return middleExtended;
}

// Checks if the thumb is extended in a thumbs-up configuration.
function checkThumbsUp(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  const thumb_tip = landmarks[4];
  const thumb_ip = landmarks[3];
  const thumb_mcp = landmarks[2];
  const thumbExtended = thumb_tip[1] < thumb_ip[1] - 30 && thumb_ip[1] < thumb_mcp[1] - 30;
  console.log(`Thumb Extended: ${thumbExtended}`);
  return thumbExtended;
}

// Additional finger-check functions
function checkIndexFinger(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  const index_tip = landmarks[8];
  const index_pip = landmarks[6];
  return index_tip[1] < index_pip[1];
}

function checkRingFinger(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  const ring_tip = landmarks[16];
  const ring_pip = landmarks[14];
  return ring_tip[1] < ring_pip[1];
}

function checkPinkyFinger(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;
  const pinky_tip = landmarks[20];
  const pinky_pip = landmarks[18];
  return pinky_tip[1] < pinky_pip[1];
}

/* ========= File Detection Functions ========= */

// Generic helper to detect a gesture from an image file.
async function detectGestureFromFileGeneric(filePath, gestureCheck) {
  if (!model) {
    model = await handpose.load();
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = filePath;
    image.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      try {
        const predictions = await model.estimateHands(canvas);
        if (predictions.length > 0) {
          let detected = false;
          predictions.forEach(prediction => {
            if (gestureCheck(prediction.landmarks)) {
              detected = true;
            }
          });
          resolve(detected);
        } else {
          resolve(false); // No hand detected
        }
      } catch (error) {
        reject(false);
      }
    };
    image.onerror = () => {
      reject(false);
    };
  });
}

// Detects a middle finger gesture from an image file.
async function detectMiddleFingerFromFile(filePath) {
  return detectGestureFromFileGeneric(filePath, checkMiddleFinger);
}

// Detects a thumbs-up gesture from an image file.
async function detectThumbsUpFromFile(filePath) {
  return detectGestureFromFileGeneric(filePath, checkThumbsUp);
}

/* ========= Live (Camera) Detection Functions ========= */

// Returns the gesture parameters based on the document title.
function getGestureInfo() {
  if (document.title.indexOf("NOT") > -1) {
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
  videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
  video.srcObject = videoStream;
  video.style.display = "block";
  if (!model) {
    model = await handpose.load();
  }
  detectHands();
}

// Continuously detects hands from the video stream.
async function detectHands() {
  if (!model || detectionStopped) return;
  const video = document.getElementById("webcam");
  const { gestureCheck, detectionEmoji, successText, noGestureText } = getGestureInfo();

  async function detect() {
    if (detectionStopped) return;
    const predictions = await model.estimateHands(video);
    let gestureDetectedLocal = false;

    if (predictions.length > 0) {
      predictions.forEach(prediction => {
        if (gestureCheck(prediction.landmarks)) {
          gestureDetectedLocal = true;
          if (!isGestureDetected) {
            isGestureDetected = true;
            detectionStartTime = Date.now();
          } else {
            const elapsedTime = (Date.now() - detectionStartTime) / 1000;
            document.getElementById("result").innerText = `${detectionEmoji} ${successText} Taking picture in ${3 - Math.floor(elapsedTime)}s...`;
            document.getElementById("result").style.color = "green";
            if (elapsedTime >= 3) {
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
