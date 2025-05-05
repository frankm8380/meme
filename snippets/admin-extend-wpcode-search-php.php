//<?php
//
function my_wpcode_search_extension_enqueue($hook) {
	if (strpos($hook, 'wpcode') === false) return;
	wp_enqueue_script('jquery');

	$custom_js = <<<'JS'
jQuery(document).ready(function($) {
	let folderHandle = null;
	let mappingData = {};

	function loadMappingFromStorage() {
		const savedMapping = localStorage.getItem('wpcodeMappingData');
		if (savedMapping) {
			mappingData = JSON.parse(savedMapping);
			console.log("[WPCode Search]: Mapping data loaded from localStorage.");
			populateMappingDropdown();
		}
	}

	function saveMappingToStorage() {
		localStorage.setItem('wpcodeMappingData', JSON.stringify(mappingData));
		console.log("[WPCode Mapping]: Mapping data saved to localStorage.");
	}

	function populateMappingDropdown() {
		let $dropdown = $('#mapping-dropdown');
		$dropdown.empty();
		$dropdown.append('<option value="">Select a Code Snippet to load</option>');
		Object.entries(mappingData)
			.sort(([a], [b]) => a.localeCompare(b))
			.forEach(([filename, id]) => {
				$dropdown.append('<option value="' + id + '">' + filename + '</option>');
			});
	}

	async function importMappingFile() {
		try {
			mappingData = {};
			const [fileHandle] = await window.showOpenFilePicker();
			const file = await fileHandle.getFile();
			const content = await file.text();
			const jsonData = JSON.parse(content);
			jsonData.forEach(snippet => {
				if (snippet.title && snippet.id && snippet.code_type) {
					let ext = snippet.code_type.toLowerCase();
					mappingData[`${snippet.title}.${ext}`] = snippet.id;
				}
			});
			saveMappingToStorage();
			populateMappingDropdown();
			wpcodeShowMessage('Mapping data imported successfully.');
		} catch (error) {
			console.error('[WPCode Mapping]: Error importing file:', error);
			wpcodeShowMessage('Failed to import mapping.');
		}
	}

	function showMappings() {
		if (Object.keys(mappingData).length === 0) {
			wpcodeShowMessage('No mapping data loaded.');
			return;
		}
		let sorted = Object.entries(mappingData).sort(([a], [b]) => a.localeCompare(b));
		let info = 'Current Snippet Mappings:\n\n';
		for (let [file, id] of sorted) {
			info += `${file} -> Snippet ID: ${id}\n`;
		}
		alert(info);
	}

	async function selectSearchFolder() {
		try {
			folderHandle = await window.showDirectoryPicker();
			wpcodeShowMessage('Output folder selected.');
		} catch (error) {
			console.error('[WPCode Search]: Error selecting folder:', error);
			wpcodeShowMessage('Failed to set folder.');
		}
	}

	function clearSearchResults() {
		$('#wpcode-search-results').empty().hide();
		$('#clear-results').hide();
	}

	async function saveAllSnippets() {
		try {
			folderHandle = await window.showDirectoryPicker();
			wpcodeShowMessage('Output folder selected.');
		} catch (error) {
			wpcodeShowMessage('Save canceled. No folder selected.');
			return;
		}

		const entries = Object.entries(mappingData);
		if (entries.length === 0) {
			wpcodeShowMessage('No mappings available to export.');
			return;
		}

		wpcodeShowMessage(`Exporting ${entries.length} snippets...`);
		let failed = [];

		for (const [filename, snippetId] of entries) {
			try {
				const safeFilename = filename.replace(/[<>:"/\\\\|?*]+/g, '_');

				const permission = await folderHandle.requestPermission({ mode: 'readwrite' });
				if (permission !== 'granted') throw new Error('Write permission denied');

				const formData = new FormData();
				formData.append('action', 'wpcode_get_snippet');
				formData.append('id', snippetId);

				const response = await fetch(ajaxurl, {
					method: 'POST',
					body: formData,
					credentials: 'same-origin'
				});

				if (!response.ok) throw new Error(`HTTP ${response.status}`);

				const data = await response.json();
				console.log('Fetched:', filename, data);
				if (!data || !data.code) throw new Error('Snippet returned no code');

				const fileHandle = await folderHandle.getFileHandle(safeFilename, { create: true });
				const writable = await fileHandle.createWritable();
				await writable.write(data.code);
				await writable.close();

				console.log(`[Save All]: ✅ Saved ${safeFilename}`);
			} catch (err) {
				console.error(`[Save All]: ❌ Failed to save ${filename}:`, err);
				failed.push(`${filename} (ID ${snippetId})`);
			}
		}

		if (failed.length > 0) {
			alert('Some snippets failed to save:\n\n' + failed.join('\n'));
		} else {
			wpcodeShowMessage('✅ All snippets saved.');
		}
	}

	async function searchSnippetsInFolder() {
		if (!folderHandle) {
			try {
				folderHandle = await window.showDirectoryPicker();
				wpcodeShowMessage('Search folder selected successfully.');
			} catch (error) {
				wpcodeShowMessage('Search canceled. No folder selected.');
				return;
			}
		}

		let searchAll = $('#all-files-checkbox').is(':checked');
		let matchCase = $('#match-case-checkbox').is(':checked');
		let searchTerm = prompt('Enter search term:');
		if (!searchTerm || searchTerm.trim() === '') {
			wpcodeShowMessage('No search term entered.');
			return;
		}

		let results = [];
		for await (const entry of folderHandle.values()) {
			if (entry.kind === 'file') {
				if (!searchAll && !(entry.name in mappingData)) continue;

				const file = await entry.getFile();
				const content = await file.text();
				const lines = content.split('\n');

				lines.forEach((line, i) => {
					const targetLine = matchCase ? line : line.toLowerCase();
					const term = matchCase ? searchTerm : searchTerm.toLowerCase();
					let col = targetLine.indexOf(term);
					while (col !== -1) {
						results.push({
							name: entry.name,
							line: i + 1,
							column: col + 1,
							context: line.substring(Math.max(0, col - 30), Math.min(line.length, col + term.length + 30))
						});
						col = targetLine.indexOf(term, col + term.length);
					}
				});
			}
		}

		const container = $('#wpcode-search-results').empty().show();
		if (results.length === 0) {
			wpcodeShowMessage('No matching snippets found.');
			return;
		}

		let html = '<h3>Search Results</h3><ul>';
		for (let result of results) {
			let id = mappingData[result.name];
			if (id) {
				let url = `${window.location.origin}/wp-admin/admin.php?page=wpcode-snippet-manager&snippet_id=${id}`;
				html += `<li><a href="${url}" target="_blank">${result.name} (Line ${result.line}, Column ${result.column})</a><br><small>...${result.context}...</small></li>`;
			}
		}
		html += '</ul>';
		container.html(html);
		$('#clear-results').show();
	}

	// Insert UI and hook listeners
	const searchSection = `
	<div id="wpcode-search-section" style="margin-bottom: 20px;">
		<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 10px;">
			<button id="search-folder" class="button">Search Snippets</button>
			<button id="select-folder" class="button">Set Search Folder</button>
			<button id="clear-results" class="button" style="display: none;">Clear Search Results</button>
			<label style="display: flex; align-items: center; gap: 5px;"><input type="checkbox" id="all-files-checkbox"> All Files</label>
			<label style="display: flex; align-items: center; gap: 5px;"><input type="checkbox" id="match-case-checkbox"> Match Case</label>
			<select id="mapping-dropdown" class="button"><option value="">Select a snippet</option></select>
			<button id="show-mappings" class="button">Show Mappings</button>
			<button id="import-mapping" class="button">Import Mapping</button>
			<button id="save-all-snippets" class="button">Save All</button>
			<button id="open-all-snippets" class="button">Open All</button>
		</div>
		<div id="wpcode-search-results" style="display: none; background: #f1f1f1; padding: 15px; border: 1px solid #ccc; border-radius: 5px; max-height: 300px; overflow-y: auto;"></div>
	</div>`;
	$('.wpcode-code-textarea').prepend(searchSection);

	wpcodePreventAutoSave('#search-folder');
	wpcodePreventAutoSave('#select-folder');
	wpcodePreventAutoSave('#clear-results');
	wpcodePreventAutoSave('#import-mapping');
	wpcodePreventAutoSave('#show-mappings');
	wpcodePreventAutoSave('#save-all-snippets');
	wpcodePreventAutoSave('#open-all-snippets');

	$('#mapping-dropdown').on('change', function() {
		var id = $(this).val();
		if (id) {
			window.open(`${window.location.origin}/wp-admin/admin.php?page=wpcode-snippet-manager&snippet_id=${id}`, '_blank');
			$(this).val('');
		}
	});

	$('#search-folder').on('click', searchSnippetsInFolder);
	$('#select-folder').on('click', selectSearchFolder);
	$('#clear-results').on('click', clearSearchResults);
	$('#import-mapping').on('click', importMappingFile);
	$('#show-mappings').on('click', showMappings);
	$('#save-all-snippets').on('click', saveAllSnippets);

	// ✅ NEW: Open all snippets in tabs
	$('#open-all-snippets').on('click', function() {
		if (Object.keys(mappingData).length === 0) {
			wpcodeShowMessage('No mappings loaded.');
			return;
		}
		let opened = 0;
		Object.entries(mappingData).sort(([a], [b]) => a.localeCompare(b)).forEach(([filename, id]) => {
			if (id) {
				const url = `${window.location.origin}/wp-admin/admin.php?page=wpcode-snippet-manager&snippet_id=${id}`;
				window.open(url, '_blank');
				opened++;
			}
		});
		wpcodeShowMessage(`Opened ${opened} snippets in new tabs.`);
	});

	loadMappingFromStorage();
});
JS;

	wp_add_inline_script('jquery', $custom_js);
}
add_action('admin_enqueue_scripts', 'my_wpcode_search_extension_enqueue');
