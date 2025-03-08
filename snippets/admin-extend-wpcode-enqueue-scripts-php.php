function enqueue_meme_scripts() {
    wp_enqueue_script('meme-gallery-script', get_template_directory_uri() . '/js/meme-gallery.js', array('jquery'), null, true);

    wp_localize_script('meme-gallery-script', 'meme_ajax', [
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce'    => wp_create_nonce('load_more_memes_nonce')
    ]);
}

add_action('wp_enqueue_scripts', 'enqueue_meme_scripts');
