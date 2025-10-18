export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // Handle publishing POST request
      if (request.method === "POST" && url.pathname === "/publish") {
        const { username, files } = await request.json();
        if (!username || !files) {
          return new Response(JSON.stringify({ success: false, error: "Missing username or files" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        const bucket = env.R2_BUCKET; // Bind your R2 bucket in the Worker

        // Upload all files to user's folder
        for (const [filename, content] of Object.entries(files)) {
          await bucket.put(`${username}/${filename}`, content, {
            httpMetadata: { contentType: getContentType(filename) }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          url: `https://fire-usa.com/${username}/index.html`
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      // Serve user files from R2
      const pathname = url.pathname.slice(1); // Remove leading '/'
      if (!pathname) return new Response("Missing file path", { status: 404 });

      const bucket = env.R2_BUCKET;
      const object = await bucket.get(pathname);
      if (!object) return new Response("File not found", { status: 404 });

      return new Response(object.body, {
        headers: { "Content-Type": object.httpMetadata.contentType || "application/octet-stream" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};

// Helper function to determine correct MIME type
function getContentType(filename) {
  if (filename.endsWith(".html")) return "text/html";
  if (filename.endsWith(".css")) return "text/css";
  if (filename.endsWith(".js")) return "application/javascript";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  if (filename.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}
