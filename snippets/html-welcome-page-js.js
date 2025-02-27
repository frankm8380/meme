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
	if (modal) {
		modal.style.display = "block";
		setTimeout(() => modal.scrollTop = 0, 10);
	}
}

// Close Modal
function closeModal(modalId) {
	let modal = document.getElementById(modalId);
	if (modal) {
		modal.style.display = "none";
	}
}

// Close modal when clicking outside
window.onclick = function(event) {
	if (event.target.classList.contains("modal")) {
		event.target.style.display = "none";
	}
};
