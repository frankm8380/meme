/**
 * 📦 Defines and sizes the workspace container between result containers.
 * This is the visual frame that holds the webcam, memeCanvas, or upload form.
 */

// 🔄 Size workspace using actual camera dimensions (called after camera loads)
function adjustWorkspaceSize(videoWidth, videoHeight) {
	const container = document.getElementById("workspaceContainer");
	if (!container || !videoWidth || !videoHeight) return;

	const topOffset = getTopToolbarHeight();
	const topResult = document.getElementById("resultContainer")?.offsetHeight || 0;
	const bottomResult = document.getElementById("bottomResultContainer")?.offsetHeight || 0;

	const availableHeight = window.innerHeight - (topOffset + topResult + bottomResult);
	const availableWidth = document.body.clientWidth;

	const aspectRatio = videoWidth / videoHeight;
	let width = availableWidth;
	let height = width / aspectRatio;

	if (height > availableHeight) {
		height = availableHeight;
		width = height * aspectRatio;
	}

	container.style.top = (topOffset + topResult) + "px";
	container.style.width = width + "px";
	container.style.height = height + "px";
	container.style.left = "50%";
	container.style.transform = "translateX(-50%)";
	container.style.position = "fixed";
	
    console.log("📐 Workspace adjusted to " + Math.round(width) + "x" + Math.round(height) + " based on camera dimensions");
}

// 🔄 Dynamically size the workspace container based on available space
function adjustWorkspaceContainer() {
	const container = document.getElementById("workspaceContainer");
	if (!container) return;

	const topOffset = getTopToolbarHeight();
	const topResult = document.getElementById("resultContainer")?.offsetHeight || 0;
	const bottomResult = document.getElementById("bottomResultContainer")?.offsetHeight || 0;

	const availableHeight = window.innerHeight - (topOffset + topResult + bottomResult);
	const availableWidth = document.body.clientWidth;

	const aspectRatio = 640 / 480; // 4:3 as default
	let width = availableWidth;
	let height = width / aspectRatio;

	if (height > availableHeight) {
		height = availableHeight;
		width = height * aspectRatio;
	}

	container.style.top = (topOffset + topResult) + "px";
	container.style.width = width + "px";
	container.style.height = height + "px";
	container.style.left = "50%";
	container.style.transform = "translateX(-50%)";
	container.style.position = "fixed";
}

// 📣 Show or hide workspace help text based on current view type
function updateWorkspaceHelp(viewType) {
	const help = document.getElementById("workspaceHelpText");
	if (!help) return;

	if (viewType === VIEW_TYPE.BLANK) {
		help.style.display = "block";
	} else {
		help.style.display = "none";
	}
}

// 🔄 Call on page load and resize
window.addEventListener("load", () => {
	adjustWorkspaceContainer();
});

window.addEventListener("resize", () => {
	setTimeout(() => {
		adjustWorkspaceContainer();
	}, 150);
});
