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
// Start the camera and initiate detection.
// -------------------------------
async function startCamera() {
  console.log("🎥 Starting camera...");
  try {
    const container = createCameraContainer();
    // Create (or retrieve) the video element
    let video = container.querySelector("#webcam");
    if (!video) {
      video = document.createElement("video");
      video.id = "webcam";
      video.autoplay = true;
      video.playsInline = true;
      container.appendChild(video);
    }
    // Stop any existing stream
    stopCamera();
    videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    video.srcObject = videoStream;
    video.onloadedmetadata = () => {
      video.play();
      // Start detection only after video dimensions are available.
      detectFaceAndGesture(video);
    };
    console.log("✅ Camera started.");
  } catch (error) {
    console.error("❌ Error starting camera:", error);
  }
}

// -------------------------------
// Stop the camera stream.
// -------------------------------
function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
    console.log("🛑 Camera stopped.");
  }

  // Hide or remove the video element
  const video = document.getElementById("webcam");
  if (video) {
    video.pause();
    video.srcObject = null;
    video.style.display = "none"; // Hide it
  }

  // Clear the canvas if it exists
  const canvas = document.getElementById("cameraCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Optionally, remove the video element entirely from the DOM
  if (video && video.parentNode) {
    video.parentNode.removeChild(video);
  }
}

// -------------------------------
// Restart detection by stopping and restarting the camera.
// -------------------------------
function restartDetection() {
    console.log("🔄 Restarting detection...");

    // Reset UI elements from meme editor
    const resultElement = document.getElementById("result");
    if (resultElement) {
        resultElement.innerText = "Awaiting gesture...";
        resultElement.style.color = "red";
    }

    const stickyFooter = document.getElementById("sticky-footer");
    const previewImage = document.getElementById("preview");

    if (stickyFooter) stickyFooter.style.display = "none";
    if (previewImage) previewImage.style.display = "none";

    // Reset detection flags
    detectionStopped = false;
    isMiddleFingerDetected = false;
    detectionStartTime = null;

    // Restart the camera for new detection
    resetDetectionState();
    startCamera();
}
