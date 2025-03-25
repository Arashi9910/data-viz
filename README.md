# 數據可視化儀表板

這是一個用於展示品牌銷售數據和賣場瀏覽數據的可視化儀表板專案。

## 特點

- 品牌銷售數據儀表板
- 賣場瀏覽數據儀表板
- 即時數據更新功能
- 互動式圖表（支持縮放和平移）

## 技術架構

- 前端：Next.js + React
- 樣式：Tailwind CSS
- 圖表：Chart.js
- API服務：Express.js + Axios

## 部署方式

### 前端部署 (GitHub Pages)

1. 構建項目：
   ```
   npm run build
   ```

2. 創建 `.nojekyll` 文件：
   ```
   cd out && type nul > .nojekyll
   ```

3. 部署到 GitHub Pages：
   ```
   git add out/
   git commit -m "Deploy to gh-pages"
   git subtree push --prefix out origin gh-pages
   ```

### API 服務部署 (Vercel)

1. 進入 API 服務目錄：
   ```
   cd api-service
   ```

2. 部署到 Vercel：
   ```
   npm run deploy
   ```

## 數據更新

儀表板通過以下方式獲取數據：

1. 品牌數據：`https://api-service-lins-projects-913ae17f.vercel.app/api/fetch-brand-data`
2. 賣場數據：`https://api-service-lins-projects-913ae17f.vercel.app/api/fetch-view-data`

數據源為 Google Sheets，可通過儀表板上的刷新按鈕手動更新，或開啟自動刷新功能。

## 開發指南

1. 安裝依賴：
   ```
   npm install
   ```

2. 啟動開發服務器：
   ```
   npm run dev
   ```

3. 開發環境訪問：
   ```
   http://localhost:3000
   ```

## 功能

- 從Google Sheets獲取數據
- 顯示銷售趨勢和營業額增長率
- 品牌比較分析和營業額趨勢圖
- 響應式設計，適用於不同設備

## 部署選項

### 方案1: 使用Vercel部署（推薦）

Vercel是Next.js的官方推薦平台，提供完整支持和最佳性能。

```bash
# 部署到Vercel
npm run deploy
```

部署後，Vercel會提供一個URL訪問你的應用。API路由會自動處理，無需額外配置。

### 方案2: 靜態導出（僅供本地測試）

如果只需在本地測試，可以使用靜態導出：

```bash
# 生成靜態文件
npm run export

# 在本地預覽
npx http-server out
```

注意：靜態導出版本不支持API功能，無法獲取Google Sheets數據。

## 開發指南

### 安裝依賴

```bash
npm install
```

### 開發環境

```bash
npm run dev
```

### 配置Google Sheets

1. 確保你的Google Sheet是公開的（"Anyone with the link can view"）
2. 在`pages/api/fetch-sheet-data.js`文件中配置默認的Sheet ID和GID
3. 或者在查詢參數中提供這些值：`/api/fetch-sheet-data?sheetId=YOUR_SHEET_ID&gid=0`

## 功能說明

### 營業額趨勢圖

- 顯示各品牌的營業額趨勢
- 默認展示銷售額最高的前5個品牌
- 可通過圖例切換不同品牌的顯示

### 營業額成長趨勢

- 顯示月度營業額成長數額和成長率
- 通過柱狀圖和折線圖同時展示兩種數據

### 品牌比較分析

- 選擇不同品牌進行對比
- 在指定時間範圍內比較品牌表現

## 故障排除

如果遇到"獲取數據時出錯，請確保Google Sheet是公開的"：

1. 檢查Google Sheet是否設置為公開
2. 確保網絡連接正常
3. 檢查Sheet ID和GID是否正確 