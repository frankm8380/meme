// -------------------------------
// Updated Face & Gesture Detection (Live) Module Using Only memeCanvas
// -------------------------------

/**
 * Resets the detection state.
 */
function resetDetectionState() {
  isGestureDetected = false;
  detectionStartTime = null;
  detectionStopped = false;
  isMiddleFingerDetected = false;
}

// ✅ Unified Face Blurring Handler for video + image + toggle mode
async function blurFaceHandler({ mode, source, canvas, ctx }) {
  const blurFace = document.getElementById("blurFace").checked;

  if (!blurFace) {
    // Unblur by redrawing saved image (only applicable in static mode)
    if (mode === "image" && savedImage) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.fillRect(savedBorderThickness, savedBorderThickness,
        canvas.width - 2 * savedBorderThickness,
        canvas.height - 2 * savedBorderThickness);
      ctx.drawImage(
        savedImage,
        savedBorderThickness, savedBorderThickness,
        savedVideoWidth, savedImageHeight,
        savedBorderThickness, savedBorderThickness,
        savedVideoWidth, savedImageHeight
      );
      drawMemeText(ctx);
    }
    return;
  }

  // Detect faces with correct model
  let faceResults;
  if (mode === "video") {
    faceResults = await faceDetectorVideo.detectForVideo(source, performance.now());
  } else if (mode === "image") {
    faceResults = await faceDetectorImage.detect(source);
  }

  if (!faceResults || faceResults.detections.length === 0) return;

  // ✅ Use only the first detection
  const detection = faceResults.detections[0];
  if (!detection) return;

  const category = detection.categories?.[0]?.categoryName?.toLowerCase();
  if (category && category !== "face") return;

  const { originX, originY, width, height } = detection.boundingBox;
  const aspectRatio = width / height;
  if (!category && (aspectRatio < 0.5 || aspectRatio > 1.5)) return;

  let x = originX, y = originY, w = width, h = height;

  if (x <= 1 && y <= 1 && w <= 1 && h <= 1) {
    x *= canvas.width;
    y *= canvas.height;
    w *= canvas.width;
    h *= canvas.height;
  }

  if (w <= 0 || h <= 0) return;

  const faceImageData = ctx.getImageData(x, y, w, h);
  const blurCanvas = document.createElement("canvas");
  blurCanvas.width = w;
  blurCanvas.height = h;
  const blurCtx = blurCanvas.getContext("2d");

  blurCtx.putImageData(faceImageData, 0, 0);
  blurCtx.filter = "blur(12px)";
  blurCtx.drawImage(blurCanvas, 0, 0);

  ctx.drawImage(blurCanvas, x, y, w, h);

  if (mode === "image") drawMemeText(ctx);
}

async function updateBlurFace() {
  const canvas = document.getElementById("memeCanvas");
  const ctx = canvas.getContext("2d");
  if (!savedImage) return;

  const tempImage = new Image();
  tempImage.src = savedImage.src;
  await new Promise(resolve => tempImage.onload = resolve);

  await blurFaceHandler({
    mode: "image",
    source: tempImage,
    canvas: canvas,
    ctx: ctx
  });
}

async function detectFaceAndGesture(video) {
  console.log("detectFaceAndGesture started");
  
  // Ensure MediaPipe models are loaded.
  if (!faceDetectorVideo || !gestureRecognizerCustomVideo || !handLandmarkerVideo) {
    await loadMediaPipeModels();
    if (!faceDetectorVideo || !gestureRecognizerCustomVideo || !handLandmarkerVideo) return;
  }
  
  const { noGestureText } = getGestureInfo();
  displayErrorMessage(noGestureText);
  
	// ✅ Use the memeCanvas for display
	const workspace = document.getElementById("workspaceContainer");
	const canvas = document.getElementById("memeCanvas");

	if (workspace && canvas) {
		canvas.width = workspace.offsetWidth;
		canvas.height = workspace.offsetHeight;
		canvas.style.width = workspace.style.width;
		canvas.style.height = workspace.style.height;
	}	
	const ctx = canvas.getContext("2d");
	
  // ✅ Ensure proper scaling for mobile cameras
  savedVideoWidth = video.videoWidth || video.offsetWidth || 640;
  savedImageHeight = video.videoHeight || video.offsetHeight || 480;
  savedBorderThickness = borderThickness;
 
  async function processFrame() {
    if (detectionStopped || video.paused || video.ended) return;
  console.log("processFrame started");

	adjustCanvasForDisclaimer(ctx,canvas);
	
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(savedBorderThickness, savedBorderThickness, canvas.width - 2 * savedBorderThickness, canvas.height - 2 * savedBorderThickness);
	  
    // Draw the current video frame onto the offscreen canvas for processing.
    offscreenCtx.drawImage(video, 0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
    
    // Then draw the offscreen canvas onto the memeCanvas (the only visible canvas).
    ctx.drawImage(offscreenCanvas, savedBorderThickness, savedBorderThickness, savedVideoWidth, savedImageHeight);
	  
    // 🔄 Optionally blur face in live video based on checkbox
    if (document.getElementById("blurFace").checked) {
	    await blurFaceHandler({
		    mode: "video",
		    source: video,
		    canvas: canvas,
		    ctx: ctx
	    });
    }
	  
    // ✅ Render meme text and disclaimer over live feed
  console.log("processFrame drawMemeText");
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
	  displayErrorMessage(noGestureText);
      resetDetectionState();
      requestAnimationFrame(processFrame);
      return;
    }
    
    // If a confirmed gesture hold is detected, capture the memeCanvas (including overlays).
if (confirmGestureHold()) {
	displayStatusMessage("Gesture Captured! Edit meme below.");
	detectionStopped = true;

	const memeCanvas = document.getElementById("memeCanvas");
	const ctx = memeCanvas.getContext("2d");

	// Draw raw video frame to memeCanvas
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, memeCanvas.width, memeCanvas.height);
	ctx.fillStyle = "white";
	ctx.fillRect(savedBorderThickness, savedBorderThickness,
		memeCanvas.width - 2 * savedBorderThickness,
		memeCanvas.height - 2 * savedBorderThickness);
	ctx.drawImage(video, savedBorderThickness, savedBorderThickness,
		savedVideoWidth, savedImageHeight);

	const dataUrl = memeCanvas.toDataURL("image/png");
	const finalImage = new Image();

	finalImage.onload = async function () {
		console.log("📸 Final image loaded for post-processing");
		savedImage = finalImage;
		
		console.log("🖌️ Drawing meme text overlays...");
		updateMemeText();

		if (document.getElementById("blurFace").checked) {
			console.log("🔍 Applying blurFaceHandler in static mode...");
			await blurFaceHandler({
				mode: "image",
				source: savedImage,
				canvas: memeCanvas,
				ctx: ctx
			});
		}

		changeState(STATE.GESTURE_DETECTED);
	};

	finalImage.onerror = function () {
		console.error("❌ Failed to load captured image for post-processing");
	};

	finalImage.src = dataUrl;
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

// Optional Debug: Draw face boxes on canvas
function displayFaceDetections(detections, ctx) {
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  detections.forEach(detection => {
    const { originX: x, originY: y, width, height } = detection.boundingBox;
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
