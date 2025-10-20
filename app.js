let editor;
let currentFile = "index.html";

let fileSystem = {
  "index.html": {
    type: "file",
    content: "<!DOCTYPE html><html><body><h1>Hello Firefly!</h1></body></html>"
  }
};

// Initialize Monaco Editor
require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.41.0/min/vs' } });
require(['vs/editor/editor.main'], () => {
  editor = monaco.editor.create(document.getElementById('editor'), {
    value: fileSystem[currentFile].content,
    language: 'html',
    theme: 'vs-dark',
    automaticLayout: true
  });

  editor.onDidChangeModelContent(() => {
    fileSystem[currentFile].content = editor.getValue();
  });

  renderFileTree();
  openFile(currentFile);
});

// Render file tree in the sidebar
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

// Open a file in the editor
function openFile(name) {
  currentFile = name;
  if (fileSystem[name].type === 'file') editor.setValue(fileSystem[name].content);
}

// Button actions
document.getElementById('new-file').onclick = () => {
  const name = prompt("Enter new file name:");
  if (!name) return;
  if (fileSystem[name]) return alert("File already exists!");
  fileSystem[name] = { type: "file", content: "" };
  renderFileTree();
  openFile(name);
};

document.getElementById('new-folder').onclick = () => {
  const name = prompt("Enter new folder name:");
  if (!name) return;
  if (fileSystem[name]) return alert("Folder already exists!");
  fileSystem[name] = { type: "folder", children: {} };
  renderFileTree();
};

document.getElementById('rename').onclick = () => {
  if (!currentFile) return alert("Select a file first");
  const newName = prompt("Enter new name:", currentFile);
  if (!newName) return;
  if (fileSystem[newName]) return alert("Name already exists!");
  fileSystem[newName] = fileSystem[currentFile];
  delete fileSystem[currentFile];
  currentFile = newName;
  renderFileTree();
};

document.getElementById('delete').onclick = () => {
  if (!currentFile) return alert("Select a file first");
  if (confirm(`Delete ${currentFile}?`)) {
    delete fileSystem[currentFile];
    currentFile = Object.keys(fileSystem)[0] || null;
    renderFileTree();
    if (currentFile) editor.setValue(fileSystem[currentFile].content);
    else editor.setValue("");
  }
};

// Publish button
document.getElementById('publish').onclick = async () => {
  const username = prompt("Enter your username for subdomain:");
  if (!username) return alert("Username required.");

  try {
    const response = await fetch("/.netlify/functions/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, files: fileSystem })
    });

    const data = await response.json();
    if (data.success) alert(`✅ Published! Your site: ${data.url}`);
    else alert(`❌ Publish failed: ${data.error || "Unknown error"}`);
  } catch (err) {
    alert(`❌ Publish failed: ${err.message}`);
  }
};
