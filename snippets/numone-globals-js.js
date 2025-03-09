// Global variables for models and detection state.
let videoStream = null;
let detectionStopped = false;
let faceDetectorVideo, faceDetectorImage;
let gestureRecognizerVideo, gestureRecognizerImage;
let handLandmarkerVideo, handLandmarkerImage;
let debug = false;
let isGestureDetected = false;
let detectionStartTime = null;

const borderThickness = 10;
let savedImageHeight = 0;
let savedBorderThickness = 10;
let savedImage = null;
let savedVideoWidth = 0;
let pageConfig = null;
let disclaimerMessage = [];
let fileNamePrefix = "meme_"; // Default fallback prefix

// offscreen canvas
const OFFSCREEN_WIDTH = 1280; 
const OFFSCREEN_HEIGHT = 960;
offscreenCanvas = document.createElement("canvas");
offscreenCanvas.width = OFFSCREEN_WIDTH;
offscreenCanvas.height = OFFSCREEN_HEIGHT;
offscreenCtx = offscreenCanvas.getContext("2d");

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
