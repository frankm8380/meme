// 🔄 meme-state-machine.js

/** 🏷️ Define Constants for Readability */
const BUTTONS = {
    READ: "readBtn",
    CREATE: "createBtn",
    UPLOAD: "uploadBtn",
    SEND: "sendBtn",
    DONATE: "donateBtn",
    START_CAMERA: "startCameraBtn",
    STOP_CAMERA: "stopCameraBtn",
    RETRY: "retryBtn",
    SAVE: "saveBtn",
    SHARE: "shareBtn",
    NEW: "newBtn",
    DONE: "doneBtn",
    BACK: "backBtn",
	GOHOME: "homeBtn"
};

/** 🎛️ Define Meme Editing Controls */
const CONTROLS = {
    TOP_TEXT: "topText",
    TEXT_COLOR: "textColor",
    BOTTOM_TEXT: "bottomText",
    DISCLAIMER: "includeDisclaimer",
    BLUR_FACE: "blurFace",  // ✅ New Blur Face Control
	MEME_FILE: "memeFile"
};

/** 🎭 Define State Identifiers */
const STATE = {
    INITIAL: 1,
    READ: 2,
    CREATE: 3,
    CREATE_MODE: 3.1,
    CAMERA_RUNNING: 4,
    CAMERA_STOPPED: 4.1,
    GESTURE_DETECTED: 5,
	UPLOAD_FORM: 6,
    SAVE: 7,
    SAVE_MODE: 7.1,
    UPLOAD: 8,
    UPLOAD_MODE: 8.1,
    SEND: 9,
    SEND_MODE: 9.1,
    SHARE: 10,
    SHARE_MODE: 10.1,
    DONATE: 11,
	GOHOME: 12,
};

function createState({ 
    name, 
    topButtons = [], 
    bottomButtons = [], 
    modal = null, 
    onEnter = null, 
    topMessage = "",
    bottomMessage = "",
    topVisible = true,  
    bottomVisible = true,
    nextState = null, // ✅ Define the next state after closing a modal
    positionTop = null, // ✅ Define top container positioning ("top" or "default")
	formVisible = false,
    canvasVisible = true
}) {
    return { name, topButtons, bottomButtons, topMessage, bottomMessage, modal, onEnter, topVisible, bottomVisible, nextState, positionTop, formVisible, canvasVisible };
}


/**
 * 🏗️ State Factory Function (Easier to Maintain & Modify)
 */
