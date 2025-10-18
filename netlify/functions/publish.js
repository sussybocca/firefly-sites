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

    const githubToken = process.env.GITHUB_TOKEN;
    const repoName = `${username}-site`; // stable repo name
    const branch = "main";
    const customDomain = `${username}.fire-usa.com`;

    // Add CNAME for custom domain
    files["CNAME"] = customDomain;

    // 1️⃣ Create the repo
    const createRepoRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: repoName,
        description: `Website for ${username}`,
        auto_init: true,
        private: false,
      }),
    });
    const repoData = await createRepoRes.json();
    if (!createRepoRes.ok) {
      throw new Error(`Failed to create GitHub repo: ${repoData.message}`);
    }

    // 2️⃣ Get latest commit SHA
    const refRes = await fetch(
      `https://api.github.com/repos/${repoData.full_name}/git/ref/heads/${branch}`,
      { headers: { Authorization: `token ${githubToken}` } }
    );
    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    // 3️⃣ Create tree with user files
    const treeRes = await fetch(
      `https://api.github.com/repos/${repoData.full_name}/git/trees`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base_tree: baseSha,
          tree: Object.entries(files).map(([filename, content]) => ({
            path: filename,
            mode: "100644",
            type: "blob",
            content: content,
          })),
        }),
      }
    );
    const treeData = await treeRes.json();

    // 4️⃣ Commit the tree
    const commitRes = await fetch(
      `https://api.github.com/repos/${repoData.full_name}/git/commits`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Initial commit for ${username}`,
          tree: treeData.sha,
          parents: [baseSha],
        }),
      }
    );
    const commitData = await commitRes.json();

    // 5️⃣ Update branch ref
    await fetch(`https://api.github.com/repos/${repoData.full_name}/git/refs/heads/${branch}`, {
      method: "PATCH",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sha: commitData.sha }),
    });

    // 6️⃣ Enable GitHub Pages
    await fetch(`https://api.github.com/repos/${repoData.full_name}/pages`, {
      method: "POST",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source: { branch: branch, path: "/" } }),
    });

    // ✅ Return the custom domain URL
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        url: `https://${customDomain}/`,
        repo: repoData.html_url,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
}
