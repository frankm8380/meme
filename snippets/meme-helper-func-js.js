// =========================
// 🎥 UI Helper Functions
// =========================
//

// // Open Modal & Scroll to Top
function openModal(modalId) {
    let modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`❌ Modal not found in DOM: ${modalId}. Checking available modals...`);
        console.log("🔍 Existing modals in DOM:", document.querySelectorAll(".modal"));
        return;
    }

    console.log(`📌 Opening modal: ${modalId}`);
    modal.style.display = "block";  
    modal.style.opacity = "1";      
    modal.style.visibility = "visible"; 
    modal.style.zIndex = "9999";   
    setTimeout(() => modal.scrollTop = 0, 10);
}

/**
 * ❌ Closes a Modal & Transitions to Next State (or Previous State)
 */
function closeModal(modalId) {
    let modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`❌ Modal not found in DOM: ${modalId}`);
        return;
    }

    console.log(`📌 Closing modal: ${modalId}`);
    modal.style.display = "none";  // ✅ Ensure modal actually hides
}

function saveModalPreference(modalId) {
    let checkbox = document.getElementById("skip" + modalId.charAt(0).toUpperCase() + modalId.slice(1));
    if (checkbox) {
        localStorage.setItem("skip_" + modalId, checkbox.checked ? "true" : "false");
        console.log("💾 Saved modal preference: skip_" + modalId + " = " + checkbox.checked);
    }
}
	
// Close modal when clicking outside
window.onclick = function(event) {
	if (event.target.classList.contains("modal")) {
		event.target.style.display = "none";
	}
};

``
function scrollToSection(sectionToScrollTo,bottom=false) {
    const theSection = document.getElementById(sectionToScrollTo);
    if (theSection) {
      theSection.style.display = "block"; // ✅ Make it visible
	  if ( bottom )
        theSection.scrollIntoView({ behavior: "smooth", block: "nearest" }); // ✅ Smooth scroll to it
	  else
        theSection.scrollIntoView({ behavior: "smooth", block: "start" }); // ✅ Smooth scroll to it
	  console.log("Scrolled to section "+sectionToScrollTo)
    } else {	  
		console.error("Unable to scroll to section "+sectionToScrollTo)
    }
}

/**
 * Retrieves or creates the camera canvas for video rendering.
 * @param {HTMLVideoElement} video - The video element displaying the webcam feed.
 * @returns {HTMLCanvasElement} - The canvas element for camera overlay.
 */
function getCameraCanvas(video) {
  const container = createCameraContainer();
  let canvas = container.querySelector("#cameraCanvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "cameraCanvas";
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.zIndex = "2";
    container.appendChild(canvas);
  } else {
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
  }
  return canvas;
}

/**
 * Returns the appropriate gesture messages based on document title.
 * @returns {Object} - Contains emoji, no-gesture text, and success text.
 */
function getGestureInfo() {
    if (document.title.includes("NOT")) {
        return {
            detectionEmoji: "🖕",
            noGestureText: "Gesture detection: No Middle Finger Detected.",
            successText: "Gesture detection: Middle Finger Detected!"
        };
    } else {
        return {
            detectionEmoji: "👍",
            noGestureText: "Gesture detection: No Thumbs Up Detected.",
            successText: "Gesture detection: Thumbs Up Detected!"
        };
    }
}

/**
 * Displays detected hand landmarks on the canvas.
 * @param {Array} landmarks - The list of detected hand landmarks.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 */
