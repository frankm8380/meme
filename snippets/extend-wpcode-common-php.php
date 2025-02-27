//<?php
//
add_action('admin_enqueue_scripts', 'wpcode_common_enqueue');

function wpcode_common_enqueue($hook) {
    // Only load on WPCode snippet editor pages
    if (strpos($hook, 'wpcode') === false) {
        return;
    }

    wp_enqueue_script('jquery');

    // Inject common JavaScript functions
    $common_js = <<<JS
jQuery(document).ready(function($) {
    // Function to display temporary messages
    function showMessage(message, source = 'WPCode Common') {
        console.log("[" + source + "]: " + message);
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

    // Function to prevent WPCode auto-save from triggering during custom actions
    function preventAutoSaveOnButtonClick(buttonSelector) {
        $(buttonSelector).on('mousedown click focus', function(event) {
            event.preventDefault();
            event.stopPropagation();
        });
    }

    // Expose the functions globally for use in other snippets
    window.wpcodeShowMessage = showMessage;
    window.wpcodePreventAutoSave = preventAutoSaveOnButtonClick;
});
JS;

    wp_add_inline_script('jquery', $common_js);
}
