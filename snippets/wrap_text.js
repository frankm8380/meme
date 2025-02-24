function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    // ✅ Explicitly apply the current font and styling
    const currentFont = ctx.font;
    const currentFillStyle = ctx.fillStyle;
    const currentStrokeStyle = ctx.strokeStyle;
    const currentLineWidth = ctx.lineWidth;

    const sentences = text.split(/(?<=[.!?])\s+/); // Split by sentences

    sentences.forEach(sentence => {
        if (ctx.measureText(sentence).width <= maxWidth) {
            // Draw sentence in one line
            ctx.font = currentFont;
            ctx.fillStyle = currentFillStyle;
            ctx.strokeStyle = currentStrokeStyle;
            ctx.lineWidth = currentLineWidth;

            ctx.fillText(sentence, x, y);
            ctx.strokeText(sentence, x, y);
            y += lineHeight;
        } else {
            // Break sentence into multiple lines if too long
            const words = sentence.split(' ');
            let line = '';

            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                const testWidth = ctx.measureText(testLine).width;

                if (testWidth > maxWidth && i > 0) {
                    ctx.font = currentFont;
                    ctx.fillStyle = currentFillStyle;
                    ctx.strokeStyle = currentStrokeStyle;
                    ctx.lineWidth = currentLineWidth;

                    ctx.fillText(line, x, y);
                    ctx.strokeText(line, x, y);
                    line = words[i] + ' ';
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }

            // Draw last remaining line
            ctx.fillText(line, x, y);
            ctx.strokeText(line, x, y);
            y += lineHeight;
        }
    });
}
