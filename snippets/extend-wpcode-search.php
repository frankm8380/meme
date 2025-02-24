//<?php
function my_wpcode_search_extension_enqueue($hook) {
    // Only load on WPCode snippet editor pages
    if (strpos($hook, 'wpcode') === false) {
        return;
    }

    wp_enqueue_script('jquery');

    $custom_js = <<<'JS'
jQuery(document).ready(function($) {
    let folderHandle = null; // Store the folder handle for the session
    let mappingData = {};

    // Load saved mapping from localStorage
    function loadMappingFromStorage() {
        const savedMapping = localStorage.getItem('wpcodeMappingData');
        if (savedMapping) {
            mappingData = JSON.parse(savedMapping);
            console.log("[WPCode Search]: Mapping data loaded from localStorage.");
        }
    }

    // Function to display messages
    function showMessage(message) {
        console.log("[WPCode Search]: " + message);
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

    // Prevent WPCode auto-save from triggering during file picker
    function preventAutoSaveOnButtonClick(buttonSelector) {
        $(buttonSelector).on('mousedown click focus', function(event) {
            event.preventDefault();
            event.stopPropagation();
        });
    }

    // Save mapping to localStorage
    function saveMappingToStorage() {
        localStorage.setItem('wpcodeMappingData', JSON.stringify(mappingData));
        console.log("[WPCode Mapping]: Mapping data saved to localStorage.");
    }

    // Function to import mapping file
    async function importMappingFile() {
        try {
            mappingData = {};
            const [fileHandle] = await window.showOpenFilePicker();
            const file = await fileHandle.getFile();
            const content = await file.text();
            const jsonData = JSON.parse(content);

            jsonData.forEach(snippet => {
                if (snippet.title && snippet.id && snippet.code_type) {
                    let fileExtension = snippet.code_type.toLowerCase();
                    mappingData[`${snippet.title}.${fileExtension}`] = snippet.id;
                }
            });

            saveMappingToStorage();
            showMessage('Mapping data imported successfully.');
        } catch (error) {
            console.error('[WPCode Mapping]: Error importing file:', error);
            showMessage('Failed to import mapping.');
        }
    }

    // Function to display mappings
    function showMappings() {
        if (Object.keys(mappingData).length === 0) {
            showMessage('No mapping data loaded.');
            return;
        }

        let mappingInfo = 'Current Snippet Mappings:\n\n';
        for (let [file, id] of Object.entries(mappingData)) {
            mappingInfo += `${file} -> Snippet ID: ${id}\n`;
        }

        alert(mappingInfo);
    }

    // Function to select folder using File Picker
    async function selectSearchFolder() {
        try {
            folderHandle = await window.showDirectoryPicker();
            showMessage('Search folder set successfully.');
        } catch (error) {
            console.error('[WPCode Search]: Error selecting folder:', error);
            showMessage('Failed to set search folder.');
        }
    }

    // Function to clear search results and hide the container and button
    function clearSearchResults() {
        $('#wpcode-search-results').empty().hide();
        $('#clear-results').hide();
    }

    // Function to search snippets in selected folder
    async function searchSnippetsInFolder() {
        // If no folder is set, prompt the user to select one
        if (!folderHandle) {
            try {
                folderHandle = await window.showDirectoryPicker();
                showMessage('Search folder selected successfully.');
            } catch (error) {
                showMessage('Search canceled. No folder selected.');
                return;
            }
        }

        let searchAllFiles = $('#all-files-checkbox').is(':checked'); // Check if the checkbox is checked

        let searchTerm = prompt('Enter search term:');
        if (!searchTerm || searchTerm.trim() === '') {
            showMessage('No search term entered.');
            return;
        }

        let results = [];

        for await (const entry of folderHandle.values()) {
            if (entry.kind === 'file') {
                // If "All Files" is unchecked, only search files that exist in the mapping
                if (!searchAllFiles && !(entry.name in mappingData)) {
                    continue; // Skip files not in the mapping
                }

                const file = await entry.getFile();
                const content = await file.text();
                const lines = content.split('\n');

                lines.forEach((line, lineIndex) => {
                    let columnIndex = line.indexOf(searchTerm);
                    while (columnIndex !== -1) {
                        let contextSnippet = line.substring(Math.max(0, columnIndex - 30), Math.min(line.length, columnIndex + searchTerm.length + 30));
                        results.push({
                            name: entry.name,
                            handle: entry,
                            file,
                            context: contextSnippet.replace(/\n/g, ' '),
                            line: lineIndex + 1,
                            column: columnIndex + 1
                        });
                        columnIndex = line.indexOf(searchTerm, columnIndex + searchTerm.length);
                    }
                });
            }
        }

        // Display results directly in the WPCode editor
        const resultsContainer = $('#wpcode-search-results');
        resultsContainer.empty(); // Clear previous results

        if (results.length > 0) {
            let resultsHTML = '<h3>Search Results</h3><ul>';
            for (let result of results) {
                let snippetId = mappingData[result.name];
                if (snippetId) {
                    let snippetUrl = `${window.location.origin}/wp-admin/admin.php?page=wpcode-snippet-manager&snippet_id=${snippetId}`;
                    resultsHTML += `<li><a href="${snippetUrl}" target="_blank">${result.name} (Line ${result.line}, Column ${result.column})</a><br><small>...${result.context}...</small></li>`;
                } else {
                    let fileBlob = new Blob([await result.file.text()], { type: 'text/html' });
                    let fileUrl = URL.createObjectURL(fileBlob);
                    resultsHTML += `<li><a href="${fileUrl}" target="_blank">${result.name} (Line ${result.line}, Column ${result.column}) - Open File</a><br><small>...${result.context}...</small></li>`;
                }
            }
            resultsHTML += '</ul>';
            resultsContainer.html(resultsHTML).show(); // Show results container when there are results
            $('#clear-results').show(); // Show the clear button
        } else {
            showMessage('No matching snippets found.');
        }
    }

    // Add custom buttons, checkbox, and result container
    var searchSection = '<div id="wpcode-search-section" style="margin-bottom: 20px;">' +
        '<div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">' +
            '<button id="search-folder" class="button">Search Snippets</button>' +
            '<button id="select-folder" class="button">Set Search Folder</button>' +
            '<button id="clear-results" class="button" style="display: none;">Clear Search Results</button>' +
            '<label style="display: flex; align-items: center; gap: 5px;">' +
                '<input type="checkbox" id="all-files-checkbox"> All Files' +
            '</label>' +
            '<button id="import-mapping" class="button">Import Mapping</button>' +
            '<button id="show-mappings" class="button">Show Mappings</button>' +
        '</div>' +
        '<div id="wpcode-search-results" style="display: none; background: #f1f1f1; padding: 15px; border: 1px solid #ccc; border-radius: 5px; max-height: 300px; overflow-y: auto;"></div>' +
    '</div>';
    $('.wpcode-code-textarea').prepend(searchSection);

    preventAutoSaveOnButtonClick('#search-folder');
    preventAutoSaveOnButtonClick('#select-folder');
    preventAutoSaveOnButtonClick('#clear-results');
    preventAutoSaveOnButtonClick('#import-mapping');
    preventAutoSaveOnButtonClick('#show-mappings');

    // Attach event listeners
    $('#search-folder').on('click', function() {
        searchSnippetsInFolder();
    });

    $('#select-folder').on('click', function() {
        selectSearchFolder();
    });

    $('#clear-results').on('click', function() {
        clearSearchResults();
    });

    $('#import-mapping').on('click', function() {
        importMappingFile();
    });

    $('#show-mappings').on('click', function() {
        showMappings();
    });

    // Load mappings on page load
    loadMappingFromStorage();
});
JS;

    wp_add_inline_script('jquery', $custom_js);
}
add_action('admin_enqueue_scripts', 'my_wpcode_search_extension_enqueue');
