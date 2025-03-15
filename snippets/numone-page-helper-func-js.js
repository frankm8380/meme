function goToPage(choice) {
	let selectedPerson = document.querySelector('input[name="person"]:checked');
	if (!selectedPerson) {
		alert("Please select Trump or Elon.");
		return;
	}

	let person = selectedPerson.value;
	let url = "";

	// Assign correct URLs based on selection
	if (person === "trump" && choice === "team") {
		url = "https://elonandtrumpnumberone.com/donald-trump-is-number-one-2/";
	} else if (person === "trump" && choice === "not") {
		url = "https://elonandtrumpnumberone.com/donald-trump-is-number-one/";
	} else if (person === "elon" && choice === "team") {
		url = "https://elonandtrumpnumberone.com/team-musk/";
	} else if (person === "elon" && choice === "not") {
		url = "https://elonandtrumpnumberone.com/elon-musk-is-number-one/";
	} else if (person === "webmaster" && choice === "team") {
		url = "https://elonandtrumpnumberone.com/team-website-creator/";
	} else if (person === "webmaster" && choice === "not") {
		url = "https://elonandtrumpnumberone.com/not-team-website-creator/";
	}

	// Redirect to the selected page
	if (url) {
		window.location.href = url;
	} else {
		alert("Something went wrong.");
	}
}

// Open Modal & Scroll to Top
function openModal(modalId) {
	let modal = document.getElementById(modalId);
	
	if (!modal) {
		console.error(`❌ Modal not found in DOM: ${modalId}. Checking available modals...`);
		console.log("🔍 Existing modals in DOM:", document.querySelectorAll(".modal"));
		return; // Stop execution if modal is missing
	}

	console.log(`📌 Opening modal: ${modalId}`);
	modal.style.display = "block";  
	modal.style.opacity = "1";      
	modal.style.visibility = "visible"; 
	modal.style.zIndex = "9999";   
	setTimeout(() => modal.scrollTop = 0, 10);

	// Hide result containers when modal is active
	let resultContainer = document.getElementById("resultContainer");
	let bottomContainer = document.getElementById("bottomResultContainer");

	if (resultContainer && bottomContainer) {
		console.log("📌 Hiding result containers while modal is active.");
		resultContainer.style.display = "none";
		bottomContainer.style.display = "none";
	}
}

// Close Modal
function closeModal(modalId) {
	let modal = document.getElementById(modalId);
	if (modal) {
		console.log(`📌 Closing modal: ${modalId}`);
		modal.style.display = "none";   // Hide it completely
		modal.style.opacity = "0";      // Ensure it's fully hidden
		modal.style.visibility = "hidden";
	} else {
		console.error(`❌ Modal not found in DOM: ${modalId}`);
		return;
	}

	// Restore the correct UI state after closing the modal
	if (document.getElementById("resultContainer")) {
		console.log("🔄 Restoring UI state after closing modal.");
		updateUI(states[currentState]); // Restore the UI state
	}
}

// Close modal when clicking outside
window.onclick = function(event) {
	if (event.target.classList.contains("modal")) {
		event.target.style.display = "none";

	  // If the state machine is active, restore result containers
	  if (document.getElementById("resultContainer")) {
	  	updateUI(states[currentState]); // Restore correct state
	  }	
	}
};
