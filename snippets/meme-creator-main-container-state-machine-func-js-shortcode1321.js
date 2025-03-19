	
/**
 * 🔄 Updates UI Based on State
 */
function updateUI(state) {
    console.log(`🔄 Updating UI for state: ${state.name}`);

    const topContainer = document.getElementById("resultContainer");
    const bottomContainer = document.getElementById("bottomResultContainer");

    if (!topContainer || !bottomContainer) {
        console.error("❌ UI containers not found in DOM.");
        return;
    }

    // Default visibility unless explicitly hidden
    const topShouldBeVisible = state.topVisible !== false;
    const bottomShouldBeVisible = state.bottomVisible !== false;

    console.log(`📌 Showing/Hiding containers... Top: ${topShouldBeVisible}, Bottom: ${bottomShouldBeVisible}`);
    topContainer.style.display = topShouldBeVisible ? "block" : "none";
    bottomContainer.style.display = bottomShouldBeVisible ? "block" : "none";
	
   // ✅ Adjust top container position when transitioning states
    if (state.positionTop) {
		positionTopContainerBelowHeader = state.positionTop !== "top"; // If "top", set false (move to top)
        console.log(`This state has a positionTop: ${state.positionTop}`);
        adjustResultContainerPosition(true);
    }

    // 🔽 Function to update buttons dynamically 🔽
    function updateButtons(location, buttons) {
        const container = document.getElementById(location === "top" ? "topButtonsContainer" : "bottomButtonsContainer");
        const allButtonsContainer = document.getElementById("allButtons");

        if (!container || !allButtonsContainer) {
            console.error(`❌ Missing container(s) for buttons: ${location}`);
            return;
        }

        // Clear existing buttons
        container.innerHTML = "";

        buttons.forEach(buttonId => {
            let button = allButtonsContainer.querySelector(`#${buttonId}`);

            if (button) {
                let clonedButton = button.cloneNode(true);
                clonedButton.addEventListener("click", () => {
                    console.log(`🖱 Click detected on: ${buttonId}, transitioning state.`);
                    changeState(buttonStateMap[buttonId] || 1);
                });

                container.appendChild(clonedButton);
            } else {
                console.warn(`⚠️ Button not found in #allButtons: ${buttonId}. Check for missing buttons.`);
            }
        });
    }

	// Display top message if provided
    if (state.topMessage && state.topMessage.trim() !== "") {
        displayTopMessage(state.topMessage);
    }
    // Display bottom message if provided
    if (state.bottomMessage && state.bottomMessage.trim() !== "") {
        displayBottomMessage(state.bottomMessage);
    }

    updateButtons("top", state.topButtons || []);
    updateButtons("bottom", state.bottomButtons || []);
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
