// ─── api.js ───────────────────────────────────────────────────────
// 所有對後端的呼叫都在這裡
// APP_SECRET 存在前端，用來驗證請求是來自你的網站

const APP_SECRET = process.env.REACT_APP_SECRET;

// 呼叫後端產生一道題目
export async function generateQuestion(systemPrompt, userPrompt, taskId) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 60000);

  let res;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-app-secret": APP_SECRET,
      },
      body: JSON.stringify({ systemPrompt, userPrompt }),
    });
  } catch (e) {
    clearTimeout(tid);
    throw new Error(e.name === "AbortError" ? "請求逾時，請重試" : "網路錯誤：" + e.message);
  }
  clearTimeout(tid);

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { ...data.question, taskId };
}

// 呼叫後端上傳 HTML 到 GitHub Gist
export async function uploadGist(filename, htmlContent) {
  const res = await fetch("/api/upload-exam", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-secret": APP_SECRET,
    },
    body: JSON.stringify({ filename, content: htmlContent }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data; // { previewUrl, gistUrl }
}
