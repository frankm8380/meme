function limit_user_submissions() {
    if (!is_user_logged_in()) {
        return; // Skip for guests
    }

    $user_id = get_current_user_id();
    $last_submission = get_user_meta($user_id, 'last_submission_time', true);
    $time_limit = 12 * 60 * 60; // 12 hours in seconds

    if ($last_submission && (time() - $last_submission) < $time_limit) {
        wp_die('<p style="color:red; font-weight:bold;">You can only submit one post every 12 hours. Try again later.</p>', 'Submission Limit Reached', array('back_link' => true));
    }
}
add_action('user_submitted_posts_pre_insert', 'limit_user_submissions');

function save_user_submission_time($post_ID) {
    if (is_user_logged_in()) {
        $user_id = get_current_user_id();
        update_user_meta($user_id, 'last_submission_time', time());
    }
}
add_action('wp_insert_post', 'save_user_submission_time');
