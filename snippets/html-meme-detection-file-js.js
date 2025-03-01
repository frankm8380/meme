async function detectGestureFromFileGeneric2(fileURL, gestureCheck, runs = 100, debug = false) {
  if (debug) {
    console.log("🔍 Running MediaPipe detection for: " + fileURL + " (up to " + runs + " runs)");
  }

  // Load the image.
  const image = new Image();
  image.src = fileURL;
  if (debug) {
    console.log("DEBUG: Loading image from: " + fileURL);
  }
  await new Promise(function (resolve, reject) {
    image.onload = function () {
      if (debug) {
        console.log("DEBUG: Image loaded successfully");
      }
      resolve();
    };
    image.onerror = function (error) {
      console.error("ERROR: Image failed to load", error);
      reject(error);
    };
  });

  // Draw the image on a canvas.
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  if (debug) {
    console.log("DEBUG: Canvas created with dimensions: " + canvas.width + "x" + canvas.height);
  }
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);
  if (debug) {
    console.log("DEBUG: Image drawn on canvas");
  }

  // Initialize MediaPipe Hands.
  // For averaging, it is best to keep maxNumHands consistent; here we set it to 1.
  if (debug) {
    console.log("DEBUG: Initializing MediaPipe Hands for file detection");
  }
  const hands = new Hands({
    locateFile: function (file) {
      return "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" + file;
    }
  });
  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
            minDetectionConfidence: 0.3,
            minHandPresenceConfidence: 0.4,
            minTrackingConfidence: 0.4,
  });

  // Helper function: run detection on the current canvas frame.
  async function runDetectionOnce() {
    return new Promise(function (resolve, reject) {
      hands.onResults(function (results) {
        resolve(results);
      });
      hands.send({ image: canvas }).catch(function (error) {
        reject(error);
      });
    });
  }

  // Collect landmarks from runs where a hand is detected.
  var collectedLandmarks = [];
  for (var i = 0; i < 100; i++) {
	if ( i === 10 && collectedLandmarks.length === 0) break;
	  
    var resultData = await runDetectionOnce();
    if (resultData && resultData.multiHandLandmarks && resultData.multiHandLandmarks.length) {
      if (debug) {
        console.log("DEBUG: Run " + (i + 1) + ": Detected " + resultData.multiHandLandmarks.length + " hand(s).");
      }
      // Use the first hand detected on this run.
      collectedLandmarks.push(resultData.multiHandLandmarks[0]);
      if (collectedLandmarks.length === runs) break;
    } else {
      if (debug) {
        console.log("DEBUG: Run " + (i + 1) + ": No hand detected.");
      }
    }
  }
  if (debug) {
    console.log("DEBUG: Total successful detection runs: " + collectedLandmarks.length + " out of " + runs);
  }
  if (collectedLandmarks.length === 0) {
    console.warn("WARNING: No hand detected in any runs.");
    // If debug is true, display the processed canvas in a popup window.
    if (debug) {
      var newWindow = window.open("", "_blank", "width=" + canvas.width + ",height=" + canvas.height);
      if (newWindow) {
        newWindow.document.write(
          "<html>" +
          "<head>" +
          "<title>Tested Image with Markers</title>" +
          "<style>" +
          "body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: #eee; }" +
          "canvas { border: 1px solid #ccc; }" +
          "</style>" +
          "</head>" +
          "<body></body>" +
          "</html>"
        );
        newWindow.document.body.appendChild(canvas);
        console.log("DEBUG: Popup window opened successfully.");
      } else {
        console.error("ERROR: Popup blocked! Please allow popups for this site.");
      }
    }
    return { detected: false, landmarks: null, reason: "No hand detected" };
  }

  // Average the landmark coordinates.
  var numLandmarks = collectedLandmarks[0].length;
  var avgLandmarks = [];
  for (var j = 0; j < numLandmarks; j++) {
    avgLandmarks[j] = { x: 0, y: 0, z: 0 };
  }
  collectedLandmarks.forEach(function (runLandmarks) {
    runLandmarks.forEach(function (landmark, j) {
      avgLandmarks[j].x += landmark.x;
      avgLandmarks[j].y += landmark.y;
      avgLandmarks[j].z += landmark.z;
    });
  });
  var n = collectedLandmarks.length;
  for (var j = 0; j < numLandmarks; j++) {
    avgLandmarks[j].x /= n;
    avgLandmarks[j].y /= n;
    avgLandmarks[j].z /= n;
  }
  if (debug) {
    console.log("DEBUG: Averaged landmarks: " + JSON.stringify(avgLandmarks));
  }

  // Draw markers on the canvas using the averaged landmarks.
  function drawMarkers(ctx, landmarks, canvasWidth, canvasHeight) {
    var markers = {
      thumb: { index: 4, color: "red" },
      index: { index: 8, color: "green" },
      middle: { index: 12, color: "orange" }
    };
    Object.keys(markers).forEach(function (key) {
      var marker = markers[key];
      var x = landmarks[marker.index].x * canvasWidth;
      var y = landmarks[marker.index].y * canvasHeight;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = marker.color;
      ctx.fill();
      ctx.font = "12px Arial";
      ctx.fillStyle = "blue";
      ctx.fillText(key, x + 8, y - 8);
    });
  }
  drawMarkers(ctx, avgLandmarks, canvas.width, canvas.height);

  // Run the gesture check on the averaged landmarks.
  var detected = gestureCheck(avgLandmarks);
  var reason = detected ? "Gesture detected via averaged MediaPipe results" : "No gesture detected in averaged results";
  if (debug) {
    console.log("DEBUG: Final gesture detection result: " + detected + " (" + reason + ")");
  }

  // Draw a status icon in the upper left: check mark if valid, X if not.
  var statusIcon = detected ? "✓" : "✗";
  ctx.font = "48px Arial";
  ctx.fillStyle = detected ? "green" : "red";
  ctx.fillText(statusIcon, 10, 60);
  if (debug) {
    console.log("DEBUG: Final gesture detection result: " + (detected ? "Valid" : "Invalid"));
  }

  // If debug is true, display the processed canvas in a popup window.
  if (debug) {
    var newWindow = window.open("", "_blank", "width=" + canvas.width + ",height=" + canvas.height);
    if (newWindow) {
      newWindow.document.write(
        "<html>" +
        "<head>" +
        "<title>Tested Image with Markers</title>" +
        "<style>" +
        "body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: #eee; }" +
        "canvas { border: 1px solid #ccc; }" +
        "</style>" +
        "</head>" +
        "<body></body>" +
        "</html>"
      );
      newWindow.document.body.appendChild(canvas);
      console.log("DEBUG: Popup window opened successfully.");
    } else {
      console.error("ERROR: Popup blocked! Please allow popups for this site.");
    }
  }

  return { detected: detected, landmarks: avgLandmarks, reason: reason };
}

