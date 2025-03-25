# 數據可視化儀表板部署筆記

## 快速部署步驟

1. 確認代碼更新已完成
2. 打開終端機 (PowerShell)
3. 切換到專案目錄：`cd C:\Users\arashi\Desktop\data-viz`
4. 執行部署命令：`npm run deploy`
5. 等待部署完成，記錄新的部署網址

## 部署輸出示例

```
PS C:\Users\arashi\Desktop\data-viz> npm run deploy
> data-viz@1.0.0 deploy
> vercel --prod
Vercel CLI 41.3.2
🔍  Inspect: https://vercel.com/lins-projects-913ae17f/data-viz/6mwQi2MC4aSvNoDHJjvMAyvGVGrD [2s]
✅  Production: https://data-5p7mbqb1e-lins-projects-913ae17f.vercel.app [2s]
❗️  Due to `builds` existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply. Learn More: https://vercel.link/unused-build-settings
```

## 環境準備檢查清單

- [ ] Node.js 安裝正確 (檢查：`node -v`)
- [ ] npm 可用 (檢查：`npm -v`)
- [ ] Vercel CLI 已安裝 (檢查：`vercel --version`)
- [ ] 已登入 Vercel 帳號 (如未登入，執行：`vercel login`)

## 部署前檢查清單

- [ ] 所有代碼變更已測試可正常工作
- [ ] Google Sheets 連接正常且權限設置為公開可訪問
- [ ] API 端點功能正常 (`/api/fetch-sheet-data` 和 `/api/fetch-view-data`)
- [ ] 環境變量已正確配置
- [ ] 自動刷新功能已測試

## 常見問題與解決方法

### 1. 部署失敗

**檢查步驟：**
1. 查看終端機錯誤信息
2. 查看詳細日誌：`vercel logs 部署網址`
3. 確認是否有語法錯誤或遺漏檔案

**常見解決方案：**
- 確保所有依賴項都已在 package.json 中列出
- 檢查代碼語法錯誤
- 確認 API 密鑰和環境變量設置正確

### 2. Google Sheets 數據無法讀取

**檢查步驟：**
1. 確認 Google Sheet 是公開的
2. 測試 API 端點 `/api/fetch-view-data` 或 `/api/fetch-sheet-data`
3. 檢查 Sheet ID 和 GID 參數是否正確

**解決方案：**
- 調整 Google Sheets 權限為"任何人都可查看"
- 更新 API 代碼中的 Sheet ID 和 GID
- 檢查網絡連接和 CORS 設置

### 3. Vercel 警告訊息

如看到以下警告，可忽略：
```
❗️  Due to `builds` existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply.
```
這是因為項目使用了自定義的 vercel.json 配置。

## 常用命令參考

```bash
# 本地開發測試
npm run dev

# 查看部署歷史
vercel list

# 特定部署的詳細日誌
vercel logs [部署網址]

# 重新部署
npm run deploy
```

## 新功能說明

### 自動刷新機制

在賣場數據頁面 (/view-data) 已實現兩種數據刷新方式：

1. **手動刷新**：頁面頂部的"刷新數據"按鈕，可隨時獲取最新數據
2. **自動刷新**：啟用後每5分鐘自動獲取一次最新數據

數據刷新不會重載整個頁面，只更新頁面中的數據和圖表。

## 重要資源連結

- 數據儀表板主頁：https://data-5p7mbqb1e-lins-projects-913ae17f.vercel.app
- 品牌數據頁面：https://data-5p7mbqb1e-lins-projects-913ae17f.vercel.app/sheet-data
- 賣場數據頁面：https://data-5p7mbqb1e-lins-projects-913ae17f.vercel.app/view-data
- 專案管理頁面：https://vercel.com/lins-projects-913ae17f/data-viz

## 檔案結構備忘

```
/pages
  /api
    fetch-sheet-data.js  - 品牌銷售數據API
    fetch-view-data.js   - 賣場瀏覽數據API
  sheet-data.js          - 品牌數據頁面
  view-data.js           - 賣場數據頁面
/components
  Header.js              - 頁面頭部組件
  LineChart.js           - 折線圖組件
  PieChart.js            - 圓餅圖組件
package.json             - 專案配置
vercel.json              - 部署配置
```

---

*最後更新：2023年7月10日* 