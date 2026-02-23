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
    const { put } = await import("@vercel/blob");
    const { url } = await put(`exams/${filename}`, content, {
      access: "public",
      contentType: "text/html",
    });

    const id = filename.replace(".html", "");
    const previewUrl = `https://toefl-generator.vercel.app/api/serve-exam?id=${id}`;
    return res.status(200).json({ previewUrl });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
