// netlify/functions/publish.js
export async function handler(event, context) {
  const username = event.queryStringParameters?.username;

  if (!username) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: "Missing username" })
    };
  }

  if (event.httpMethod === "GET") {
    // Return demo project or saved project for this username
    const demoProject = {
      "index.html": { type: "file", content: "<!DOCTYPE html><html><body><h1>Hello Firefly!</h1></body></html>" }
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, files: demoProject })
    };
  }

  if (event.httpMethod === "POST") {
    try {
      const files = JSON.parse(event.body); // project files from frontend
      console.log(`Publishing project for ${username}:`, files);

      // TODO: Save files to storage or GitHub if desired
      // For now, simulate the published URL
      const url = `https://${username}.fire-usa.com`;

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, url })
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: err.message })
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ success: false, error: "Method not allowed" })
  };
}
