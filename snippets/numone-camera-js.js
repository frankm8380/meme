// -------------------------------
// Inject CSS for the camera container, video, and canvas.
// -------------------------------
(function injectCameraCSS() {
  const style = document.createElement("style");
  style.innerHTML = `
    /* Container for the video and canvas */
    #videoContainer {
      position: relative;
      width: 640px;
      height: 480px;
      margin: 20px auto;
      background: black;
    }
    /* Video element styling */
    #videoContainer video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      object-fit: cover;
    }
    /* Overlay canvas styling */
    #videoContainer #cameraCanvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      pointer-events: none;
      border: 2px solid red; /* For debugging; remove or change as needed */
    }
  `;
  document.head.appendChild(style);
})();

// -------------------------------
// Create a container for the video and canvas if it doesn't exist.
// -------------------------------
function createCameraContainer() {
  let container = document.getElementById("videoContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "videoContainer";
    document.body.appendChild(container);
  }
  return container;
}

// -------------------------------
// Helper to Start the camera process
// -------------------------------
function handleStartCamera() {
    document.getElementById("startCameraBtn").style.display = "none"; // Hide the button
    // Ensure the camera container is visible again
    const container = document.getElementById("videoContainer");
    if (container) {
        container.style.display = "block"; // Make sure it's visible
	}
		    
	startCamera(); // Start the camera and detection

  }
// -------------------------------
// Start the camera and initiate detection.
// -------------------------------
async function startCamera() {
    console.log("🎥 Starting camera...");
    try {
        const container = createCameraContainer();
        container.style.display = "block";

        // Remove any existing video element before creating a new one
        let oldVideo = document.getElementById("webcam");
        if (oldVideo) {
            oldVideo.pause();
            oldVideo.srcObject = null;
            oldVideo.remove();
        }

        // Create a new video element
        let video = document.createElement("video");
        video.id = "webcam";
        video.autoplay = true;
        video.playsInline = true;
        container.appendChild(video);

        // Get new video stream
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        video.srcObject = videoStream;

        video.onloadedmetadata = () => {
            video.play();
            detectionStopped = false;  // ✅ Reset detection flag
            detectFaceAndGesture(video);
        };

        // Show the meme canvas and buttons
        const memeCanvas = document.getElementById("memeCanvas");
        if (memeCanvas) {
            memeCanvas.style.display = "block";
        }

        document.getElementById("startCameraBtn").style.display = "none";
        document.getElementById("stopCameraBtn").style.display = "inline-block";
        document.getElementById("editMemeBtn").style.display = "inline-block";
		
        console.log("✅ Camera started.");
    } catch (error) {
        console.error("❌ Error starting camera:", error);
    }
}

// -------------------------------
// Stop the camera stream.
// -------------------------------
function stopCamera() {
    console.log("🛑 Stopping camera and cleaning up...");

    // Stop the camera stream if it's active
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }

    detectionStopped = true; // ✅ Stop processing loop

    // Hide the camera container
    const container = document.getElementById("videoContainer");
    if (container) {
        container.style.display = "none";
    }

    // Remove the video element to ensure fresh start
    const video = document.getElementById("webcam");
    if (video) {
        video.pause();
        video.srcObject = null;
        video.remove();
    }

    // Clear the memeCanvas and hide it
    const memeCanvas = document.getElementById("memeCanvas");
    if (memeCanvas) {
        const ctx = memeCanvas.getContext("2d");
        ctx.clearRect(0, 0, memeCanvas.width, memeCanvas.height);
		
        memeCanvas.width = defaultCanvasWidth;
        memeCanvas.height = defaultCanvasHeight;
        console.log(`🔄 Restored memeCanvas size to ${defaultCanvasWidth}x${defaultCanvasHeight}`);
    }

    // Restore the Start Camera button
    document.getElementById("startCameraBtn").style.display = "inline-block";
	
  // Reset result message positioning
    const resultElement = document.getElementById("resultContainer");
    if (resultElement) {
        resultElement.style.position = "relative";  // Remove sticky when stopping
    }
	displayStatusMessage("Start Camera when ready!");

    // Hide Stop, Retry, and Save buttons
    document.getElementById("stopCameraBtn").style.display = "none";
    document.getElementById("retryBtn").style.display = "none";
    document.getElementById("saveBtn").style.display = "none";
    document.getElementById("editMemeBtn").style.display = "none";
}
