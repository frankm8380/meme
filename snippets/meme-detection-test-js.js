let previousResults = "";  // Store previous results for consistency

// ✅ Reset detection results every time the page loads
window.onload = function () {
    console.log("🔄 Resetting detection results on page load...");
    localStorage.removeItem("detectionResults"); // Clears previous test results
};

function pickFileAndDetectHands() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*"; // Only allow image files
    input.style.display = "none";

    input.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const imageURL = e.target.result; // Get the image as a Data URL
                detectHandsFromImage(imageURL);  // Call the function to detect hands
            };
            reader.readAsDataURL(file); // Convert image to Data URL
        }
    });

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

// ✅ Function to Save CSV File
function saveCSV(results) {
    const blob = new Blob([results], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "detection_results.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ✅ Batch Test Images from Folder (Using MediaPipe)
async function batchTestImages() {
    try {
        // 🗂️ Open file picker for a folder
        const handle = await window.showDirectoryPicker();
        console.log("📂 Selected Folder:", handle.name);

        // ✅ Load existing results from storage to avoid overwriting past results
        let results = previousResults || "Filename,Detection Status,Reason,Middle Tip Y,Middle PIP Y,Index Tip Y,Index PIP Y\n";
        let fileCount = 0;
        if (document.title.includes("NOT")) {
        } else {

        }

        // Process each image file in the folder
        for await (const entry of handle.values()) {
            if (entry.kind === "file" && /\.(png|jpe?g)$/i.test(entry.name)) {
                fileCount++;
                console.log(`🖼️ Processing file: ${entry.name}...`);

                // Read file as blob URL
                const file = await entry.getFile();
                const fileURL = URL.createObjectURL(file);

                // Run MediaPipe detection with averaging
const result = document.title.indexOf("NOT") > -1
    ? await detectGestureFromFileGeneric(fileURL, checkMiddleFingerImproved, 100)
    : await detectGestureFromFileGeneric(fileURL, checkThumbsUp, 100);

                if (!result) {
                    console.error(`❌ ERROR: Detection failed for ${entry.name}`);
                    URL.revokeObjectURL(fileURL);
                    continue;
                }

                const { detected, reason, landmarks } = result;

                // Extract landmark y-values using the new object notation
                const middleTipY = landmarks?.[12]?.y ?? "N/A";
                const middlePipY = landmarks?.[10]?.y ?? "N/A";
                const indexTipY = landmarks?.[8]?.y ?? "N/A";
                const indexPipY = landmarks?.[6]?.y ?? "N/A";

                console.log(`✅ ${entry.name}: ${detected ? "Detected" : "Rejected"} - ${reason}`);
                console.log("📊 Landmark Y values:", { middleTipY, middlePipY, indexTipY, indexPipY });

                // Append new result
                const resultRow = `${entry.name},${detected ? "Detected" : "Rejected"},${reason},${middleTipY},${middlePipY},${indexTipY},${indexPipY}\n`;
                results += resultRow;

                // Clean up blob URL
                URL.revokeObjectURL(fileURL);
            }
        }

        if (fileCount === 0) {
            alert("⚠️ No valid images found in the selected folder.");
            return;
        }

        // ✅ Store updated results in Local Storage to persist across runs
        localStorage.setItem("detectionResults", results);
        previousResults = results; // Keep in memory

        // ✅ Save results to a CSV file
        saveCSV(results);

        console.log("✅ Batch Test Completed. Results saved to detection_results.csv");

    } catch (error) {
        console.error("🛑 Error selecting folder or processing files:", error);
        alert("⚠️ Failed to process images. Check console for details.");
    }
}
// Helper function to draw landmarks on the canvas for one hand.
function drawHandLandmarks(ctx, landmarks, color) {
    ctx.fillStyle = color;
    landmarks.forEach((landmark) => {
        const x = landmark.x * ctx.canvas.width;
        const y = landmark.y * ctx.canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// Main function: detects one or two hands and draws landmarks for each,
// then displays the resulting image in a popup.
async function detectHandsAndShow(fileURL) {
    console.log(`DEBUG: detectMiddleFingerAndShow invoked with file URL: ${fileURL}`);

    // Load the image.
    const image = new Image();
    image.src = fileURL;
    await new Promise((resolve, reject) => {
        image.onload = () => {
            console.log("DEBUG: Image loaded successfully");
            resolve();
        };
        image.onerror = (error) => {
            console.error("ERROR: Failed to load image", error);
            reject(error);
        };
    });

    // Create a canvas and draw the image onto it.
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height);
    console.log(`DEBUG: Canvas created with dimensions: ${canvas.width}x${canvas.height}`);

    // Initialize MediaPipe Hands (set to detect up to 2 hands)
    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.5,
    });

    // Run detection on the current canvas frame.
    const results = await new Promise((resolve, reject) => {
        hands.onResults((results) => {
            console.log("DEBUG: MediaPipe Hands results received");
            resolve(results);
        });
        hands.send({ image: canvas }).catch((error) => {
            console.error("ERROR: hands.send failed", error);
            reject(error);
        });
    });

    let validGesture = false;
    const detectedHands = results.multiHandLandmarks || [];
    console.log(`DEBUG: Detected ${detectedHands.length} hand(s).`);

    // For each detected hand, draw landmarks and check for middle finger gesture.
    detectedHands.forEach((landmarks, handIndex) => {
        const color = handIndex === 0 ? "red" : "blue";
        console.log(`DEBUG: Processing Hand ${handIndex + 1} with ${landmarks.length} landmarks.`);
        landmarks.forEach((landmark, i) => {
            const x = landmark.x * canvas.width;
            const y = landmark.y * canvas.height;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
            console.log(`DEBUG: Hand ${handIndex + 1}, Landmark ${i + 1}: x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
        });
        if (checkMiddleFingerImproved(landmarks)) {
            console.log(`DEBUG: Hand ${handIndex + 1} passed middle finger detection.`);
            validGesture = true;
        } else {
            console.log(`DEBUG: Hand ${handIndex + 1} did NOT pass middle finger detection.`);
        }
    });

    // Draw status icon in the upper right: check mark if valid, X if not.
    const statusIcon = validGesture ? "✓" : "✗";
    ctx.font = "48px Arial";
    ctx.fillStyle = validGesture ? "green" : "red";
    ctx.fillText(statusIcon, canvas.width - 60, 60);
    console.log(`DEBUG: Final gesture detection result: ${validGesture ? "Valid" : "Invalid"}`);

    // Open a popup window to display the processed canvas.
    const popup = window.open("", "_blank", `width=${canvas.width},height=${canvas.height}`);
    if (popup) {
        popup.document.write(`
      <html>
        <head>
          <title>Middle Finger Detection Result</title>
          <style>
            body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: #eee; }
            canvas { border: 1px solid #ccc; }
          </style>
        </head>
        <body></body>
      </html>
    `);
        popup.document.body.appendChild(canvas);
        console.log("DEBUG: Popup window opened successfully.");
    } else {
        console.error("ERROR: Popup blocked! Please allow popups for this site.");
    }

    return { validGesture, detectedHands };
}

async function detectGestureFromFileGenericAveragedDisplay(fileURL, gestureCheck, runs = 10) {
    console.log(`🔍 Running averaged detection for: ${fileURL} over ${runs} runs`);

    // Load the image.
    const image = new Image();
    image.src = fileURL;
    console.log("DEBUG: Loading image from:", fileURL);
    await new Promise((resolve, reject) => {
        image.onload = () => {
            console.log("DEBUG: Image loaded successfully");
            resolve();
        };
        image.onerror = (error) => {
            console.error("ERROR: Image failed to load", error);
            reject(error);
        };
    });
    const width = image.width, height = image.height;

    // Create a canvas and draw the image once.
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, width, height);
    console.log(`DEBUG: Canvas created with dimensions: ${width}x${height}`);

    // Initialize MediaPipe Hands (set maxNumHands to 1 for consistent averaging).
    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.5,
    });

    // Helper function: run detection once on the current canvas.
    async function runDetectionOnce() {
        return new Promise((resolve, reject) => {
            hands.onResults((results) => {
                resolve(results);
            });
            hands.send({ image: canvas }).catch(reject);
        });
    }

    let collectedLandmarks = [];
    // For each run, we'll add markers on top of the image.
    for (let i = 0; i < runs; i++) {
        let results = await runDetectionOnce();
        if (results?.multiHandLandmarks?.length) {
            console.log(`DEBUG: Run ${i + 1}: Detected hand with ${results.multiHandLandmarks[0].length} landmarks.`);
            // Save the landmarks for averaging.
            collectedLandmarks.push(results.multiHandLandmarks[0]);
            // Choose a semi-transparent color that changes with each run.
            let hue = (i * 360 / runs) % 360;
            ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.5)`;
            // Draw each landmark for this run.
            results.multiHandLandmarks[0].forEach((landmark) => {
                const x = landmark.x * width;
                const y = landmark.y * height;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            });
            // Label the run number in a solid color.
            ctx.font = "16px Arial";
            ctx.fillStyle = `hsla(${hue}, 100%, 50%, 1)`;
            ctx.fillText(`Run ${i + 1}`, 10, 20 + i * 18);
        } else {
            console.log(`DEBUG: Run ${i + 1}: No hand detected.`);
        }
    }
    console.log(`DEBUG: Total successful runs: ${collectedLandmarks.length} out of ${runs}`);

    // Compute average landmarks if any runs succeeded.
    let avgLandmarks = [];
    if (collectedLandmarks.length > 0) {
        const numLandmarks = collectedLandmarks[0].length;
        // Initialize average landmark array.
        for (let j = 0; j < numLandmarks; j++) {
            avgLandmarks[j] = { x: 0, y: 0, z: 0 };
        }
        collectedLandmarks.forEach((landmarks) => {
            landmarks.forEach((landmark, j) => {
                avgLandmarks[j].x += landmark.x;
                avgLandmarks[j].y += landmark.y;
                avgLandmarks[j].z += landmark.z;
            });
        });
        const n = collectedLandmarks.length;
        for (let j = 0; j < numLandmarks; j++) {
            avgLandmarks[j].x /= n;
            avgLandmarks[j].y /= n;
            avgLandmarks[j].z /= n;
        }
        console.log("DEBUG: Averaged landmarks:", avgLandmarks);
        // Draw averaged landmarks in bright orange.
        avgLandmarks.forEach((landmark) => {
            const x = landmark.x * width;
            const y = landmark.y * height;
            ctx.fillStyle = "orange";
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        // Label the average.
        ctx.font = "20px Arial";
        ctx.fillStyle = "blue";
        ctx.fillText("Average", 10, height - 20);
    } else {
        console.warn("WARNING: No hand detected in any run.");
    }

    // Run gestureCheck on the averaged landmarks.
    const detected = avgLandmarks.length > 0 ? gestureCheck(avgLandmarks) : false;
    console.log(`DEBUG: Final gesture detection result: ${detected}`);

    // Draw a status icon in the upper right: check mark if detected, X if not.
    const statusIcon = detected ? "✓" : "✗";
    ctx.font = "48px Arial";
    ctx.fillStyle = detected ? "green" : "red";
    ctx.fillText(statusIcon, width - 60, 60);

    // Open a popup window to display the final canvas.
    const popup = window.open("", "_blank", `width=${width},height=${height}`);
    if (popup) {
        popup.document.write(`
      <html>
        <head>
          <title>Averaged Detection</title>
          <style>
            body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background: #eee; }
            canvas { border: 1px solid #ccc; }
          </style>
        </head>
        <body></body>
      </html>
    `);
        popup.document.body.appendChild(canvas);
        console.log("DEBUG: Popup window opened successfully.");
    } else {
        console.error("ERROR: Popup blocked! Please allow popups for this site.");
    }

    return { detected, avgLandmarks };
}

