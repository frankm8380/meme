//<?php

// ✅ Allow JSON and JS file uploads in WordPress
function allow_custom_upload_mimes($mimes) {
    $mimes['json'] = 'application/json'; // Allow JSON uploads
    $mimes['js'] = 'application/javascript'; // Allow JS uploads
    return $mimes;
}
add_filter('upload_mimes', 'allow_custom_upload_mimes');

// ✅ Verify file type and extension for JS uploads
function fix_mime_types($data, $file, $filename, $mimes) {
    $ext = pathinfo($filename, PATHINFO_EXTENSION);
    
    if ($ext === 'js') {
        $data['ext'] = 'js';
        $data['type'] = 'application/javascript';
    }

    return $data;
}
add_filter('wp_check_filetype_and_ext', 'fix_mime_types', 10, 4);