async function detectGestureFromFileGeneric(fileURL, gestureCheck, runs = 20, debug = true) {
  return detectGestureFromFileGeneric2(fileURL, gestureCheck, 20, true);

  if (debug) {
    console.log("🔍 Running MediaPipe detection for: " + fileURL + " (up to " + runs + " runs)");
  }

  // Load the image.
  const image = new Image();
  image.src = fileURL;
  if (debug) {
    console.log("DEBUG: Loading image from: " + fileURL);
  }
  await new Promise(function (resolve, reject) {
    image.onload = function () {
      if (debug) {
        console.log("DEBUG: Image loaded successfully");
      }
      resolve();
    };
    image.onerror = function (error) {
      console.error("ERROR: Image failed to load", error);
      reject(error);
    };
  });

  // Draw the image on a canvas.
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  if (debug) {
    console.log("DEBUG: Canvas created with dimensions: " + canvas.width + "x" + canvas.height);
  }
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);
  if (debug) {
    console.log("DEBUG: Image drawn on canvas");
  }

  // Initialize MediaPipe Hands with maxNumHands set to 2.
  if (debug) {
    console.log("DEBUG: Initializing MediaPipe Hands for file detection");
  }
  const hands = new Hands({
    locateFile: function (file) {
      return "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" + file;
    }
  });
  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
            minDetectionConfidence: 0.35,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
  });

  // Helper function to run detection on the current canvas frame.
  async function runDetectionOnce() {
    return new Promise(function (resolve, reject) {
      hands.onResults(function (results) {
        resolve(results);
      });
      hands.send({ image: canvas }).catch(function (error) {
        reject(error);
      });
    });
  }

  var validDetection = false;
  var validLandmarks = null;
  // Run detection up to 'runs' times.
  for (var i = 0; i < runs; i++) {
    var resultData = await runDetectionOnce();
    if (resultData && resultData.multiHandLandmarks && resultData.multiHandLandmarks.length) {
      if (debug) {
        console.log("DEBUG: Run " + (i + 1) + ": Detected " + resultData.multiHandLandmarks.length + " hand(s).");
      }
      resultData.multiHandLandmarks.forEach(function (landmarks, handIndex) {
        if (debug) {
          console.log("DEBUG: Run " + (i + 1) + ": Processing Hand " + (handIndex + 1) + " with " + landmarks.length + " landmarks.");
        }
        if (gestureCheck(landmarks)) {
          if (debug) {
            console.log("DEBUG: Run " + (i + 1) + ": Hand " + (handIndex + 1) + " passed gesture check.");
          }
          validDetection = true;
          validLandmarks = landmarks;
        } else {
          if (debug) {
            console.log("DEBUG: Run " + (i + 1) + ": Hand " + (handIndex + 1) + " did NOT pass gesture check.");
          }
        }
      });
    } else {
      if (debug) {
        console.log("DEBUG: Run " + (i + 1) + ": No hand detected.");
      }
    }
    // If you want to break early when a valid gesture is detected, uncomment the next line:
    // if (validDetection) break;
  }

  if (!validDetection) {
    console.warn("WARNING: No hand with valid gesture detected in any run.");
  }

  // If a valid hand was found, draw markers for key landmarks.
  if (validLandmarks) {
    function drawMarkers(ctx, landmarks, canvasWidth, canvasHeight) {
      var markers = {
        thumb: { index: 4, color: "red" },
        index: { index: 8, color: "green" },
        middle: { index: 12, color: "orange" }
      };
      Object.keys(markers).forEach(function (key) {
        var marker = markers[key];
        var x = landmarks[marker.index].x * canvasWidth;
        var y = landmarks[marker.index].y * canvasHeight;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = marker.color;
        ctx.fill();
        ctx.font = "12px Arial";
        ctx.fillStyle = "blue";
        ctx.fillText(key, x + 8, y - 8);
      });
    }
    drawMarkers(ctx, validLandmarks, canvas.width, canvas.height);
  }

  // Only display the image in a popup if debug flag is true.
  if (debug) {
    var newWindow = window.open("", "_blank", "width=" + canvas.width + ",height=" + canvas.height);
    if (newWindow) {
      newWindow.document.write(
        "<html>" +
        "<head>" +
        "<title>Tested Image with Markers</title>" +
        "<style>" +
        "body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: #eee; }" +
        "canvas { border: 1px solid #ccc; }" +
        "</style>" +
        "</head>" +
        "<body></body>" +
        "</html>"
      );
      newWindow.document.body.appendChild(canvas);
      console.log("DEBUG: Popup window opened successfully.");
    } else {
      console.error("ERROR: Popup blocked! Please allow popups for this site.");
    }
  }

  var reason = validDetection
    ? "Gesture detected via MediaPipe results"
    : "No gesture detected in runs";
  if (debug) {
    console.log("DEBUG: Final gesture detection result: " + validDetection + " (" + reason + ")");
  }

  // Draw a status icon in the upper left: check mark if valid, X if not.
  var statusIcon = validDetection ? "✓" : "✗";
  ctx.font = "48px Arial";
  ctx.fillStyle = validDetection ? "green" : "red";
  ctx.fillText(statusIcon, 10, 60);
  if (debug) {
    console.log("DEBUG: Final gesture detection result: " + (validDetection ? "Valid" : "Invalid"));
  }

  return { detected: validDetection, landmarks: validLandmarks, reason: reason };
}

// ✅ Detects a middle finger gesture from an image file.
async function detectMiddleFingerFromFile(fileURL) {
  console.log("DEBUG: Starting middle finger detection from file:", fileURL);
  return detectGestureFromFileGeneric(fileURL, checkMiddleFinger, 100);
}

// ✅ Detects a thumbs-up gesture from an image file.
async function detectThumbsUpFromFile(fileURL) {
  console.log("DEBUG: Starting thumbs up detection from file:", fileURL);
  return detectGestureFromFileGeneric(fileURL, checkThumbsUp, 100);
}


// ✅ Gesture Detection Functions
function detectGestureFromFile(fileURL) {
  if (document.title.indexOf("NOT") > -1) {
    console.log("✅ Middle finger check");
    return detectMiddleFingerFromFile(fileURL);
  } else {
    console.log("✅ Thumbs up check");
    return detectThumbsUpFromFile(fileURL);
  }
}
