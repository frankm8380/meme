function updateColor() {
  const colorPicker = document.getElementById("textColor");
  const colorDisplay = document.getElementById("colorDisplay");

  if (colorPicker && colorDisplay) {
    // Force style + value to sync
    const color = colorPicker.value;
    colorDisplay.style.backgroundColor = color;
    colorPicker.setAttribute("value", color);  // 🔧 Force DOM attribute sync
    lastSelectedTextColor = color;
  }
}


function updateMemeText() {
  const memeCanvas = document.getElementById("memeCanvas");
  const ctx = memeCanvas.getContext("2d");

  if (!savedImage) return;

  // ✅ Adjust the canvas size, including disclaimer space
  adjustCanvasForDisclaimer(ctx, memeCanvas);

  // ✅ Draw background and saved image
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, memeCanvas.width, memeCanvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(savedBorderThickness, savedBorderThickness,
    memeCanvas.width - 2 * savedBorderThickness,
    memeCanvas.height - 2 * savedBorderThickness);
  ctx.drawImage(
    savedImage,
    savedBorderThickness, savedBorderThickness,
    savedVideoWidth, savedImageHeight,
    savedBorderThickness, savedBorderThickness,
    savedVideoWidth, savedImageHeight
  );

  // ✅ Call drawMemeText to handle text overlays
  drawMemeText(ctx);
}

function drawMemeText(ctx) {
  const memeCanvas = document.getElementById("memeCanvas");
  if (!memeCanvas) return;

let colorInput = document.querySelector("#bottomButtonsContainer input#textColor") ||
                 document.querySelector("#topButtonsContainer input#textColor") ||
                 document.querySelector("input#textColor");
  let textColor = colorInput ? colorInput.value : "#ffffff";
  let topText = document.getElementById("topText").value;
  let bottomText = document.getElementById("bottomText").value;
  let includeDisclaimer = document.getElementById("includeDisclaimer").checked;
  let disclaimerLineHeight = 24;
  let fontSize = 50;
  let lineHeight = fontSize * 1.2;
  let effectiveMaxWidth = memeCanvas.width - 40;

ctx.font = `bold ${fontSize}px Impact`;
ctx.textAlign = "center";
ctx.textBaseline = "bottom";  // Helps vertical alignment
ctx.fillStyle = textColor;
ctx.strokeStyle = "black";
ctx.lineWidth = 4;  // Reduced from 8
ctx.lineJoin = "round";  // Smooths joins
ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
ctx.shadowBlur = 4;
ctx.shadowOffsetX = 2;
ctx.shadowOffsetY = 2;

  drawWrappedText(ctx, topText, savedBorderThickness + 60, memeCanvas);
  let wrappedBottomText = wrapText(ctx, bottomText, effectiveMaxWidth);
  let bottomY = savedBorderThickness + savedImageHeight - 20 - (wrappedBottomText.length - 1) * lineHeight;
  drawWrappedText(ctx, bottomText, bottomY, memeCanvas);

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

	if (includeDisclaimer) {
    ctx.fillStyle = "black";
    ctx.font = "bold 18px Arial";
    let disclaimerY = savedBorderThickness + savedImageHeight + 35;
    disclaimerMessage.forEach(sentence => {
      wrapText(ctx, sentence, effectiveMaxWidth).forEach(line => {
        ctx.fillText(line, memeCanvas.width / 2, disclaimerY);
        disclaimerY += disclaimerLineHeight;
      });
    });
  }
}

function displayTopMessage(message) {
    let topMsgElem = document.getElementById("topMessage");
    if (!topMsgElem) {
        topMsgElem = document.createElement("div");
        topMsgElem.id = "topMessage";
        topMsgElem.className = "state-message";
        // Optionally insert it into a specific container:
        document.getElementById("resultContainer").prepend(topMsgElem);
    }
    topMsgElem.innerText = message;
    topMsgElem.style.opacity = "1";
    topMsgElem.style.color = "blue"; // style as needed
    // Optionally add a fade effect similar to displayStatusMessage...
    setTimeout(() => {
        topMsgElem.style.opacity = "0.7";
    }, 2000);
}
function displayBottomMessage(message) {
    let bottomMsgElem = document.getElementById("bottomMessage");
    if (!bottomMsgElem) {
        bottomMsgElem = document.createElement("div");
        bottomMsgElem.id = "bottomMessage";
        bottomMsgElem.className = "state-message";
        document.getElementById("bottomResultContainer").prepend(bottomMsgElem);
    }
    bottomMsgElem.innerText = message;
    bottomMsgElem.style.opacity = "1";
    bottomMsgElem.style.color = "blue"; // style as needed
    setTimeout(() => {
        bottomMsgElem.style.opacity = "0.7";
    }, 2000);
}

// Display Status Message with Smooth Fade
function displayStatusMessage(message) {
    const topMessage = document.getElementById("topMessage");
    if (topMessage) {
        topMessage.textContent = message;
        topMessage.style.display = "block";
    }
}
function displayErrorMessage(message) {
    const topMessage = document.getElementById("topMessage");
    if (topMessage) {
        topMessage.textContent = message;
        topMessage.style.display = "block";
        topMessage.style.color = "red"; // Optional visual cue
    }
}

/**
 * 🎨 Creates a meme control UI element dynamically
 * @param {string} controlId - The control identifier from CONTROLS.
 * @returns {HTMLElement} - The generated control element.
 */
    function createMemeControl(controlId) {
        let control;

      switch (controlId) {
        case "topText":
        case "bottomText":
            control = document.createElement("select");
            control.id = controlId;
            control.onchange = updateMemeText;
            break;

        case "textColor":
            control = document.createElement("input");
            control.type = "color";
            control.id = "textColor";
            control.value = "#ffffff";
            control.oninput = function () {
                updateColor();
                updateMemeText();
            };
            break;

        case "includeDisclaimer":
            control = document.createElement("input");
            control.type = "checkbox";
            control.id = "includeDisclaimer";
            control.checked = true;
            control.onchange = updateMemeText;
            break;

        case "blurFace":
            control = document.createElement("input");
            control.type = "checkbox";
            control.id = "blurFace";
            control.checked = true;
            control.onchange = updateBlurFace;
            break;
      }

      return control;
    }
