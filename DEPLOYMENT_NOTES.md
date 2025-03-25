# 數據可視化儀表板 - 部署筆記

## 部署平台

這個項目使用 **Vercel** 部署，而不是 Netlify。Vercel 是 Next.js 的官方推薦部署平台，提供完整的 API 路由支持。

## 部署步驟

1. **準備部署**
   ```bash
   # 確保所有更改已提交
   git add .
   git commit -m "準備部署"
   
   # 使用 Vercel 部署
   npm run deploy
   ```

2. **部署網址**
   最新部署網址：`https://data-oudjutuxz-lins-projects-913ae17f.vercel.app/sheet-data`

## 項目結構

關鍵文件：

- `pages/sheet-data.js` - 主要數據可視化頁面
  - 包含品牌營業額趨勢圖
  - 包含營業額成長趨勢圖
  - 包含品牌比較功能

- `pages/api/fetch-sheet-data.js` - API 路由
  - 負責從 Google Sheets 獲取數據
  - 進行數據處理和分析
  - 返回結構化數據給前端

- `components/` - UI 組件
  - `LineChart.js`, `BarChart.js`, `PieChart.js` - 圖表組件
  - `Header.js` - 頁面頂部導航

## 新功能：品牌營業額趨勢圖

### 功能說明

- 顯示每個品牌的營業額隨時間的變化趨勢
- 默認顯示銷售額最高的前5個品牌
- 可通過圖例切換顯示/隱藏品牌
- 包含總營業額趨勢線作為比較基準

### 實現方式

- 通過 `processBrandSalesTrend` 函數處理數據
- 選擇熱門品牌並創建對應的數據集
- 使用 LineChart 組件顯示

## 修改記錄

1. **新增功能**：品牌營業額趨勢圖
   - 添加了 `processBrandSalesTrend` 函數處理品牌銷售趨勢
   - 在 UI 中新增趨勢圖展示

2. **優化**：營業額成長趨勢圖
   - 將營業額成長數和成長比分離展示
   - 優化圖表顯示效果

3. **改進**：品牌選擇界面
   - 改善品牌篩選和選擇功能
   - 過濾無效的品牌名稱

## 數據獲取流程

1. 前端透過 `/api/fetch-sheet-data` API 獲取數據
2. API 從 Google Sheets 獲取原始數據
3. 在服務器端進行數據處理和分析
4. 返回結構化數據給前端
5. 前端進行圖表渲染和展示

## 故障排除

### 常見問題

1. **數據獲取錯誤**
   - 確保 Google Sheet 設為公開訪問
   - 檢查網路連接
   - 檢查 Sheet ID 和 GID 是否正確

2. **圖表不顯示**
   - 檢查瀏覽器控制台是否有錯誤
   - 確認數據格式是否符合預期

3. **部署問題**
   - 使用 `npm run deploy` 重新部署
   - 檢查 Vercel 儀表板中的部署日誌

## 重要提醒

- 所有 API 請求應使用 `/api/fetch-sheet-data` 而非 Netlify 函數端點
- Vercel 部署會自動處理 API 路由，無需額外配置
- 如需本地預覽，使用 `npm run dev` 啟動開發服務器 