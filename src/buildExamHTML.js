// ─── buildExamHTML.js ─────────────────────────────────────────────
import { SECTIONS, BAND_LABEL } from "./config";

export function buildExamHTML(sectionKey, questions, band) {
  const cfg = SECTIONS[sectionKey];
  const date = new Date().toLocaleDateString("zh-TW");
  const isReading = sectionKey === "reading";

  // ── Part 1: inline fill ──
  function buildPart1(q, qi) {
    const stimulusWithInputs = (q.stimulus || "").replace(
      /([a-zA-Z]+_+)/g,
      (match) => {
        const underscores = (match.match(/_/g) || []).length;
        const prefix = match.replace(/_+/g, "");
        return `<span class="bw">${prefix}<input class="ii" data-qi="${qi}" style="width:${underscores*11+18}px" placeholder="${"_".repeat(underscores)}"></span>`;
      }
    );
    return `
    <div class="qblock" id="part-0">
      <div class="qhead">
        <span class="qtype" style="color:${cfg.color}">${cfg.emoji} PART 1 — COMPLETE THE WORDS</span>
        <span class="qband" style="background:${cfg.bg};color:${cfg.color}">Band ${q.band||band}</span>
      </div>
      <h2 class="qtopic">${q.topic||""}</h2>
      ${(q.tags||[]).length?`<div class="tags">${(q.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join("")}</div>`:""}
      ${q.scenario?`<div class="scenario" style="border-color:${cfg.color}">💡 ${q.scenario}</div>`:""}
      <div class="plabel">Read the passage and complete the missing parts of the words.</div>
      <div class="stim-inline" id="stim-${qi}">${stimulusWithInputs}</div>
      <button class="nbtn" style="background:${cfg.color};margin-top:18px" id="submit-p1-${qi}" onclick="submitPart1(${qi})">Submit Part 1 →</button>
      <div class="p1ans hidden" id="p1ans-${qi}">
        <div class="anstitle">✓ Answers</div>
        ${(q.items||[]).map((item,ii)=>`
          <div class="ansrow">
            <span class="anum">Q${ii+1}.</span>
            <span class="actx">${item.question||""}</span>
            <span class="aword" style="color:${cfg.color}">→ ${item.answer||""}</span>
            ${item.explanation?`<span class="aexpl">${item.explanation}</span>`:""}
          </div>`).join("")}
        ${q.tips?`<div class="tips" style="margin-top:14px">🇹🇼 ${q.tips}</div>`:""}
      </div>
    </div>`;
  }

  // ── Part 2: two texts, switch after Text 1 questions done ──
  function buildPart2(q, qi) {
    const items = q.items||[];
    const stimulus = q.stimulus||"";

    // Split stimulus into Text 1 and Text 2
    const textSections = [];
    const textRegex = /\[Text \d+[^\]]*\]/g;
    const markers = [];
    let match;
    while ((match = textRegex.exec(stimulus)) !== null) {
      markers.push({ label: match[0].replace(/[\[\]]/g,""), index: match.index, end: match.index + match[0].length });
    }
    if (markers.length >= 2) {
      textSections.push({ label: markers[0].label, content: stimulus.slice(markers[0].end, markers[1].index).trim() });
      textSections.push({ label: markers[1].label, content: stimulus.slice(markers[1].end).trim() });
    } else if (markers.length === 1) {
      textSections.push({ label: markers[0].label, content: stimulus.slice(markers[0].end).trim() });
    } else {
      textSections.push({ label: "Text", content: stimulus });
    }

    const half = textSections.length >= 2 ? Math.ceil(items.length / 2) : items.length;
    const text1Items = items.slice(0, half);
    const text2Items = items.slice(half);

    const text1Steps = text1Items.map((item, localII) => {
      const ii = localII;
      const isLastOfText1 = localII === text1Items.length - 1;
      return `
      <div class="qstep ${localII===0?"":"hidden"}" id="qs-${qi}-${ii}">
        <div class="qnum" style="color:${cfg.color}">Q${ii+1} / ${items.length}</div>
        <div class="qtext">${item.question||""}</div>
        <div class="qopts">
          ${(item.options||[]).map((opt,oi)=>`
            <div class="opt" data-qi="${qi}" data-ii="${ii}" data-letter="${String.fromCharCode(65+oi)}" onclick="selectOpt(this)">
              <span class="ol" style="color:${cfg.color}">${String.fromCharCode(65+oi)}.</span>
              ${opt.replace(/^[A-D]\.\s*/,"")}
            </div>`).join("")}
        </div>
        <div class="qexpl hidden" id="qe-${qi}-${ii}">📌 ${item.explanation||""}</div>
        <div class="qnav">
          ${isLastOfText1 && text2Items.length > 0
            ? `<button class="nbtn" style="background:${cfg.color}" onclick="switchToText2(${qi},${ii})">Next Text →</button>`
            : `<button class="nbtn" style="background:${cfg.color}" onclick="nextQ(${qi},${ii})">Next Question →</button>`
          }
        </div>
      </div>`;
    }).join("");

    const text2Steps = text2Items.map((item, localII) => {
      const ii = half + localII;
      const isLast = ii === items.length - 1;
      return `
      <div class="qstep hidden" id="qs-${qi}-${ii}">
        <div class="qnum" style="color:${cfg.color}">Q${ii+1} / ${items.length}</div>
        <div class="qtext">${item.question||""}</div>
        <div class="qopts">
          ${(item.options||[]).map((opt,oi)=>`
            <div class="opt" data-qi="${qi}" data-ii="${ii}" data-letter="${String.fromCharCode(65+oi)}" onclick="selectOpt(this)">
              <span class="ol" style="color:${cfg.color}">${String.fromCharCode(65+oi)}.</span>
              ${opt.replace(/^[A-D]\.\s*/,"")}
            </div>`).join("")}
        </div>
        <div class="qexpl hidden" id="qe-${qi}-${ii}">📌 ${item.explanation||""}</div>
        <div class="qnav">
          ${isLast
            ? `<button class="nbtn" style="background:${cfg.color}" onclick="nextQ(${qi},${ii})">Finish Part 2 →</button>`
            : `<button class="nbtn" style="background:${cfg.color}" onclick="nextQ(${qi},${ii})">Next Question →</button>`
          }
        </div>
      </div>`;
    }).join("");

    return `
    <div class="qblock hidden" id="part-1">
      <div class="qhead">
        <span class="qtype" style="color:${cfg.color}">${cfg.emoji} PART 2 — READING IN DAILY LIFE</span>
        <span class="qband" style="background:${cfg.bg};color:${cfg.color}">Band ${q.band||band}</span>
      </div>
      <h2 class="qtopic">${q.topic||""}</h2>
      ${(q.tags||[]).length?`<div class="tags">${(q.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join("")}</div>`:""}
      <div class="split">
        <div class="sleft" id="sleft-${qi}">
          ${q.scenario?`<div class="scenario" style="border-color:${cfg.color}">💡 ${q.scenario}</div>`:""}
          <div id="text1-content-${qi}">
            <div class="tlabel">${textSections[0]?.label||"Text 1"}</div>
            <div class="stimtexts">${(textSections[0]?.content||"").replace(/\n/g,"<br>")}</div>
          </div>
          <div id="text2-content-${qi}" class="hidden">
            <div class="tlabel">${textSections[1]?.label||"Text 2"}</div>
            <div class="stimtexts">${(textSections[1]?.content||"").replace(/\n/g,"<br>")}</div>
          </div>
        </div>
        <div class="sright">
          <div id="text1-steps-${qi}">${text1Steps}</div>
          <div id="text2-steps-${qi}" class="hidden">${text2Steps}</div>
          <div class="pdone hidden" id="pd-${qi}">
            <div style="text-align:center;padding:20px;color:#888;font-size:14px">✓ Part 2 complete</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  // ── Part 3: single passage, one question at a time ──
  function buildPart3(q, qi) {
    const items = q.items||[];
    const stimHTML = (q.stimulus||"")
      .replace(/\[Passage \d+[^\]]*\]/g, m => `<div class="tlabel">${m.replace(/[\[\]]/g,"")}</div>`);

    const stepsHTML = items.map((item,ii)=>`
      <div class="qstep ${ii===0?"":"hidden"}" id="qs-${qi}-${ii}">
        <div class="qnum" style="color:${cfg.color}">Q${ii+1} / ${items.length}</div>
        <div class="qtext">${item.question||""}</div>
        <div class="qopts">
          ${(item.options||[]).map((opt,oi)=>`
            <div class="opt" data-qi="${qi}" data-ii="${ii}" data-letter="${String.fromCharCode(65+oi)}" onclick="selectOpt(this)">
              <span class="ol" style="color:${cfg.color}">${String.fromCharCode(65+oi)}.</span>
              ${opt.replace(/^[A-D]\.\s*/,"")}
            </div>`).join("")}
        </div>
        <div class="qexpl hidden" id="qe-${qi}-${ii}">📌 ${item.explanation||""}</div>
        <div class="qnav">
          ${ii<items.length-1
            ?`<button class="nbtn" style="background:${cfg.color}" onclick="nextQ(${qi},${ii})">Next Question →</button>`
            :`<button class="nbtn" style="background:#1a1a2e" onclick="submitAll(${qi},${ii})">Submit & See Score ✓</button>`
          }
        </div>
      </div>`).join("");

    return `
    <div class="qblock hidden" id="part-2">
      <div class="qhead">
        <span class="qtype" style="color:${cfg.color}">${cfg.emoji} PART 3 — ACADEMIC TEXT</span>
        <span class="qband" style="background:${cfg.bg};color:${cfg.color}">Band ${q.band||band}</span>
      </div>
      <h2 class="qtopic">${q.topic||""}</h2>
      ${(q.tags||[]).length?`<div class="tags">${(q.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join("")}</div>`:""}
      <div class="split">
        <div class="sleft">
          ${q.scenario?`<div class="scenario" style="border-color:${cfg.color}">💡 ${q.scenario}</div>`:""}
          <div class="stimtexts">${stimHTML}</div>
        </div>
        <div class="sright">
          ${stepsHTML}
          <div class="pdone hidden" id="pd-${qi}">
            <div style="text-align:center;padding:20px;color:#888;font-size:14px">✓ Part 3 complete</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  // ── Generic block (non-reading) ──
  function buildGeneric(q, qi) {
    const isFreeform = ["write_email","academic_discussion"].includes(q.taskId);
    const isSpeaking = sectionKey==="speaking";
    const items = q.items||[];
    const itemsHTML = items.map((item,ii)=>{
      const hasOpts = (item.options||[]).filter(o=>o.trim()).length>0;
      return `
      <div class="item">
        ${item.question?`<p class="iq">${items.length>1?`<b style="color:${cfg.color}">Q${ii+1}.</b> `:""}${item.question}</p>`:""}
        ${hasOpts?`<div style="display:flex;flex-direction:column;gap:8px">${(item.options||[]).map((opt,oi)=>`
          <div class="opt" data-qi="${qi}" data-ii="${ii}" data-letter="${String.fromCharCode(65+oi)}" onclick="selectOpt(this)">
            <span class="ol" style="color:${cfg.color}">${String.fromCharCode(65+oi)}.</span> ${opt.replace(/^[A-D]\.\s*/,"")}
          </div>`).join("")}</div>`
          :(!isFreeform?`<input class="short-ans" placeholder="${isSpeaking?"（口語作答）":"輸入答案..."}">`:"")}
        <div class="expl hidden" id="expl-${qi}-${ii}">📌 ${item.explanation||""}</div>
      </div>`;
    }).join("");
    return `
    <div class="qblock">
      <div class="qhead">
        <span class="qtype" style="color:${cfg.color}">${cfg.emoji} ${(q.taskId||"").replace(/_/g," ").toUpperCase()}</span>
        <span class="qband" style="background:${cfg.bg};color:${cfg.color}">Band ${q.band||band}</span>
      </div>
      <h2 class="qtopic">${q.topic||""}</h2>
      ${(q.tags||[]).length?`<div class="tags">${(q.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join("")}</div>`:""}
      ${q.scenario?`<div class="scenario" style="border-color:${cfg.color}">💡 ${q.scenario}</div>`:""}
      ${q.stimulus?`<div class="stimulus">${q.stimulus.replace(/\n/g,"<br>")}</div>`:""}
      ${q.prompt?`<div class="prompt">${q.prompt}</div>`:""}
      ${itemsHTML}
      ${isFreeform?`
        <div class="write-label">你的回答：</div>
        <textarea class="writing-box" id="writing-${qi}" style="border-color:${cfg.color}55" placeholder="在這裡輸入你的答案..." oninput="updateWc(${qi})"></textarea>
        <div class="wcount" id="wc-${qi}">0 words</div>`:""}
      ${isSpeaking&&q.taskId==="take_interview"?`<div class="speak-note">🎤 口語作答，每題 45 秒。</div>`:""}
      <button class="reveal-btn" style="background:${cfg.color}" onclick="revealBlock(${qi},this)">查看解答</button>
      ${q.model_answer?`<div class="model hidden" id="model-${qi}"><div class="section-label">範例答案</div>${q.model_answer.replace(/\n/g,"<br>")}</div>`:""}
      ${q.scoring_rubric?`<div class="rubric hidden" id="rubric-${qi}">
        ${q.scoring_rubric.band_6?`<div class="rb rb6"><b>Band 6</b><br>${q.scoring_rubric.band_6}</div>`:""}
        ${q.scoring_rubric.band_4?`<div class="rb rb4"><b>Band 4</b><br>${q.scoring_rubric.band_4}</div>`:""}
        ${q.scoring_rubric.band_2?`<div class="rb rb2"><b>Band 2</b><br>${q.scoring_rubric.band_2}</div>`:""}
      </div>`:""}
      ${q.tips?`<div class="tips hidden" id="tips-${qi}">🇹🇼 ${q.tips}</div>`:""}
    </div>`;
  }

  let part1HTML="", part2HTML="", part3HTML="";
  let p2qi = -1;
  questions.forEach((q,qi)=>{
    if(q.taskId==="complete_words") part1HTML=buildPart1(q,qi);
    else if(q.taskId==="read_daily_life"){ part2HTML=buildPart2(q,qi); p2qi=qi; }
    else if(q.taskId==="academic_text") part3HTML=buildPart3(q,qi);
  });
  const genericBlocks = !isReading ? questions.map((q,qi)=>buildGeneric(q,qi)).join("") : "";
  const answersJSON = JSON.stringify(questions.map(q=>(q.items||[]).map(item=>item.answer?.charAt(0).toUpperCase()||"")));
  const p2HalfCount = p2qi>=0 ? Math.ceil((questions[p2qi]?.items||[]).length/2) : 0;

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TOEFL 2026 — ${cfg.label} Band ${band}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,'Noto Serif TC',serif;background:#FAF9F6;color:#2c2c2c;line-height:1.6}
.header{background:#1a1a2e;padding:18px 32px;color:#fff;position:sticky;top:0;z-index:100}
.header h1{font-size:18px;margin-bottom:2px}
.header p{color:#aaa;font-size:12px}
.pbar{height:3px;background:rgba(255,255,255,.15);margin-top:8px;border-radius:2px}
.pfill{height:100%;background:${cfg.color};border-radius:2px;transition:width .5s}
.container{max-width:1100px;margin:0 auto;padding:28px 20px;display:flex;flex-direction:column;gap:24px}
.qblock{background:#fff;border-radius:16px;border:1.5px solid ${cfg.color}33;padding:28px;box-shadow:0 2px 14px rgba(0,0,0,.07)}
.qhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.qtype{font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:bold}
.qband{padding:3px 12px;border-radius:20px;font-size:12px;font-weight:bold}
.qtopic{font-size:17px;color:#1a1a2e;margin-bottom:10px}
.tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.tag{background:#f5f5f5;color:#777;padding:2px 10px;border-radius:20px;font-size:11px}
.scenario{background:#f8f8f6;border-left:4px solid;padding:10px 14px;border-radius:0 8px 8px 0;margin-bottom:14px;font-size:13px;color:#555}
.plabel{font-size:13.5px;font-weight:600;color:#1a1a2e;margin-bottom:14px}
.stim-inline{background:#fafaf7;border:1px solid #e8e8e0;border-radius:12px;padding:20px 24px;font-size:15px;line-height:2.4;color:#333}
.bw{display:inline-flex;align-items:baseline;gap:1px}
.ii{border:none;border-bottom:2px solid ${cfg.color};background:transparent;font-size:15px;font-family:Georgia,serif;color:${cfg.color};font-weight:bold;padding:0 2px;outline:none}
.ii:focus{background:${cfg.bg}55;border-radius:3px 3px 0 0}
.ii.correct{border-bottom-color:#4caf50;color:#2e7d32;background:#e8f5e933}
.ii.wrong{border-bottom-color:#f44336;color:#c62828;background:#ffebee55}
.p1ans{margin-top:20px;padding:18px;background:#f8fdf8;border:1px solid ${cfg.color}33;border-radius:12px}
.anstitle{font-size:12px;font-weight:bold;color:${cfg.color};text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.ansrow{display:flex;gap:8px;align-items:baseline;margin-bottom:10px;flex-wrap:wrap;font-size:13px}
.anum{color:#aaa;min-width:26px;font-size:12px}
.actx{color:#555;flex:1;min-width:200px}
.aword{font-weight:bold;white-space:nowrap}
.aexpl{color:#777;font-size:12px;width:100%;padding-left:34px;margin-top:2px}
.split{display:grid;grid-template-columns:1fr 360px;gap:24px;margin-top:16px;align-items:start}
.sleft{position:sticky;top:80px;max-height:calc(100vh - 110px);overflow-y:auto}
.sright{}
.stimtexts{font-size:14px;line-height:1.95;color:#333}
.tlabel{font-size:11px;font-weight:bold;color:${cfg.color};text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
.qstep{padding:18px;background:#fafaf8;border-radius:12px;border:1px solid #eee;margin-bottom:12px}
.qnum{font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.qtext{font-size:14px;color:#1a1a2e;font-weight:500;margin-bottom:14px;line-height:1.6}
.qopts{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
.qexpl{padding:10px 14px;background:#f0f5ff;border:1px solid #bbdefb;border-radius:10px;font-size:13px;color:#1565c0;line-height:1.7;margin-top:10px}
.qnav{margin-top:12px}
.opt{padding:10px 14px;border-radius:10px;border:2px solid #eee;background:#fff;font-size:13.5px;cursor:pointer;transition:all .12s;line-height:1.5}
.opt:hover{border-color:${cfg.color};background:${cfg.bg}}
.opt.selected{border-color:${cfg.color};background:${cfg.bg}}
.opt.correct{border-color:#4caf50!important;background:#e8f5e9!important}
.opt.wrong{border-color:#f44336!important;background:#ffebee!important}
.ol{font-weight:bold;margin-right:6px}
.nbtn{padding:10px 22px;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold}
.nbtn:hover{opacity:.88}
.stimulus{background:#fafaf7;border:1px solid #e8e8e0;border-radius:12px;padding:18px 22px;margin-bottom:18px;font-size:15px;line-height:1.95;color:#333;white-space:pre-wrap}
.prompt{font-size:14.5px;font-weight:600;color:#1a1a2e;margin-bottom:18px}
.item{margin-bottom:20px}
.iq{font-size:14px;color:#444;margin-bottom:10px;font-weight:500}
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
.tips{padding:11px 14px;background:#fff8e1;border:1px solid #ffe082;border-radius:10px;font-size:13px;color:#795548}
.hidden{display:none}
.score-screen{background:#fff;border-radius:16px;border:2px solid ${cfg.color};padding:36px;text-align:center;display:none}
.score-screen.show{display:block}
.score-big{font-size:48px;font-weight:bold;color:${cfg.color};margin:12px 0}
.review-section{margin-top:32px;text-align:left;border-top:1px solid #eee;padding-top:24px}
.review-part{margin-bottom:28px}
.review-part-title{font-size:12px;font-weight:bold;color:${cfg.color};text-transform:uppercase;letter-spacing:1px;margin-bottom:14px}
.footer{text-align:center;color:#ccc;font-size:12px;padding:28px}
@media(max-width:768px){.split{grid-template-columns:1fr}.sleft{position:static;max-height:none}}
</style>
</head>
<body>
<div class="header">
  <h1>${cfg.emoji} TOEFL 2026 Practice — ${cfg.label}</h1>
  <p>Band ${band} · ${BAND_LABEL[band]} · ${date}</p>
  ${isReading?`<div class="pbar"><div class="pfill" id="pfill" style="width:33%"></div></div>`:""}
</div>
<div class="container">
  ${isReading ? part1HTML+part2HTML+part3HTML : genericBlocks}
  ${isReading?`
  <div class="score-screen" id="sscreen">
    <div style="font-size:36px;margin-bottom:10px">🎉</div>
    <div style="font-size:20px;font-weight:bold;color:#1a1a2e;margin-bottom:6px">Reading Complete!</div>
    <div class="score-big" id="sbig">—</div>
    <div style="font-size:13px;color:#888;margin-bottom:20px" id="sdetail"></div>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button onclick="location.reload()" style="padding:10px 28px;background:#eee;color:#555;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold">Try Again</button>
      <button onclick="showReview()" id="review-btn" style="padding:10px 28px;background:${cfg.color};color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold">查看完整解析 →</button>
    </div>
    <div class="review-section hidden" id="review-section"></div>
  </div>`:""}
</div>
<div class="footer">TOEFL iBT 2026 新版練習題</div>
<script>
const ANSWERS=${answersJSON};
const QUESTIONS=${JSON.stringify(questions.map(q=>({
  taskId: q.taskId,
  items: (q.items||[]).map(item=>({
    question: item.question||"",
    answer: item.answer||"",
    explanation: item.explanation||""
  })),
  tips: q.tips||""
})))};
const P2QI=${p2qi};
const P2HALF=${p2HalfCount};
let totalQ=0,correctQ=0;
let userAnswers={};

function selectOpt(el){
  const qi=el.dataset.qi,ii=el.dataset.ii;
  document.querySelectorAll('[data-qi="'+qi+'"][data-ii="'+ii+'"]').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
  if(!userAnswers[qi]) userAnswers[qi]={};
  userAnswers[qi][ii]=el.dataset.letter;
}

function submitPart1(qi){
  const inputs=document.querySelectorAll('.ii[data-qi="'+qi+'"]');
  const ans=ANSWERS[qi]||[];
  inputs.forEach((inp,ii)=>{
    totalQ++;
    const userVal=inp.value.trim().toLowerCase();
    const correct=(ans[ii]||"").toLowerCase();
    if(userVal===correct) correctQ++;
    inp.disabled=true;
    if(!userAnswers[qi]) userAnswers[qi]={};
    userAnswers[qi][ii]=inp.value.trim();
  });
  document.getElementById('submit-p1-'+qi).style.display='none';
  document.getElementById('stim-'+qi).style.display='none';
  const p2=document.getElementById('part-1');
  if(p2){setTimeout(()=>{p2.classList.remove('hidden');p2.scrollIntoView({behavior:'smooth'});setProgress(2,3);},800);}
}

function nextQ(qi,ii){
  const ans=ANSWERS[qi]||[];
  const sel=document.querySelector('[data-qi="'+qi+'"][data-ii="'+ii+'"].selected');
  const correct=ans[ii];
  totalQ++;
  if(sel&&sel.dataset.letter===correct) correctQ++;
  if(!userAnswers[qi]) userAnswers[qi]={};
  userAnswers[qi][ii]=sel?sel.dataset.letter:'';
  document.getElementById('qs-'+qi+'-'+ii).classList.add('hidden');
  const nextStep=document.getElementById('qs-'+qi+'-'+(ii+1));
  if(nextStep){
    setTimeout(()=>{nextStep.classList.remove('hidden');nextStep.scrollIntoView({behavior:'smooth',block:'nearest'});},300);
  } else {
    const done=document.getElementById('pd-'+qi);
    if(done) done.classList.remove('hidden');
    const p3=document.getElementById('part-2');
    if(p3){setTimeout(()=>{p3.classList.remove('hidden');p3.scrollIntoView({behavior:'smooth'});setProgress(3,3);},800);}
  }
}

function switchToText2(qi,ii){
  const ans=ANSWERS[qi]||[];
  const sel=document.querySelector('[data-qi="'+qi+'"][data-ii="'+ii+'"].selected');
  const correct=ans[ii];
  totalQ++;
  if(sel&&sel.dataset.letter===correct) correctQ++;
  if(!userAnswers[qi]) userAnswers[qi]={};
  userAnswers[qi][ii]=sel?sel.dataset.letter:'';
  document.getElementById('qs-'+qi+'-'+ii).classList.add('hidden');
  document.getElementById('text1-content-'+qi).classList.add('hidden');
  document.getElementById('text1-steps-'+qi).classList.add('hidden');
  setTimeout(()=>{
    document.getElementById('text2-content-'+qi).classList.remove('hidden');
    document.getElementById('text2-steps-'+qi).classList.remove('hidden');
    const firstText2Step=document.getElementById('qs-'+qi+'-'+P2HALF);
    if(firstText2Step) firstText2Step.classList.remove('hidden');
    document.getElementById('part-1').scrollIntoView({behavior:'smooth'});
  },300);
}

function submitAll(qi,ii){
  const ans=ANSWERS[qi]||[];
  const sel=document.querySelector('[data-qi="'+qi+'"][data-ii="'+ii+'"].selected');
  const correct=ans[ii];
  totalQ++;
  if(sel&&sel.dataset.letter===correct) correctQ++;
  if(!userAnswers[qi]) userAnswers[qi]={};
  userAnswers[qi][ii]=sel?sel.dataset.letter:'';
  document.getElementById('qs-'+qi+'-'+ii).classList.add('hidden');
  setTimeout(()=>{
    const sc=document.getElementById('sscreen');
    if(sc){
      sc.classList.add('show');
      const pct=totalQ>0?Math.round(correctQ/totalQ*100):0;
      document.getElementById('sbig').textContent=correctQ+' / '+totalQ;
      document.getElementById('sdetail').textContent='Correct: '+correctQ+' | Incorrect: '+(totalQ-correctQ)+' | Accuracy: '+pct+'%';
      sc.scrollIntoView({behavior:'smooth'});
      setProgress(3,3);
    }
  },600);
}

function showReview(){
  document.getElementById('review-btn').style.display='none';
  const section=document.getElementById('review-section');
  section.classList.remove('hidden');

  // Part 1: show stim + color inputs + answer panel
  QUESTIONS.forEach((q,qi)=>{
    if(q.taskId!=='complete_words') return;
    const stimEl=document.getElementById('stim-'+qi);
    if(stimEl) stimEl.style.display='';
    const inputs=document.querySelectorAll('.ii[data-qi="'+qi+'"]');
    const ans=ANSWERS[qi]||[];
    inputs.forEach((inp,ii)=>{
      const userVal=(inp.value||'').trim().toLowerCase();
      const correct=(ans[ii]||'').toLowerCase();
      if(userVal===correct) inp.classList.add('correct');
      else{ inp.classList.add('wrong'); inp.value=ans[ii]||''; }
    });
    document.getElementById('p1ans-'+qi).classList.remove('hidden');
  });

  // Part 2/3: show all steps + color options + explanations
  QUESTIONS.forEach((q,qi)=>{
    if(q.taskId==='complete_words') return;
    const ans=ANSWERS[qi]||[];
    q.items.forEach((_,ii)=>{
      const step=document.getElementById('qs-'+qi+'-'+ii);
      if(step) step.classList.remove('hidden');
      const expl=document.getElementById('qe-'+qi+'-'+ii);
      if(expl) expl.classList.remove('hidden');
      document.querySelectorAll('[data-qi="'+qi+'"][data-ii="'+ii+'"]').forEach(opt=>{
        opt.style.pointerEvents='none';
        if(opt.dataset.letter===ans[ii]) opt.classList.add('correct');
        else if(opt.classList.contains('selected')) opt.classList.add('wrong');
      });
    });
    // Part 2: show both texts and both step groups
    if(q.taskId==='read_daily_life'){
      ['text1-content-','text2-content-','text1-steps-','text2-steps-'].forEach(prefix=>{
        const el=document.getElementById(prefix+qi);
        if(el) el.classList.remove('hidden');
      });
    }
  });

  // Build summary
  let html='';
  QUESTIONS.forEach((q,qi)=>{
    if(!q.items||q.items.length===0) return;
    const partLabel=q.taskId==='complete_words'?'Part 1 — Complete the Words'
      :q.taskId==='read_daily_life'?'Part 2 — Reading in Daily Life'
      :'Part 3 — Academic Text';
    html+='<div class="review-part"><div class="review-part-title">'+partLabel+'</div>';
    q.items.forEach((item,ii)=>{
      const userAns=(userAnswers[qi]&&userAnswers[qi][ii]!=null)?userAnswers[qi][ii]:'—';
      const correctAns=item.answer?.charAt(0).toUpperCase()||'';
      const isCorrect=q.taskId==='complete_words'
        ?(userAns||'').toLowerCase()===(correctAns||'').toLowerCase()
        :userAns===correctAns;
      html+='<div style="margin-bottom:14px;padding:14px;background:#fafaf8;border-radius:10px;border:1px solid '+(isCorrect?'#c8e6c9':'#ffcdd2')+'">';
      html+='<div style="font-size:13px;font-weight:500;color:#1a1a2e;margin-bottom:8px"><span style="color:'+(isCorrect?'#4caf50':'#f44336')+';margin-right:6px">'+(isCorrect?'✓':'✗')+'</span>Q'+(ii+1)+'. '+item.question+'</div>';
      html+='<div style="font-size:12px;color:#666;margin-bottom:6px">你的答案：<b>'+userAns+'</b> ／ 正確答案：<b style="color:#3D7A55">'+correctAns+'</b></div>';
      if(item.explanation) html+='<div style="font-size:12px;color:#1565c0;padding:8px 12px;background:#f0f5ff;border-radius:8px;margin-top:6px">📌 '+item.explanation+'</div>';
      html+='</div>';
    });
    if(q.tips) html+='<div class="tips" style="margin-bottom:12px">🇹🇼 '+q.tips+'</div>';
    html+='</div>';
  });
  section.innerHTML=html;
}

function setProgress(cur,total){
  const f=document.getElementById('pfill');
  if(f) f.style.width=Math.round(cur/total*100)+'%';
}

function revealBlock(qi,btn){
  document.querySelectorAll('[id^="expl-'+qi+'-"]').forEach(e=>e.classList.remove('hidden'));
  document.querySelectorAll('[data-qi="'+qi+'"]').forEach(opt=>{
    const ii=opt.dataset.ii;
    const correct=(ANSWERS[qi]||[])[ii];
    if(opt.dataset.letter===correct) opt.classList.add('correct');
    else if(opt.classList.contains('selected')) opt.classList.add('wrong');
  });
  ['model','rubric','tips'].forEach(p=>{const el=document.getElementById(p+'-'+qi);if(el)el.classList.remove('hidden');});
  btn.style.display='none';
}

function updateWc(qi){
  const ta=document.getElementById('writing-'+qi);
  const wc=document.getElementById('wc-'+qi);
  if(ta&&wc) wc.textContent=ta.value.trim().split(/\s+/).filter(Boolean).length+' words';
}
</script>
</body>
</html>`;
}
