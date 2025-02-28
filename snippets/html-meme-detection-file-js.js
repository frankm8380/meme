// ✅ Generic Gesture Detection with MediaPipe and Averaging
async function detectGestureFromFileGeneric(fileURL, gestureCheck, runs = 10) {
    console.log(`🔍 Running MediaPipe detection for: ${fileURL} (Averaging ${runs} runs)`);

    // Load the image
    const image = new Image();
    image.src = fileURL;
    await new Promise((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = (error) => reject(error);
    });

    // Draw the image on a canvas
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height);

    // Initialize MediaPipe Hands
    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.5,
    });

    async function runDetectionOnce() {
        return new Promise((resolve, reject) => {
            hands.onResults((results) => resolve(results));
            hands.send({ image: canvas }).catch(reject);
        });
    }

    let collectedLandmarks = [];
    for (let i = 0; i < runs; i++) {
        const resultData = await runDetectionOnce();
        if (resultData?.multiHandLandmarks?.length) {
            collectedLandmarks.push(resultData.multiHandLandmarks[0]);
        }
    }

    if (collectedLandmarks.length === 0) {
        return { detected: false, landmarks: null, reason: "No hand detected" };
    }

    // Averaging the landmark coordinates
    const numLandmarks = collectedLandmarks[0].length;
    let avgLandmarks = Array.from({ length: numLandmarks }, () => ({ x: 0, y: 0, z: 0 }));

    collectedLandmarks.forEach(runLandmarks => {
        for (let j = 0; j < numLandmarks; j++) {
            avgLandmarks[j].x += runLandmarks[j].x;
            avgLandmarks[j].y += runLandmarks[j].y;
            avgLandmarks[j].z += runLandmarks[j].z;
        }
    });

    const n = collectedLandmarks.length;
    for (let j = 0; j < numLandmarks; j++) {
        avgLandmarks[j].x /= n;
        avgLandmarks[j].y /= n;
        avgLandmarks[j].z /= n;
    }

    const detected = gestureCheck(avgLandmarks);
    const reason = detected ? "Gesture detected via averaged MediaPipe results" : "No gesture detected in averaged results";

    return { detected, landmarks: avgLandmarks, reason };
}

// ✅ Detects a middle finger gesture from an image file.
async function detectMiddleFingerFromFile(fileURL) {
    return detectGestureFromFileGeneric(fileURL, checkMiddleFinger, 100);
}

// ✅ Detects a thumbs-up gesture from an image file.
async function detectThumbsUpFromFile(fileURL) {
    return detectGestureFromFileGeneric(fileURL, checkThumbsUp, 100);
}
			
function attemptDetection(file, attempt) {
  const fileBlob = new Blob([file], { type: file.type });
  const fileURL = URL.createObjectURL(fileBlob);

  return detectGestureFromFile(fileURL)
    .then((isDetected) => {
      URL.revokeObjectURL(fileURL);
      if (isDetected) {
        return true;
      } else if (attempt < 2) {
        return attemptDetection(file, attempt + 1);
      } else {
        return false;
      }
    })
    .catch((error) => {
      URL.revokeObjectURL(fileURL);
      if (attempt < 2) {
        return attemptDetection(file, attempt + 1);
      } else {
        throw error;
      }
    });
}

// ✅ Gesture Detection Functions
function detectGestureFromFile(fileURL) {
  if (document.title.indexOf("NOT") > -1) {
    console.log(`✅ Middle finger check`);
    return detectMiddleFingerFromFile(fileURL);
  } else {
    console.log(`✅ Thumbs up check`);
    return detectThumbsUpFromFile(fileURL);
  }
}


