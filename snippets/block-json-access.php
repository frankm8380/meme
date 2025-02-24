// ✅ Block direct access to JSON files for security
function block_json_file_access() {
    if (preg_match('/\.json$/', $_SERVER['REQUEST_URI'])) {
        wp_die('You are not allowed to access this file.');
    }
}
add_action('template_redirect', 'block_json_file_access');
