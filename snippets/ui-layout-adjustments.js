let resizeTimeout;
window.addEventListener("resize", () => {
	clearTimeout(resizeTimeout);
	resizeTimeout = setTimeout(handleResizeLayout, 200);
});

function handleResizeLayout() {
	applyViewType(states[currentState].viewType);
	adjustResultContainerPosition(positionTopContainerBelowHeader);
	adjustWorkspaceContainer();
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
 * Detect any fixed top toolbars and adjust the resultContainer position dynamically.
 */
function getTopToolbarHeight() {
    let wpAdminBarHeight = 0;
    let highestFixed = 0;

    // 1) WordPress admin bar
    const wpAdminBar = document.getElementById("wpadminbar");
    if (wpAdminBar && window.getComputedStyle(wpAdminBar).display !== "none") {
        wpAdminBarHeight = wpAdminBar.offsetHeight;
    }

    // 2) Find the "Advertisements" header, then its outer #atatags-* container
    let adsHeight = 0;
    const adLabel = Array.from(document.querySelectorAll("div"))
        .find(el => el.textContent.trim() === "Advertisements" &&
                    window.getComputedStyle(el).display !== "none");
    if (adLabel) {
        // climb up to the outer container whose id starts with "atatags-"
        const adContainer = adLabel.closest("div[id^='atatags-']");
        if (adContainer) {
            adsHeight = adContainer.offsetHeight;
        } else {
            // fallback to just the label height
            adsHeight = adLabel.offsetHeight;
        }
    }

    // 3) If we're not stacking below all fixed headers, just return wpAdminBar + ads
    if (!positionTopContainerBelowHeader) {
        return wpAdminBarHeight + adsHeight;
    }

    // 4) Otherwise scan all fixed-position top:0 elements (excluding our UI)
    document.querySelectorAll("*").forEach(el => {
        const style = window.getComputedStyle(el);
        if (
            style.position === "fixed" &&
            parseInt(style.top, 10) === 0 &&
            style.display !== "none" &&
            el.offsetHeight > 0 &&
            el.id !== "wpadminbar" &&
            el.id !== "resultContainer"
        ) {
            highestFixed = Math.max(highestFixed, el.offsetHeight);
        }
    });

    // 5) Combine the tallest header and WP admin bar, then add ads
    const base = Math.max(wpAdminBarHeight, highestFixed);
    return base + adsHeight;
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
