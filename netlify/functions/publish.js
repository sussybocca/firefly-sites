import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { username, files } = JSON.parse(event.body);
    if (!username || !files) {
      return { statusCode: 400, body: "Missing username or files" };
    }

    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    // Encode content to Base64 for GitHub API
    const commits = [];
    for (const [filename, content] of Object.entries(files)) {
      commits.push({
        path: `${username}/${filename}`,
        message: `Update ${filename} for ${username}`,
        content: Buffer.from(content).toString("base64"),
      });
    }

    // Get the latest commit SHA
    const branch = "main";
    const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/${branch}`, {
      headers: { Authorization: `token ${token}` },
    });
    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    // Create a new tree with the user files
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

    // Create a commit
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

    // Update the branch ref
    await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
      method: "PATCH",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
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
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
