// ✅ Initialize Gesture Recognizer (for Hand Gesture Detection)
let gestureRecognizerImage;
let gestureRecognizerVideo;

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

// ✅ Function to Start Face Detection from Webcam
async function detectGesturesFromWebcam() {
  console.log("DEBUG: Running detectGesturesFromWebcam...");

  let video;
  let canvas;
  let isRunning = true;

  try {
    // ✅ Create a video element for the webcam
    video = document.createElement("video");
    video.autoplay = true;
    video.style.display = "none";
    document.body.appendChild(video);

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await new Promise((resolve) => (video.onloadeddata = resolve));

    // ✅ Create canvas
    canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    if (!gestureRecognizerVideo) {
      await createGestureRecognizer("VIDEO");
    }

    async function processFrame() {
      if (!isRunning || video.paused || video.ended) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const results = gestureRecognizerVideo.recognizeForVideo(video, performance.now());

      if (results.landmarks && results.landmarks.length > 0) {
        console.log("DEBUG: Detected " + results.landmarks.length + " hand(s).");

        results.landmarks.forEach((landmarks, index) => {
          drawConnectors(ctx, landmarks, GestureRecognizer.HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 5
          });
          drawLandmarks(ctx, landmarks, {
            color: "#FF0000",
            lineWidth: 2
          });
        });

        if (results.gestures.length > 0) {
          const gestureName = results.gestures[0][0].categoryName;
          console.log("✅ Recognized Gesture: " + gestureName);
          ctx.font = "24px Arial";
          ctx.fillStyle = "yellow";
          ctx.fillText("Gesture: " + gestureName, 20, 40);
        }
      } else {
        console.log("DEBUG: No hands detected.");
      }

      requestAnimationFrame(processFrame);
    }

    processFrame();

    // ✅ Open popup to display webcam gesture detection
    const popup = window.open("", "_blank", "width=" + canvas.width + ",height=" + canvas.height);
    if (popup) {
      popup.document.write(`
        <html>
          <head>
            <title>Live Gesture Detection</title>
            <style>
              body { margin: 0; display: flex; align-items: center; justify-content: center; background: #eee; }
              canvas { border: 1px solid #ccc; }
            </style>
          </head>
          <body></body>
        </html>
      `);
      popup.document.body.appendChild(canvas);

      // ✅ Monitor popup closure to stop detection
      let popupInterval = setInterval(() => {
        if (popup.closed) {
          console.log("DEBUG: Popup closed. Stopping gesture detection...");
          stopGestureDetection();
          clearInterval(popupInterval);
        }
      }, 500);
    } else {
      console.error("ERROR: Popup blocked! Please allow popups for this site.");
    }
  } catch (error) {
    console.error("ERROR: Unable to access webcam.", error);
  }

  function stopGestureDetection() {
    console.log("DEBUG: Stopping gesture detection...");
    isRunning = false;

    // ✅ Stop webcam stream
    if (video && video.srcObject) {
      let tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    if (video) video.remove();
    if (canvas) canvas.remove();
  }
}

// ✅ Function to process an uploaded image and detect hand gestures
async function detectGesturesFromFile() {
  console.log("DEBUG: Image file processing started...");

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.display = "none";
  document.body.appendChild(input);

  input.addEventListener("change", async function (event) {
    const file = event.target.files[0];

    if (!file) {
      console.error("ERROR: No file selected.");
      return;
    }

    const reader = new FileReader();
    
    reader.onload = async function (e) {
      const image = new Image();
      image.src = e.target.result;

      image.onload = async function () {
        console.log("DEBUG: Image loaded, processing for gesture recognition...");

        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(image, 0, 0, image.width, image.height);

        if (!gestureRecognizerImage) {
          await createGestureRecognizer("IMAGE");
        }

        const results = gestureRecognizerImage.recognize(image);

        if (results.landmarks && results.landmarks.length > 0) {
          console.log("DEBUG: Detected " + results.landmarks.length + " hand(s).");

          results.landmarks.forEach((landmarks, index) => {
            drawConnectors(ctx, landmarks, GestureRecognizer.HAND_CONNECTIONS, {
              color: "#00FF00",
              lineWidth: 5
            });
            drawLandmarks(ctx, landmarks, {
              color: "#FF0000",
              lineWidth: 2
            });
          });

          if (results.gestures.length > 0) {
            const gestureName = results.gestures[0][0].categoryName;
            console.log("✅ Recognized Gesture: " + gestureName);
            ctx.font = "24px Arial";
            ctx.fillStyle = "yellow";
            ctx.fillText("Gesture: " + gestureName, 20, 40);
          }
        } else {
          console.log("DEBUG: No hands detected.");
        }

        const popup = window.open("", "_blank", "width=" + image.width + ",height=" + image.height);
        if (popup) {
          popup.document.write(`
            <html>
              <head>
                <title>Gesture Detection on Image</title>
                <style>
                  body { margin: 0; display: flex; align-items: center; justify-content: center; background: #eee; }
                  canvas { border: 1px solid #ccc; }
                </style>
              </head>
              <body></body>
            </html>
          `);
          popup.document.body.appendChild(canvas);
        } else {
          console.error("ERROR: Popup blocked! Please allow popups for this site.");
        }
      };
    };

    reader.readAsDataURL(file);
  });

  input.click();
  setTimeout(() => input.remove(), 1000);
}
