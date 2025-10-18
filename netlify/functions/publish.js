import fetch from "node-fetch";

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method not allowed" };
    }

    const { username, files } = JSON.parse(event.body);
    if (!username || !files) {
      return { statusCode: 400, body: "Missing username or files" };
    }

    const repo = process.env.GITHUB_REPO; // e.g., "username/firefly-sites"
    const token = process.env.GITHUB_TOKEN; // GitHub Personal Access Token with repo permissions
    const branch = "main";

    // Prepare commits
    const commits = Object.entries(files).map(([filename, content]) => ({
      path: `users/${username}/${filename}`,
      message: `Update ${filename} for ${username}`,
      content: Buffer.from(content).toString("base64"),
    }));

    // Get latest commit SHA
    const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, {
      headers: { Authorization: `token ${token}` },
    });
    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    // Create tree
    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base_tree: baseSha,
        tree: commits.map(f => ({
          path: f.path,
          mode: "100644",
          type: "blob",
          content: Buffer.from(f.content, "base64").toString(),
        })),
      }),
    });
    const treeData = await treeRes.json();

    // Create commit
    const commitRes = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Publish site for ${username}`,
        tree: treeData.sha,
        parents: [baseSha],
      }),
    });
    const commitData = await commitRes.json();

    // Update branch ref
    await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      method: "PATCH",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sha: commitData.sha }),
    });

    // Return the Netlify subdomain URL
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        url: `https://${username}.fire-usa.com/index.html`,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
}
