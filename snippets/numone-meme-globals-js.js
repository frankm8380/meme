// Global variables for models and detection state.
let videoStream = null;
let detectionStopped = false;
let faceDetectorVideo = null, faceDetectorImage = null;
let gestureRecognizerCustomVideo = null, gestureRecognizerCustomImage = null;
let handLandmarkerVideo = null, handLandmarkerImage = null;
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
let offscreenCanvas = document.createElement("canvas");
offscreenCanvas.width = OFFSCREEN_WIDTH;
offscreenCanvas.height = OFFSCREEN_HEIGHT;
let offscreenCtx = offscreenCanvas.getContext("2d");

let defaultCanvasWidth=300;
let defaultCanvasHeight=150;

let currentState = 1;
let previousState = 1; // Track the last non-modal state
let lastHeaderBottom = 0; // Track last known header height to prevent infinite adjustments
let positionTopContainerBelowHeader = true;
let tfliteModel = null;
