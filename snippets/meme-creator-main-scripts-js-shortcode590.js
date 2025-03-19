/**
 * Detect any fixed top toolbars and adjust the resultContainer position dynamically.
 */
function getTopToolbarHeight() {
    let wpAdminBarHeight = 0;
    let highestFixedElement = 0;

    // Check if the WordPress admin bar exists and is visible
    const wpAdminBar = document.getElementById("wpadminbar");
    if (wpAdminBar && window.getComputedStyle(wpAdminBar).display !== "none") {
        wpAdminBarHeight = wpAdminBar.offsetHeight;
    }

	if ( !positionTopContainerBelowHeader ) {
		return wpAdminBarHeight;
	}

    // Find the tallest fixed-position element at the very top (excluding resultContainer)
    document.querySelectorAll("*").forEach(el => {
        const style = window.getComputedStyle(el);
        if (
            style.position === "fixed" &&
            parseInt(style.top) === 0 &&
            el.offsetHeight > 0 &&
            style.display !== "none" &&
            el.id !== "wpadminbar" && // Don't double-count wpadminbar
            el.id !== "resultContainer" // 🚀 Fix: Don't count resultContainer itself
        ) {
            highestFixedElement = Math.max(highestFixedElement, el.offsetHeight);
        }
    });

    let finalHeight = Math.max(wpAdminBarHeight, highestFixedElement);
    return finalHeight;
}
	
function adjustResultContainerPosition(positionBelowHeader = true) {
    const resultContainer = document.getElementById("resultContainer");
    const memeCanvas = document.getElementById("memeCanvas");

    if (!resultContainer || !memeCanvas) {
        console.error("❌ Missing resultContainer or memeCanvas in DOM.");
        return;
    }
	
    // ✅ Regular positioning logic
    positionTopContainerBelowHeader = positionBelowHeader;
    let headerBottom = getTopToolbarHeight();

    if (headerBottom === lastHeaderBottom) {
        return;
    }

    lastHeaderBottom = headerBottom;

    resultContainer.style.position = "fixed";
    resultContainer.style.top = `${headerBottom}px`;
}

/**
 * Dynamically adjust meme canvas size while keeping it within the available space.
 */
function adjustMemeCanvasSize(video) {
    const memeCanvas = document.getElementById("memeCanvas");
    const topResultContainer = document.getElementById("resultContainer");
    const bottomResultContainer = document.getElementById("bottomResultContainer");

    if (!memeCanvas || !topResultContainer) return;

    // Get the height of any top toolbar
    let toolbarHeight = getTopToolbarHeight();

    // Get the bottom of the top result container
    const resultBottom = topResultContainer.getBoundingClientRect().bottom + window.scrollY;
    const canvasTop = resultBottom;

    // Check if the bottom container is visible
    const bottomStart = bottomResultContainer && window.getComputedStyle(bottomResultContainer).display !== "none"
        ? bottomResultContainer.offsetTop
        : window.innerHeight;

    // Available height for canvas
    const availableHeight = bottomStart - canvasTop;

    // Set maximum width (with small margins)
    const maxWidth = document.body.clientWidth;

    // Maintain video aspect ratio
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    let newWidth = maxWidth;
    let newHeight = newWidth / videoAspectRatio;

    // If height exceeds available space, adjust width accordingly
    if (newHeight > availableHeight) {
        newHeight = availableHeight;
        newWidth = newHeight * videoAspectRatio;
    }

    // Apply new size
    memeCanvas.width = Math.round(newWidth);
    memeCanvas.height = Math.round(newHeight);
    memeCanvas.style.width = `${memeCanvas.width}px`;
    memeCanvas.style.height = `${memeCanvas.height}px`;

    // Use `fixed` positioning to keep it correctly aligned
    memeCanvas.style.position = "fixed";
    memeCanvas.style.top = `${canvasTop}px`;
    memeCanvas.style.left = "50%";
    memeCanvas.style.transform = "translateX(-50%)";

    // Ensure the canvas is visible
    memeCanvas.style.display = "block";
}

/**
 * 🔄 Monitor DOM for unexpected changes like ads injecting above the header
 */
function watchForHeaderChanges() {
    let header = document.querySelector("header, #site-header, .site-header, .page-header");
    if (!header) return;

    // Use MutationObserver to detect changes in header position
    const observer = new MutationObserver(() => {
        setTimeout(adjustResultContainerPosition, 100); // Throttle to prevent spam calls
    });

    observer.observe(document.body, {
        childList: true, // Watch for new elements being added
        subtree: true,   // Watch all descendant elements
    });
}
