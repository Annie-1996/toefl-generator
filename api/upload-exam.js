// api/upload-exam.js
// Vercel Serverless Function
// 接收 HTML 內容 → 驗證 secret → 推檔案到 GitHub repo → 回傳 GitHub Pages 連結

const GITHUB_OWNER = "Annie-1996";
const GITHUB_REPO  = "toefl-generator";
const EXAMS_PATH   = "exams"; // 考卷存放資料夾

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-app-secret");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secret = req.headers["x-app-secret"];
  if (!secret || secret !== process.env.APP_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { filename, content } = req.body;
  if (!filename || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const base64Content = Buffer.from(content).toString("base64");
    const filePath = `${EXAMS_PATH}/${filename}`;
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        message: `Add exam: ${filename}`,
        content: base64Content,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.message || "GitHub API error" });
    }

    const previewUrl = `https://${GITHUB_OWNER}.github.io/${GITHUB_REPO}/${filePath}`;
    return res.status(200).json({ previewUrl });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
