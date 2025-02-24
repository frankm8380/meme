function my_wpcode_mapping_extension_enqueue($hook) {
    if (strpos($hook, 'wpcode') === false) {
        return;
    }

    wp_enqueue_script('jquery');

    $custom_js = <<<'JS'
    jQuery(document).ready(function($) {
        let mappingData = {};

        // Load saved mapping from localStorage
        function loadMappingFromStorage() {
            const savedMapping = localStorage.getItem('wpcodeMappingData');
            if (savedMapping) {
                mappingData = JSON.parse(savedMapping);
                console.log("[WPCode Mapping]: Mapping data loaded from localStorage.");
            }
        }

        // Save mapping to localStorage
        function saveMappingToStorage() {
            localStorage.setItem('wpcodeMappingData', JSON.stringify(mappingData));
            console.log("[WPCode Mapping]: Mapping data saved to localStorage.");
        }

        // Function to display messages
        function showMessage(message) {
            console.log("[WPCode Mapping]: " + message);
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

        // Prevent WPCode auto-save from triggering during button click
        function preventAutoSaveOnButtonClick(buttonSelector) {
            $(buttonSelector).on('mousedown click focus', function(event) {
                event.preventDefault();
                event.stopPropagation();
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

        // Add buttons for mapping functions
        var mappingButtons = '<div id="wpcode-mapping-buttons" style="margin-bottom: 10px;">' +
            '<button id="import-mapping" class="button">Import Mapping</button>' +
            '<button id="show-mappings" class="button">Show Mappings</button>' +
            '</div>';
        $('.wpcode-code-textarea').prepend(mappingButtons);

        // Prevent auto-save when buttons are clicked
        preventAutoSaveOnButtonClick('#import-mapping');
        preventAutoSaveOnButtonClick('#show-mappings');

        // Attach event listeners
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
add_action('admin_enqueue_scripts', 'my_wpcode_mapping_extension_enqueue');
