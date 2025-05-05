//<?php
//
add_action('init', function() {
	add_action('wp_ajax_wpcode_get_snippet', function() {
		if (!current_user_can('edit_posts')) {
			wp_send_json_error('Unauthorized', 403);
		}

		$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
		if (!$id) {
			wp_send_json_error('Missing snippet ID', 400);
		}

		// ✅ Try to access WPCode again, now that it's later in the load order
		if (!function_exists('wpcode') && isset($GLOBALS['wpcode'])) {
			function wpcode() {
				return $GLOBALS['wpcode'];
			}
		}

		if (!function_exists('wpcode') || !method_exists(wpcode(), 'library')) {
			wp_send_json_error('WPCode still not ready at init');
		}

		try {
			$snippet = wpcode()->library->get_snippet($id);
			if (!$snippet || empty($snippet->id)) {
				wp_send_json_error('Snippet not found', 404);
			}

			wp_send_json_success([
				'id'    => $snippet->id,
				'title' => $snippet->title,
				'type'  => $snippet->type,
				'code'  => $snippet->code,
			]);
		} catch (Throwable $e) {
			wp_send_json_error('Exception: ' . $e->getMessage(), 500);
		}
	});
});
