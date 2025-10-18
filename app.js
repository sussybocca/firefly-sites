let files = { "index.html": "<!DOCTYPE html><html><body><h1>Hello Firefly!</h1></body></html>" };
let currentFile = "index.html";

// Initialize Monaco Editor
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.41.0/min/vs' }});
require(['vs/editor/editor.main'], function () {
    window.editor = monaco.editor.create(document.getElementById('editor'), {
        value: files[currentFile],
        language: 'html',
        theme: 'vs-light'
    });

    // Update files object on change
    editor.onDidChangeModelContent(() => {
        files[currentFile] = editor.getValue();
        updatePreview();
    });

    updatePreview();
});

function updatePreview() {
    const preview = document.getElementById('preview');
    const blob = new Blob([files["index.html"]], { type: 'text/html' });
    preview.src = URL.createObjectURL(blob);
}

// Publish Button
document.getElementById('publishBtn').onclick = async () => {
    const username = prompt("Enter your Firefly username:");
    if (!username) return alert("Username required.");

    const res = await fetch("/.netlify/functions/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, files })
    });

    const data = await res.json();
    if (data.success) {
        alert(`✅ Site published! View it at: ${data.url}`);
    } else {
        alert("❌ Failed to publish site.");
    }
};
