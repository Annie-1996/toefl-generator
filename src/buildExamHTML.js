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
      <div class="stim-inline">${stimulusWithInputs}</div>
      <button class="nbtn" style="background:${cfg.color};margin-top:18px" onclick="submitPart1(${qi})">Submit Part 1 →</button>
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

  // ── Part 2 & 3: left-right, one question at a time ──
  function buildSplitPart(q, qi, partNum, partLabel) {
    const items = q.items||[];
    const stimHTML = (q.stimulus||"")
      .replace(/\[Text \d+[^\]]*\]|\[Passage \d+[^\]]*\]/g, m =>
        `</div><div class="tsec"><div class="tlabel">${m.replace(/[\[\]]/g,"")}</div>`)
      .replace(/^<\/div>/,"") + "</div>";

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
            :partNum<3
              ?`<button class="nbtn" style="background:${cfg.color}" onclick="nextQ(${qi},${ii})">Finish Part ${partNum} →</button>`
              :`<button class="nbtn" style="background:#1a1a2e" onclick="submitAll(${qi},${ii})">Submit & See Score ✓</button>`
          }
        </div>
      </div>`).join("");

    return `
    <div class="qblock hidden" id="part-${partNum-1}">
      <div class="qhead">
        <span class="qtype" style="color:${cfg.color}">${cfg.emoji} PART ${partNum} — ${partLabel}</span>
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
            <div style="text-align:center;padding:20px;color:#888;font-size:14px">✓ Part ${partNum} complete</div>
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
  questions.forEach((q,qi)=>{
    if(q.taskId==="complete_words") part1HTML=buildPart1(q,qi);
    else if(q.taskId==="read_daily_life") part2HTML=buildSplitPart(q,qi,2,"READING IN DAILY LIFE");
    else if(q.taskId==="academic_text") part3HTML=buildSplitPart(q,qi,3,"ACADEMIC TEXT");
  });
  const genericBlocks = !isReading ? questions.map((q,qi)=>buildGeneric(q,qi)).join("") : "";
  const answersJSON = JSON.stringify(questions.map(q=>(q.items||[]).map(item=>item.answer?.charAt(0).toUpperCase()||"")));

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
.tsec{margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #f0f0e8}
.tsec:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
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
    <button onclick="location.reload()" style="padding:10px 28px;background:${cfg.color};color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold">Try Again</button>
  </div>`:""}
</div>
<div class="footer">TOEFL iBT 2026 新版練習題</div>
<script>
const ANSWERS=${answersJSON};
let totalQ=0,correctQ=0;

function selectOpt(el){
  const qi=el.dataset.qi,ii=el.dataset.ii;
  document.querySelectorAll('[data-qi="'+qi+'"][data-ii="'+ii+'"]').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
}

function submitPart1(qi){
  const inputs=document.querySelectorAll('.ii[data-qi="'+qi+'"]');
  const ans=ANSWERS[qi]||[];
  inputs.forEach((inp,ii)=>{
    totalQ++;
    const userVal=inp.value.trim().toLowerCase();
    const correct=(ans[ii]||"").toLowerCase();
    if(userVal===correct){correctQ++;inp.classList.add('correct');}
    else{inp.classList.add('wrong');inp.value=ans[ii]||"";}
    inp.disabled=true;
  });
  document.getElementById('p1ans-'+qi).classList.remove('hidden');
  document.querySelector('[onclick="submitPart1('+qi+')"]').style.display='none';
  const p2=document.getElementById('part-1');
  if(p2){setTimeout(()=>{p2.classList.remove('hidden');p2.scrollIntoView({behavior:'smooth'});setProgress(2,3);},800);}
}

function nextQ(qi,ii){
  const ans=ANSWERS[qi]||[];
  const sel=document.querySelector('[data-qi="'+qi+'"][data-ii="'+ii+'"].selected');
  const correct=ans[ii];
  totalQ++;
  if(sel&&sel.dataset.letter===correct) correctQ++;
  document.querySelectorAll('[data-qi="'+qi+'"][data-ii="'+ii+'"]').forEach(opt=>{
    if(opt.dataset.letter===correct) opt.classList.add('correct');
    else if(opt.classList.contains('selected')) opt.classList.add('wrong');
  });
  const expl=document.getElementById('qe-'+qi+'-'+ii);
  if(expl) expl.classList.remove('hidden');
  const curStep=document.getElementById('qs-'+qi+'-'+ii);
  curStep.querySelector('.qnav').style.display='none';
  const nextStep=document.getElementById('qs-'+qi+'-'+(ii+1));
  if(nextStep){
    setTimeout(()=>{nextStep.classList.remove('hidden');nextStep.scrollIntoView({behavior:'smooth',block:'nearest'});},500);
  } else {
    const done=document.getElementById('pd-'+qi);
    if(done) done.classList.remove('hidden');
    const p3=document.getElementById('part-2');
    if(p3){setTimeout(()=>{p3.classList.remove('hidden');p3.scrollIntoView({behavior:'smooth'});setProgress(3,3);},800);}
  }
}

function submitAll(qi,ii){
  const ans=ANSWERS[qi]||[];
  const sel=document.querySelector('[data-qi="'+qi+'"][data-ii="'+ii+'"].selected');
  const correct=ans[ii];
  totalQ++;
  if(sel&&sel.dataset.letter===correct) correctQ++;
  document.querySelectorAll('[data-qi="'+qi+'"][data-ii="'+ii+'"]').forEach(opt=>{
    if(opt.dataset.letter===correct) opt.classList.add('correct');
    else if(opt.classList.contains('selected')) opt.classList.add('wrong');
  });
  const expl=document.getElementById('qe-'+qi+'-'+ii);
  if(expl) expl.classList.remove('hidden');
  document.getElementById('qs-'+qi+'-'+ii).querySelector('.qnav').style.display='none';
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
