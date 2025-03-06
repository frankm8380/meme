// =========================
// 🎥 UI Helper Functions
// =========================

/**
 * Retrieves or creates the camera canvas for video rendering.
 * @param {HTMLVideoElement} video - The video element displaying the webcam feed.
 * @returns {HTMLCanvasElement} - The canvas element for camera overlay.
 */
function getCameraCanvas(video) {
  const container = createCameraContainer();
  let canvas = container.querySelector("#cameraCanvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "cameraCanvas";
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.zIndex = "2";
    container.appendChild(canvas);
  } else {
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
  }
  return canvas;
}

/**
 * Returns the appropriate gesture messages based on document title.
 * @returns {Object} - Contains emoji, no-gesture text, and success text.
 */
function getGestureInfo() {
    if (document.title.includes("NOT")) {
        return {
            detectionEmoji: "🖕",
            noGestureText: "No Middle Finger Detected.",
            successText: "Middle Finger Detected!"
        };
    } else {
        return {
            detectionEmoji: "👍",
            noGestureText: "No Thumbs Up Detected.",
            successText: "Thumbs Up Detected!"
        };
    }
}

/**
 * Displays detected hand landmarks on the canvas.
 * @param {Array} landmarks - The list of detected hand landmarks.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 */
function displayHandDetections(landmarks, ctx) {
  landmarks.forEach((landmarkSet) => {
    drawConnectors(ctx, landmarkSet, HAND_CONNECTIONS, {
      color: "#00FF00", // Green skeleton
      lineWidth: 5
    });
    drawLandmarks(ctx, landmarkSet, {
      color: "#FF0000", // Red dots
      lineWidth: 2
    });
  });
}
