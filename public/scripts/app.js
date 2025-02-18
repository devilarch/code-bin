// Initialize paste viewer when page loads or hash changes
function initializeRouting() {
    const path = window.location.hash.substr(1);

    // Clear any existing notifications
    document.getElementById('notification').style.display = 'none';

    if (path.startsWith('/paste/')) {
        const pasteId = path.split('/')[2];
        loadPaste(pasteId);
    } else {
        // Show editor by default
        document.querySelector('.editor-container').style.display = 'block';
        document.getElementById('paste-viewer').style.display = 'none';
        document.getElementById('result').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', initializeRouting);
window.addEventListener('hashchange', initializeRouting);

async function createPaste() {
    const content = document.getElementById('code-editor').value;
    const expiration = document.getElementById('expiration').value;

    if (!content) {
        showNotification('Please enter some content!');
        return;
    }

    try {
        const response = await fetch('http://localhost:4000/api/pastes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, expiration })
        });

        if (!response.ok) throw new Error('Failed to create paste');

        const data = await response.json();
        // Navigate directly to the paste URL
        window.location.hash = `#/paste/${data.slug}`;
    } catch (error) {
        showNotification(error.message || 'Failed to create paste');
    }
}

async function loadPaste(pasteId) {
    try {
        const response = await fetch(`http://localhost:4000/api/pastes/${pasteId}`);
        if (!response.ok) throw new Error('Paste not found or expired');

        const data = await response.json();

        // Hide editor and result
        document.querySelector('.editor-container').style.display = 'none';
        document.getElementById('result').style.display = 'none';

        // Show viewer and content
        const viewer = document.getElementById('paste-viewer');
        viewer.style.display = 'block';
        document.getElementById('paste-content').textContent = data.content;

        // Update page title
        document.title = `CodeBin - ${pasteId}`;
    } catch (error) {
        showNotification(error.message);
        setTimeout(() => window.location = '/index.html', 2000);
    }
}

// Remove the showResult function and update createPaste
// The remaining functions stay the same
