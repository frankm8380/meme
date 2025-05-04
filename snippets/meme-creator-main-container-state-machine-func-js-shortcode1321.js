	
/**
 * 🔄 Updates UI Based on State
 */

function applyViewType(viewType) {
	const memeCanvas = document.getElementById("memeCanvas");
	const uploadForm = document.getElementById("uploadFormContainer");
	const topContainer = document.getElementById("resultContainer");
	const bottomContainer = document.getElementById("bottomResultContainer");
	const video = document.getElementById("webcam");

	if (!memeCanvas || !uploadForm) return;
	if (!topContainer || !bottomContainer) return;

    const ctx = memeCanvas.getContext("2d");

	switch (viewType) {
		case VIEW_TYPE.CAMERA:
			// live video is on the canvas
			memeCanvas.style.display = "none";
			uploadForm.style.display = "none";
	        topContainer.style.display = "block";
	        bottomContainer.style.display = "block";
			if (video) adjustMemeCanvasSize(video);
			if (ctx) drawMemeText(ctx);
			break;

		case VIEW_TYPE.MEME:
			// captured gesture is on the canvas
			memeCanvas.style.display = "block";
			uploadForm.style.display = "none";
	        topContainer.style.display = "block";
	        bottomContainer.style.display = "block";
			if (video) adjustMemeCanvasSize(video);
			if (ctx) drawMemeText(ctx);
			break;

		case VIEW_TYPE.UPLOAD:
			memeCanvas.style.display = "none";
			uploadForm.style.display = "block";
	        topContainer.style.display = "block";
	        bottomContainer.style.display = "block";
			uploadForm.width = memeCanvas.width;
			uploadForm.height = memeCanvas.height;
			uploadForm.style.width = memeCanvas.style.width;
			uploadForm.style.height = memeCanvas.style.height;
			uploadForm.style.position = memeCanvas.style.position;
			uploadForm.style.top = memeCanvas.style.top;
			uploadForm.style.left = memeCanvas.style.left;
			uploadForm.style.transform = memeCanvas.style.transform;
			break;

		case VIEW_TYPE.BLANK:
		default:
			// Nothing shown
			memeCanvas.style.display = "none";
			uploadForm.style.display = "none";
	        topContainer.style.display = "block";
	        bottomContainer.style.display = "block";
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

// 📌 Cache controls when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
    cacheControlsOnce();
});

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

/**
 * 🔀 Changes State in the State Machine
 */
function changeState(newState) {
    if (!states[newState]) {
        console.error(`❌ Invalid state: ${newState}`);
        return;
    }

    // Store previous state when not in a modal
    if (!states[newState].modal) {
        previousState = newState;
    }

    console.log(`🔀 Changing state from ${currentState} to ${newState}`);
    currentState = newState;

    // Automatically call `onEnter` function if defined
    if (states[newState].onEnter) {
        console.log(`⚡ Executing onEnter function for state: ${newState}`);
        states[newState].onEnter();
    } else if (states[newState].modal) {
        // ✅ Open modal if this state requires one
        let modalId = states[newState].modal;
        
        if (localStorage.getItem(`skip_${modalId}`) === "true") {
            console.log(`🚫 Skipping modal: ${modalId} (User preference)`);       
            afterModalClose(modalId);
            return;
        }

        let modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`❌ Modal not found: ${modalId}`);
            return;
        }

        console.log(`📌 State machine opening modal: ${modalId}`);
        openModal(modalId);

        // 🕵️‍♂️ Watch for modal closing
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "style" && window.getComputedStyle(modal).display === "none") {
                    console.log(`🛑 Detected modal close: ${modalId}`);
                    observer.disconnect();
                    afterModalClose(modalId);
                }
            });
        });

        observer.observe(modal, { attributes: true });
    }

    // ✅ UI updates (including buttons) are now handled in one place
    updateUI(states[currentState]);
}
	
/**
 * 🔄 Handles Skipped Modal (User Chose "Do not show again")
 */
function afterModalClose(modalId) {
    console.log("🔄 Handling closed modal: " + modalId);

    let resultContainer = document.getElementById("resultContainer");
    let bottomContainer = document.getElementById("bottomResultContainer");
    if (resultContainer && bottomContainer) {
      // Get the current state that owns this modal
      let currentState = Object.values(states).find(state => state.modal === modalId);

      // Determine next state (if defined), otherwise go back to previous state
      let nextState = currentState?.nextState || previousState;

      console.log("🔄 Transitioning to state: " + nextState);
      changeState(nextState);
	}
}
