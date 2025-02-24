// ✅ Generate Nonce for Upload Form (Pending Only)
add_action('wp_ajax_get_meme_nonce', 'generate_meme_nonce');
add_action('wp_ajax_nopriv_get_meme_nonce', 'generate_meme_nonce');

function generate_meme_nonce() {
    $nonce = wp_create_nonce('get_meme_nonce');
    wp_send_json_success(['nonce' => $nonce]);
}

// ✅ Meme Upload Handler with Rejection on Integrity Check Failure
add_action('wp_ajax_upload_meme', 'handle_meme_upload');
add_action('wp_ajax_nopriv_upload_meme', 'handle_meme_upload');

function handle_meme_upload() {
    // Verify Nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'get_meme_nonce')) {
        wp_send_json_error(['message' => 'Invalid nonce.']);
        return;
    }

    // Check if a file is uploaded
    if (!isset($_FILES['file'])) {
        wp_send_json_error(['message' => 'No file uploaded']);
        return;
    }

    // Validate and Upload Image
    $file = $_FILES['file'];
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowed_types)) {
        wp_send_json_error(['message' => 'Invalid file type.']);
        return;
    }

    $uploaded_file = wp_handle_upload($file, ['test_form' => false]);

    if (isset($uploaded_file['error'])) {
        wp_send_json_error(['message' => $uploaded_file['error']]);
        return;
    }

    $file_url = $uploaded_file['url'];

    // Analyze image using Google Vision API
    $image_safe = analyze_image_safety($file_url);
    if ($image_safe !== true) {
        wp_send_json_error(['message' => "Image rejected: $image_safe"]);
        return;
    }

    // Analyze text for inappropriate language
    $post_content = sanitize_text_field($_POST['post_content']);
    $text_safe = analyze_text_safety($post_content);
    if ($text_safe !== true) {
        wp_send_json_error(['message' => "Text rejected: Contains inappropriate language."]);
        return;
    }

    // Create Post (Only if both checks passed)
    $post_status = 'publish';

    $image_html = '<div style="margin-bottom:20px;"><img src="' . esc_url($file_url) . '" alt="User Uploaded Meme" style="max-width:100%; height:auto; border: 2px solid #ddd; padding: 5px; border-radius: 5px;"></div>';
    $post_data = [
        'post_title'    => wp_strip_all_tags(substr($post_content, 0, 50)),
        'post_content'  => $image_html . $post_content,
        'post_status'   => $post_status,
        'post_author'   => get_current_user_id(),
        'post_type'     => 'post',
    ];
$post_id = wp_insert_post($post_data);

if (is_wp_error($post_id)) {
    wp_send_json_error(['message' => 'Failed to create post']);
    return;
}

// ✅ Upload the image and attach it to the post
$attachment_id = media_handle_sideload([
    'name'     => basename($uploaded_file['file']),
    'tmp_name' => $uploaded_file['file'],
], $post_id);

if (is_wp_error($attachment_id)) {
    wp_send_json_error(['message' => 'Failed to upload media']);
    return;
}

// ✅ Set the uploaded image as the featured image
set_post_thumbnail($post_id, $attachment_id);

// ✅ Insert the image directly into post content
$image_url = wp_get_attachment_url($attachment_id);
$image_html = wp_get_attachment_image($attachment_id, 'full', false, [
    'class' => 'meme-image',
    'style' => 'max-width:100%; height:auto; border:2px solid #ddd; padding:5px; border-radius:5px;'
]);

$updated_post_data = [
    'ID' => $post_id,
    'post_content' => $image_html . $post_content // Automatically adds image before post text
];

wp_update_post($updated_post_data);

// ✅ Return success response
$post_url = get_permalink($post_id);
wp_send_json_success(['message' => 'Meme uploaded successfully.', 'url' => $post_url]);

}

// ✅ Analyze Image Content Using Google Cloud Vision API with Specific Feedback
function analyze_image_safety($file_url) {
    $credentials = file_get_contents('https://elonandtrumpnumberone.com/wp-content/uploads/2025/02/zee-coach-b0a5a711e22f.json');
    $access_token = get_google_access_token($credentials);
    if (!$access_token) {
        return "Unable to authenticate with Google Vision.";
    }

    $vision_url = 'https://vision.googleapis.com/v1/images:annotate?access_token=' . $access_token;

    $image_data = file_get_contents($file_url);
    $base64_image = base64_encode($image_data);

    $request_body = json_encode([
        'requests' => [
            [
                'image' => ['content' => $base64_image],
                'features' => [['type' => 'SAFE_SEARCH_DETECTION']],
            ],
        ],
    ]);

    $response = wp_remote_post($vision_url, [
        'body'    => $request_body,
        'headers' => ['Content-Type' => 'application/json'],
    ]);

    if (is_wp_error($response)) {
        return "Failed to process image.";
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    $safe_search = $body['responses'][0]['safeSearchAnnotation'];

    $allowed_ratings = ['VERY_UNLIKELY', 'UNLIKELY', 'POSSIBLE'];

    if (!in_array($safe_search['adult'], $allowed_ratings)) {
        return "Image contains adult content.";
    }

    if (!in_array($safe_search['violence'], $allowed_ratings)) {
        return "Image contains violent content.";
    }

    return true;
}

// ✅ Get Google OAuth Access Token from Service Account JSON
function get_google_access_token($credentials_json) {
    $credentials = json_decode($credentials_json, true);

    $jwt_header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $now = time();
    $jwt_claim = base64_encode(json_encode([
        'iss'   => $credentials['client_email'],
        'scope' => 'https://www.googleapis.com/auth/cloud-platform',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $now,
        'exp'   => $now + 3600
    ]));

    $signature = '';
    openssl_sign($jwt_header . '.' . $jwt_claim, $signature, $credentials['private_key'], 'sha256');
    $jwt = $jwt_header . '.' . $jwt_claim . '.' . base64_encode($signature);

    $response = wp_remote_post('https://oauth2.googleapis.com/token', [
        'body' => [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ],
    ]);

    if (is_wp_error($response)) {
        return false;
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    return $body['access_token'] ?? false;
}

// ✅ Basic Text Content Filter with Rejection Reason
function analyze_text_safety($text) {
    $banned_words = ['piss', 'shit', 'fuck', 'cunt', 'cock', 'fag'];
    foreach ($banned_words as $word) {
        if (stripos($text, $word) !== false) {
            return false;
        }
    }
    return true;
}
