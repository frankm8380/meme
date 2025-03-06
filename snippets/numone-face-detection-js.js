// -------------------------------
// Face & Gesture Detection (Live)
// -------------------------------
async function detectFaceAndGesture(video) {
  console.log("detectFaceAndGesture started");
  if (!faceDetectorVideo || !gestureRecognizerVideo || !handLandmarkerVideo) {
    await loadMediaPipeModels();
    if (!faceDetectorVideo || !gestureRecognizerVideo || !handLandmarkerVideo) return;
  }
    
  const { noGestureText } = getGestureInfo();
  document.getElementById("result").innerText = noGestureText;
  document.getElementById("result").style.color = "red";

  const canvas = getCameraCanvas(video);
  const ctx = canvas.getContext("2d");

  async function processFrame() {
    if (detectionStopped) return;

    // Clear and draw the current video frame on the canvas.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Run face detection directly on the video element.
    const faceResults = await faceDetectorVideo.detectForVideo(video, performance.now());
    if (!faceResults || faceResults.detections.length === 0) {
      resetDetectionState();
      requestAnimationFrame(processFrame);
      return;
    }

    displayFaceDetections(faceResults.detections, ctx);
    let faceBoundingBox = faceResults.detections[0].boundingBox;

    // Placeholder gesture detection.
    let detectedGesture = detectGesture(video, ctx);
    if (!detectedGesture) {
      const { noGestureText } = getGestureInfo();
      document.getElementById("result").innerText = noGestureText;
      document.getElementById("result").style.color = "red";
      resetDetectionState();
      requestAnimationFrame(processFrame);
      return;
    }
    if (confirmGestureHold()) {
      let dataURL = canvas.toDataURL("image/png");
      let savedImage = saveImage(dataURL);
      let encodedImage = await embedMetadata(savedImage, faceBoundingBox, detectedGesture);
      storeEncodedImage(encodedImage);
      detectionStopped = true;
      return;
    }
    requestAnimationFrame(processFrame);
  }
  processFrame();
}

// -------------------------------
// Face Detection, Saving, and Metadata Embedding
// -------------------------------
async function detectFace(frame, isLive = true) {
  console.log("🧑 Running face detection...");
  let faceDetector = isLive ? faceDetectorVideo : faceDetectorImage;
  if (!faceDetector) {
    console.error("❌ Face detector is not initialized.");
    return null;
  }
  try {
    let image = new Image();
    image.src = frame;
    await new Promise(resolve => image.onload = resolve);
    let faceResults = isLive
      ? await faceDetector.detectForVideo(image, performance.now())
      : await faceDetector.detect(image);
    if (faceResults.detections.length === 0) {
      return null;
    }
    return faceResults;
  } catch (error) {
    console.error("❌ Error during face detection:", error);
    return null;
  }
}

// -------------------------------
// Display Face Detections
// -------------------------------
function displayFaceDetections(detections, ctx) {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  detections.forEach(detection => {
    const { originX: x, originY: y, width, height } = detection.boundingBox;
    // Scale coordinates if they appear to be normalized.
    let scaledX = x, scaledY = y, scaledWidth = width, scaledHeight = height;
    if (x <= 1 && y <= 1 && width <= 1 && height <= 1) {
      scaledX = x * canvasWidth;
      scaledY = y * canvasHeight;
      scaledWidth = width * canvasWidth;
      scaledHeight = height * canvasHeight;
    }
    ctx.strokeStyle = "limegreen";
    ctx.lineWidth = 3;
    ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
    const confidence = Math.round(detection.categories[0].score * 100);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(scaledX, scaledY - 25, 80, 20);
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.fillText(`Conf: ${confidence}%`, scaledX + 5, scaledY - 10);
  });
}
