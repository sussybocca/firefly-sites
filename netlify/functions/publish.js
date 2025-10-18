import fetch from "node-fetch";
import FormData from "form-data";

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method not allowed" };
    }

    const { username, files } = JSON.parse(event.body);
    if (!username || !files) {
      return { statusCode: 400, body: "Missing username or files" };
    }

    const netlifyToken = process.env.NETLIFY_TOKEN; // Your personal Netlify access token
    const siteName = `fire-usa-${username}`; // Netlify site name (unique per user)
    const domain = "fire-usa.com"; // Your main domain

    // 1️⃣ Create a new site for the user
    const createSiteRes = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${netlifyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: siteName,
        custom_domain: `${username}.${domain}`, // Map subdomain
      }),
    });

    const siteData = await createSiteRes.json();
    if (!siteData.id) {
      throw new Error(`Failed to create Netlify site: ${siteData.message || "Unknown error"}`);
    }

    // 2️⃣ Prepare files for deploy
    const formData = new FormData();
    for (const [filename, content] of Object.entries(files)) {
      formData.append(filename, content);
    }

    // 3️⃣ Deploy the files
    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteData.id}/deploys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${netlifyToken}`,
      },
      body: formData,
    });

    const deployData = await deployRes.json();
    if (!deployData.id) {
      throw new Error(`Failed to deploy: ${deployData.message || "Unknown error"}`);
    }

    // 4️⃣ Return the URL with user subdomain
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