/** 📌 Define State Transitions */
const states = {
    [STATE.INITIAL]: createState({
        name: "Initial",
		formVisible: false,
        canvasVisible: false,
        topButtons: [BUTTONS.READ, BUTTONS.CREATE, BUTTONS.DONATE],
        bottomButtons: [BUTTONS.GOHOME],
        topVisible: true,
        bottomVisible: true,
        positionTop: "default",
        topMessage: "Welcome! Please choose an option.",
        bottomMessage: "Select Read, Create, or Donate."
    }),
    [STATE.READ]: createState({
        name: "Read Modal",
        modal: "readModal",
		formVisible: false,
        canvasVisible: false,
        topVisible: false,
        bottomVisible: false
        // (modal states can leave messages empty)
    }),
    [STATE.CREATE]: createState({
        name: "Create Modal",
        modal: "createModal",
		formVisible: false,
        canvasVisible: false,
        topVisible: false,
        bottomVisible: false,
        nextState: STATE.CAMERA_RUNNING,
        positionTop: "top"
    }),
    [STATE.CREATE_MODE]: createState({
        name: "Create Mode",
		formVisible: false,
        canvasVisible: false,
        bottomButtons: [BUTTONS.START_CAMERA, BUTTONS.BACK],
        topVisible: true,
        bottomVisible: true,
        positionTop: "top",
        topMessage: "Create your meme.",
        bottomMessage: "Press 'Start Camera' to capture your image or 'Back' to return."
    }),
    [STATE.CAMERA_RUNNING]: createState({
        name: "Camera Running",
		formVisible: false,
        canvasVisible: true,
        topButtons: [CONTROLS.TOP_TEXT, CONTROLS.BLUR_FACE, CONTROLS.TEXT_COLOR],  
        bottomButtons: [CONTROLS.BOTTOM_TEXT, CONTROLS.DISCLAIMER, BUTTONS.STOP_CAMERA],  
        onEnter: clickStartCamera,
        topVisible: true,
        bottomVisible: true,
        positionTop: "top",
        topMessage: "Camera Running: Time to show your #1 gesture!",
        bottomMessage: "Align your face and perform the #1 gesture for capture."
    }),
    [STATE.CAMERA_STOPPED]: createState({
        name: "Camera Stopped",
		formVisible: false,
        canvasVisible: true,
        topButtons: [BUTTONS.START_CAMERA],  
        bottomButtons: [BUTTONS.BACK],  
        onEnter: clickStopCamera,
        topVisible: true,
        bottomVisible: true,
        topMessage: "Camera Stopped.",
        bottomMessage: "Press 'Start Camera' to restart."
    }),
    [STATE.GESTURE_DETECTED]: createState({
        name: "Gesture Detected",
		formVisible: false,
        canvasVisible: true,
        topButtons: [CONTROLS.TOP_TEXT, CONTROLS.BLUR_FACE, CONTROLS.TEXT_COLOR, BUTTONS.SAVE],  
        bottomButtons: [CONTROLS.BOTTOM_TEXT, CONTROLS.DISCLAIMER, BUTTONS.RETRY, BUTTONS.BACK],  
        topVisible: true,
        bottomVisible: true,
        topMessage: "Gesture Detected!",
        bottomMessage: "You can edit or redo your meme here.  When you like it, click Save!"
    }),
    [STATE.SAVE]: createState({
        name: "Save Modal",
        modal: "saveModal",
        topVisible: false,
        bottomVisible: false,
        nextState: STATE.SAVE_MODE,
		formVisible: false,
        canvasVisible: false
    }),
    [STATE.SAVE_MODE]: createState({
        name: "Meme Saved",
		formVisible: true,
        canvasVisible: false,
        topButtons: [CONTROLS.MEME_FILE],  
        bottomButtons: [BUTTONS.UPLOAD, BUTTONS.SEND, BUTTONS.SHARE, BUTTONS.DONATE, BUTTONS.BACK],
        onEnter: clickSaveMeme,
        topVisible: true,
        bottomVisible: true,
        topMessage: "Meme Saved!",
        bottomMessage: "You can now Upload, Send, or Share your meme."
    }),
    [STATE.UPLOAD]: createState({
        name: "Upload Modal",
        modal: "uploadModal",
		formVisible: false,
        canvasVisible: false,
        topVisible: false,
        bottomVisible: false,
        nextState: STATE.UPLOAD_MODE
    }),
    [STATE.UPLOAD_MODE]: createState({
        name: "Meme Uploaded",
		formVisible: true,
        canvasVisible: false,
        topButtons: [CONTROLS.MEME_FILE],  
        bottomButtons: [BUTTONS.SEND, BUTTONS.SHARE, BUTTONS.DONATE, BUTTONS.BACK],
        onEnter: clickUploadMeme,
        topVisible: true,
        bottomVisible: true,
        topMessage: "Meme Uploaded!",
        bottomMessage: "Your meme is now uploaded and ready."
    }),
    [STATE.SEND]: createState({
        name: "Send Modal",
        modal: "sendModal",
		formVisible: false,
        canvasVisible: false,
        topVisible: false,
        bottomVisible: false,
        nextState: STATE.SEND_MODE
    }),
    [STATE.SEND_MODE]: createState({
        name: "Meme Sent",
		formVisible: true,
        canvasVisible: false,
        topButtons: [CONTROLS.MEME_FILE],  
        bottomButtons: [BUTTONS.UPLOAD, BUTTONS.SHARE, BUTTONS.DONATE, BUTTONS.BACK],
        onEnter: clickSendMeme,
        topVisible: true,
        bottomVisible: true,
        topMessage: "Meme Sent!",
        bottomMessage: "Your meme has been sent successfully."
    }),
    [STATE.SHARE]: createState({
        name: "Share Modal",
        modal: "shareModal",
		formVisible: false,
        canvasVisible: false,
        topVisible: false,
        bottomVisible: false,
        nextState: STATE.SHARE_MODE
    }),
    [STATE.SHARE_MODE]: createState({
        name: "Meme Shared",
		formVisible: true,
        canvasVisible: false,
        topButtons: [CONTROLS.MEME_FILE],  
        bottomButtons: [BUTTONS.UPLOAD, BUTTONS.SEND, BUTTONS.DONATE, BUTTONS.BACK],
        onEnter: clickShareMeme,
        topVisible: true,
        bottomVisible: true,
        topMessage: "Meme Shared!",
        bottomMessage: "Your meme is now shared with others."
    }),
    [STATE.DONATE]: createState({
        name: "Donate Modal",
        modal: "donateModal",
		formVisible: false,
        canvasVisible: false,
        topVisible: false,
        bottomVisible: false,
        topMessage: "Support Us!",
        bottomMessage: "Thank you for considering a donation."
    }),
	[STATE.GOHOME]: createState({
  	    name: "Go Home",
	    onEnter: () => {
		    window.location.href = "https://elonandtrumpnumberone.com/";
	    }
    })
};

