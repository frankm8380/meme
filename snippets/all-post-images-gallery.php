// Default value if not set
$rows_per_page = isset($rows_per_page) && is_numeric($rows_per_page) ? intval($rows_per_page) : 20;

// Dynamic title based on $rows_per_page
$gallery_title = ($rows_per_page === -1) ? "All Memes" : "Latest $rows_per_page Memes";
?>

<!-- Divider and Title -->
<hr id="gallery-divider">
<h2 id="gallery-title"><?php echo esc_html($gallery_title); ?></h2>

<!-- Empty Meme Container (Content will load via AJAX) -->
<div id="meme-gallery">
    <script>console.log("Meme gallery initialized.");</script>
</div>

<!-- Loading Indicator -->
<div id="loadingIndicator">🔄 Loading more memes...</div>

<script>
	document.addEventListener("DOMContentLoaded", function () {
		let page = 1;
		let isLoading = false;
		let hasMoreMemes = true; // ✅ Tracks if more memes exist
		let memesLoaded = 0; // ✅ Counter to track memes loaded
		const maxMemes = <?php echo $rows_per_page; ?>; // Pass PHP value to JS
		const memeGallery = document.getElementById("meme-gallery");
		const loadingIndicator = document.getElementById("loadingIndicator");

		console.log("📢 Meme gallery initialized. First load triggered.");

		async function loadMoreMemes(initialLoad = false) {
			if (isLoading || !hasMoreMemes) {
				console.log("⚠️ Load attempt ignored (already loading or no more memes).");
				return;
			}
			isLoading = true;
			loadingIndicator.style.display = "block";
			console.log(`🔄 Fetching memes for page ${page}...`);

			try {
				const response = await fetch(meme_ajax.ajax_url, {
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: new URLSearchParams({
						action: "load_memes",
						nonce: meme_ajax.nonce,  
						page: page
					})
				});

				const data = await response.json();
				console.log("✅ Response received:", data);

				if (data.success && data.data.length > 0) {
					console.log(`🎉 Successfully loaded ${data.data.length} memes.`);

					data.data.forEach(meme => {
						if (maxMemes !== -1 && memesLoaded >= maxMemes) {
							console.log("⛔ Max memes reached. Stopping further loads.");
							hasMoreMemes = false;
							window.removeEventListener("scroll", handleScroll);
							return; // Stop adding more memes
						}

						const memeItem = document.createElement("div");
						memeItem.classList.add("meme-item");
						memeItem.innerHTML = `
							<img src="${meme.thumbnail}" alt="Meme" loading="lazy">
							<p>${meme.caption}</p>
						`;
						memeGallery.appendChild(memeItem);

						memesLoaded++; // ✅ Increment count
					});

					page++;
					console.log(`📄 Page number incremented to ${page}. Ready for next load.`);
				} else {
					console.log("🚫 No more memes available. Stopping infinite scroll.");
					hasMoreMemes = false; // ✅ Prevents unnecessary requests
					window.removeEventListener("scroll", handleScroll);
				}
			} catch (error) {
				console.error("❌ Error loading more memes:", error);
			}

			isLoading = false;
			loadingIndicator.style.display = "none";
		}

		function handleScroll() {
			if (window.innerHeight + window.scrollY >= memeGallery.offsetHeight - 100) {
				console.log("📜 Scroll detected near bottom. Attempting to load more memes...");
				loadMoreMemes();
			}
		}

		loadMoreMemes(true); // Load first batch on page load
		window.addEventListener("scroll", handleScroll);
	});
</script>

<style>
    #gallery-divider {
        width: 80%;
        margin: 40px auto 20px;
        border: 0;
        height: 2px;
        background: linear-gradient(to right, #ccc, #333, #ccc);
    }

    #gallery-title {
        text-align: center;
        font-size: 2rem;
        font-weight: bold;
        margin: 20px 0;
        color: #333;
    }

    #meme-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        grid-auto-flow: dense;
        gap: 15px;
        padding: 0;
        margin: 0 auto;
        width: 100%;
        max-width: 1600px;
        box-sizing: border-box;
    }

    .meme-item {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        text-align: center;
        box-sizing: border-box;
    }

    .meme-item img {
        width: 100%;
        height: auto;
        display: block;
    }

    .meme-item p {
        padding: 10px;
        margin: 0;
        font-size: 1rem;
        font-weight: bold;
        background-color: #f7f7f7;
    }

    #loadingIndicator {
        text-align: center;
        padding: 20px;
        font-size: 1.2rem;
        color: #666;
        display: none;
    }
</style>