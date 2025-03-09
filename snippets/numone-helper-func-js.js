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
	if ( debug ) {
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
}

    function wrapText(ctx, text, maxWidth) {
      const words = text.split(" ");
      let lines = [];
      let currentLine = "";
      words.forEach(word => {
        let testLine = currentLine ? currentLine + " " + word : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine !== "") {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      lines.push(currentLine);
      return lines;
    }

    function drawWrappedText(ctx, text, yPosition, canvas) {
      if (ctx.measureText(text).width <= (canvas.width - 40)) {
        ctx.strokeText(text, canvas.width / 2, yPosition);
        ctx.fillText(text, canvas.width / 2, yPosition);
      } else {
        const middleIndex = Math.floor(text.length / 2);
        let splitIndex = text.lastIndexOf(' ', middleIndex);
        if (splitIndex === -1) splitIndex = text.indexOf(' ', middleIndex);
        const firstLine = text.substring(0, splitIndex);
        const secondLine = text.substring(splitIndex + 1);
        ctx.strokeText(firstLine, canvas.width / 2, yPosition);
        ctx.fillText(firstLine, canvas.width / 2, yPosition);
        ctx.strokeText(secondLine, canvas.width / 2, yPosition + lineHeight);
        ctx.fillText(secondLine, canvas.width / 2, yPosition + lineHeight);
      }
    }

async function adjustCanvasForDisclaimer(ctx,theCanvasToAdjust) {
    // adjust the canvas dimensions here if needed.  canvas.width = video.videoWidth + 2 * borderThickness;
    const includeDisclaimer = document.getElementById("includeDisclaimer").checked;
    const disclaimerLineHeight = 24;
    const fontSize = 50;
    const lineHeight = fontSize * 1.2;
    const effectiveMaxWidth = theCanvasToAdjust.width - 40;	
    let totalDisclaimerLines = 0;
    if (includeDisclaimer) {
      disclaimerMessage.forEach(sentence => {
        totalDisclaimerLines += wrapText(ctx, sentence, effectiveMaxWidth).length;
      });
    }
	// ✅ Re-check the disclaimer state dynamically every frame
    const disclaimerHeight = includeDisclaimer ? totalDisclaimerLines * disclaimerLineHeight + 20 : 0;
    if (includeDisclaimer && window.innerWidth <= 768) {
      disclaimerHeight = Math.max(disclaimerHeight, 186);
    }

    // ✅ Ensure the live image does NOT cover the disclaimer
    const disclaimerPadding = includeDisclaimer ? disclaimerHeight : 0;
    // ✅ Keep memeCanvas full size but keep video fixed inside
    theCanvasToAdjust.width = savedVideoWidth + 2 * savedBorderThickness;
    theCanvasToAdjust.height = savedImageHeight + 2 * savedBorderThickness + disclaimerPadding;
}
