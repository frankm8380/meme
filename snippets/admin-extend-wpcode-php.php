//<?php
//
function my_wpcode_extension_enqueue($hook) {
    // Only load on WPCode snippet editor pages
    if (strpos($hook, 'wpcode') === false) {
        return;
    }

    wp_enqueue_script('jquery');

    $custom_js = <<<JS
jQuery(document).ready(function($) {
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
                return 'txt';
        }
    }

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
            wpcodeShowMessage('File successfully saved as ' + fileName);
        } catch (error) {
            console.error('Failed to manually save file:', error);
            wpcodeShowMessage('Manual save failed or was canceled.');
        }
    }

    var checkExist = setInterval(function() {
        var editorContainer = $('.wpcode-code-textarea');
        if (editorContainer.length) {
            clearInterval(checkExist);

            var customButtons = '<div id="my-custom-buttons" style="margin-bottom: 10px;">' +
                '<div style="display: flex; gap: 10px; align-items: center;">' +
                    '<button id="import-clipboard" class="button">Import from Clipboard</button>' +
                    '<button id="export-clipboard" class="button">Copy to Clipboard</button>' +
                    '<button id="export-file-picker" class="button">Export to File</button>' +
                    '<button id="import-file" class="button">Import from File</button>' +
                '</div>' +
                '</div>';
            editorContainer.prepend(customButtons);

            wpcodePreventAutoSave('#export-clipboard');
            wpcodePreventAutoSave('#import-clipboard');
            wpcodePreventAutoSave('#export-file-picker');
            wpcodePreventAutoSave('#import-file');

            $('#import-clipboard').on('click', function() {
                navigator.clipboard.readText().then(function(clipboardText) {
                    if (clipboardText.trim() === "") {
                        wpcodeShowMessage('Clipboard is empty. Nothing to import.');
                        return;
                    }
                    insertCodeIntoEditor(clipboardText);
                }).catch(function(err) {
                    console.error('Failed to read clipboard: ', err);
                    var manualPaste = prompt('Clipboard access denied by browser. Please paste your code manually:');
                    if (manualPaste && manualPaste.trim() !== "") {
                        insertCodeIntoEditor(manualPaste);
                    } else {
                        wpcodeShowMessage('No code imported.');
                    }
                });
            });

            $('#export-clipboard').on('click', function() {
                var code = $('#wpcode_snippet_code').val();
                navigator.clipboard.writeText(code).then(function() {
                    wpcodeShowMessage('Code copied to clipboard!');
                }).catch(function(err) {
                    wpcodeShowMessage('Error copying code: ' + err);
                });
            });

            $('#export-file-picker').on('click', async function () {
                var code = $('#wpcode_snippet_code').val();
                var snippetName = $('input[name="wpcode_snippet_title"]').val() || 'extend_wpcode';
                var snippetType = $('#wpcode_snippet_type').val() || 'custom_code';
                var extension = getFileExtension(snippetType);
                var fileName = snippetName + '.' + extension;
                await manualFileSave(fileName, code);
            });

            $('#import-file').on('click', function() {
                var input = $('<input type="file" accept=".txt,.js,.php,.html,.css" style="display: none;">');
                $('body').append(input);
                input.trigger('click');
                input.on('change', function(event) {
                    var file = event.target.files[0];
                    if (!file) {
                        wpcodeShowMessage('No file selected.');
                        return;
                    }

                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var importedCode = e.target.result;
                        insertCodeIntoEditor(importedCode);
                    };
                    reader.onerror = function() {
                        wpcodeShowMessage('Error reading the file.');
                    };
                    reader.readAsText(file);
                    input.remove();
                });
            });

            function insertCodeIntoEditor(code) {
                $('#wpcode_snippet_code').val(code);
                var cmElement = $('#wpcode_snippet_code').next('.CodeMirror')[0];
                if (cmElement && cmElement.CodeMirror) {
                    cmElement.CodeMirror.setValue(code);
                    cmElement.CodeMirror.refresh();
                }
                wpcodeShowMessage('Code successfully imported!');
            }

            // 🔔 Message listener for Save All automation
            window.addEventListener('message', async function(event) {
                if (event.origin !== window.location.origin) return;
                if (event.data.action === 'export-snippet') {
                    const fileName = event.data.filename || 'snippet.txt';
                    const code = $('#wpcode_snippet_code').val();
                    await manualFileSave(fileName, code);
                    setTimeout(() => window.close(), 1000);
                }
            });
        }
    }, 500);
});
JS;

    wp_add_inline_script('jquery', $custom_js);
}
add_action('admin_enqueue_scripts', 'my_wpcode_extension_enqueue');
