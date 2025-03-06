// Global variables for models and detection state.
let videoStream = null;
let detectionStopped = false;
let faceDetectorVideo, faceDetectorImage;
let gestureRecognizerVideo, gestureRecognizerImage;
let handLandmarkerVideo, handLandmarkerImage;
let debug = true;
let isGestureDetected = false;
let detectionStartTime = null;


// -------------------------------
// Expose module functions (optional)
// -------------------------------
window.CameraModule = {
  startCamera,
  stopCamera,
  restartDetection
};

// -------------------------------
// For demo/testing: start camera automatically when the module loads.
// -------------------------------
//startCamera();
