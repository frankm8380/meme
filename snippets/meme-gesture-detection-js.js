//<?php
//
// ----------------------------------------
// Gesture Detection Functions (Unified with .task file)
// ----------------------------------------

/**
 * Detects gestures in the given video frame using the .task model.
 * - Only accepts 'Middle_Finger' if document.title includes 'NOT'
 * - Only accepts 'Thumb_Up' otherwise
 * @param {HTMLVideoElement} frame - The video frame.
 * @param {CanvasRenderingContext2D} ctx - The drawing context.
 * @returns {string|null} - The detected gesture or null if none found.
 */
function detectGesture(frame, ctx) {
  if (!gestureRecognizerCustomVideo) {
    console.warn("Gesture Recognizer not initialized.");
    return null;
  }

  const detectMiddleFingerOnly = document.title.includes("NOT");
  const results = gestureRecognizerCustomVideo.recognizeForVideo(frame, performance.now());

  const numHands = results.landmarks ? results.landmarks.length : 0;
  console.log(`🖐️ Hands detected: ${numHands}`);

  if (results.gestures && results.gestures.length > 0) {
    const gestures = results.gestures;

    const allowedGesture = detectMiddleFingerOnly ? 'middleFinger' : 'thumbsUp';
    let matchCount = 0;
    let highestScore = 0;

    // Count how many hands match the allowed gesture
    for (let i = 0; i < gestures.length; i++) {
      const gesture = gestures[i][0];
      if (gesture.categoryName === allowedGesture && gesture.score > 0.75) {
        matchCount++;
        highestScore = Math.max(highestScore, gesture.score);
      }
    }

    if (matchCount === 2) {
      displayErrorMessage("🔥⚠️ That's a Number 11! One hand only please.");
      return null;
    }

    if (numHands > 1) {
      displayErrorMessage("⚠️ One hand only please.");
      return null;
    }

    if (matchCount === 1) {
      console.log(`✅ Single ${allowedGesture} detected`);
      return allowedGesture;
    }
  }

  const { noGestureText } = getGestureInfo();
  displayErrorMessage(noGestureText);
	
  return null;
}

/**
 * Confirms if a detected gesture has been held long enough for validation.
 * @returns {boolean} - Returns true if the gesture has been held long enough, otherwise false.
 */
function confirmGestureHold() {
  if (isGestureDetected) {
    let elapsedTime = (Date.now() - detectionStartTime) / 1000;
    const { detectionEmoji, successText } = getGestureInfo();
    displayStatusMessage(`${detectionEmoji} ${successText} Taking picture in ${2 - Math.floor(elapsedTime)}s...`);
    return elapsedTime >= 2;
  } else {
    isGestureDetected = true;
    detectionStartTime = Date.now();
    return false;
  }
}
