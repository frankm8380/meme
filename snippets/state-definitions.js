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
	MEME_FILE: "memeFile",
	MSG_TEXT: "msgText"
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

const VIEW_TYPE = {
    BLANK: 0,  // canvas hidden
    CAMERA: 1, // live camera on canvas
    MEME: 2,    // captured gesture static image on canvas
    UPLOAD: 2    // Upload message and resized captured gesture static image on canvas
};

function createState({ 
    name, 
	viewType = VIEW_TYPE.BLANK,
    topButtons = [], 
    bottomButtons = [], 
    topMessage = "",
    bottomMessage = "",
    modal = null, 
    onEnter = null, 
    nextState = null, // ✅ Define the next state after closing a modal
    positionTop = null, // ✅ Define top container positioning ("top" or "default")
}) {
    return { name, viewType, topButtons, bottomButtons, topMessage, bottomMessage, modal, onEnter, nextState, positionTop };
}


/**
 * 🏗️ State Factory Function (Easier to Maintain & Modify)
 */
/** 📌 Define State Transitions */
const states = {
    [STATE.INITIAL]: createState({
        name: "Initial",
		viewType: VIEW_TYPE.BLANK,
        topButtons: [BUTTONS.READ, BUTTONS.CREATE, BUTTONS.DONATE],
        bottomButtons: [BUTTONS.GOHOME],
        positionTop: "default",
        topMessage: "Welcome! Please choose an option.",
        bottomMessage: "Select Read, Create, or Donate."
    }),
    [STATE.READ]: createState({
        name: "Read Modal",
		viewType: VIEW_TYPE.BLANK,
        modal: "readModal"
    }),
    [STATE.CREATE]: createState({
        name: "Create Modal",
		viewType: VIEW_TYPE.BLANK,
        modal: "createModal",
        nextState: STATE.CAMERA_RUNNING,
        positionTop: "top"
    }),
    [STATE.CREATE_MODE]: createState({
        name: "Create Mode",
		viewType: VIEW_TYPE.BLANK,
        bottomButtons: [BUTTONS.START_CAMERA, BUTTONS.BACK],
        positionTop: "top",
        topMessage: "Create your meme.",
        bottomMessage: "Press 'Start Camera' to capture your image or 'Back' to return."
    }),
    [STATE.CAMERA_RUNNING]: createState({
        name: "Camera Running",
		viewType: VIEW_TYPE.CAMERA,
        topButtons: [CONTROLS.TOP_TEXT, CONTROLS.BLUR_FACE, CONTROLS.TEXT_COLOR],  
        bottomButtons: [CONTROLS.BOTTOM_TEXT, CONTROLS.DISCLAIMER, BUTTONS.STOP_CAMERA],  
        onEnter: clickStartCamera,
        positionTop: "top",
        topMessage: "Camera Running: Time to show your #1 gesture!",
        bottomMessage: "Align your face and perform the #1 gesture for capture."
    }),
    [STATE.CAMERA_STOPPED]: createState({
        name: "Camera Stopped",
		viewType: VIEW_TYPE.BLANK,
        topButtons: [BUTTONS.START_CAMERA],  
        bottomButtons: [BUTTONS.BACK],  
        onEnter: clickStopCamera,
        topMessage: "Camera Stopped.",
        bottomMessage: "Press 'Start Camera' to restart."
    }),
    [STATE.GESTURE_DETECTED]: createState({
        name: "Gesture Detected",
		viewType: VIEW_TYPE.MEME,
        topButtons: [CONTROLS.TOP_TEXT, CONTROLS.BLUR_FACE, CONTROLS.TEXT_COLOR, BUTTONS.SAVE],  
        bottomButtons: [CONTROLS.BOTTOM_TEXT, CONTROLS.DISCLAIMER, BUTTONS.RETRY, BUTTONS.BACK],  
        topMessage: "Gesture Detected!",
        bottomMessage: "You can edit or redo your meme here.  When you like it, click Save!"
    }),
    [STATE.SAVE]: createState({
        name: "Save Modal",
		viewType: VIEW_TYPE.BLANK,
        modal: "saveModal",
        nextState: STATE.SAVE_MODE
    }),
    [STATE.SAVE_MODE]: createState({
        name: "Meme Saved",
		viewType: VIEW_TYPE.MEME,
        topButtons: [CONTROLS.MEME_FILE],  
        bottomButtons: [BUTTONS.UPLOAD, BUTTONS.SEND, BUTTONS.SHARE, BUTTONS.DONATE, BUTTONS.BACK],
        onEnter: clickSaveMeme,
        topMessage: "Meme Saved!",
        bottomMessage: "You can now Upload, Send, or Share your meme."
    }),
    [STATE.UPLOAD]: createState({
        name: "Upload Modal",
		viewType: VIEW_TYPE.BLANK,
        modal: "uploadModal",
        nextState: STATE.UPLOAD_MODE
    }),
    [STATE.UPLOAD_MODE]: createState({
        name: "Meme Uploaded",
		viewType: VIEW_TYPE.MEME,
        topButtons: [CONTROLS.MEME_FILE],  
        bottomButtons: [BUTTONS.SEND, BUTTONS.SHARE, BUTTONS.DONATE, BUTTONS.BACK],
        onEnter: clickUploadMeme,
        topMessage: "Meme Uploaded!",
        bottomMessage: "Your meme is now uploaded and ready."
    }),
    [STATE.SEND]: createState({
        name: "Send Modal",
		viewType: VIEW_TYPE.BLANK,
        modal: "sendModal",
        nextState: STATE.SEND_MODE
    }),
    [STATE.SEND_MODE]: createState({
        name: "Meme Sent",
		viewType: VIEW_TYPE.MEME,
        topButtons: [CONTROLS.MEME_FILE],  
        bottomButtons: [BUTTONS.UPLOAD, BUTTONS.SHARE, BUTTONS.DONATE, BUTTONS.BACK],
        onEnter: clickSendMeme,
        topMessage: "Meme Sent!",
        bottomMessage: "Your meme has been sent successfully."
    }),
    [STATE.SHARE]: createState({
        name: "Share Modal",
		viewType: VIEW_TYPE.BLANK,
        modal: "shareModal",
        nextState: STATE.SHARE_MODE
    }),
    [STATE.SHARE_MODE]: createState({
        name: "Meme Shared",
		viewType: VIEW_TYPE.MEME,
        topButtons: [CONTROLS.MEME_FILE],  
        bottomButtons: [BUTTONS.UPLOAD, BUTTONS.SEND, BUTTONS.DONATE, BUTTONS.BACK],
        onEnter: clickShareMeme,
        topMessage: "Meme Shared!",
        bottomMessage: "Your meme is now shared with others."
    }),
    [STATE.DONATE]: createState({
        name: "Donate Modal",
		viewType: VIEW_TYPE.BLANK,
        modal: "donateModal",
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

