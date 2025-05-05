// -------------------------------
// Start the camera stream using the existing webcam element.
// -------------------------------
async function startCamera() {
	if (!detectionStopped) {
		stopCamera(); // safety first
	}

	console.log("🎥 Starting camera and detection...");
	displayStatusMessage("Camera is Starting");
	resetDetectionState();

	try {
		const video = document.getElementById("webcam");
		if (!video) {
			console.error("❌ Webcam element not found.");
			return;
		}

		video.style.display = "block";

		// Start video stream
		videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
		video.srcObject = videoStream;

		// Wait for the actual video to be ready
		await new Promise(resolve => {
			video.onloadedmetadata = () => {
				video.play();
				resolve();
			};
		});

		// Now that we have actual dimensions, adjust layout
		adjustWorkspaceSize(video.videoWidth, video.videoHeight);

		detectionStopped = false;
		detectFaceAndGesture(video); // ✅ begins draw + detection loop
		console.log("✅ Camera started.");
	} catch (error) {
		console.error("❌ Error starting camera:", error);
	}
}
// -------------------------------
// Stop the camera stream and hide all visual elements.
// -------------------------------
function stopCamera() {
	console.log("🛑 Stopping camera and cleaning up...");

	const video = document.getElementById("webcam");
	if (video) {
		try {
			video.pause();
			video.srcObject = null;
			video.style.display = "none";
		} catch (e) {
			console.warn("⚠️ Video cleanup issue:", e);
		}
	}

	if (videoStream) {
		videoStream.getTracks().forEach(track => track.stop());
		videoStream = null;
	}

	detectionStopped = true;

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
