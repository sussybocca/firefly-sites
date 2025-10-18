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

    const netlifyToken = process.env.NETLIFY_TOKEN; // Your Netlify access token
    const teamId = process.env.NETLIFY_TEAM_ID; // optional — your team/org ID
    const domain = "fire-usa.com"; // your custom domain root

    // 1️⃣ Create a new site
    const siteRes = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${netlifyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `${username}-fire-usa`,
        custom_domain: `${username}.${domain}`,
        account_slug: teamId,
      }),
    });

    const siteData = await siteRes.json();
    if (!siteRes.ok) {
      throw new Error(`Failed to create site: ${siteData.message || JSON.stringify(siteData)}`);
    }

    // 2️⃣ Prepare the file structure
    const filesToUpload = {};
    for (const [filename, content] of Object.entries(files)) {
      filesToUpload[filename] = Buffer.from(content).toString("base64");
    }

    // 3️⃣ Create a deploy
    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteData.site_id}/deploys`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${netlifyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: filesToUpload,
        draft: false,
      }),
    });

    const deployData = await deployRes.json();
    if (!deployRes.ok) {
      throw new Error(`Failed to deploy site: ${deployData.message || JSON.stringify(deployData)}`);
    }

    // ✅ Return live URL
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        url: `https://${username}.${domain}/index.html`,
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
}
