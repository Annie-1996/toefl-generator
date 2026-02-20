// api/upload-gist.js
// Vercel Serverless Function
// 接收 HTML 內容 → 驗證 secret → 上傳到 GitHub Gist → 回傳可分享連結

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-app-secret");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // 驗證 secret token
  const secret = req.headers["x-app-secret"];
  if (!secret || secret !== process.env.APP_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { filename, content } = req.body;
  if (!filename || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const response = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        description: "TOEFL 2026 Practice Exam",
        public: false,
        files: { [filename]: { content } },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.message || "GitHub API error" });
    }

    const data = await response.json();
    const rawUrl = data.files[filename]?.raw_url;
    if (!rawUrl) return res.status(500).json({ error: "Could not get raw URL" });

    const previewUrl = `https://htmlpreview.github.io/?${rawUrl}`;
    return res.status(200).json({ previewUrl, gistUrl: data.html_url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
