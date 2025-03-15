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
    EDIT: "editBtn",
    SHARE: "shareBtn",
    NEW: "newBtn",
    DONE: "doneBtn",
    BACK: "backBtn"
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
    EDIT: 6,
    EDIT_MODE: 6.1,
    SAVE: 7,
    SAVE_MODE: 7.1,
    UPLOAD: 8,
    UPLOAD_MODE: 8.1,
    SEND: 9,
    SEND_MODE: 9.1,
    SHARE: 10,
    SHARE_MODE: 10.1,
    DONATE: 11
};

function createState({ 
    name, 
    topButtons = [], 
    bottomButtons = [], 
    modal = null, 
    onEnter = null, 
    topVisible = true,  
    bottomVisible = true,
    nextState = null, // ✅ Define the next state after closing a modal
    positionTop = null // ✅ Define top container positioning ("top" or "default")
}) {
    return { name, topButtons, bottomButtons, modal, onEnter, topVisible, bottomVisible, nextState, positionTop };
}


/**
 * 🏗️ State Factory Function (Easier to Maintain & Modify)
 */
/** 📌 Define State Transitions */
const states = {
    [STATE.INITIAL]: createState({
        name: "Initial",
        topButtons: [BUTTONS.READ, BUTTONS.CREATE, BUTTONS.DONATE],
        bottomButtons: [BUTTONS.BACK],
        topVisible: true,  // ✅ Explicitly show top container
        bottomVisible: true,
        positionTop: "default"  // ✅ Follows after any header (default)
    }),
    [STATE.READ]: createState({
        name: "Read Modal",
        modal: "readModal",
        topVisible: false, // ✅ Hide top container for modals
        bottomVisible: false
    }),
    [STATE.CREATE]: createState({
        name: "Create Modal",
        modal: "createModal",
        topVisible: false,
        bottomVisible: false,
        nextState: STATE.CAMERA_RUNNING, // ✅ When closed, transition to CREATE_MODE
        positionTop: "top"  // ✅ Moves top container to very top (adjust for WP admin bar)
    }),
    [STATE.CREATE_MODE]: createState({
        name: "Create Mode",
        bottomButtons: [BUTTONS.START_CAMERA, BUTTONS.BACK],
        topVisible: true,  // ✅ Ensure top container is visible
        bottomVisible: true,
        positionTop: "top"  // ✅ Moves top container to very top (adjust for WP admin bar)
    }),
    [STATE.CAMERA_RUNNING]: createState({
        name: "Camera Running",
        bottomButtons: [BUTTONS.STOP_CAMERA, BUTTONS.EDIT, BUTTONS.BACK],
        onEnter: clickStartCamera,
        topVisible: true,
        bottomVisible: true,
        positionTop: "top"  // ✅ Moves top container to very top (adjust for WP admin bar)
    }),
    [STATE.CAMERA_STOPPED]: createState({
        name: "Camera Stopped",
        bottomButtons: [BUTTONS.START_CAMERA, BUTTONS.BACK],
        onEnter: clickStopCamera,
        topVisible: true,
        bottomVisible: true
    }),
    [STATE.GESTURE_DETECTED]: createState({
        name: "Gesture Detected",
        bottomButtons: [BUTTONS.EDIT, BUTTONS.RETRY, BUTTONS.SAVE, BUTTONS.BACK],
        topVisible: true,
        bottomVisible: true
    }),
    [STATE.EDIT]: createState({
        name: "Edit Modal",
        modal: "editModal",
        topVisible: false,
        bottomVisible: false,
        nextState: STATE.EDIT_MODE // ✅ When closed, transition to EDIT_MODE
    }),
    [STATE.EDIT_MODE]: createState({
        name: "Meme Editing Mode",
        onEnter: clickEditMeme,
        topVisible: true,
        bottomVisible: true
    }),
    [STATE.SAVE]: createState({
        name: "Save Modal",
        modal: "saveModal",
        topVisible: false,
        bottomVisible: false,
        nextState: STATE.SAVE_MODE // ✅ When closed, transition to SAVE_MODE
    }),
    [STATE.SAVE_MODE]: createState({
        name: "Meme Saved",
        bottomButtons: [BUTTONS.UPLOAD, BUTTONS.SEND, BUTTONS.SHARE, BUTTONS.DONATE, BUTTONS.BACK],
        onEnter: clickSaveMeme,
        topVisible: true,
        bottomVisible: true
    }),
    [STATE.UPLOAD]: createState({
        name: "Upload Modal",
        modal: "uploadModal",
        topVisible: false,
        bottomVisible: false,
        nextState: STATE.UPLOAD_MODE // ✅ When closed, transition to UPLOAD_MODE
    }),
    [STATE.UPLOAD_MODE]: createState({
        name: "Meme Uploaded",
        bottomButtons: [BUTTONS.SEND, BUTTONS.SHARE, BUTTONS.DONATE, BUTTONS.BACK],
        onEnter: clickUploadMeme,
        topVisible: true,
        bottomVisible: true
    }),
    [STATE.SEND]: createState({
        name: "Send Modal",
        modal: "sendModal",
        topVisible: false,
        bottomVisible: false,
        nextState: STATE.SEND_MODE // ✅ When closed, transition to SEND_MODE
    }),
    [STATE.SEND_MODE]: createState({
        name: "Meme Sent",
        bottomButtons: [BUTTONS.UPLOAD, BUTTONS.SHARE, BUTTONS.DONATE, BUTTONS.BACK],
        onEnter: clickSendMeme,
        topVisible: true,
        bottomVisible: true
    }),
    [STATE.SHARE]: createState({
        name: "Share Modal",
        modal: "shareModal",
        topVisible: false,
        bottomVisible: false,
        nextState: STATE.SHARE_MODE // ✅ When closed, transition to SHARE_MODE
    }),
    [STATE.SHARE_MODE]: createState({
        name: "Meme Shared",
        bottomButtons: [BUTTONS.UPLOAD, BUTTONS.SEND, BUTTONS.DONATE, BUTTONS.BACK],
        onEnter: clickShareMeme,
        topVisible: true,
        bottomVisible: true
    }),
    [STATE.DONATE]: createState({
        name: "Donate Modal",
        modal: "donateModal",
        topVisible: false,
        bottomVisible: false
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
    [BUTTONS.EDIT]: STATE.EDIT,
    [BUTTONS.SHARE]: STATE.SHARE,
    [BUTTONS.NEW]: STATE.CREATE,
    [BUTTONS.DONE]: STATE.INITIAL,
    [BUTTONS.BACK]: STATE.INITIAL
};

// stuff to do once the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
	// Page Load Configuration
	const path = window.location.pathname.toLowerCase();
	const pageTitle = document.title.toLowerCase();
	loadConfiguration(path, pageTitle);

	const memeEditor = document.getElementById("memeEditorPopup");
	let isDragging = false;
	let offsetX, offsetY;

	// Drag and Move Meme Editor
	if (memeEditor) {
		memeEditor.addEventListener("mousedown", (e) => {
			isDragging = true;
			offsetX = e.clientX - memeEditor.getBoundingClientRect().left;
			offsetY = e.clientY - memeEditor.getBoundingClientRect().top;
			memeEditor.classList.add("dragging");
		});

		document.addEventListener("mousemove", (e) => {
			if (!isDragging) return;
			memeEditor.style.left = (e.clientX - offsetX) + "px";
			memeEditor.style.top = (e.clientY - offsetY) + "px";
		});

		document.addEventListener("mouseup", () => {
			isDragging = false;
			memeEditor.classList.remove("dragging");
		});
	}
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
window.addEventListener("load", () => {
    adjustResultContainerPosition();
    watchForHeaderChanges(); // Start monitoring for ad injections
});
	
// Adjust memeCanvas on resize as well
window.addEventListener("resize", () => {
	adjustResultContainerPosition();
	
});


function clickStartCamera() {
	startCamera();
}
function clickStopCamera() {
	stopCamera();
}
function clickEditMeme() {
	toggleMemeEditor();
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
