export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username } = req.query;
    const files = req.body;

    if (!username || !files) return res.status(400).json({ success: false, error: "Missing username or files" });

    try {
      // Normally here you would save files to storage or GitHub
      // For demo, just simulate URL
      const url = `https://${username}.fire-usa.com`;
      console.log(`Publishing ${username}'s site`, files);
      return res.status(200).json({ success: true, url });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  } else {
    res.status(405).json({ success: false, error: "Method not allowed" });
  }
}
