// -------------------------------
// 📂 Image Processing Module
// Handles Image Capture & Metadata
// -------------------------------

/**
 * Saves the captured image frame.
 * @param {string} frame - The image data URL.
 * @returns {string} - Returns the image frame.
 */
function saveImage(frame) {
  console.log("💾 Saving image...");
  captureImage();
  return frame;
}

/**
 * Captures an image from the video feed and stores it.
 */
function captureImage() {
  const video = document.getElementById("webcam");
  const memeCanvas = document.getElementById("memeCanvas");
  const ctx = memeCanvas.getContext("2d");

  // ✅ Set canvas size based on the device's camera resolution
  memeCanvas.width = video.videoWidth + 2 * borderThickness;
  memeCanvas.height = video.videoHeight + 2 * borderThickness;

  savedImageHeight = video.videoHeight;
  savedBorderThickness = borderThickness;
  savedVideoWidth = video.videoWidth;

  // ✅ Draw black border and white background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, memeCanvas.width, memeCanvas.height);
  ctx.fillStyle = "white";
  ctx.fillRect(borderThickness, borderThickness, memeCanvas.width - 2 * borderThickness, memeCanvas.height - 2 * borderThickness);

  // ✅ Draw video frame at its natural resolution
  ctx.drawImage(video, borderThickness, borderThickness, video.videoWidth, video.videoHeight);

  // ✅ Stop the video stream after capturing
  videoStream.getTracks().forEach(track => track.stop());
  video.style.display = "none";

  // ✅ Convert captured image to data URL
  savedImage = new Image();
  savedImage.onload = function () {
    updateMemeText(); // Call function to add text
  };
  savedImage.src = memeCanvas.toDataURL("image/png");

  // ✅ Update result message
  displayStatusMessage("📸 Picture Captured! Meme Ready! Customize & Save Below.");
  scrollToSection("result");

  // ✅ Show the meme editor
  document.getElementById("sticky-footer").style.display = "block";
  document.getElementById("memeEditorBlurb").style.display = "block";
}

/**
 * Embeds metadata into an image.
 * @param {string} image - The image data URL.
 * @param {Object} faceBoundingBox - Bounding box of detected face.
 * @param {string} detectedGesture - The detected gesture.
 * @returns {Promise<string>} - A promise resolving to the encoded image.
 */
function embedMetadata(image, faceBoundingBox, detectedGesture) {
  console.log("📝 Embedding metadata...");
  let img = new Image();
  img.src = image;
  return new Promise(resolve => {
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      let metadataString = JSON.stringify({ faceBoundingBox, gesture: detectedGesture });
      ctx.fillStyle = "rgba(255,255,255,0)";
      ctx.font = "1px Arial";
      ctx.fillText(metadataString, 1, 1);
      resolve(canvas.toDataURL("image/png"));
    };
  });
}

/**
 * Stores the final encoded image by prompting a download.
 * @param {string} encodedImage - The processed image with metadata.
 */
function storeEncodedImage(encodedImage) {
  console.log("📂 Storing final image...");
  const link = document.createElement("a");
  link.href = encodedImage;
  link.download = `detected_image_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Loads an image from a given URL.
 * @param {string} imageUrl - The URL of the image.
 * @returns {Promise<string>} - A promise resolving to the image data URL.
 */
function loadImage(imageUrl) {
  console.log("🖼️ Loading image from URL...");
  return new Promise(resolve => {
    let img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
  });
}

/**
 * Extracts metadata from an image.
 * @param {string} image - The image data URL.
 * @returns {Promise<Object|null>} - A promise resolving to the extracted metadata or null.
 */
function extractMetadata(image) {
  console.log("🔍 Checking for embedded metadata...");
  return new Promise(resolve => {
    let img = new Image();
    img.src = image;
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      let pixelData = ctx.getImageData(1, 1, 1, 1).data;
      let hiddenText = String.fromCharCode(pixelData[0], pixelData[1], pixelData[2]);
      try {
        let extractedMetadata = JSON.parse(hiddenText);
        console.log("✅ Extracted metadata:", extractedMetadata);
        resolve(extractedMetadata);
      } catch (error) {
        console.log("❌ No embedded metadata found.");
        resolve(null);
      }
    };
  });
}
