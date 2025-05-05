// 🎯 Master UI Update Function
function updateUI(state) {
	console.log("🔄 Updating UI for state: " + state.name);

	const topContainer = document.getElementById("resultContainer");
	const bottomContainer = document.getElementById("bottomResultContainer");
	const topMessageEl = document.getElementById("topMessage");
	const bottomMessageEl = document.getElementById("bottomMessage");

	if (!topContainer || !bottomContainer || !topMessageEl || !bottomMessageEl) {
		console.error("❌ One or more UI containers not found.");
		return;
	}

	// Adjust result container position if needed
	if (state.positionTop) {
		positionTopContainerBelowHeader = state.positionTop !== "top";
		adjustResultContainerPosition(true);
	}

	// Set messages
	topMessageEl.textContent = state.topMessage || "";
	topMessageEl.style.display = state.topMessage ? "block" : "none";

	bottomMessageEl.textContent = state.bottomMessage || "";
	bottomMessageEl.style.display = state.bottomMessage ? "block" : "none";

	applyViewType(state.viewType);
	
	// Render top and bottom buttons
	updateButtons("top", state.topButtons || []);
	updateButtons("bottom", state.bottomButtons || []);
}

// 🔘 Insert Buttons + Controls into Button Rows (top or bottom)
function updateButtons(location, items) {
	const container = document.getElementById(location === "top" ? "topButtonsContainer" : "bottomButtonsContainer");
	if (!container) {
		console.error("❌ Missing container for " + location + "ButtonsContainer");
		return;
	}

	container.innerHTML = "";

	items.forEach(itemId => {
		if (Object.values(CONTROLS).includes(itemId)) {
			const cached = CONTROL_CACHE[itemId];
			if (cached && cached.el && cached.label) {
				const group = document.createElement("div");
				group.className = "control-group";
				group.appendChild(cached.label);
				group.appendChild(cached.el);
				container.appendChild(group);
			} else {
				console.warn("⚠️ Missing control or label for: " + itemId);
			}
		} else if (Object.values(BUTTONS).includes(itemId)) {
			const original = document.querySelector("#allButtons #" + itemId);
			if (original) {
				const cloned = original.cloneNode(true);
				cloned.addEventListener("click", () => {
					console.log("🖱 Click: " + itemId + ", transitioning state.");
					changeState(buttonStateMap[itemId] || 1);
				});
				container.appendChild(cloned);
			}
		}
	});
}
function setWorkspaceHelpText(text) {
	const helpTextEl = document.getElementById("workspaceHelpText");
	if (helpTextEl) {
		helpTextEl.innerText = text;
	}
}


/**
 * 🔄 Updates UI Based on State
 */
function applyViewType(viewType) {
	const webcam = document.getElementById("webcam");
	const memeCanvas = document.getElementById("memeCanvas");
	const uploadForm = document.getElementById("uploadFormContainer");
	const helpText = document.getElementById("workspaceHelpText");

	// Sanity check
	if (!webcam) {
		console.error("❌ Missing webcam workspace element.");
		return;
	}
	if (!memeCanvas) {
		console.error("❌ Missing memeCanvas workspace element.");
		return;
	}
	if (!uploadForm) {
		console.error("❌ Missing uploadForm workspace element.");
		return;
	}
	if (!helpText) {
		console.error("❌ Missing helpText workspace element.");
		return;
	}

	// Default: hide everything
	webcam.style.display = "none";
	memeCanvas.style.display = "none";
	uploadForm.style.display = "none";
	helpText.style.display = "none";

	switch (viewType) {
		case VIEW_TYPE.CAMERA:
			memeCanvas.style.display = "block";
			
			
			break;

		case VIEW_TYPE.MEME:
			memeCanvas.style.display = "block";
			break;

		case VIEW_TYPE.UPLOAD:
			uploadForm.style.display = "block";
			break;

		case VIEW_TYPE.BLANK:
		default:
			helpText.style.display = "block";
			
setWorkspaceHelpText("Tap 'Create' to begin.");


			
			break;
	}
}


// 🔁 Cache all original controls + labels once, so we can reuse them later
const CONTROL_CACHE = {};

function cacheControlsOnce() {
	Object.values(CONTROLS).forEach(id => {
		const el = document.getElementById(id);
		const label = document.querySelector("label[for='" + id + "']");

		if (el && label) {
			CONTROL_CACHE[id] = { el, label };

			switch (id) {
				case "topText":
				case "bottomText":
					el.addEventListener("change", updateMemeText);
					break;

				case "textColor":
					el.addEventListener("input", () => {
						updateColor();
						updateMemeText();
						lastSelectedTextColor = el.value;
					});
					break;

				case "includeDisclaimer":
					el.addEventListener("change", updateMemeText);
					break;

				case "blurFace":
					el.addEventListener("change", updateBlurFace);
					break;
			}
		}
	});
}
