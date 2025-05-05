// 📌 Cache controls when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
	cacheControlsOnce();
});

// 🧠 Full Page Initialization
window.addEventListener("load", async () => {
	// ✅ Hard-code the Home button to always go to site root
	const homeBtn = document.getElementById("homeBtn");
	if (homeBtn) {
		homeBtn.addEventListener("click", (e) => {
			e.preventDefault();
			window.location.href = "https://elonandtrumpnumberone.com/";
		});
	}

	// Load config and initialize state
	const path = window.location.pathname.toLowerCase();
	const pageTitle = document.title.toLowerCase();
	loadConfiguration(path, pageTitle);

	// 👁️ Create webcam element early
	const workspace = document.getElementById("workspaceContainer");
	const existingVideo = document.getElementById("webcam");
	if (!workspace) {
		console.warn("⚠️ Workspace not found");
	} else {
		const video = document.createElement("video");
		video.id = "webcam";
		video.autoplay = true;
		video.playsInline = true;
		video.muted = true; // Avoid autoplay restrictions
		video.style.display = "none"; // Start hidden
		workspace.appendChild(video);

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
			video.srcObject = stream;

			video.onloadedmetadata = () => {
				video.play();

				// ✅ Now that size is known, adjust layout
				adjustWorkspaceSize(video.videoWidth, video.videoHeight);

				const memeCanvas = document.getElementById("memeCanvas");
				if (memeCanvas) {
					memeCanvas.width = video.videoWidth;
					memeCanvas.height = video.videoHeight;
					defaultCanvasWidth = video.videoWidth;
					defaultCanvasHeight = video.videoHeight;
					console.log("📏 Canvas initialized: " + defaultCanvasWidth + "x" + defaultCanvasHeight);
				}
			};
		} catch (error) {
			console.error("❌ Could not access webcam:", error);
		}
	}

	// 🔄 Adjust top bar positioning
	const resultContainer = document.getElementById("resultContainer");
	const canvasExists = document.getElementById("memeCanvas");
	if (resultContainer && canvasExists) {
		adjustResultContainerPosition();
	} else {
		setTimeout(() => {
			const retryTop = document.getElementById("resultContainer");
			const retryCanvas = document.getElementById("memeCanvas");
			if (retryTop && retryCanvas) {
				adjustResultContainerPosition();
			} else {
				console.error("❌ Still missing resultContainer or memeCanvas after delay.");
			}
		}, 250);
	}
	watchForHeaderChanges();

	// 🧠 UI state setup
	updateUI(states[currentState]);

	// 🔘 Bind all buttons
	Object.keys(buttonStateMap).forEach(btn => {
		const button = document.getElementById(btn);
		if (button) {
			button.addEventListener("click", () => {
				console.log("🖱 Click: " + btn + ", changing state to " + buttonStateMap[btn]);
				changeState(buttonStateMap[btn]);
			});
		} else {
			console.warn("⚠️ Button not found: " + btn);
		}
	});
});
