export default {
  async fetch(request, env) {
    try {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }

      const { username, files } = await request.json();
      if (!username || !files) {
        return new Response("Missing username or files", { status: 400 });
      }

      const bucket = env.R2_BUCKET; // R2 bucket binding

      // Upload all files to the user's folder
      for (const [filename, content] of Object.entries(files)) {
        await bucket.put(`${username}/${filename}`, content, {
          httpMetadata: { contentType: getContentType(filename) },
        });
      }

      const url = `https://fire-usa.com/${username}/index.html`;
      return new Response(JSON.stringify({ success: true, url }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

// Helper for content type
function getContentType(filename) {
  if (filename.endsWith(".html")) return "text/html";
  if (filename.endsWith(".css")) return "text/css";
  if (filename.endsWith(".js")) return "application/javascript";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}
