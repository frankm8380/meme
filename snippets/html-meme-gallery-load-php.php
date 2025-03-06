function load_memes_ajax() {
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'load_more_memes_nonce')) {
        wp_send_json(['success' => false, 'message' => 'Security check failed.'], 403);
        exit;
    }

    nocache_headers();

    $page = isset($_POST['page']) ? intval($_POST['page']) : 1;
    $posts_per_page = 20;

    // 🔹 Ensure first page correctly loads expected results
    if ($page === 1) {
        $offset = 0;
    	$posts_per_page = $posts_per_page + 1;
    } else {
        $offset = ($page - 1) * $posts_per_page;
    }
	
    $query = new WP_Query([
        'post_type'      => 'post',
        'posts_per_page' => $posts_per_page,
        'paged'          => $page,
        'offset'         => $offset, // 🔹 Fix for pagination loading correctly
        'orderby'        => 'date',
        'order'          => 'DESC'
    ]);

    $memes = [];
    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $image_url = get_the_post_thumbnail_url(get_the_ID(), 'medium');

            if (!$image_url) {
                $content = get_the_content();
                preg_match('/<img.+src=[\'"]([^\'"]+)[\'"].*>/i', $content, $matches);
                if (isset($matches[1])) {
                    $image_url = $matches[1];
                }
            }

            if ($image_url) {
                $memes[] = [
                    'thumbnail' => esc_url($image_url),
                    'caption'   => esc_html(get_the_title()),
                ];
            }
        }
        wp_reset_postdata();
    }

    if (!empty($memes)) {
        wp_send_json([
            'success' => true,
            'data'    => $memes
        ]);
    } else {
        wp_send_json([
            'success' => false,
            'message' => 'No more memes.'
        ]);
    }
}

add_action('wp_ajax_load_memes', 'load_memes_ajax');
add_action('wp_ajax_nopriv_load_memes', 'load_memes_ajax');
