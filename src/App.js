import { useState, useEffect } from "react";
import { SECTIONS, TOPICS, BAND_LABEL, buildSystemPrompt } from "./config";
import { generateQuestion, uploadGist } from "./api";
import { buildExamHTML } from "./buildExamHTML";

const HISTORY_KEY = "toefl2026_history";

// ─── Question Card ────────────────────────────────────────────────
function QuestionCard({ q, sectionKey, onNext, isLast }) {
  const cfg = SECTIONS[sectionKey] || SECTIONS.reading;
  const [ua, setUa] = useState({});
  const [writing, setWriting] = useState("");
  const [revealed, setReveal] = useState(false);
  const isFreeform = ["write_email", "academic_discussion"].includes(q.taskId);
  const isSpeaking = sectionKey === "speaking";

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: `1.5px solid ${cfg.color}33`, padding: 28, boxShadow: "0 2px 16px rgba(0,0,0,.07)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: cfg.color, textTransform: "uppercase", marginBottom: 4 }}>{cfg.emoji} {(q.taskId || "").replace(/_/g, " ")}</div>
          <div style={{ fontSize: 18, fontWeight: "bold", color: "#1a1a2e" }}>{q.topic}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
          <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: "bold" }}>Band {q.band}</span>
          {(q.tags || []).map(t => <span key={t} style={{ background: "#f5f5f5", color: "#777", padding: "3px 10px", borderRadius: 20, fontSize: 11 }}>#{t}</span>)}
        </div>
      </div>

      {q.scenario && <div style={{ background: "#f8f8f6", borderLeft: `4px solid ${cfg.color}`, padding: "10px 14px", borderRadius: "0 8px 8px 0", marginBottom: 16, fontSize: 13.5, color: "#555", lineHeight: 1.7 }}>💡 {q.scenario}</div>}
      {q.stimulus && <div style={{ background: "#fafaf7", border: "1px solid #e8e8e0", borderRadius: 12, padding: "18px 22px", marginBottom: 18, fontSize: 15, lineHeight: 1.95, color: "#333", fontFamily: "Georgia,serif", whiteSpace: "pre-wrap" }}>{q.stimulus}</div>}
      {q.prompt && <div style={{ fontSize: 14.5, fontWeight: 600, color: "#1a1a2e", marginBottom: 18, lineHeight: 1.6 }}>{q.prompt}</div>}

      {(q.items || []).map((item, idx) => (
        <div key={idx} style={{ marginBottom: 22 }}>
          {item.question && <div style={{ fontSize: 14, color: "#444", marginBottom: 10, fontWeight: 500, lineHeight: 1.7 }}>
            {(q.items || []).length > 1 && <span style={{ color: cfg.color, fontWeight: "bold" }}>Q{idx + 1}. </span>}{item.question}
          </div>}
          {(item.options || []).filter(o => o.trim()).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(item.options || []).map((opt, oi) => {
                const letter = String.fromCharCode(65 + oi);
                const sel = ua[idx] === letter;
                const correct = item.answer?.charAt(0).toUpperCase() === letter;
                return <button key={oi} onClick={() => !revealed && setUa({ ...ua, [idx]: letter })}
                  style={{
                    textAlign: "left", padding: "11px 15px", borderRadius: 10, cursor: revealed ? "default" : "pointer", fontSize: 14, lineHeight: 1.6, transition: "all .12s",
                    border: revealed ? (correct ? "2px solid #4caf50" : sel ? "2px solid #f44336" : "2px solid #eee") : (sel ? `2px solid ${cfg.color}` : "2px solid #eee"),
                    background: revealed ? (correct ? "#e8f5e9" : sel ? "#ffebee" : "#fafafa") : (sel ? cfg.bg : "#fafafa"),
                  }}>
                  <span style={{ fontWeight: "bold", marginRight: 8, color: revealed && correct ? "#388e3c" : revealed && sel ? "#d32f2f" : cfg.color }}>{letter}.</span>
                  {opt.replace(/^[A-D]\.\s*/, "")}
                  {revealed && correct && " ✓"}{revealed && sel && !correct && " ✗"}
                </button>;
              })}
            </div>
          ) : (!isFreeform && item.question && (
            <input value={ua[idx] || ""} onChange={e => setUa({ ...ua, [idx]: e.target.value })} placeholder={isSpeaking ? "（口語作答）" : "輸入答案..."}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${cfg.color}55`, fontSize: 14, boxSizing: "border-box", background: "#fafaf8", fontFamily: "Georgia,serif" }} />
          ))}
          {revealed && item.explanation && <div style={{ marginTop: 10, padding: "11px 14px", background: "#f0f5ff", border: "1px solid #bbdefb", borderRadius: 10, fontSize: 13, color: "#1565c0", lineHeight: 1.7 }}>📌 {item.explanation}</div>}
        </div>
      ))}

      {isFreeform && <div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>你的回答：</div>
        <textarea value={writing} onChange={e => setWriting(e.target.value)} rows={7} placeholder="在這裡輸入你的答案..."
          style={{ width: "100%", padding: 14, borderRadius: 12, border: `1.5px solid ${cfg.color}55`, fontSize: 14, lineHeight: 1.85, resize: "vertical", fontFamily: "Georgia,serif", boxSizing: "border-box", background: "#fafaf8" }} />
        <div style={{ textAlign: "right", fontSize: 12, color: "#aaa", marginTop: 3 }}>{writing.split(/\s+/).filter(Boolean).length} words</div>
      </div>}

      <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
        {!revealed && <button onClick={() => setReveal(true)} style={{ padding: "10px 22px", background: cfg.color, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>查看解答</button>}
        {revealed && onNext && <button onClick={onNext} style={{ padding: "10px 26px", background: isLast ? "#1a1a2e" : cfg.color, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>{isLast ? "✦ 完成測試" : "下一題 →"}</button>}
      </div>

      {revealed && q.model_answer && <div style={{ marginTop: 20, padding: "15px 18px", background: "#f1f8e9", border: "1px solid #c5e1a5", borderRadius: 12, fontSize: 14, lineHeight: 1.9, fontFamily: "Georgia,serif", color: "#2e4a1e", whiteSpace: "pre-wrap" }}>{q.model_answer}</div>}
      {revealed && q.scoring_rubric && <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[["band_6", "Band 6", "#1b5e20", "#e8f5e9"], ["band_4", "Band 4", "#e65100", "#fff3e0"], ["band_2", "Band 2", "#b71c1c", "#ffebee"]].map(([k, l, c, bg]) =>
          q.scoring_rubric[k] && <div key={k} style={{ padding: 12, background: bg, borderRadius: 10, border: `1px solid ${c}33` }}>
            <div style={{ fontSize: 11, fontWeight: "bold", color: c, marginBottom: 5 }}>{l}</div>
            <div style={{ fontSize: 12, color: "#444", lineHeight: 1.6 }}>{q.scoring_rubric[k]}</div>
          </div>)}
      </div>}
      {revealed && q.tips && <div style={{ marginTop: 14, padding: "11px 14px", background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, fontSize: 13, color: "#795548", lineHeight: 1.7 }}>🇹🇼 {q.tips}</div>}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [section, setSection]         = useState("reading");
  const [band, setBand]               = useState(4);
  const [topic, setTopic]             = useState("");
  const [mode, setMode]               = useState("setup");
  const [questions, setQuestions]     = useState([]);
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [genProgress, setGenProgress] = useState({ done: 0, total: 0 });
  const [genError, setGenError]       = useState("");
  const [history, setHistory]         = useState([]);
  const [shareUrl, setShareUrl]       = useState("");
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [copied, setCopied]           = useState(false);
  const [examLog, setExamLog]         = useState([]); // history of generated exams

  useEffect(() => {
    try {
      const h = localStorage.getItem(HISTORY_KEY);
      if (h) setHistory(JSON.parse(h));
      const log = localStorage.getItem("toefl2026_examlog");
      if (log) setExamLog(JSON.parse(log));
    } catch {}
  }, []);

  const saveHistory = (entries) => {
    const updated = [...history, ...entries].slice(-60);
    setHistory(updated);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
  };

  const saveExamLog = (entry) => {
    const updated = [entry, ...examLog].slice(0, 50);
    setExamLog(updated);
    try { localStorage.setItem("toefl2026_examlog", JSON.stringify(updated)); } catch {}
  };

  const startTest = async () => {
    const tasks = SECTIONS[section].tasks;
    const chosenTopic = topic || TOPICS[section][Math.floor(Math.random() * TOPICS[section].length)];
    setMode("generating");
    setGenProgress({ done: 0, total: tasks.length });
    setQuestions([]); setGenError(""); setCurrentIdx(0);
    setShareUrl(""); setUploadError("");

    const generated = [];
    const systemPrompt = buildSystemPrompt(history);

    for (let i = 0; i < tasks.length; i++) {
      try {
        const userPrompt = `請出一道2026 TOEFL練習題：\nSection:${section}\nTask:${tasks[i].label}(id:${tasks[i].id})\nTopic:${chosenTopic}\nBand:${band}(${BAND_LABEL[band]})\n嚴格按照${tasks[i].id}格式，內容原創。`;
        const q = await generateQuestion(systemPrompt, userPrompt);
        generated.push(q);
        setQuestions([...generated]);
        setGenProgress({ done: i + 1, total: tasks.length });
      } catch (e) {
        setGenError(`第${i + 1}題（${tasks[i].label}）生成失敗：${e.message}`);
        setMode("setup"); return;
      }
    }

    saveHistory(generated.map(q => ({ section, taskId: q.taskId, topic: q.topic || chosenTopic, band: q.band || band, tags: q.tags || [] })));
    setMode("testing");
  };

  const handleUpload = async (qs) => {
    setUploading(true); setUploadError(""); setShareUrl("");
    try {
      const html = buildExamHTML(section, qs, band);
      const filename = `toefl-2026-${section}-band${band}-${Date.now()}.html`;
      const { previewUrl } = await uploadGist(filename, html);
      setShareUrl(previewUrl);
      saveExamLog({
        section, band,
        topic: qs[0]?.topic || "",
        url: previewUrl,
        date: new Date().toLocaleDateString("zh-TW"),
      });
    } catch (e) { setUploadError("上傳失敗：" + e.message); }
    setUploading(false);
  };

  const cfg = SECTIONS[section];

  // ── Setup ──
  if (mode === "setup") return (
    <div style={{ fontFamily: "Georgia,'Noto Serif TC',serif", minHeight: "100vh", background: "#FAF9F6" }}>
      <div style={{ background: "#1a1a2e", padding: "18px 32px" }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: "#8888aa", textTransform: "uppercase", marginBottom: 3 }}>2026 New Format</div>
        <div style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>TOEFL iBT Practice Generator</div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "start" }}>
        {/* Left: Generator */}
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
            {Object.entries(SECTIONS).map(([k, s]) => (
              <button key={k} onClick={() => { setSection(k); setTopic(""); }}
                style={{ padding: "10px 20px", borderRadius: 40, border: section === k ? `2px solid ${s.color}` : "2px solid #e0e0e0", background: section === k ? s.bg : "#fff", color: section === k ? s.color : "#888", fontWeight: section === k ? "bold" : "normal", cursor: "pointer", fontSize: 14, transition: "all .13s" }}>
                {s.emoji} {s.label}
              </button>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${cfg.color}33`, padding: 24, boxShadow: "0 2px 14px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize: 12, fontWeight: "bold", color: cfg.color, textTransform: "uppercase", letterSpacing: 2, marginBottom: 18 }}>
              一次生成全部 {cfg.tasks.length} 個題型：
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
              {cfg.tasks.map((t, i) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 14px", background: cfg.bg, borderRadius: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: cfg.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "bold", flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: cfg.color }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 6 }}>Topic</label>
                <select value={topic} onChange={e => setTopic(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #ddd", fontSize: 13, background: "#fafafa" }}>
                  <option value="">🎲 隨機</option>
                  {TOPICS[section].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#666", display: "block", marginBottom: 6 }}>目標 Band</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="range" min={1} max={6} value={band} onChange={e => setBand(Number(e.target.value))} style={{ flex: 1, accentColor: cfg.color }} />
                  <span style={{ minWidth: 80, fontSize: 12, background: cfg.bg, color: cfg.color, padding: "4px 10px", borderRadius: 8, fontWeight: "bold", textAlign: "center" }}>Band {band}</span>
                </div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>{BAND_LABEL[band]}</div>
              </div>
            </div>
            {genError && <div style={{ padding: 12, background: "#fff0f0", borderRadius: 8, color: "#c62828", fontSize: 13, marginBottom: 14 }}>{genError}</div>}
            <button onClick={startTest}
              style={{ width: "100%", padding: 14, background: cfg.color, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: "bold", cursor: "pointer" }}>
              ✦ 開始生成完整測試（{cfg.tasks.length} 題型）
            </button>
          </div>
        </div>

        {/* Right: Exam log */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8e8e0", padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: "bold", color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>📋 已產生的考卷</div>
          {examLog.length === 0 ? (
            <div style={{ fontSize: 13, color: "#bbb", textAlign: "center", padding: "20px 0" }}>還沒有考卷</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {examLog.map((e, i) => {
                const s = SECTIONS[e.section];
                return (
                  <div key={i} style={{ padding: "10px 12px", background: "#fafaf8", borderRadius: 10, border: "1px solid #f0f0ec" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: "bold", color: s?.color }}>{s?.emoji} {s?.label}</span>
                      <span style={{ fontSize: 11, color: "#bbb" }}>{e.date}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Band {e.band} · {e.topic}</div>
                    <a href={e.url} target="_blank" rel="noreferrer"
                      style={{ display: "block", fontSize: 12, color: "#fff", background: s?.color, padding: "5px 10px", borderRadius: 6, textDecoration: "none", textAlign: "center", fontWeight: "bold" }}>
                      開啟考卷 ↗
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Generating ──
  if (mode === "generating") return (
    <div style={{ fontFamily: "Georgia,serif", minHeight: "100vh", background: "#FAF9F6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>{cfg.emoji}</div>
      <div style={{ fontSize: 18, fontWeight: "bold", color: "#1a1a2e", marginBottom: 8 }}>正在生成 {cfg.label} 完整測試...</div>
      <div style={{ fontSize: 14, color: "#888", marginBottom: 28 }}>{genProgress.done} / {genProgress.total} 題型完成</div>
      <div style={{ width: 300, height: 8, background: "#e0e0e0", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ width: `${genProgress.total ? genProgress.done / genProgress.total * 100 : 0}%`, height: "100%", background: cfg.color, borderRadius: 10, transition: "width .4s" }} />
      </div>
      <div style={{ marginTop: 18, fontSize: 13, color: "#aaa" }}>
        {genProgress.done < genProgress.total ? `生成中：${cfg.tasks[genProgress.done]?.label}...` : "完成！"}
      </div>
      <button onClick={() => { setMode("setup"); setGenError(""); }}
        style={{ marginTop: 32, padding: "9px 24px", background: "transparent", color: "#aaa", border: "1px solid #ddd", borderRadius: 10, cursor: "pointer", fontSize: 13 }}>
        取消
      </button>
    </div>
  );

  // ── Testing (teacher preview) ──
  if (mode === "testing") {
    const q = questions[currentIdx];
    const isLast = currentIdx === questions.length - 1;
    return (
      <div style={{ fontFamily: "Georgia,'Noto Serif TC',serif", minHeight: "100vh", background: "#FAF9F6" }}>
        <div style={{ background: "#1a1a2e", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ color: "#fff", fontWeight: "bold" }}>{cfg.emoji} {cfg.label} · Band {band} <span style={{ fontWeight: "normal", color: "#888", fontSize: 12, marginLeft: 8 }}>預覽模式</span></div>
          <div style={{ display: "flex", gap: 8 }}>
            {questions.map((_, i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: "bold", background: i < currentIdx ? "#4caf50" : i === currentIdx ? cfg.color : "rgba(255,255,255,.15)" }}>{i + 1}</div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 20px" }}>
          <div style={{ fontSize: 12, color: "#aaa", marginBottom: 16 }}>題型 {currentIdx + 1} / {questions.length} — {cfg.tasks[currentIdx]?.label}</div>
          <QuestionCard key={currentIdx} q={q} sectionKey={section}
            onNext={isLast ? () => setMode("done") : () => { setCurrentIdx(i => i + 1); setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50); }}
            isLast={isLast} />
        </div>
      </div>
    );
  }

  // ── Done ──
  return (
    <div style={{ fontFamily: "Georgia,'Noto Serif TC',serif", minHeight: "100vh", background: "#FAF9F6" }}>
      <div style={{ background: "#1a1a2e", padding: "22px 32px" }}>
        <div style={{ fontSize: 21, fontWeight: "bold", color: "#fff" }}>{cfg.emoji} 測試生成完成！</div>
      </div>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 21, fontWeight: "bold", color: "#1a1a2e", marginBottom: 6 }}>{cfg.label} 測試已完成</div>
          <div style={{ fontSize: 14, color: "#888", marginBottom: 14 }}>Band {band} · {BAND_LABEL[band]}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            {cfg.tasks.map(t => <span key={t.id} style={{ background: cfg.bg, color: cfg.color, padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: "bold" }}>✓ {t.label}</span>)}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: `2px solid ${cfg.color}`, padding: 26, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: "bold", color: cfg.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>🔗 產生學生分享連結</div>

          {!shareUrl ? (
            <>
              {uploadError && <div style={{ padding: "10px 14px", background: "#fff0f0", borderRadius: 10, fontSize: 13, color: "#c62828", marginBottom: 14 }}>{uploadError}</div>}
              <button onClick={() => handleUpload(questions)} disabled={uploading}
                style={{ width: "100%", padding: "13px", background: uploading ? "#aaa" : cfg.color, color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: "bold", cursor: uploading ? "not-allowed" : "pointer" }}>
                {uploading ? "⏳ 上傳中..." : "⬆ 一鍵上傳，產生分享連結"}
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 10, lineHeight: 1.7 }}>複製以下連結傳給學生，點開即可直接作答：</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input readOnly value={shareUrl} onClick={e => e.target.select()}
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", fontSize: 12, background: "#f8f8f8", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }} />
                <button onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
                  style={{ padding: "10px 18px", background: copied ? "#4caf50" : cfg.color, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: "bold", whiteSpace: "nowrap", transition: "background .2s" }}>
                  {copied ? "已複製 ✓" : "複製"}
                </button>
              </div>
              <a href={shareUrl} target="_blank" rel="noreferrer"
                style={{ display: "block", textAlign: "center", padding: "10px", background: "#f5f5f5", color: "#333", border: "1px solid #ddd", borderRadius: 10, fontSize: 13, fontWeight: "bold", textDecoration: "none" }}>
                預覽考卷 ↗
              </a>
              <div style={{ marginTop: 10, fontSize: 12, color: "#aaa", textAlign: "center" }}>學生點開連結直接作答，不需要帳號。</div>
            </>
          )}
        </div>

        <div style={{ textAlign: "center" }}>
          <button onClick={() => { setMode("setup"); setQuestions([]); setCurrentIdx(0); setShareUrl(""); setGenError(""); setUploadError(""); }}
            style={{ padding: "12px 36px", background: "#fff", color: "#555", border: "2px solid #ddd", borderRadius: 12, fontSize: 14, cursor: "pointer" }}>
            ← 再出一份新測試
          </button>
        </div>
      </div>
    </div>
  );
}
