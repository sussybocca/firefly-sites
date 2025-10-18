let editor;
let currentFile = "index.html";

// In-memory file system
let fileSystem = {
  "index.html": {
    type: "file",
    content: "<!DOCTYPE html><html><body><h1>Hello Firefly!</h1></body></html>"
  }
};

// Initialize Monaco Editor
require.config({
  paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.41.0/min/vs' }
});
require(['vs/editor/editor.main'], function () {
  editor = monaco.editor.create(document.getElementById('editor'), {
    value: fileSystem[currentFile].content,
    language: 'html',
    theme: 'vs-dark'
  });

  editor.onDidChangeModelContent(() => {
    if (fileSystem[currentFile].type === "file") {
      fileSystem[currentFile].content = editor.getValue();
      updatePreview(currentFile);
    }
  });

  renderFileTree();
  openFile(currentFile);
});

// Render file/folder tree
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

// Open file in editor
function openFile(name) {
  currentFile = name;
  if (fileSystem[name].type === 'file') {
    editor.setValue(fileSystem[name].content);
    updatePreview(name);
  }
}

// File actions
document.getElementById('new-file').onclick = () => {
  const name = prompt("Enter new file name:");
  if (!name) return;
  fileSystem[name] = { type: "file", content: "" };
  renderFileTree();
  openFile(name);
};

document.getElementById('new-folder').onclick = () => {
  const name = prompt("Enter new folder name:");
  if (!name) return;
  fileSystem[name] = { type: "folder", children: {} };
  renderFileTree();
};

document.getElementById('rename').onclick = () => {
  if (!currentFile) return alert("Select a file first");
  const newName = prompt("Enter new name:", currentFile);
  if (!newName) return;
  fileSystem[newName] = fileSystem[currentFile];
  delete fileSystem[currentFile];
  currentFile = newName;
  renderFileTree();
};

document.getElementById('delete').onclick = () => {
  if (!currentFile) return alert("Select a file first");
  if (confirm(`Delete ${currentFile}?`)) {
    delete fileSystem[currentFile];
    currentFile = null;
    renderFileTree();
    editor.setValue("");
  }
};

// Live preview
function updatePreview(fileName) {
  const preview = document.getElementById('preview');
  if (!fileSystem[fileName] || fileSystem[fileName].type !== "file") return;
  const blob = new Blob([fileSystem[fileName].content], { type: 'text/html' });
  preview.src = URL.createObjectURL(blob);
}

// ✅ Netlify Publish Integration
document.getElementById('publish').onclick = async () => {
  const username = prompt("Enter your Firefly username:");
  if (!username) return alert("Username required.");

  const filesToPublish = {};
  for (let key in fileSystem) {
    if (fileSystem[key].type === "file") {
      filesToPublish[key] = fileSystem[key].content;
    }
  }

  try {
    const res = await fetch("/.netlify/functions/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, files: filesToPublish })
    });

    const data = await res.json();

    if (data.success) {
      alert(`✅ Site published successfully!\n\nVisit it at:\n${data.url}`);
      window.open(data.url, "_blank");
    } else {
      alert(`❌ Failed to publish site: ${data.error || "Unknown error"}`);
    }
  } catch (e) {
    alert(`❌ Publish request failed: ${e.message}`);
  }
};
