/**************************************
 * detection.js – Live Gesture Detection (MediaPipe Version)
 **************************************/





// // Additional finger-check functions...
function checkIndexFinger(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;
    const index_tip = landmarks[8];
    const index_pip = landmarks[6];
    return index_tip.y < index_pip.y;
}

function checkRingFinger(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;
    const ring_tip = landmarks[16];
    const ring_pip = landmarks[14];
    return ring_tip.y < ring_pip.y;
}

function checkPinkyFinger(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;
    const pinky_tip = landmarks[20];
    const pinky_pip = landmarks[18];
    return pinky_tip.y < pinky_pip.y;
}

function checkHandGesture(landmarks) {
    return checkMiddleFinger(landmarks) && !checkIndexFinger(landmarks);
}

