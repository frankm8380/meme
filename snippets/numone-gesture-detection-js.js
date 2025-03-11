// ----------------------------------------
// Gesture Detection Functions
// ----------------------------------------

/**
 * Detects gestures in the given video frame.
 * @param {HTMLVideoElement} frame - The video frame.
 * @param {CanvasRenderingContext2D} ctx - The drawing context.
 * @returns {string|null} - The detected gesture or null if none found.
 */
function detectGesture(frame, ctx) {
  let handLandmarks = detectHands(frame, ctx);
  if (handLandmarks && handLandmarks.length > 0) {

    let detectMiddleFinger = document.title.includes("NOT");

    if (detectMiddleFinger) {
      for (let index = 0; index < handLandmarks.length; index++) {
        let landmarkSet = handLandmarks[index];
        console.log(landmarkSet);
        if ( debug ) {
        	drawConnectors(ctx, landmarkSet, HAND_CONNECTIONS, {
          	color: "#00FF00", // Green skeleton
          	lineWidth: 5
        	});
        	drawLandmarks(ctx, landmarkSet, {
         	 color: "#FF0000", // Red dots
         	 lineWidth: 2
        	});
		}

        let found = checkMiddleFinger(landmarkSet);
        if (found === 'Middle_Finger') {
          console.log("✅ Middle Finger Detected");
          return found; // ✅ Immediately return once detected
        }
      }
      return null; // If no middle finger is found
    } else {
      return detectThumbsUpGoogle(frame, ctx);
    }
  }
}

/**
 * Detects hands in the given video frame.
 * @param {HTMLVideoElement} frame - The video frame.
 * @param {CanvasRenderingContext2D} ctx - The drawing context.
 * @returns {Array|null} - Array of hand landmarks or null if no hands detected.
 */
function detectHands(frame, ctx) {
  if (!handLandmarkerVideo) {
    console.warn("Hand Landmarker not initialized.");
    return null;
  }
  // Use the current video frame and performance.now() as the timestamp.
  const results = handLandmarkerVideo.detectForVideo(frame, performance.now());
  if (results && results.landmarks && results.landmarks.length > 0) {
    return results.landmarks;
  }
  return null;
}

/**
 * Detects if a thumbs-up gesture is present in the given video frame.
 * @param {HTMLVideoElement} frame - The video frame.
 * @param {CanvasRenderingContext2D} ctx - The drawing context.
 * @returns {string|null} - Returns 'Thumb_Up' if detected, otherwise null.
 */
function detectThumbsUpGoogle(frame, ctx) {
  if (!gestureRecognizerVideo) {
    console.warn("Hand Landmarker not initialized.");
    return null;
  }

  const results = gestureRecognizerVideo.recognizeForVideo(frame, performance.now());

  if (results && results.landmarks && results.landmarks.length > 0) {
    displayHandDetections(results.landmarks, ctx);
  }

  if (results.gestures && results.gestures.length > 0) {
    const gestureName = results.gestures[0][0].categoryName;
    if (gestureName === 'Thumb_Up') {
      return gestureName;
    }
  }

  return null;
}

/**
 * Checks if a middle finger gesture is present in the given hand landmarks.
 * @param {Array} handLandmarks - Array of hand landmarks.
 * @returns {string|null} - Returns 'Middle_Finger' if detected, otherwise null.
 */
function checkMiddleFinger(handLandmarks) {
  if (!handLandmarks || handLandmarks.length < 21) {
    console.log("DEBUG: Insufficient landmarks for middle finger detection.");
    return null;
  }

  // Stricter tolerances to reduce false detections
  const extTolerance = 0.02;    // 🔹 Lowered tolerance for middle finger extension
  const foldTolerance = 0.02;   // 🔹 Lowered tolerance for checking index folding
  const obscuredThreshold = 0.01; // 🔹 Made stricter to avoid weak index detection

  // Middle finger landmarks
  const middle_tip = handLandmarks[12];
  const middle_pip = handLandmarks[10];
  const middle_mcp = handLandmarks[9];

  // Index finger landmarks
  const index_tip = handLandmarks[8];
  const index_pip = handLandmarks[6];
  const index_mcp = handLandmarks[5];

  // Ring finger landmarks
  const ring_tip = handLandmarks[16];
  const ring_pip = handLandmarks[14];

  // Pinky finger landmarks
  const pinky_tip = handLandmarks[20];
  const pinky_pip = handLandmarks[18];

  // ✅ Middle Finger Extension: Check vertical and horizontal positions
  const middleExtended = (middle_tip.y < (middle_pip.y - extTolerance)) &&  // Clearly extended above PIP
                         (middle_pip.y < middle_mcp.y - extTolerance);      // PIP also extended above MCP

  // ✅ Index Finger Folding Check
  const indexDistance = index_tip.y - index_pip.y;
  let indexFolded;
  if (indexDistance < obscuredThreshold) {
    console.log("DEBUG: Index finger appears to be obscured; ignoring index folded check.");
    indexFolded = true;
  } else {
    indexFolded = (index_tip.y > (index_pip.y + foldTolerance)) &&  // Must be bent downward
                  (index_pip.y > index_mcp.y);                      // MCP must be lower than PIP
  }

  // ✅ Check if ring and pinky fingers are also folded
  const ringFolded = (ring_tip.y > ring_pip.y + foldTolerance);
  const pinkyFolded = (pinky_tip.y > pinky_pip.y + foldTolerance);

  console.log(`DEBUG: checkMiddleFinger -> middleExtended: ${middleExtended}, indexDistance: ${indexDistance.toFixed(3)}, indexFolded: ${indexFolded}, ringFolded: ${ringFolded}, pinkyFolded: ${pinkyFolded}`);

  // ✅ Ensure only the middle finger is extended
  if (middleExtended && indexFolded && ringFolded && pinkyFolded) {
    return 'Middle_Finger';
  }
  return null;
}

/**
 * Confirms if a detected gesture has been held long enough for validation.
 * @returns {boolean} - Returns true if the gesture has been held long enough, otherwise false.
 */
function confirmGestureHold() {
  if (isGestureDetected) {
    let elapsedTime = (Date.now() - detectionStartTime) / 1000;
    const { detectionEmoji, successText, noGestureText } = getGestureInfo();
	displayStatusMessage(`${detectionEmoji} ${successText} Taking picture in ${2 - Math.floor(elapsedTime)}s...`);
    return elapsedTime >= 2;
  } else {
    isGestureDetected = true;
    detectionStartTime = Date.now();
    return false;
  }
}


