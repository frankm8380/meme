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

// ✅ Function to Create Hand Landmarker with Mode
async function createHandLandmarker(mode = "VIDEO") {
  console.log("DEBUG: Initializing MediaPipe Hand Landmarker in", mode, "mode...");
  
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );

  const options = {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU"
    },
    runningMode: mode,
    numHands: 2
  };

  if (mode === "IMAGE") {
    handLandmarkerImage = await HandLandmarker.createFromOptions(vision, options);
  } else {
    handLandmarkerVideo = await HandLandmarker.createFromOptions(vision, options);
  }

  console.log("DEBUG: MediaPipe Hand Landmarker is ready for", mode, "mode.");
}

// ✅ Function to Create Gesture Recognizer with Mode
async function createGestureRecognizer(mode = "VIDEO") {
  console.log("DEBUG: Initializing MediaPipe Gesture Recognizer in", mode, "mode...");
  
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );

  const options = {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU"
    },
    runningMode: mode
  };

  if (mode === "IMAGE") {
    gestureRecognizerImage = await GestureRecognizer.createFromOptions(vision, options);
  } else {
    gestureRecognizerVideo = await GestureRecognizer.createFromOptions(vision, options);
  }

  console.log("DEBUG: MediaPipe Gesture Recognizer is ready for", mode, "mode.");
}

// ✅ Function to Load All MediaPipe Models
async function loadMediaPipeModels() {
  console.log("⏳ Loading MediaPipe models...");
  try {
    // These functions should initialize your models and set the global variables.
    await createFaceDetector("VIDEO");  // Should set faceDetectorVideo
    await createFaceDetector("IMAGE");  // Should set faceDetectorImage
    await createGestureRecognizer("VIDEO");  // Should set gestureRecognizerVideo
    await createGestureRecognizer("IMAGE");  // Should set gestureRecognizerImage
    await createHandLandmarker("VIDEO");  // Should set handLandmarkerVideo
    await createHandLandmarker("IMAGE");  // Should set handLandmarkerImage

    if (!faceDetectorVideo || !gestureRecognizerVideo || !handLandmarkerVideo) {
      console.log("⚠️ Some video models failed to load.");
      return;
    }
    if (!faceDetectorImage || !gestureRecognizerImage || !handLandmarkerImage) {
      console.log("⚠️ Some image models failed to load.");
      return;
    }
    console.log("✅ All MediaPipe models loaded successfully.");
  } catch (error) {
    console.error("❌ Error loading models:", error);
  }
}
