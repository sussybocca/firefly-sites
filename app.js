document.addEventListener("DOMContentLoaded", () => {
  let editor;
  let currentFile = "index.html";

  let fileSystem = {
    "index.html": { type: "file", content: "<!DOCTYPE html><html><body><h1>Hello Firefly!</h1></body></html>" }
  };

  // Load Monaco Editor
  require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.41.0/min/vs' } });
  require(['vs/editor/editor.main'], () => {
    editor = monaco.editor.create(document.getElementById('editor'), {
      value: fileSystem[currentFile].content,
      language: 'html',
      theme: 'vs-dark'
    });

    editor.onDidChangeModelContent(() => {
      fileSystem[currentFile].content = editor.getValue();
      updatePreview(currentFile);
    });

    renderFileTree();
    openFile(currentFile);
  });

  // Render file tree
  function renderFileTree() {
    const tree = document.getElementById('file-tree');
    tree.innerHTML = '';
    for (let name in fileSystem) {
      const li = document.createElement('li');
      li.textContent = name + (fileSystem[name].type === 'folder' ? '/' : '');
      li.onclick = () => openFile(name);
      tree.appendChild(li);
    }
  }

  // Open a file
  function openFile(name) {
    currentFile = name;
    if (fileSystem[name].type === 'file') {
      editor.setValue(fileSystem[name].content);
    }
  }

  // New file
  document.getElementById('new-file').onclick = () => {
    const name = prompt("Enter new file name:");
    if (!name) return;
    fileSystem[name] = { type: "file", content: "" };
    renderFileTree();
    openFile(name);
  };

  // New folder
  document.getElementById('new-folder').onclick = () => {
    const name = prompt("Enter new folder name:");
    if (!name) return;
    fileSystem[name] = { type: "folder", children: {} };
    renderFileTree();
  };

  // Rename
  document.getElementById('rename').onclick = () => {
    if (!currentFile) return alert("Select a file first");
    const newName = prompt("Enter new name:", currentFile);
    if (!newName) return;
    fileSystem[newName] = fileSystem[currentFile];
    delete fileSystem[currentFile];
    currentFile = newName;
    renderFileTree();
  };

  // Delete
  document.getElementById('delete').onclick = () => {
    if (!currentFile) return alert("Select a file first");
    if (confirm(`Delete ${currentFile}?`)) {
      delete fileSystem[currentFile];
      currentFile = null;
      renderFileTree();
      editor.setValue("");
    }
  };

  // Publish
  document.getElementById('publish').onclick = async () => {
    const username = prompt("Enter your username:");
    if (!username) return alert("Username required.");

    try {
      const res = await fetch(`/api/publish?username=${username}`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fileSystem)
      });

      const data = await res.json();
      if (data.success) alert(`✅ Published! Your site: ${data.url}`);
      else alert(`❌ Publish failed: ${data.error || 'Unknown error'}`);
    } catch (err) {
      alert(`❌ Network error: ${err.message}`);
    }
  };

  // Optional: live preview function
  function updatePreview(name) {
    // You can implement an iframe preview if desired
    // e.g., document.getElementById('preview').srcdoc = fileSystem[name].content;
  }
});