/** 🔄 Reverse Map for Button Actions */
const buttonStateMap = {
    [BUTTONS.READ]: STATE.READ,
    [BUTTONS.CREATE]: STATE.CREATE,
    [BUTTONS.UPLOAD]: STATE.UPLOAD,
    [BUTTONS.SEND]: STATE.SEND,
    [BUTTONS.DONATE]: STATE.DONATE,
    [BUTTONS.START_CAMERA]: STATE.CAMERA_RUNNING,
    [BUTTONS.STOP_CAMERA]: STATE.CAMERA_STOPPED,
    [BUTTONS.RETRY]: STATE.CREATE,
    [BUTTONS.SAVE]: STATE.SAVE,
    [BUTTONS.SHARE]: STATE.SHARE,
    [BUTTONS.NEW]: STATE.CREATE,
    [BUTTONS.DONE]: STATE.INITIAL,
    [BUTTONS.BACK]: STATE.INITIAL,
    [BUTTONS.GOHOME]: STATE.GOHOME
};

// stuff to do once the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {	
	// ✅ Hard-code the Home button to always go to site root
	const homeBtn = document.getElementById("homeBtn");
	if (homeBtn) {
		homeBtn.addEventListener("click", (e) => {
			e.preventDefault(); // prevent any default state-machine behavior
			window.location.href = "https://elonandtrumpnumberone.com/";
		});
	}
	
	// Page Load Configuration
	const path = window.location.pathname.toLowerCase();
	const pageTitle = document.title.toLowerCase();
	loadConfiguration(path, pageTitle);
	
	// Meme Canvas Initialization
	const memeCanvas = document.getElementById("memeCanvas");
	if (memeCanvas) {
		defaultCanvasWidth = memeCanvas.width;
		defaultCanvasHeight = memeCanvas.height;
		// Ensure canvas starts hidden until adjusted
		memeCanvas.style.display = "none";
		console.log("📏 Saved default memeCanvas size: " + defaultCanvasWidth + "x" + defaultCanvasHeight);
	}
	
	// Initialize UI based on the current state
	updateUI(states[currentState]);

	// Attach event listeners dynamically
	Object.keys(buttonStateMap).forEach(btn => {
		let button = document.getElementById(btn);
		if (button) {
			button.addEventListener("click", () => {
				console.log("🖱 Click detected on: " + btn + ", changing state to " + buttonStateMap[btn]);
				changeState(buttonStateMap[btn]);
			});
		} else {
			console.warn("⚠️ Button missing in DOM at load: " + btn);
		}
	});

	// Ensure canvas resizes properly on window resize
	let resizeTimeout;
	window.addEventListener("resize", () => {
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(() => {
			const video = document.getElementById("webcam");
			if (video) adjustMemeCanvasSize(video);
		}, 100); // Debounce time
	});
	
});

// Run on page load
window.addEventListener("load", async () => {
	const resultExists = document.getElementById("resultContainer");
	const canvasExists = document.getElementById("memeCanvas");

	if (resultExists && canvasExists) {
		adjustResultContainerPosition();
	} else {
		console.warn("⏳ Delaying result container positioning until DOM is ready...");
		setTimeout(() => {
			const resultRetry = document.getElementById("resultContainer");
			const canvasRetry = document.getElementById("memeCanvas");
			if (resultRetry && canvasRetry) {
				adjustResultContainerPosition();
			} else {
				console.error("❌ Still missing resultContainer or memeCanvas after delay.");
			}
		}, 250); // Delay to let DOM finish building
	}

	watchForHeaderChanges();
});


	
// Adjust memeCanvas on resize as well
window.addEventListener("resize", () => {
	clearTimeout(resizeTimeout);
	resizeTimeout = setTimeout(() => {
		const memeCanvas = document.getElementById("memeCanvas");
		const uploadForm = document.getElementById("uploadFormContainer");

		if (memeCanvas && memeCanvas.style.display !== "none") {
			const video = document.getElementById("webcam");
			if (video) {
				adjustMemeCanvasSize(video);
			}
		} else if (memeCanvas && uploadForm && uploadForm.style.display !== "none") {
			uploadForm.width = memeCanvas.width;
			uploadForm.height = memeCanvas.height;
			uploadForm.style.width = memeCanvas.style.width;
			uploadForm.style.height = memeCanvas.style.height;
			uploadForm.style.position = memeCanvas.style.position;
			uploadForm.style.top = memeCanvas.style.top;
			uploadForm.style.left = memeCanvas.style.left;
			uploadForm.style.transform = memeCanvas.style.transform;
			uploadForm.style.display = memeCanvas.style.display;
		}
	}, 100); // Debounce time
});
``

function clickStartCamera() {
	startCamera();
}
function clickStopCamera() {
	stopCamera();
}
function clickSaveMeme() {
	saveMeme();
}
function clickUploadMeme() {
	uploadMeme();
}
function clickSendMeme() {
	sendMeme();
}
function clickShareMeme() {
	shareMeme();
}
