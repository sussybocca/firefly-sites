import fetch from "node-fetch";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: "Method not allowed" }) };
  }

  const { username, files } = JSON.parse(event.body);

  if (!username || !files) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: "Missing username or files" }) };
  }

  try {
    // Create a temporary GitHub repo content ZIP or use in-memory zip
    // For simplicity, we'll send content as a deploy to Netlify

    // Prepare a deploy request
    const deployResponse = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NETLIFY_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: username.toLowerCase(), // subdomain name
        custom_domain: `${username}.fire-usa.com`
      }),
    });

    const data = await deployResponse.json();

    if (data.error) {
      return { statusCode: 500, body: JSON.stringify({ success: false, error: data.error }) };
    }

    // Normally here you would trigger a deploy with the user's files
    // Netlify can deploy from a repo or ZIP — you can automate it with the API

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, url: `https://${username}.fire-usa.com` }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
}
