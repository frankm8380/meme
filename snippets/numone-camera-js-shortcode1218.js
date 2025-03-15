// Modify startCamera function to call adjustMemeCanvasSize
async function startCamera() {
    if (!detectionStopped) {
        stopCamera();
    }

    console.log("🎥 Starting camera and detection...");
    displayStatusMessage("Camera is Starting");
    resetDetectionState();

    try {
        // ✅ Ensure videoContainer exists and is visible
        const container = createCameraContainer();

        // ✅ Remove any existing webcam elements
        let existingVideo = document.getElementById("webcam");
        if (existingVideo) {
            existingVideo.pause();
            existingVideo.srcObject = null;
            existingVideo.remove();
        }

        // ✅ Create a new video element inside the container
        let video = document.createElement("video");
        video.id = "webcam";
        video.autoplay = true;
        video.playsInline = true;
        container.appendChild(video);

        // ✅ Set video stream size
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        video.srcObject = videoStream;

        video.onloadedmetadata = () => {
            video.play();
            detectionStopped = false;
            detectFaceAndGesture(video);

            // ✅ Resize memeCanvas to fit between resultContainers
            adjustMemeCanvasSize(video);
        };
        console.log("✅ Camera started.");
    } catch (error) {
        console.error("❌ Error starting camera:", error);
    }
}

// ✅ Optional: Adjust on window resize
window.addEventListener("resize", () => {
    const video = document.getElementById("webcam");
    if (video) adjustMemeCanvasSize(video);
});

// -------------------------------
// Stop the camera stream.
// -------------------------------
function stopCamera() {
    console.log("🛑 Stopping camera and cleaning up...");

    // ✅ Stop the camera stream if it's active
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }

    detectionStopped = true; // Stop processing loop

    // ✅ Remove the video element if it exists
    const video = document.getElementById("webcam");
    if (video) {
        video.pause();
        video.srcObject = null;
        video.remove();
    }

    // ✅ Restore memeCanvas state
    const memeCanvas = document.getElementById("memeCanvas");
    if (memeCanvas) {
        const ctx = memeCanvas.getContext("2d");
        ctx.clearRect(0, 0, memeCanvas.width, memeCanvas.height);

        memeCanvas.width = defaultCanvasWidth;
        memeCanvas.height = defaultCanvasHeight;
        memeCanvas.style.display = "none";

        console.log(`🔄 Restored memeCanvas size to ${defaultCanvasWidth}x${defaultCanvasHeight}`);
    }
    displayStatusMessage("What can I do on this page?");
}

// -------------------------------
// Create a container for the video and canvas if it doesn't exist.
// -------------------------------
function createCameraContainer() {
    let container = document.getElementById("videoContainer");

    if (!container) {
		console.log("Creating new videoContainer")
        container = document.createElement("div");
        container.id = "videoContainer";
        container.style.display = "none"; // 🔹 Hide it completely
        container.innerHTML = "";
    } else {
		console.log("Reusing previous videoContainer")
	}

    // ✅ Ensure it is ALWAYS inside `.image-container`
    const memeContainer = document.querySelector(".image-container");
    if (memeContainer && !memeContainer.contains(container)) {
        memeContainer.appendChild(container);
        console.log("✅ Ensured videoContainer is inside .image-container");
    }

    return container;
}
