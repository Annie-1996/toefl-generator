export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing exam id");

  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: `exams/${id}` });
    
    if (!blobs || blobs.length === 0) {
      return res.status(404).send("Exam not found");
    }

    const blobUrl = blobs[0].url;
    const response = await fetch(blobUrl);
    const html = await response.text();

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (e) {
    return res.status(500).send("Error: " + e.message);
  }
}
