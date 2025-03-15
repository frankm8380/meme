	
function uploadMeme() {
}
function sendMeme() {
}
function shareMeme() {
}



// ✅ Check if IP has reached limit for a specific action and page
async function checkIpLimit(actionType, pageTitle) {
    const encodedTitle = encodeURIComponent(pageTitle);
    const response = await fetch(`/wp-admin/admin-ajax.php?action=check_ip_limit&action_type=${actionType}&page_title=${encodedTitle}`);
    const data = await response.json();
    return data.allowed;
}

// ✅ Disable buttons if IP limit reached on page load
async function enforceIpLimitsOnLoad() {
    const pageTitle = document.title;

    // Check upload limit
    const uploadAllowed = await checkIpLimit('upload', pageTitle);
    if (!uploadAllowed) {
        document.getElementById("uploadMemeButton").disabled = true;
        document.getElementById("uploadStatus").innerText = `❌ Upload limit reached for "${pageTitle}". You can only upload one meme every 12 hours.`;
    } else {
        document.getElementById("uploadMemeButton").disabled = false;
	}

    // Check email limit
    const emailAllowed = await checkIpLimit('email', pageTitle);
    if (!emailAllowed) {
        document.getElementById("emailMemeButton").disabled = true;
        document.getElementById("uploadStatus").innerText += `\n❌ Email limit reached for "${pageTitle}". You can only send one email every 12 hours.`;
    } else {
        document.getElementById("emailMemeButton").disabled = false;
	}
    document.getElementById("twitterMemeButton").disabled = false;
}

// ✅ Log successful action after upload or email
async function logIpAction(actionType, pageTitle) {
    const encodedTitle = encodeURIComponent(pageTitle);
    await fetch(`/wp-admin/admin-ajax.php?action=log_ip_action&action_type=${actionType}&page_title=${encodedTitle}`);
}

// ✅ Clear limits for testing
async function clearLimits() {
    const response = await fetch('/wp-admin/admin-ajax.php?action=clear_ip_limits');
    const data = await response.json();

    if (data.success) {
        alert("✅ Limits cleared successfully.");
        document.getElementById("uploadStatus").innerText = "✅ Limits cleared. You can test again.";
        await enforceIpLimitsOnLoad();
    } else {
        alert("❌ Failed to clear limits.");
    }
}

// ✅ URL Encoding Functions
function urlEncode(text) {
	return encodeURIComponent(text);
}

function legacyURLEncode(text) {
	return escape(text);
}

// ✅ Preview Selected Image
function previewImage() {
	const fileInput = document.getElementById("memeFile");
	const previewContainer = document.getElementById("imagePreviewContainer");
	const previewImage = document.getElementById("imagePreview");

	if (!fileInput.files || fileInput.files.length === 0) {
		previewContainer.style.display = "none";
		return;
	}

	const file = fileInput.files[0];

	if (!file.type.startsWith("image/")) {
		document.getElementById("uploadStatus").innerText = "❌ Please select a valid image file.";
		previewContainer.style.display = "none";
		return;
	}

	const reader = new FileReader();
	reader.onload = function (e) {
		previewImage.src = e.target.result;
		previewContainer.style.display = "block";
	};

	reader.readAsDataURL(file);
}

// ✅ Google Vision Validation
let lastValidatedFile = null;
let lastValidatedText = "";
let visionCheckPassed = false;

async function validateBeforeAction(actionType) {
    const fileInput = document.getElementById("memeFile");
    const file = fileInput.files[0];
    const currentText = document.getElementById("postContent").value.trim();

    // Check if the file or text actually changed
    const fileChanged = !lastValidatedFile || file?.name !== lastValidatedFile.name || file?.size !== lastValidatedFile.size;
    const textChanged = currentText !== lastValidatedText;

    if (fileChanged || textChanged) {
        // Reset validation and recheck
        visionCheckPassed = false;
        document.getElementById("uploadStatus").innerText = "🔍 Revalidating changes...";

        // If a file exists, validate it
        if (file) {
            visionCheckPassed = await validateFileWithVision(file);
        }

        if (!visionCheckPassed) {
            document.getElementById("uploadStatus").innerText = "❌ Validation failed.";
            return false; // Stop the action
        }

        // Update the last validated state
        lastValidatedFile = file ? { name: file.name, size: file.size } : null;
        lastValidatedText = currentText;
    }

    return true; // Proceed with the action
}

// // ✅ Validate File with Google Vision API
async function validateFileWithVision(file) {
    document.getElementById("uploadStatus").innerText = "🔍 Validating image...";
    visionCheckPassed = false;

    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = async function (event) {
            const base64Image = event.target.result.split(',')[1];

            try {
                const response = await fetch('/wp-admin/admin-ajax.php?action=analyze_image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image_data: base64Image })
                });

                const result = await response.json();
                if (result.success) {
                    document.getElementById("uploadStatus").innerText = "✅ Image approved!";
                    lastValidatedFile = { name: file.name, size: file.size };
                    visionCheckPassed = true;
                    resolve(true);
                } else {
                    document.getElementById("uploadStatus").innerText = `❌ Image rejected: ${result.message}`;
                    visionCheckPassed = false;
                    resolve(false);
                }
            } catch (error) {
                document.getElementById("uploadStatus").innerText = "❌ Error validating image. Try again.";
                visionCheckPassed = false;
                resolve(false);
            }
        };

        reader.onerror = (err) => {
            document.getElementById("uploadStatus").innerText = "❌ Error reading file.";
            visionCheckPassed = false;
            reject(err);
        };

        reader.readAsDataURL(file);
    });
}

// ✅ Check if the File is the Same as Last Validated One
function isSameFile(file) {
    return lastValidatedFile && file.name === lastValidatedFile.name && file.size === lastValidatedFile.size;
}
	
// ✅ Disable all buttons during processing
function disableAllButtons() {
    document.getElementById("uploadMemeButton").disabled = true;
    document.getElementById("emailMemeButton").disabled = true;
    document.getElementById("twitterMemeButton").disabled = true;
}

// ✅ Restore button states after processing
async function restoreButtons(successButton = null) {
    await enforceIpLimitsOnLoad();
    if (successButton) {
        successButton.disabled = true;
    }
}

