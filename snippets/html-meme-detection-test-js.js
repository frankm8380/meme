let previousResults = "";  // Store previous results for consistency

// ✅ Reset detection results every time the page loads
window.onload = function () {
    console.log("🔄 Resetting detection results on page load...");
    localStorage.removeItem("detectionResults"); // Clears previous test results
};

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

        // Process each image file in the folder
        for await (const entry of handle.values()) {
            if (entry.kind === "file" && /\.(png|jpe?g)$/i.test(entry.name)) {
                fileCount++;
                console.log(`🖼️ Processing file: ${entry.name}...`);

                // Read file as blob URL
                const file = await entry.getFile();
                const fileURL = URL.createObjectURL(file);

                // Run MediaPipe detection with averaging (using Middle Finger check)
                const result = await detectGestureFromFileGeneric(fileURL, checkMiddleFinger, 100);

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
