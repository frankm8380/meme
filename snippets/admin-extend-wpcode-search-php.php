//<?php
//
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
            populateMappingDropdown();
        }
    }


    // Save mapping to localStorage
    function saveMappingToStorage() {
        localStorage.setItem('wpcodeMappingData', JSON.stringify(mappingData));
        console.log("[WPCode Mapping]: Mapping data saved to localStorage.");
    }

    // Populate the dropdown with the current mapping data (sorted)
    function populateMappingDropdown() {
        let $dropdown = $('#mapping-dropdown');
        $dropdown.empty();
        $dropdown.append('<option value="">Select a Code Snippet to load</option>');

        // Convert object to array, sort by filename, and populate dropdown
        Object.entries(mappingData)
            .sort(([fileA], [fileB]) => fileA.localeCompare(fileB)) // Sort alphabetically by filename
            .forEach(([filename, snippetId]) => {
                $dropdown.append('<option value="' + snippetId + '">' + filename + '</option>');
            });
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
            populateMappingDropdown();
            wpcodeShowMessage('Mapping data imported successfully.');
        } catch (error) {
            console.error('[WPCode Mapping]: Error importing file:', error);
            wpcodeShowMessage('Failed to import mapping.');
        }
    }

// Function to display mappings
function showMappings() {
    if (Object.keys(mappingData).length === 0) {
        wpcodeShowMessage('No mapping data loaded.');
        return;
    }

    let sortedMappings = Object.entries(mappingData)
        .sort(([fileA], [fileB]) => fileA.localeCompare(fileB)); // Sort alphabetically by file name

    let mappingInfo = 'Current Snippet Mappings:\n\n';
    for (let [file, id] of sortedMappings) {
        mappingInfo += `${file} -> Snippet ID: ${id}\n`;
    }

    alert(mappingInfo);
}


    // Function to select folder using File Picker
    async function selectSearchFolder() {
        try {
            folderHandle = await window.showDirectoryPicker();
            wpcodeShowMessage('Search folder set successfully.');
        } catch (error) {
            console.error('[WPCode Search]: Error selecting folder:', error);
            wpcodeShowMessage('Failed to set search folder.');
        }
    }

    // Function to clear search results and hide the container and button
    function clearSearchResults() {
        $('#wpcode-search-results').empty().hide();
        $('#clear-results').hide();
    }

    // Function to search snippets in selected folder
    async function searchSnippetsInFolder() {
        if (!folderHandle) {
            try {
                folderHandle = await window.showDirectoryPicker();
                wpcodeShowMessage('Search folder selected successfully.');
            } catch (error) {
                wpcodeShowMessage('Search canceled. No folder selected.');
                return;
            }
        }

        let searchAllFiles = $('#all-files-checkbox').is(':checked');
        let matchCase = $('#match-case-checkbox').is(':checked');

        let searchTerm = prompt('Enter search term:');
        if (!searchTerm || searchTerm.trim() === '') {
            wpcodeShowMessage('No search term entered.');
            return;
        }

        let results = [];

        for await (const entry of folderHandle.values()) {
            if (entry.kind === 'file') {
                if (!searchAllFiles && !(entry.name in mappingData)) {
                    continue;
                }

                const file = await entry.getFile();
                const content = await file.text();
                const lines = content.split('\n');

                lines.forEach((line, lineIndex) => {
                    const effectiveLine = matchCase ? line : line.toLowerCase();
                    const effectiveSearchTerm = matchCase ? searchTerm : searchTerm.toLowerCase();
                    let columnIndex = effectiveLine.indexOf(effectiveSearchTerm);
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
                        columnIndex = effectiveLine.indexOf(effectiveSearchTerm, columnIndex + effectiveSearchTerm.length);
                    }
                });
            }
        }

        const resultsContainer = $('#wpcode-search-results');
        resultsContainer.empty();

        if (results.length > 0) {
            let resultsHTML = '<h3>Search Results</h3><ul>';
            for (let result of results) {
                let snippetId = mappingData[result.name];
                if (snippetId) {
                    let snippetUrl = `${window.location.origin}/wp-admin/admin.php?page=wpcode-snippet-manager&snippet_id=${snippetId}`;
                    resultsHTML += `<li><a href="${snippetUrl}" target="_blank">${result.name} (Line ${result.line}, Column ${result.column})</a><br><small>...${result.context}...</small></li>`;
                }
            }
            resultsHTML += '</ul>';
            resultsContainer.html(resultsHTML).show();
            $('#clear-results').show();
        } else {
            wpcodeShowMessage('No matching snippets found.');
        }
    }

    // Add custom buttons, checkboxes, dropdown, and result container
    var searchSection = '<div id="wpcode-search-section" style="margin-bottom: 20px;">' +
        '<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 10px;">' +
            '<button id="search-folder" class="button">Search Snippets</button>' +
            '<button id="select-folder" class="button">Set Search Folder</button>' +
            '<button id="clear-results" class="button" style="display: none;">Clear Search Results</button>' +
            '<label style="display: flex; align-items: center; gap: 5px;">' +
                '<input type="checkbox" id="all-files-checkbox"> All Files' +
            '</label>' +
            '<label style="display: flex; align-items: center; gap: 5px;">' +
                '<input type="checkbox" id="match-case-checkbox"> Match Case' +
            '</label>' +
            '<select id="mapping-dropdown" class="button">' +
                '<option value="">Select a snippet</option>' +
            '</select>' +
            '<button id="show-mappings" class="button">Show Mappings</button>' +
            '<button id="import-mapping" class="button">Import Mapping</button>' +
        '</div>' +
        '<div id="wpcode-search-results" style="display: none; background: #f1f1f1; padding: 15px; border: 1px solid #ccc; border-radius: 5px; max-height: 300px; overflow-y: auto;"></div>' +
    '</div>';
    $('.wpcode-code-textarea').prepend(searchSection);

    wpcodePreventAutoSave('#search-folder');
    wpcodePreventAutoSave('#select-folder');
    wpcodePreventAutoSave('#clear-results');
    wpcodePreventAutoSave('#import-mapping');
    wpcodePreventAutoSave('#show-mappings');

    // Event listener for dropdown change
    $(document).on('change', '#mapping-dropdown', function() {
        var snippetId = $(this).val();
        if (snippetId) {
            var snippetUrl = `${window.location.origin}/wp-admin/admin.php?page=wpcode-snippet-manager&snippet_id=${snippetId}`;
            window.open(snippetUrl, '_blank');
            $(this).val('');
        }
    });

    // Attach event listeners for buttons
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
