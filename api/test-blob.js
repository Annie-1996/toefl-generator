import { put, list } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  try {
    // 存一個測試檔案
   const { put } = require("@vercel/blob");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  try {
    const { url } = await put("test/hello.html", "<h1>Hello from Blob!</h1>", {
      access: "public",
      contentType: "text/html",
    });
    
    return res.status(200).json({ success: true, url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
```

Commit 之後等 Vercel 部署完，直接在瀏覽器打開：
```
https://toefl-generator.vercel.app/api/test-blob
