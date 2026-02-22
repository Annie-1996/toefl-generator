// ─── config.js ────────────────────────────────────────────────────
export const SECTIONS = {
  reading: {
    label: "Reading", emoji: "📖", color: "#3D7A55", bg: "#EEF7F2",
    tasks: [
      { id: "complete_words",  label: "Complete the Words",    desc: "補全段落中缺失的單字字母" },
      { id: "read_daily_life", label: "Read in Daily Life",    desc: "閱讀 Email / Memo / 公告等短文" },
      { id: "academic_text",   label: "Read an Academic Text", desc: "閱讀學術短文（約200字）" },
    ],
  },
  listening: {
    label: "Listening", emoji: "🎧", color: "#4A4E9A", bg: "#EEEFF8",
    tasks: [
      { id: "choose_response",     label: "Listen and Choose a Response", desc: "聽一句話，選最適當回應" },
      { id: "listen_conversation", label: "Listen to a Conversation",     desc: "短對話（校園/日常），回答問題" },
      { id: "listen_announcement", label: "Listen to an Announcement",    desc: "校園公告，回答問題" },
      { id: "academic_talk",       label: "Listen to an Academic Talk",   desc: "學術短講（100-250字），回答問題" },
    ],
  },
  writing: {
    label: "Writing", emoji: "✍️", color: "#B5621E", bg: "#FBF2EA",
    tasks: [
      { id: "build_sentence",      label: "Build a Sentence",   desc: "重組打亂的句子" },
      { id: "write_email",         label: "Write an Email",      desc: "根據情境寫一封 Email（7分鐘）" },
      { id: "academic_discussion", label: "Academic Discussion", desc: "回應課堂討論板貼文（10分鐘）" },
    ],
  },
  speaking: {
    label: "Speaking", emoji: "🎤", color: "#A03060", bg: "#F9EEF4",
    tasks: [
      { id: "listen_repeat",  label: "Listen and Repeat",  desc: "聽7句話並複誦" },
      { id: "take_interview", label: "Take an Interview",  desc: "回答4個問題（各45秒，無準備時間）" },
    ],
  },
};

export const TOPICS = {
  reading:   ["科技與創新","環境與生態","校園生活","社會科學","醫學與健康","職場與商業","文化與藝術","教育政策"],
  listening: ["校園對話","科學講座","辦公室情境","課程公告","歷史課程","社會議題","藝術討論","日常生活"],
  writing:   ["留學申請","宿舍問題","課程選擇","工作機會","環境議題","科技影響","社會政策","文化保存"],
  speaking:  ["個人喜好","校園生活","社會趨勢","科技影響","教育經驗","文化活動","職涯規劃","日常習慣"],
};

export const BAND_LABEL = {
  6: "C2 Expert",
  5: "C1 Advanced",
  4: "B2 Upper-Int.",
  3: "B1 Intermediate",
  2: "A2 Elementary",
  1: "A1 Beginner",
};

export function buildSystemPrompt(history = []) {
  const used = history.slice(-20).map((h, i) =>
    `${i + 1}. [${h.section}/${h.taskId}] 主題:${h.topic} Band:${h.band}`
  ).join("\n");

  return `你是一位頂尖的 TOEFL iBT 2026 出題專家（ETS 於 2026/01/21 起實施新版）。

【2026 各題型規格】

Reading/complete_words:
- 生成一段 80-120 字的英文段落
- 第一句完整保留，不挖空
- 從第二句開始，每隔一個單字挖空（第1、3、5、7、9...個單字）
- 每個挖空保留前50%字母（向下取整），後半用底線替代，底線數量=缺失字母數
- 範例：might→mi___ / that→th__ / people→peo___ / complex→comp___
- 總共挖空10個單字
- stimulus 欄位放完整段落（含挖空標記）
- items 陣列放10個物件，每個：question放該挖空單字的上下文句子，answer放完整單字，options放空陣列[]
- 挖空單字難度適中（避免 is/a/the/of 等功能詞，也避免生僻字），詞性多樣

Reading/read_daily_life:
- 只生成 2 個不同類型的日常文本（不多不少）
- 文本類型任選：poster/sign/notice/menu/social media post/schedule/email/text message/advertisement/news article/form/receipt
- 每個文本配 3 題選擇題
- 題型涵蓋：main purpose、detail comprehension、vocabulary in context、inference、practical information
- stimulus 放 2 個文本，用 [Text 1 — Notice] / [Text 2 — Email] 等標記區隔
- items 放全部 6 題（題號連續），每題包含 question/options(4個)/answer/explanation(中文)
- 所有答案可從文本中找到依據，干擾選項合理但明確錯誤

Reading/academic_text:
- 只生成 1 篇學術文章（不多不少），約 200 字
- 學科任選：History / Art & Music / Business & Economics / Life Sciences / Physical Sciences / Social Sciences
- 固定 5 題，題型：Main idea(1題)、Factual information(2題)、Vocabulary in context(1題)、Inference(1題)
- 文章自成一體，不需背景知識，2-3段，邏輯連貫
- stimulus 放文章內容，用 [Passage 1 — 主題] 標記開頭
- items 放 5 題，每題包含 question/options(4個)/answer/explanation(中文)
- 干擾選項基於文本但含錯誤細節

Listening/choose_response: [Speaker says:]標記一句話，4選項測pragmatics
Listening/listen_conversation: 10來回短對話（Student A/B），2題選擇題
Listening/listen_announcement: 40-85字校園公告腳本，選擇題
Listening/academic_talk: 100-250字學術講座腳本，選擇題
Writing/build_sentence: 打亂單字用"|"分隔，items[0].answer是正確句子，options留空陣列[]
Writing/write_email: 情境描述，7分鐘寫email；model_answer放範例
Writing/academic_discussion: 教授提問+學生A、B範例留言，10分鐘回應；model_answer放範例
Speaking/listen_repeat: stimulus放7個編號句子，items留空陣列[]
Speaking/take_interview: 4個由淺入深的問題，options留空陣列[]，answer放範例口答

【評分】Band 1-6（對齊CEFR）
${history.length > 0 ? "【已出題記錄（避免重複主題/場景/考點）】\n" + used : ""}

【輸出】純JSON，不加markdown fence：
{"taskId":"","section":"","topic":"主題3-5字","band":數字,"tags":["","",""],"scenario":"情境說明中文","stimulus":"英文材料","prompt":"英文指令","items":[{"question":"","options":["A.","B.","C.","D."],"answer":"","explanation":"中文解析"}],"model_answer":"範例或null","scoring_rubric":{"band_6":"","band_4":"","band_2":""},"tips":"台灣學生備考提示"}`;
}
