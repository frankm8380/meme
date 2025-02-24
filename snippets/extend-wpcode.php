function my_wpcode_extension_enqueue($hook) {
    // Only load on WPCode snippet editor pages
    if (strpos($hook, 'wpcode') === false) {
        return;
    }

    wp_enqueue_script('jquery');

    $custom_js = <<<JS
jQuery(document).ready(function($) {
    // Function to show temporary messages and log them
    function showMessage(message) {
        console.log("[WPCode Custom]: " + message);
        var messageBox = $('<div class="my-temp-message">' + message + '</div>');
        $('body').append(messageBox);
        messageBox.css({
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#007cba',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '5px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
            zIndex: 9999
        }).fadeIn();

        setTimeout(function() {
            messageBox.fadeOut(function() {
                $(this).remove();
            });
        }, 3000);
    }

    // Function to determine the correct file extension based on snippet type
    function getFileExtension(snippetType) {
        switch (snippetType.toLowerCase()) {
            case 'php':
            case 'php_code':
                return 'php';
            case 'js':
            case 'javascript':
            case 'javascript_code':
                return 'js';
            case 'css':
            case 'css_code':
                return 'css';
            case 'html':
            case 'html_code':
                return 'html';
            default:
                return 'txt'; // Default fallback
        }
    }

    // Always prompt user for file save location with correct extension
    async function manualFileSave(fileName, fileContent) {
        try {
            const options = {
                suggestedName: fileName,
                types: [{
                    description: 'Code Files',
                    accept: { 'text/plain': ['.txt', '.js', '.php', '.html', '.css'] }
                }]
            };
            const handle = await window.showSaveFilePicker(options);
            const writable = await handle.createWritable();

            await writable.write(fileContent);
            await writable.close();

            showMessage(`File successfully saved as \${fileName}`);
        } catch (error) {
            console.error('Failed to manually save file:', error);
            showMessage('Manual save failed or was canceled.');
        }
    }

    // Prevent WPCode auto-save from triggering when clicking custom buttons
    function preventAutoSaveOnButtonClick(buttonSelector) {
        $(buttonSelector).on('mousedown click focus', function(event) {
            event.preventDefault();
            event.stopPropagation();
        });
    }

    // Poll for the WPCode editor container until it appears
    var checkExist = setInterval(function() {
        var editorContainer = $('.wpcode-code-textarea');
        if (editorContainer.length) {
            clearInterval(checkExist);

            // Add custom buttons for clipboard and file together without Dummy button
            var customButtons = '<div id="my-custom-buttons" style="margin-bottom: 10px;">' +
                '<div style="display: flex; gap: 10px; align-items: center;">' +
                    '<button id="import-clipboard" class="button">Import from Clipboard</button>' +
                    '<button id="export-clipboard" class="button">Copy to Clipboard</button>' +
                    '<button id="export-file-picker" class="button">Export to File</button>' +
                    '<button id="import-file" class="button">Import from File</button>' +
                '</div>' +
                '</div>';
            editorContainer.prepend(customButtons);

            // Prevent auto-save from triggering when clicking custom buttons
            preventAutoSaveOnButtonClick('#export-clipboard');
            preventAutoSaveOnButtonClick('#import-clipboard');
            preventAutoSaveOnButtonClick('#export-file-picker');
            preventAutoSaveOnButtonClick('#import-file');

            // Import from Clipboard
            $('#import-clipboard').on('click', function() {
                navigator.clipboard.readText().then(function(clipboardText) {
                    if (clipboardText.trim() === "") {
                        showMessage('Clipboard is empty. Nothing to import.');
                        return;
                    }
                    insertCodeIntoEditor(clipboardText);
                }).catch(function(err) {
                    console.error('Failed to read clipboard: ', err);
                    var manualPaste = prompt('Clipboard access denied by browser. Please paste your code manually:');
                    if (manualPaste && manualPaste.trim() !== "") {
                        insertCodeIntoEditor(manualPaste);
                    } else {
                        showMessage('No code imported.');
                    }
                });
            });

            // Export to Clipboard
            $('#export-clipboard').on('click', function() {
                var code = $('#wpcode_snippet_code').val();
                navigator.clipboard.writeText(code).then(function() {
                    showMessage('Code copied to clipboard!');
                }).catch(function(err) {
                    showMessage('Error copying code: ' + err);
                });
            });

            // Export using File Picker with correct file extension
            $('#export-file-picker').on('click', async function () {
                var code = $('#wpcode_snippet_code').val();
                var snippetName = $('input[name="wpcode_snippet_title"]').val() || 'extend_wpcode';
                var snippetType = $('#wpcode_snippet_type').val() || 'custom_code';
                var extension = getFileExtension(snippetType);

                var fileName = snippetName + '.' + extension;

                await manualFileSave(fileName, code);
            });

            // Import from File (read file content and insert directly into editor)
            $('#import-file').on('click', function() {
                var input = $('<input type="file" accept=".txt,.js,.php,.html,.css" style="display: none;">');
                $('body').append(input);
                input.trigger('click');
                input.on('change', function(event) {
                    var file = event.target.files[0];
                    if (!file) {
                        showMessage('No file selected.');
                        return;
                    }

                    var reader = new FileReader();

                    reader.onload = function(e) {
                        var importedCode = e.target.result;
                        insertCodeIntoEditor(importedCode); // Directly insert the file contents
                    };

                    reader.onerror = function() {
                        showMessage('Error reading the file.');
                    };

                    reader.readAsText(file);
                    input.remove();
                });
            });

            // Directly insert code into editor
            function insertCodeIntoEditor(code) {
                $('#wpcode_snippet_code').val(code);
                var cmElement = $('#wpcode_snippet_code').next('.CodeMirror')[0];
                if (cmElement && cmElement.CodeMirror) {
                    cmElement.CodeMirror.setValue(code);
                    cmElement.CodeMirror.refresh();
                }
                showMessage('Code successfully imported!');
            }
        }
    }, 500);
});
JS;

    wp_add_inline_script('jquery', $custom_js);
}
add_action('admin_enqueue_scripts', 'my_wpcode_extension_enqueue');
