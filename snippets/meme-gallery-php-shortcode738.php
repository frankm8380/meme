// Meme gallery shortcode with masonry layout using actual photo sizes and fallback to post content images
?>

<div id="meme-gallery" class="masonry-layout">
    <script>console.log("Meme gallery shortcode triggered.");</script>
    <?php
    $args = array(
        'post_type' => 'post', // Assuming memes are uploaded as posts
        'posts_per_page' => -1
    );
    $meme_query = new WP_Query($args);

    if ($meme_query->have_posts()) :
        echo "<script>console.log('Meme posts found: " . $meme_query->found_posts . "');</script>";

        while ($meme_query->have_posts()) : $meme_query->the_post();
            $image_url = get_the_post_thumbnail_url(get_the_ID(), 'full'); // Use full-size images

            // Fallback: Extract first image from post content
            if (!$image_url) {
                $content = get_the_content();
                preg_match('/<img.+src=[\'"]([^\'"]+)[\'"].*>/i', $content, $matches);
                if (isset($matches[1])) {
                    $image_url = $matches[1];
                    echo "<script>console.log('Fallback image found for post ID: " . get_the_ID() . "');</script>";
                }
            }

            if ($image_url) :
                echo "<script>console.log('Meme image found for post ID: " . get_the_ID() . "');</script>";
    ?>
                <div class="meme-item">
                    <img src="<?php echo esc_url($image_url); ?>" alt="<?php the_title(); ?>">
                    <p><?php the_title(); ?></p>
                </div>
    <?php
            else :
                echo "<script>console.log('No image found for post ID: " . get_the_ID() . "');</script>";
            endif;
        endwhile;

        wp_reset_postdata();
    else :
        echo "<script>console.log('No meme posts found.');</script>";
        echo "<p>No memes found.</p>";
    endif;
    ?>
</div>

<?php
