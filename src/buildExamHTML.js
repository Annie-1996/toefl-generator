// ─── buildExamHTML.js ─────────────────────────────────────────────
// 把生成好的題目陣列打包成學生用的完整 HTML 考卷

import { SECTIONS, BAND_LABEL } from "./config";

export function buildExamHTML(sectionKey, questions, band) {
  const cfg = SECTIONS[sectionKey];
  const date = new Date().toLocaleDateString("zh-TW");

  const qBlocks = questions.map((q, qi) => {
    const isFreeform = ["write_email", "academic_discussion"].includes(q.taskId);
    const isSpeaking = sectionKey === "speaking";

    const itemsHTML = (q.items || []).map((item, ii) => {
      const hasOptions = (item.options || []).filter((o) => o.trim()).length > 0;
      return `
      <div class="item">
        ${item.question ? `<p class="iq">${(q.items || []).length > 1 ? `<b style="color:${cfg.color}">Q${ii + 1}.</b> ` : ""}${item.question}</p>` : ""}
        ${hasOptions
          ? (item.options || []).map((opt, oi) => `
          <div class="opt" data-qi="${qi}" data-ii="${ii}" data-letter="${String.fromCharCode(65 + oi)}" onclick="selectOpt(this)">
            <span class="ol" style="color:${cfg.color}">${String.fromCharCode(65 + oi)}.</span> ${opt.replace(/^[A-D]\.\s*/, "")}
          </div>`).join("")
          : (!isFreeform ? `<input class="short-ans" placeholder="${isSpeaking ? "（口語作答，此欄可記重點）" : "輸入你的答案..."}">` : "")}
        <div class="expl hidden" id="expl-${qi}-${ii}">📌 ${item.explanation || ""}</div>
      </div>`;
    }).join("");

    return `
    <div class="qblock">
      <div class="qhead">
        <span class="qtype" style="color:${cfg.color}">${cfg.emoji} ${(q.taskId || "").replace(/_/g, " ").toUpperCase()}</span>
        <span class="qband" style="background:${cfg.bg};color:${cfg.color}">Band ${q.band || band}</span>
      </div>
      <h2 class="qtopic">${q.topic || ""}</h2>
      ${(q.tags || []).length ? `<div class="tags">${(q.tags || []).map((t) => `<span class="tag">#${t}</span>`).join("")}</div>` : ""}
      ${q.scenario ? `<div class="scenario" style="border-color:${cfg.color}">💡 ${q.scenario}</div>` : ""}
      ${q.stimulus ? `<div class="stimulus">${q.stimulus.replace(/\n/g, "<br>")}</div>` : ""}
      ${q.prompt ? `<div class="prompt">${q.prompt}</div>` : ""}
      ${itemsHTML}
      ${isFreeform ? `
        <div class="write-label">你的回答：</div>
        <textarea class="writing-box" id="writing-${qi}" style="border-color:${cfg.color}55" placeholder="在這裡輸入你的答案..." oninput="updateWc(${qi})"></textarea>
        <div class="wcount" id="wc-${qi}">0 words</div>` : ""}
      ${isSpeaking && q.taskId === "take_interview" ? `<div class="speak-note">🎤 口語作答，每題 45 秒。聽到題目後立刻作答，無準備時間。</div>` : ""}
      <button class="reveal-btn" style="background:${cfg.color}" onclick="revealBlock(${qi}, this)">查看解答</button>
      ${q.model_answer ? `<div class="model hidden" id="model-${qi}"><div class="section-label">範例答案</div>${q.model_answer.replace(/\n/g, "<br>")}</div>` : ""}
      ${q.scoring_rubric ? `<div class="rubric hidden" id="rubric-${qi}">
        ${q.scoring_rubric.band_6 ? `<div class="rb rb6"><b>Band 6</b><br>${q.scoring_rubric.band_6}</div>` : ""}
        ${q.scoring_rubric.band_4 ? `<div class="rb rb4"><b>Band 4</b><br>${q.scoring_rubric.band_4}</div>` : ""}
        ${q.scoring_rubric.band_2 ? `<div class="rb rb2"><b>Band 2</b><br>${q.scoring_rubric.band_2}</div>` : ""}
      </div>` : ""}
      ${q.tips ? `<div class="tips hidden" id="tips-${qi}">🇹🇼 ${q.tips}</div>` : ""}
    </div>`;
  }).join("");

  // Embed answers in JS for reveal logic
  const answersJSON = JSON.stringify(
    questions.map((q) => (q.items || []).map((item) => item.answer?.charAt(0).toUpperCase() || ""))
  );

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TOEFL 2026 — ${cfg.label} Band ${band}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,'Noto Serif TC',serif;background:#FAF9F6;color:#2c2c2c;line-height:1.6}
.header{background:#1a1a2e;padding:22px 32px;color:#fff}
.header h1{font-size:20px;margin-bottom:4px}
.header p{color:#aaa;font-size:13px}
.container{max-width:820px;margin:0 auto;padding:32px 20px;display:flex;flex-direction:column;gap:28px}
.qblock{background:#fff;border-radius:16px;border:1.5px solid ${cfg.color}33;padding:28px;box-shadow:0 2px 14px rgba(0,0,0,.07)}
.qhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.qtype{font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:bold}
.qband{padding:3px 12px;border-radius:20px;font-size:12px;font-weight:bold}
.qtopic{font-size:18px;color:#1a1a2e;margin-bottom:10px}
.tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.tag{background:#f5f5f5;color:#777;padding:2px 10px;border-radius:20px;font-size:11px}
.scenario{background:#f8f8f6;border-left:4px solid;padding:10px 14px;border-radius:0 8px 8px 0;margin-bottom:16px;font-size:13.5px;color:#555}
.stimulus{background:#fafaf7;border:1px solid #e8e8e0;border-radius:12px;padding:18px 22px;margin-bottom:18px;font-size:15px;line-height:1.95;color:#333;white-space:pre-wrap}
.prompt{font-size:14.5px;font-weight:600;color:#1a1a2e;margin-bottom:18px}
.item{margin-bottom:20px}
.iq{font-size:14px;color:#444;margin-bottom:10px;font-weight:500}
.opt{padding:11px 15px;border-radius:10px;border:2px solid #eee;background:#fafafa;font-size:14px;cursor:pointer;margin-bottom:8px;transition:all .12s}
.opt:hover{border-color:${cfg.color};background:${cfg.bg}}
.opt.selected{border-color:${cfg.color};background:${cfg.bg}}
.opt.correct{border-color:#4caf50!important;background:#e8f5e9!important}
.opt.wrong{border-color:#f44336!important;background:#ffebee!important}
.ol{font-weight:bold;margin-right:6px}
.short-ans{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid ${cfg.color}55;font-size:14px;background:#fafaf8;font-family:Georgia,serif;margin-top:4px}
.expl{margin-top:10px;padding:11px 14px;background:#f0f5ff;border:1px solid #bbdefb;border-radius:10px;font-size:13px;color:#1565c0;line-height:1.7}
.write-label{font-size:13px;color:#888;margin-bottom:6px}
.writing-box{width:100%;min-height:160px;padding:14px;border-radius:12px;border:1.5px solid;font-size:14px;line-height:1.85;resize:vertical;font-family:Georgia,serif;background:#fafaf8}
.wcount{text-align:right;font-size:12px;color:#aaa;margin-top:4px;margin-bottom:12px}
.speak-note{padding:11px 14px;background:#fff3e0;border-radius:10px;font-size:13px;color:#e65100;margin-bottom:12px}
.reveal-btn{margin-top:8px;padding:10px 24px;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold}
.reveal-btn:hover{opacity:.88}
.section-label{font-size:11px;font-weight:bold;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.model{margin-top:18px;padding:16px 20px;background:#f1f8e9;border:1px solid #c5e1a5;border-radius:12px;font-size:14px;line-height:1.9;color:#2e4a1e}
.rubric{margin-top:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.rb{padding:12px;border-radius:10px;font-size:12px;line-height:1.6}
.rb6{background:#e8f5e9;color:#1b5e20}
.rb4{background:#fff3e0;color:#e65100}
.rb2{background:#ffebee;color:#b71c1c}
.tips{margin-top:12px;padding:11px 14px;background:#fff8e1;border:1px solid #ffe082;border-radius:10px;font-size:13px;color:#795548}
.hidden{display:none}
.footer{text-align:center;color:#ccc;font-size:12px;padding:28px}
@media(max-width:600px){.rubric{grid-template-columns:1fr}.container{padding:16px 12px}.qblock{padding:18px}}
</style>
</head>
<body>
<div class="header">
  <h1>${cfg.emoji} TOEFL 2026 Practice — ${cfg.label}</h1>
  <p>Band ${band} · ${BAND_LABEL[band]} · ${questions.length} tasks · ${date}</p>
</div>
<div class="container">${qBlocks}</div>
<div class="footer">TOEFL iBT 2026 新版練習題</div>
<script>
const ANSWERS = ${answersJSON};
function selectOpt(el) {
  const qi = el.dataset.qi, ii = el.dataset.ii;
  document.querySelectorAll('[data-qi="'+qi+'"][data-ii="'+ii+'"]').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
}
function revealBlock(qi, btn) {
  document.querySelectorAll('[id^="expl-'+qi+'-"]').forEach(e=>e.classList.remove('hidden'));
  document.querySelectorAll('[data-qi="'+qi+'"]').forEach(opt => {
    const ii = opt.dataset.ii;
    const correct = ANSWERS[qi]?.[ii];
    if (opt.dataset.letter === correct) opt.classList.add('correct');
    else if (opt.classList.contains('selected')) opt.classList.add('wrong');
  });
  ['model','rubric','tips'].forEach(p=>{
    const el=document.getElementById(p+'-'+qi);
    if(el) el.classList.remove('hidden');
  });
  btn.style.display='none';
}
function updateWc(qi) {
  const ta=document.getElementById('writing-'+qi);
  const wc=document.getElementById('wc-'+qi);
  if(ta&&wc) wc.textContent=ta.value.trim().split(/\s+/).filter(Boolean).length+' words';
}
</script>
</body>
</html>`;
}
