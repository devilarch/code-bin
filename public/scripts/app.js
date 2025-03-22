// DOM Elements
const codeEditor = document.getElementById('code-editor');
const languageSelect = document.getElementById('language');
const expirationSelect = document.getElementById('expiration');
const resultContainer = document.getElementById('result');
const pasteUrl = document.getElementById('paste-url');
const pasteViewer = document.getElementById('paste-viewer');
const pasteContent = document.getElementById('paste-content');
const viewerLanguage = document.getElementById('viewer-language');
const viewerExpiry = document.getElementById('viewer-expiry');
const notification = document.getElementById('notification');
const searchBar = document.getElementById('search-bar');
const searchInput = document.getElementById('search-input');
const replaceInput = document.getElementById('replace-input');
const shortcutsModal = document.getElementById('shortcuts-modal');

// Stats update
function updateStats() {
    const content = codeEditor.value;
    const chars = content.length;
    const words = content.trim().split(/\s+/).length;
    const lines = content.split('\n').length;
    
    document.getElementById('stats').textContent = 
        `${chars} characters | ${words} words | ${lines} lines`;
}

// Line numbers functionality
function updateLineNumbers(element) {
    const content = element.value || element.textContent;
    const lines = content.split('\n');
    const lineNumbers = Array.from({ length: lines.length }, (_, i) => i + 1).join('\n');
    
    // Update line numbers container
    const lineNumbersContainer = document.querySelector('.line-numbers');
    if (lineNumbersContainer) {
        lineNumbersContainer.textContent = lineNumbers;
    }
}

// Get base API URL based on environment
const getApiBaseUrl = () => {
    // In production, use the actual domain
    // In development, use localhost
    return process.env.NODE_ENV === 'production' 
        ? `${window.location.origin}/api`
        : 'http://localhost:4000/api';
};

// Create paste
async function createPaste() {
    const content = codeEditor.value.trim();
    if (!content) {
        showNotification('Please enter some content', 'error');
        return;
    }

    try {
        const response = await fetch(`${getApiBaseUrl()}/pastes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
                language: languageSelect.value,
                expiresIn: expirationSelect.value
            })
        });

        if (!response.ok) throw new Error('Failed to create paste');

        const data = await response.json();
        if (!data.slug) throw new Error('No paste ID received');
        
        const pasteId = data.slug;
        const fullUrl = `${window.location.origin}/#/paste/${pasteId}`;
        
        // Update URL display and show result container
        pasteUrl.value = fullUrl;
        resultContainer.style.display = 'block';
        
        // Show success notification
        showNotification('Paste created successfully!', 'success');
        
        // Add copy URL button functionality
        const urlCopyButton = resultContainer.querySelector('.btn-primary');
        if (urlCopyButton) {
            urlCopyButton.onclick = async () => {
                try {
                    await navigator.clipboard.writeText(fullUrl);
                    showNotification('URL copied to clipboard!', 'success');
                } catch (err) {
                    showNotification('Failed to copy URL', 'error');
                }
            };
        }
    } catch (error) {
        showNotification('Failed to create paste: ' + error.message, 'error');
        console.error('Error:', error);
    }
}

// Copy to clipboard
async function copyToClipboard() {
    const content = pasteContent.textContent;
    try {
        await navigator.clipboard.writeText(content);
        showNotification('Content copied to clipboard!', 'success');
    } catch (err) {
        showNotification('Failed to copy content', 'error');
        console.error('Failed to copy:', err);
    }
}

// Load paste
async function loadPaste(pasteId) {
    try {
        const response = await fetch(`${getApiBaseUrl()}/pastes/${pasteId}`);
        if (!response.ok) throw new Error('Paste not found or expired');

        const data = await response.json();
        
        // Update viewer
        pasteContent.textContent = data.content;
        if (data.language) {
            pasteContent.className = `language-${data.language}`;
            viewerLanguage.textContent = data.language;
            Prism.highlightElement(pasteContent);
        }
        
        // Update expiry info
        viewerExpiry.textContent = data.expiresAt ? 
            `Expires: ${new Date(data.expiresAt).toLocaleString()}` : 
            'Never expires';
        
        // Hide editor and show viewer
        document.querySelector('.editor-container').style.display = 'none';
        pasteViewer.style.display = 'block';
        resultContainer.style.display = 'none';
        
        // Update line numbers
        updateLineNumbers(pasteContent);
        
        // Update page title
        document.title = `CodeBin - ${pasteId}`;
    } catch (error) {
        showNotification(error.message, 'error');
        console.error('Error:', error);
        // Redirect to home page after error
        setTimeout(() => {
            window.location.href = '/';
        }, 3000);
    }
}

// Show notification
function showNotification(message, type = 'error') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    notification.style.background = type === 'success' ? '#10b981' : '#ef4444';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Event Listeners
if (codeEditor) {
    codeEditor.addEventListener('input', () => {
        updateLineNumbers(codeEditor);
        updateStats();
    });

    // Initial update
    updateLineNumbers(codeEditor);
    updateStats();
}

// Initialize routing
function initializeRouting() {
    const hash = window.location.hash;
    
    // Clear any existing notifications
    if (notification) {
        notification.style.display = 'none';
    }

    if (hash.startsWith('#/paste/')) {
        const pasteId = hash.split('/')[2];
        if (pasteId) {
            loadPaste(pasteId);
        } else {
            showNotification('Invalid paste ID', 'error');
        }
    } else {
        // Show editor by default
        if (document.querySelector('.editor-container')) {
            document.querySelector('.editor-container').style.display = 'block';
        }
        if (pasteViewer) {
            pasteViewer.style.display = 'none';
        }
        if (resultContainer) {
            resultContainer.style.display = 'none';
        }
    }
}

// Theme handling
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    showNotification(`Switched to ${newTheme} theme`, 'success');
}

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    // Ctrl/Cmd + S: Save paste
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        createPaste();
    }
    // Ctrl/Cmd + D: Toggle dark mode
    else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
    }
    // Ctrl/Cmd + L: Clear editor
    else if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        clearEditor();
    }
    // Ctrl/Cmd + K: Show keyboard shortcuts
    else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleShortcutsModal();
    }
});

// Clear editor
function clearEditor() {
    if (codeEditor) {
        codeEditor.value = '';
        updateLineNumbers(codeEditor);
        updateStats();
        showNotification('Editor cleared', 'success');
    }
}

// Shortcuts modal
function toggleShortcutsModal() {
    if (shortcutsModal) {
        const isVisible = shortcutsModal.style.display === 'block';
        shortcutsModal.style.display = isVisible ? 'none' : 'block';
    }
}

// Close shortcuts modal when clicking outside
window.addEventListener('click', (e) => {
    if (shortcutsModal && e.target === shortcutsModal) {
        shortcutsModal.style.display = 'none';
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeRouting();
    initializeTheme();
    
    // Add event listeners for buttons
    const createButton = document.getElementById('create-paste');
    const themeButton = document.getElementById('toggle-theme');
    const clearButton = document.getElementById('clear-editor');
    const shortcutsButton = document.getElementById('show-shortcuts');
    
    if (createButton) {
        createButton.addEventListener('click', createPaste);
    }
    if (themeButton) {
        themeButton.addEventListener('click', toggleTheme);
    }
    if (clearButton) {
        clearButton.addEventListener('click', clearEditor);
    }
    if (shortcutsButton) {
        shortcutsButton.addEventListener('click', toggleShortcutsModal);
    }
});

window.addEventListener('hashchange', initializeRouting);
