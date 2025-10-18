import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { username, files } = JSON.parse(event.body);

    if (!username || !files) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing username or files" }) };
    }

    const repo = process.env.GITHUB_REPO;       // e.g., "your-org/firefly-sites"
    const token = process.env.GITHUB_TOKEN;     // GitHub Personal Access Token

    const branch = "main";

    // Step 1: Get latest commit SHA
    const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, {
      headers: { Authorization: `token ${token}` },
    });
    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    // Step 2: Build a tree with the user files
    const treeItems = Object.entries(files).map(([filename, content]) => ({
      path: `${username}/${filename}`,
      mode: "100644",
      type: "blob",
      content,
    }));

    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
      method: "POST",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ base_tree: baseSha, tree: treeItems }),
    });

    const treeData = await treeRes.json();

    // Step 3: Create a commit
    const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
      method: "POST",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Publish site for ${username}`,
        tree: treeData.sha,
        parents: [baseSha],
      }),
    });

    const commitData = await commitRes.json();

    // Step 4: Update the branch
    await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      method: "PATCH",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sha: commitData.sha }),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        url: `https://fire-usa.com/${username}/index.html`,
      }),
    };

  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
  }
}
