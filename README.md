# TOEFL 2026 Practice Generator

## 部署步驟（只需要做一次）

### 步驟1：把程式碼推上 GitHub

打開終端機，進入這個資料夾，執行：

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/你的帳號名稱/toefl-generator.git
git push -u origin main
```

（先在 GitHub 建一個名為 `toefl-generator` 的空 repo）

---

### 步驟2：在 Vercel 部署

1. 打開 [vercel.com](https://vercel.com)，用 GitHub 帳號登入
2. 按「Add New Project」
3. 選你的 `toefl-generator` repo
4. Framework Preset 選「Create React App」
5. 按「Deploy」

---

### 步驟3：填入環境變數

部署完成後：
1. 進入 Vercel 專案頁面
2. Settings → Environment Variables
3. 新增以下三個變數：

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | 你的 Anthropic API key（sk-ant-...） |
| `GITHUB_TOKEN` | 你的 GitHub token（ghp_...） |
| `APP_SECRET` | 自己設一個任意密碼（如 `my-secret-2026`） |
| `REACT_APP_SECRET` | 填入跟 APP_SECRET 一樣的值 |

4. 填完後回到「Deployments」，按「Redeploy」

---

### 完成！

你的工具網址會是 `https://toefl-generator-xxx.vercel.app`

---

## 之後更新出題邏輯

1. 打開 GitHub，進入你的 repo
2. 點 `src/config.js`
3. 右上角鉛筆圖示 → 編輯
4. 改完按「Commit changes」
5. Vercel 自動重新部署，2分鐘後生效