function displayHandDetections(landmarks, ctx) {
	if ( debug ) {
  		landmarks.forEach((landmarkSet) => {
    		drawConnectors(ctx, landmarkSet, HAND_CONNECTIONS, {
      		color: "#00FF00", // Green skeleton
      		lineWidth: 5
    		});
    		drawLandmarks(ctx, landmarkSet, {
      		color: "#FF0000", // Red dots
      		lineWidth: 2
    		});
  		});
	}
}

    function wrapText(ctx, text, maxWidth) {
      const words = text.split(" ");
      let lines = [];
      let currentLine = "";
      words.forEach(word => {
        let testLine = currentLine ? currentLine + " " + word : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine !== "") {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      lines.push(currentLine);
      return lines;
    }

    function drawWrappedText(ctx, text, yPosition, canvas) {
      let fontSize = 50;
      let lineHeight = fontSize * 1.2;
      if (ctx.measureText(text).width <= (canvas.width - 40)) {
        ctx.strokeText(text, canvas.width / 2, yPosition);
        ctx.fillText(text, canvas.width / 2, yPosition);
      } else {
        const middleIndex = Math.floor(text.length / 2);
        let splitIndex = text.lastIndexOf(' ', middleIndex);
        if (splitIndex === -1) splitIndex = text.indexOf(' ', middleIndex);
        const firstLine = text.substring(0, splitIndex);
        const secondLine = text.substring(splitIndex + 1);
        ctx.strokeText(firstLine, canvas.width / 2, yPosition);
        ctx.fillText(firstLine, canvas.width / 2, yPosition);
        ctx.strokeText(secondLine, canvas.width / 2, yPosition + lineHeight);
        ctx.fillText(secondLine, canvas.width / 2, yPosition + lineHeight);
      }
    }

async function adjustCanvasForDisclaimer(ctx,theCanvasToAdjust) {
    // adjust the canvas dimensions here if needed.  canvas.width = video.videoWidth + 2 * borderThickness;
    let includeDisclaimer = document.getElementById("includeDisclaimer").checked;
    let disclaimerLineHeight = 24;
    let fontSize = 50;
    let lineHeight = fontSize * 1.2;
    theCanvasToAdjust.width = savedVideoWidth + 2 * savedBorderThickness; // set this FIRST
    let effectiveMaxWidth = theCanvasToAdjust.width - 40;
    let totalDisclaimerLines = 0;
    if (includeDisclaimer) {
      disclaimerMessage.forEach(sentence => {
        totalDisclaimerLines += wrapText(ctx, sentence, effectiveMaxWidth).length;
      });
    }
	// ✅ Re-check the disclaimer state dynamically every frame
    let disclaimerHeight = includeDisclaimer ? totalDisclaimerLines * disclaimerLineHeight + 20 : 0;
    if (includeDisclaimer && window.innerWidth <= 768) {
      disclaimerHeight = Math.max(disclaimerHeight, 186);
    }

    // ✅ Ensure the live image does NOT cover the disclaimer
    let disclaimerPadding = includeDisclaimer ? disclaimerHeight : 0;
    // ✅ Keep memeCanvas full size but keep video fixed inside
    theCanvasToAdjust.width = savedVideoWidth + 2 * savedBorderThickness;
    theCanvasToAdjust.height = savedImageHeight + 2 * savedBorderThickness + disclaimerPadding;
	
}

async function loadConfiguration(path,pageTitle) {
    console.log(`Current URL Path: ${path}`);
    console.log(`Current Page Title: ${pageTitle}`);

    if (path.includes("trump")) {
      console.log("Detected: Trump page from path.");
      if (pageTitle.includes("not!")) {
        loadPageConfig("https://elonandtrumpnumberone.com/wp-content/uploads/2025/02/trumpConfigNot-2.json");
      } else {
        loadPageConfig("https://elonandtrumpnumberone.com/wp-content/uploads/2025/02/trumpConfigTeam-2.json");
      }
    } else if (path.includes("musk") || path.includes("elon")) {
      console.log("Detected: Musk page from path.");
      if (pageTitle.includes("not!")) {
        loadPageConfig("https://elonandtrumpnumberone.com/wp-content/uploads/2025/02/muskConfigNot-2.json");
      } else {
        loadPageConfig("https://elonandtrumpnumberone.com/wp-content/uploads/2025/02/muskConfigTeam-2.json");
      }
    } else if (path.includes("webmaster")) {
      console.log("Detected: Webmaster page from path.");
      if (pageTitle.includes("not!")) {
        loadPageConfig("https://elonandtrumpnumberone.com/wp-content/uploads/2025/02/webmasterConfigNot-2.json");
      } else {
        loadPageConfig("https://elonandtrumpnumberone.com/wp-content/uploads/2025/02/webmasterConfigTeam-2.json");
      }
    } else {
      console.warn("No matching page detected from title or path.");
    }
}

async function loadPageConfig(configFile) {
  console.log(`Config File Path: ${configFile}`);
  try {
    const response = await fetch(configFile);
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.status} - ${response.statusText}`);
    }
    pageConfig = await response.json();
    console.log("Config loaded successfully:", pageConfig);
    fileNamePrefix = pageConfig.fileNamePrefix || fileNamePrefix; // Use prefix from JSON
    populateDropdowns();
    populateDisclaimerMessages();
    populateSection("accomplishments-list", "accomplishments");
    populateSection("title-list", "titleList");
    populateSection("intro-list", "introList");
    populateSection("meme-instructions-list", "memeInstructionsList");
  } catch (error) {
    console.error("Error loading page config:", error);
    displayErrorMessage("Failed to load configuration. Please try refreshing the page or contact support.");
  }
}
function populateSection(divId, jsonSection) {
  try {
    const sectionData = pageConfig[jsonSection];

    // Find or create the container to display the list
    const container = document.getElementById(divId);
    if (!container) {
      console.error(`No container found with ID '${divId}'.`);
      return;
    }

    // Clear any existing content
    container.innerHTML = '';

    // Loop through section data and add div elements
    sectionData.forEach(item => {
      const div = document.createElement("div");
      div.classList.add(`${jsonSection}-item`);

      // Generic handling for all sections, including accomplishments
      if (jsonSection === "accomplishments") {
        // Use HTML formatting directly from JSON and add source link
        div.innerHTML = `${item.text} <a href="${item.source || '#'}" target="_blank">(source)</a>`;
      } else {
        // Render plain or HTML-formatted content for other sections
        div.innerHTML = item;
      }

      container.appendChild(div);
    });

    console.log(`${jsonSection} populated successfully.`);
  } catch (error) {
    console.error(`Error populating ${jsonSection}:`, error);
    displayErrorMessage(`Error loading ${jsonSection}. Please try again.`);
  }
}


function populateAccomplishments() {
  try {
    const accomplishments = pageConfig.accomplishments;

    // Find or create the container to display the list
    const container = document.getElementById("accomplishments-list");
    if (!container) {
      console.error("No container found with ID 'accomplishments-list'.");
      return;
    }

    // Clear any existing content
    container.innerHTML = '';

    // Loop through accomplishments and add div elements
    accomplishments.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("accomplishment-item");

      const text = item.text;

      // Find the end of the first sentence based on '. ' occurrence
      const sentenceEnd = text.indexOf('.  ') + 1; // Include the period

      let formattedText;
      if (sentenceEnd > 0) {
        const firstSentence = text.substring(0, sentenceEnd + 1); // Include space after the period
        const restOfText = text.substring(sentenceEnd + 1);
        formattedText = `<strong>${firstSentence}</strong>${restOfText}`;
      } else {
        // If no '. ' found, bold the entire text
        formattedText = `<strong>${text}</strong>`;
      }

      // Insert the formatted text with the source link
      div.innerHTML = `${formattedText} <a href="${item.source || '#'}" target="_blank">(source)</a>`;
      container.appendChild(div);
    });

    console.log("Accomplishments populated successfully.");
  } catch (error) {
    console.error("Error populating accomplishments:", error);
    displayErrorMessage("Error loading accomplishments. Please try again.");
  }
}

function populateDropdowns() {
  try {
    const topTextSelect = document.getElementById("topText");
    const bottomTextSelect = document.getElementById("bottomText");
    topTextSelect.innerHTML = '';
    bottomTextSelect.innerHTML = '';

    pageConfig.topTexts.forEach(text => {
      const option = document.createElement("option");
      option.text = text;
      topTextSelect.add(option);
    });

    pageConfig.bottomTexts.forEach(text => {
      const option = document.createElement("option");
      option.text = text;
      bottomTextSelect.add(option);
    });
    console.log("Dropdowns populated successfully.");
  } catch (error) {
    console.error("Error populating dropdowns:", error);
    displayErrorMessage("Error loading meme options. Please try again.");
  }
}

function populateDisclaimerMessages() {
  try {
    if (pageConfig.disclaimerMessages) {
      disclaimerMessage = [...pageConfig.disclaimerMessages];
      console.log("Disclaimer messages loaded successfully.");
    }
  } catch (error) {
    console.error("Error loading disclaimer messages:", error);
    displayErrorMessage("Error loading disclaimers. Please try again.");
  }
}
