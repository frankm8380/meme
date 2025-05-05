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
