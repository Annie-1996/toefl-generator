export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  try {
    const { put } = await import("@vercel/blob");
    
    const { url } = await put("test/hello.html", "<h1>Hello from Blob!</h1>", {
      access: "public",
      contentType: "text/html",
    });
    
    return res.status(200).json({ success: true, url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
