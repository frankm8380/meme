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
		url = "https://elonandtrumpnumberone.com/team-trump/";
	} else if (person === "trump" && choice === "not") {
		url = "https://elonandtrumpnumberone.com/not-team-trump/";
	} else if (person === "elon" && choice === "team") {
		url = "https://elonandtrumpnumberone.com/team-musk/";
	} else if (person === "elon" && choice === "not") {
		url = "https://elonandtrumpnumberone.com/not-team-musk/";
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

