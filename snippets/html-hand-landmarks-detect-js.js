// ✅ Function to initialize Hand Landmarker with dynamic mode support
let handLandmarkerImage;
let handLandmarkerVideo;

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

// ✅ Test Hand Tracking with Live Webcam
async function detectHandsFromWebcam() {
  console.log("DEBUG: Running testMediaPipeSampleHands...");

  let video; // ✅ Declare globally for access in stopHandTracking
  let canvas;
  let isRunning = true; // ✅ Track detection state

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

    if (!handLandmarkerVideo) {
      await createHandLandmarker("VIDEO");
    }

    async function processFrame() {
      if (!isRunning || video.paused || video.ended) return; // ✅ Stop loop if not running

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const results = handLandmarkerVideo.detectForVideo(video, performance.now());

      if (results.landmarks && results.landmarks.length > 0) {
        console.log("DEBUG: Detected " + results.landmarks.length + " hand(s).");

        results.landmarks.forEach((landmarks, index) => {
          console.log("DEBUG: Drawing hand " + (index + 1));
          drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
            color: "#00FF00", // Green skeleton
            lineWidth: 5
          });
          drawLandmarks(ctx, landmarks, {
            color: "#FF0000", // Red dots
            lineWidth: 2
          });
        });
      } else {
        console.log("DEBUG: No hands detected.");
      }

      requestAnimationFrame(processFrame);
    }

    processFrame();

    // ✅ Open popup to display webcam hand tracking
    const popup = window.open("", "_blank", "width=" + canvas.width + ",height=" + canvas.height);
    if (popup) {
      popup.document.write(`
        <html>
          <head>
            <title>Live Hand Detection</title>
            <style>
              body { margin: 0; display: flex; align-items: center; justify-content: center; background: #eee; }
              canvas { border: 1px solid #ccc; }
            </style>
          </head>
          <body></body>
        </html>
      `);
      popup.document.body.appendChild(canvas);
      console.log("DEBUG: Popup window opened for MediaPipe test.");

      // ✅ Monitor popup closing to stop detection
      let popupInterval = setInterval(() => {
        if (popup.closed) {
          console.log("DEBUG: Popup closed. Stopping hand tracking...");
          stopHandTracking(); // ✅ Properly stop detection
          clearInterval(popupInterval);
        }
      }, 500);
    } else {
      console.error("ERROR: Popup blocked! Please allow popups for this site.");
    }
  } catch (error) {
    console.error("ERROR: Unable to access webcam.", error);
  }

  // ✅ Function to Stop Hand Tracking
  function stopHandTracking() {
    console.log("DEBUG: Stopping hand tracking...");

    // ✅ Stop webcam stream
    if (video && video.srcObject) {
      let tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    // ✅ Stop the detection loop
    isRunning = false;

    // ✅ Remove elements safely
    if (video) video.remove();
    if (canvas) canvas.remove();
  }
}

// ✅ Function to process an uploaded image and detect hand landmarks
async function detectHandsFromFile() {
  console.log("DEBUG: Image file processing started...");

  // ✅ Create an input element for file selection
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*"; // Allow only images
  input.style.display = "none";

  document.body.appendChild(input); // Append input temporarily

  // ✅ Handle file selection
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
        console.log("DEBUG: Image loaded, processing for hand detection...");

        // ✅ Create a canvas to draw the image
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(image, 0, 0, image.width, image.height);

        if (!handLandmarkerImage) {
          await createHandLandmarker("IMAGE");
        }

        // ✅ Run hand detection
        const results = handLandmarkerImage.detect(image);

        if (results.landmarks && results.landmarks.length > 0) {
          console.log("DEBUG: Detected " + results.landmarks.length + " hand(s).");

          results.landmarks.forEach((landmarks, index) => {
            console.log("DEBUG: Drawing hand " + (index + 1));
            drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
              color: "#00FF00", // Green skeleton
              lineWidth: 5
            });
            drawLandmarks(ctx, landmarks, {
              color: "#FF0000", // Red dots
              lineWidth: 2
            });
          });
        } else {
          console.log("DEBUG: No hands detected.");
        }

        // ✅ Open a popup to display the processed image
        const popup = window.open("", "_blank", "width=" + image.width + ",height=" + image.height);
        if (popup) {
          popup.document.write(`
            <html>
              <head>
                <title>Hand Detection on Image</title>
                <style>
                  body { margin: 0; display: flex; align-items: center; justify-content: center; background: #eee; }
                  canvas { border: 1px solid #ccc; }
                </style>
              </head>
              <body></body>
            </html>
          `);
          popup.document.body.appendChild(canvas);
          console.log("DEBUG: Popup window opened for processed image.");
        } else {
          console.error("ERROR: Popup blocked! Please allow popups for this site.");
        }
      };
    };

    reader.readAsDataURL(file);
  });

  // ✅ Simulate a click on the input to open file picker
  input.click();

  // ✅ Remove the input from the DOM after selection
  setTimeout(() => input.remove(), 1000);
}
