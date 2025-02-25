//<?php
//
// ✅ Get the user's IP address
function get_user_ip_address() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return sanitize_text_field($_SERVER['HTTP_CLIENT_IP']);
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return sanitize_text_field(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    } else {
        return sanitize_text_field($_SERVER['REMOTE_ADDR']);
    }
}

// ✅ Limit submissions based on IP address, action type, and page title
function limit_ip_submissions($action_type, $page_title) {
    $time_limit = 12 * 60 * 60; // 12 hours
    $ip = get_user_ip_address();
    $log = get_option('meme_ip_action_log', array());

    if (isset($log[$ip][$action_type][$page_title]) && (time() - $log[$ip][$action_type][$page_title]) < $time_limit) {
        wp_die('<p style="color:red; font-weight:bold;">You can only perform this action once every 12 hours on this page. Try again later.</p>', 'Limit Reached', array('back_link' => true));
    }
}

// ✅ Save the timestamp of a successful submission by IP, action type, and page title
function save_ip_submission_time($action_type, $page_title) {
    $ip = get_user_ip_address();
    $log = get_option('meme_ip_action_log', array());
    $log[$ip][$action_type][$page_title] = time();
    update_option('meme_ip_action_log', $log);
}

// ✅ Custom AJAX action for checking IP limit including page title
add_action('wp_ajax_check_ip_limit', 'check_ip_limit');
add_action('wp_ajax_nopriv_check_ip_limit', 'check_ip_limit');

function check_ip_limit() {
    $action_type = sanitize_text_field($_GET['action_type']);
    $page_title = sanitize_text_field($_GET['page_title']);
    $ip = get_user_ip_address();
    $log = get_option('meme_ip_action_log', array());
    $time_limit = 12 * 60 * 60; // 12 hours

    $allowed = !isset($log[$ip][$action_type][$page_title]) || (time() - $log[$ip][$action_type][$page_title]) >= $time_limit;

    wp_send_json(array('allowed' => $allowed));
}

// ✅ Log action after a successful submission by IP, action type, and page title
add_action('wp_ajax_log_ip_action', 'log_ip_action_ajax');
add_action('wp_ajax_nopriv_log_ip_action', 'log_ip_action_ajax');

function log_ip_action_ajax() {
    $action_type = sanitize_text_field($_GET['action_type']);
    $page_title = sanitize_text_field($_GET['page_title']);
    save_ip_submission_time($action_type, $page_title);
    wp_send_json_success();
}

// ✅ Automatically clear old logs daily
if (!wp_next_scheduled('wp_scheduled_clear_ip_logs')) {
    wp_schedule_event(time(), 'daily', 'wp_scheduled_clear_ip_logs');
}

add_action('wp_scheduled_clear_ip_logs', 'clear_old_ip_logs');
function clear_old_ip_logs() {
    $log = get_option('meme_ip_action_log', array());
    $expiration_time = 12 * 60 * 60; // 12 hours

    foreach ($log as $ip => $actions) {
        foreach ($actions as $action => $pages) {
            foreach ($pages as $page_title => $timestamp) {
                if (time() - $timestamp > $expiration_time) {
                    unset($log[$ip][$action][$page_title]);
                }
            }
            if (empty($log[$ip][$action])) {
                unset($log[$ip][$action]);
            }
        }
        if (empty($log[$ip])) {
            unset($log[$ip]); // Remove IP if no actions remain
        }
    }

    update_option('meme_ip_action_log', $log);
}

// ✅ Custom AJAX action to clear IP limits for testing
add_action('wp_ajax_clear_ip_limits', 'clear_ip_limits_ajax');
add_action('wp_ajax_nopriv_clear_ip_limits', 'clear_ip_limits_ajax');

function clear_ip_limits_ajax() {
    delete_option('meme_ip_action_log'); // Clears all stored limits
    wp_send_json_success();
}
