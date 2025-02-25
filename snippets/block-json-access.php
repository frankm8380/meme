//<?php

// ✅ Block direct access to JSON and JS files for security
function block_json_and_js_file_access() {
    if (preg_match('/\.(json|js)$/', $_SERVER['REQUEST_URI'])) {
        wp_die('You are not allowed to access this file.');
    }
}
add_action('template_redirect', 'block_json_and_js_file_access');
