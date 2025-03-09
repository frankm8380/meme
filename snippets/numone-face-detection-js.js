// -------------------------------
// Updated Face & Gesture Detection (Live) Module Using Only memeCanvas
// -------------------------------


// Note: This module assumes that helper functions such as loadMediaPipeModels,
// getGestureInfo, detectGesture, confirmGestureHold, resetDetectionState, saveImage,
// embedMetadata, and storeEncodedImage are defined elsewhere in your project.

async function detectFaceAndGesture(video) {
  console.log("detectFaceAndGesture started");
  
  // Ensure MediaPipe models are loaded.
  if (!faceDetectorVideo || !gestureRecognizerVideo || !handLandmarkerVideo) {
    await loadMediaPipeModels();
    if (!faceDetectorVideo || !gestureRecognizerVideo || !handLandmarkerVideo) return;
  }
  
  const { noGestureText } = getGestureInfo();
  document.getElementById("result").innerText = noGestureText;
  document.getElementById("result").style.color = "red";
  
  // Use only the memeCanvas for display.
  const canvas = getMemeCanvas();
  const ctx = canvas.getContext("2d");
	
  savedImageHeight = video.videoHeight;
  savedBorderThickness = borderThickness;
  savedVideoWidth = video.videoWidth;
  
  async function processFrame() {
    if (detectionStopped || video.paused || video.ended) return;

	adjustCanvasForDisclaimer(ctx,canvas);
	
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(savedBorderThickness, savedBorderThickness, canvas.width - 2 * savedBorderThickness, canvas.height - 2 * savedBorderThickness);
	    
    // Draw the current video frame onto the offscreen canvas for processing.
    offscreenCtx.drawImage(video, 0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
    
    // Then draw the offscreen canvas onto the memeCanvas (the only visible canvas).
    ctx.drawImage(offscreenCanvas, savedBorderThickness, savedBorderThickness, savedVideoWidth, savedImageHeight);
	  
    // ✅ Render meme text and disclaimer over live feed
    drawMemeText(ctx);
	  
    // Run face detection on the live video.
    const faceResults = await faceDetectorVideo.detectForVideo(video, performance.now());
    if (!faceResults || faceResults.detections.length === 0) {
      resetDetectionState();
      requestAnimationFrame(processFrame);
      return;
    }
    
    // Overlay face detection results (bounding boxes, confidence text, etc.) on the memeCanvas.
    if ( debug )
    	displayFaceDetections(faceResults.detections, ctx);
    let faceBoundingBox = faceResults.detections[0].boundingBox;
    
    // Run gesture detection (this is a placeholder function—ensure it's defined elsewhere).
    let detectedGesture = detectGesture(video, ctx);
    if (!detectedGesture) {
      const { noGestureText } = getGestureInfo();
      document.getElementById("result").innerText = noGestureText;
      document.getElementById("result").style.color = "red";
      resetDetectionState();
      requestAnimationFrame(processFrame);
      return;
    }
    
    // If a confirmed gesture hold is detected, capture the memeCanvas (including overlays).
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

// Helper: Return the memeCanvas element.
function getMemeCanvas() {
  return document.getElementById("memeCanvas");
}

// -------------------------------
// Face Detection, Saving, and Metadata Embedding (Unmodified Functions)
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

// Display Face Detections on the memeCanvas.
function displayFaceDetections(detections, ctx) {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  detections.forEach(detection => {
    const { originX: x, originY: y, width, height } = detection.boundingBox;
    // Scale coordinates if they are normalized.
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
