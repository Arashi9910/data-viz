import axios from 'axios';

export default async function handler(req, res) {
  try {
    // 執行初始檢查
    const directCheck = await fetchDirectCSVData();
    console.log("直接訪問檢查結果:", directCheck.success ? "成功" : directCheck.message);
    
    // 檢查請求參數，支持動態sheet ID
    const requestedSheetId = req.query.sheetId;
    
    // 從您的 Google Sheet 獲取表格 ID
    const sheetId = requestedSheetId || '1-SDpG2WKJ4WyLNR2bQn5YtVXtidB8fC0fuj6h1MlkbI';
    
    // 表格中的工作表 ID (gid)，支持動態gid
    const gid = req.query.gid || '483830182';
    
    // 添加調試參數和查詢選項
    const debug = req.query.debug === 'true';
    const method = req.query.method || 'auto'; // 'auto', 'vis', 'csv'
    const timeout = parseInt(req.query.timeout) || 20000; // 超時設定，默認20秒
    
    console.log(`開始獲取數據: sheetId=${sheetId}, gid=${gid}, method=${method}, timeout=${timeout}ms`);
    
    // 檢查連接性
    const internetCheck = await checkInternetConnection();
    if (!internetCheck.ok) {
      console.error("網絡連接檢查失敗:", internetCheck.error);
      return res.status(500).json({
        error: "網絡連接問題，無法連接到Google服務",
        details: internetCheck.error,
        suggestions: [
          "請檢查您的網絡連接",
          "如果使用VPN，請嘗試關閉它",
          "確認您可以在瀏覽器中訪問Google服務"
        ]
      });
    }
    
    // 檢查Google Sheet是否可以訪問
    const sheetCheck = await checkSheetAccessibility(sheetId);
    if (!sheetCheck.ok) {
      console.error("Google Sheet訪問檢查失敗:", sheetCheck.error);
      return res.status(403).json({
        error: "無法訪問指定的Google Sheet",
        details: sheetCheck.error,
        googleError: sheetCheck.googleError,
        suggestions: [
          "確保您的Google Sheet已設為公開共享",
          "確保權限設置為「知道連結的任何人都可以查看」",
          "檢查Sheet ID是否正確",
          "如果使用Google Workspace帳戶，可能需要特殊的共享設置"
        ]
      });
    }
    
    // 根據指定方法選擇數據獲取方式
    if (method === 'csv' || method === 'auto') {
      try {
        console.log(`嘗試使用CSV方法獲取數據...`);
        const result = await fetchUsingCSVMethod(sheetId, gid, timeout);
        if (result && result.data && result.data.length > 0) {
          console.log(`成功使用 CSV 方法獲取數據: ${result.data.length} 行`);
          const response = await processData(result.data, debug);
          return res.status(200).json(response);
        } else if (method === 'csv') {
          throw new Error('CSV 方法未返回有效數據');
        }
      } catch (csvError) {
        console.error('CSV 方法失敗:', csvError);
        if (method === 'csv') {
          throw csvError;
        }
      }
    }
    
    if (method === 'vis' || method === 'auto') {
      try {
        console.log(`嘗試使用Visualization API方法獲取數據...`);
        const result = await fetchUsingVisualizationAPIMethod(sheetId, gid, timeout);
        if (result && result.data && result.data.length > 0) {
          console.log(`成功使用 Visualization API 方法獲取數據: ${result.data.length} 行`);
          const response = await processData(result.data, debug);
          return res.status(200).json(response);
        } else {
          throw new Error('Visualization API 方法未返回有效數據');
        }
      } catch (visError) {
        console.error('Visualization API 方法失敗:', visError);
        throw visError;
      }
    }
    
    // 使用第三種方法: Google Sheets API (如果可用)
    try {
      console.log(`嘗試使用Google Sheets API方法獲取數據...`);
      const result = await fetchUsingGoogleSheetsAPI(sheetId, gid, timeout);
      if (result && result.data && result.data.length > 0) {
        console.log(`成功使用Google Sheets API方法獲取數據: ${result.data.length} 行`);
        const response = await processData(result.data, debug);
        return res.status(200).json(response);
      }
    } catch (apiError) {
      console.error('Google Sheets API方法失敗:', apiError);
      // 繼續處理失敗情況
    }
    
    // 如果所有方法都失敗，返回示例數據
    console.log('所有方法都失敗，返回示例數據');
    const exampleData = generateExampleData();
    const response = await processData(exampleData, debug);
    response.isExampleData = true;
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    // 提供更詳細的錯誤信息
    let errorMessage = '獲取數據時出錯，請確保 Google Sheet 是公開的';
    let errorDetails = [];
    let suggestions = [
      "確保您的Google Sheet已設為公開（點擊右上角的「共用」按鈕）",
      "將權限設置為「知道連結的任何人都可以查看」",
      "確保表格中包含預期的數據格式",
      "檢查網絡連接是否正常",
      "如果使用VPN，請嘗試關閉它", 
      "嘗試使用調試模式: 在網址後添加 ?debug=true",
      "嘗試直接訪問您的Google Sheet來確認它是公開的"
    ];
    
    if (error.response) {
      // 伺服器返回了錯誤狀態碼
      errorMessage += `\n伺服器返回了錯誤狀態碼: ${error.response.status}`;
      errorDetails.push(`錯誤狀態: ${error.response.status}`);
      
      if (error.response.data) {
        errorDetails.push(`錯誤詳情: ${JSON.stringify(error.response.data)}`);
      }
      
      // 根據狀態碼提供更具體的建議
      if (error.response.status === 403) {
        suggestions.unshift("此Google Sheet需要授權訪問，請確保將其設置為「知道連結的任何人都可以查看」");
      } else if (error.response.status === 404) {
        suggestions.unshift("找不到指定的Google Sheet，請檢查ID是否正確");
      } else if (error.response.status === 429) {
        suggestions.unshift("請求過多，請稍後再試");
      }
    } else if (error.request) {
      // 請求已發出，但沒有收到響應
      errorMessage += '\n沒有收到伺服器響應，請檢查網絡連接或 Google Sheets 服務可用性';
      errorDetails.push("無響應錯誤: 請求已發送但未收到回應");
      suggestions.unshift("請檢查您的網絡連接和防火牆設置");
    } else {
      // 在設置請求時出現錯誤
      errorMessage += `\n錯誤詳情: ${error.message}`;
      errorDetails.push(`錯誤信息: ${error.message}`);
    }
    
    res.status(500).json({ 
      error: errorMessage, 
      details: errorDetails,
      suggestions: suggestions,
      googleSheetUrl: `https://docs.google.com/spreadsheets/d/1-SDpG2WKJ4WyLNR2bQn5YtVXtidB8fC0fuj6h1MlkbI/edit`,
      diagnosticInfo: {
        timestamp: new Date().toISOString(),
        requestQuery: req.query,
        errorName: error.name,
        errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
}

// 檢查網絡連接
async function checkInternetConnection() {
  try {
    // 嘗試連接到Google
    const response = await axios.get('https://www.google.com', { 
      timeout: 5000,
      validateStatus: () => true // 接受任何狀態碼
    });
    
    if (response.status >= 200 && response.status < 400) {
      return { ok: true };
    } else {
      return { 
        ok: false, 
        error: `無法訪問Google.com，狀態碼: ${response.status}` 
      };
    }
  } catch (error) {
    return { 
      ok: false, 
      error: `網絡連接檢查失敗: ${error.message}` 
    };
  }
}

// 檢查Google Sheet可訪問性
async function checkSheetAccessibility(sheetId) {
  try {
    // 嘗試獲取Google Sheet的基本信息
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
    
    const response = await axios.head(url, { 
      timeout: 5000,
      validateStatus: () => true, // 接受任何狀態碼
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (response.status >= 200 && response.status < 400) {
      return { ok: true };
    } else {
      return { 
        ok: false, 
        error: `無法訪問Google Sheet，狀態碼: ${response.status}`,
        googleError: response.data || '沒有錯誤詳情'
      };
    }
  } catch (error) {
    return { 
      ok: false, 
      error: `訪問Google Sheet失敗: ${error.message}`,
      googleError: error.response?.data || '沒有錯誤詳情'
    };
  }
}

// 處理獲取到的數據
async function processData(data, debug = false) {
  try {
    console.log(`處理數據: ${data.length} 行`);
    
    // 如果是調試模式，打印一些數據樣本
    if (debug) {
      console.log("數據樣本（前3行）:", data.slice(0, 3));
      // 打印數據中的列名
      if (data.length > 0) {
        console.log("列名:", Object.keys(data[0]));
      }
    }
    
    // 識別月份標記行
    let monthRows = findMonthRows(data);
    console.log(`找到 ${monthRows.length} 個月份標記行`);
    
    // 如果沒有找到月份標記行，嘗試從數據中推斷
    if (monthRows.length === 0) {
      console.log('未找到月份標記行，嘗試從數據中推斷');
      monthRows = inferMonthRows(data);
    }
    
    // 如果仍然沒有月份標記，創建一個默認月份
    if (monthRows.length === 0) {
      console.log('創建默認月份');
      const defaultMonth = {
        index: 0,
        month: '此紀錄為當前月份(30天內)',
      };
      monthRows = [defaultMonth];
    }
    
    // 將數據按月份分組
    const groupedByMonth = {};
    
    for (let i = 0; i < monthRows.length; i++) {
      const currentMonthRow = monthRows[i];
      const nextMonthRow = monthRows[i + 1];
      
      const startIndex = currentMonthRow.index + 1;
      const endIndex = nextMonthRow ? nextMonthRow.index : data.length;
      
      const monthData = data.slice(startIndex, endIndex).filter(row => {
        // 過濾有效數據行
        return row && row['品牌'] && 
               (row['商品數'] !== undefined && row['商品數'] !== null) &&
               (row['動銷率'] !== undefined && row['動銷率'] !== null);
      });
      
      groupedByMonth[currentMonthRow.month] = monthData;
    }
    
    // 檢查是否有有效的分組數據
    if (Object.keys(groupedByMonth).length === 0) {
      console.log('沒有有效的分組數據，嘗試直接將所有數據放在一個默認月份');
      
      // 直接將所有有效數據放在一個默認月份
      const validData = data.filter(row => {
        return row && row['品牌'] && 
               (row['商品數'] !== undefined && row['商品數'] !== null) &&
               (row['動銷率'] !== undefined && row['動銷率'] !== null);
      });
      
      if (validData.length > 0) {
        groupedByMonth['此紀錄為當前月份(30天內)'] = validData;
      }
    }
    
    // 計算每個月份的匯總數據和成長率
    const monthlySummary = calculateMonthlySummary(groupedByMonth);
    
    // 準備所有品牌列表（用於前端篩選）
    const allBrands = extractAllBrands(groupedByMonth);
    
    return { 
      data: data, 
      groupedData: groupedByMonth,
      monthlySummary: monthlySummary,
      allBrands: allBrands,
      dataSource: 'processed_data',
      monthRows: debug ? monthRows : undefined,
      debug: debug ? { 
        dataStructure: data.length > 0 ? Object.keys(data[0]) : [],
        dataSample: data.slice(0, 3),
        groupedMonths: Object.keys(groupedByMonth),
        groupedDataSummary: Object.entries(groupedByMonth).map(([month, data]) => ({ 
          month, 
          count: data.length 
        }))
      } : undefined
    };
  } catch (error) {
    console.error('處理數據時出錯:', error);
    throw error;
  }
}

// 查找月份標記行
function findMonthRows(data) {
  try {
    const monthRows = [];
    
    data.forEach((row, index) => {
      // 檢查是否是月份標記行
      const isMonthMarker = row && row['屬性'] && typeof row['屬性'] === 'string' && 
                          (row['屬性'].includes('此紀錄為') || 
                           row['屬性'].includes('天內') || 
                           row['屬性'].match(/\d+\/\d+~\d+\/\d+/));
      
      if (isMonthMarker) {
        monthRows.push({
          index: index,
          month: row['屬性'].trim(),
        });
      }
    });
    
    return monthRows;
  } catch (error) {
    console.error('查找月份標記行時出錯:', error);
    return [];
  }
}

// 從數據中推斷月份
function inferMonthRows(data) {
  try {
    // 根據排名變化或其他模式推斷月份
    const possibleBreaks = [];
    
    // 尋找排名重置為1的地方（可能是新月份的開始）
    for (let i = 1; i < data.length; i++) {
      const currentRow = data[i];
      const prevRow = data[i - 1];
      
      // 排名從高變到1可能表示新月份開始
      if (currentRow['排名/依動銷率'] === '1' && 
          prevRow['排名/依動銷率'] && 
          parseInt(prevRow['排名/依動銷率']) > 1) {
        possibleBreaks.push(i - 1);  // 月份標記通常在前一行
      }
    }
    
    // 根據推斷的分隔點創建月份標記
    return possibleBreaks.map((breakIndex, i) => ({
      index: breakIndex,
      month: `此紀錄為推斷月份${i + 1}(30天內)`,
    }));
  } catch (error) {
    console.error('推斷月份時出錯:', error);
    return [];
  }
}

// 使用 CSV 方法獲取數據
async function fetchUsingCSVMethod(sheetId, gid, timeout = 15000) {
  try {
    console.log("使用 CSV 方法獲取數據...");
    
    // 使用 CSV 導出
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    
    console.log("CSV URL:", csvUrl);
    
    const response = await axios.get(csvUrl, {
      responseType: 'text',
      timeout: timeout,
      headers: {
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/csv,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    // 檢查響應
    if (response.status !== 200) {
      throw new Error(`CSV方法返回無效狀態碼: ${response.status}`);
    }
    
    if (!response.data || response.data.trim() === '') {
      throw new Error('CSV方法返回的數據為空');
    }
    
    // 檢查返回的內容是否為錯誤頁面而不是CSV
    if (response.data.includes('<!DOCTYPE html>') || 
        response.data.includes('<html') || 
        response.data.includes('</html>')) {
      throw new Error('接收到HTML而非CSV數據，可能是權限錯誤或無效的表格ID');
    }
    
    // 解析 CSV 數據
    const parsedData = parseCSV(response.data);
    
    if (!parsedData || parsedData.length === 0) {
      throw new Error('解析CSV數據失敗，未找到有效數據');
    }
    
    console.log(`CSV方法成功，解析了 ${parsedData.length} 行數據`);
    return { data: parsedData, source: 'csv' };
  } catch (error) {
    console.error('使用 CSV 方法獲取數據時出錯:', error);
    throw error;
  }
}

// 使用 Visualization API 方法獲取數據
async function fetchUsingVisualizationAPIMethod(sheetId, gid, timeout = 15000) {
  try {
    console.log("使用 Visualization API 方法獲取數據...");
    
    // 方法1: 使用 Google Visualization API
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
    
    console.log("Visualization API URL:", url);
    
    const response = await axios.get(url, {
      responseType: 'text',
      timeout: timeout,
      headers: {
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    // 檢查響應狀態碼和內容
    if (response.status !== 200) {
      throw new Error(`Visualization API返回無效狀態碼: ${response.status}`);
    }
    
    if (!response.data || response.data.trim() === '') {
      throw new Error('Visualization API返回的數據為空');
    }
    
    // 檢查返回的內容是否為錯誤頁面而不是JSON
    if (response.data.includes('<!DOCTYPE html>') || 
        response.data.includes('<html') || 
        response.data.includes('</html>')) {
      throw new Error('接收到HTML而非JSON數據，可能是權限錯誤或無效的表格ID');
    }
    
    console.log("原始響應數據:", response.data.substring(0, 200) + "...");
    
    // Google Visualization API 返回的是一種特殊的 JSON 格式，需要處理
    if (!response.data.includes('google.visualization.Query.setResponse')) {
      throw new Error('返回的數據不符合Google Visualization API格式');
    }
    
    // 提取 JSON 部分
    let jsonStr = response.data;
    jsonStr = jsonStr.replace(/^.*?google\.visualization\.Query\.setResponse\(/s, '');
    jsonStr = jsonStr.replace(/\);?\s*$/s, '');
    
    console.log("提取的JSON數據:", jsonStr.substring(0, 200) + "...");
    
    if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
      throw new Error('無法提取有效的JSON數據');
    }
    
    const jsonData = JSON.parse(jsonStr);
    
    // 檢查數據結構
    if (!jsonData.table || !jsonData.table.rows || !jsonData.table.cols) {
      throw new Error('Google Visualization API 返回了無效的數據結構');
    }

    console.log("解析的JSON數據結構:", JSON.stringify({
      colsCount: jsonData.table.cols.length,
      rowsCount: jsonData.table.rows.length,
      colNames: jsonData.table.cols.map(col => col.label)
    }));
    
    // 將 Google Visualization API 格式轉換為更易用的格式
    const parsedData = transformVisualizationApiData(jsonData);
    
    if (!parsedData || parsedData.length === 0) {
      throw new Error('解析Visualization API數據失敗，未找到有效數據');
    }
    
    console.log(`Visualization API方法成功，解析了 ${parsedData.length} 行數據`);
    return { data: parsedData, source: 'visualization_api' };
  } catch (error) {
    console.error('使用 Visualization API 方法獲取數據時出錯:', error);
    throw error;
  }
}

// 使用Google Sheets API獲取數據 (第三種方法)
async function fetchUsingGoogleSheetsAPI(sheetId, gid, timeout = 15000) {
  try {
    console.log("使用Google Sheets API方法獲取數據...");
    
    // 使用公開表格的直接HTML表格視圖 (這不需要API密鑰)
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/htmlpublish?gid=${gid}&single=true&output=tsv`;
    
    console.log("Google Sheets HTML URL:", url);
    
    const response = await axios.get(url, {
      responseType: 'text',
      timeout: timeout,
      headers: {
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    // 檢查返回是否為HTML
    if (!response.data || !response.data.includes('<html')) {
      throw new Error('未接收到有效的HTML響應');
    }
    
    // 從HTML中提取表格數據
    const parsedData = parseHTMLTable(response.data);
    
    if (!parsedData || parsedData.length === 0) {
      throw new Error('從HTML中解析表格失敗');
    }
    
    console.log(`Google Sheets HTML方法成功，解析了 ${parsedData.length} 行數據`);
    return { data: parsedData, source: 'sheets_api_html' };
    
  } catch (error) {
    console.error('使用Google Sheets API方法獲取數據時出錯:', error);
    throw error;
  }
}

// 從HTML中解析表格數據
function parseHTMLTable(htmlString) {
  try {
    // 尋找表格數據
    const tableMatch = htmlString.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) {
      throw new Error('HTML中找不到表格');
    }
    
    const tableContent = tableMatch[0];
    
    // 提取表頭
    const headerMatch = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
    if (!headerMatch) {
      throw new Error('表格中找不到表頭行');
    }
    
    // 提取表頭各列
    const headerCells = headerMatch[1].match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
    const headers = headerCells.map(cell => {
      // 移除HTML標籤
      return cell.replace(/<[^>]*>/g, '').trim();
    });
    
    if (headers.length === 0) {
      throw new Error('未能提取表頭列');
    }
    
    // 提取所有行
    const rows = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    
    if (rows.length <= 1) { // 僅有表頭
      throw new Error('表格中只有表頭，沒有數據行');
    }
    
    const result = [];
    
    // 從第二行開始（跳過表頭）
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // 提取單元格
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      
      if (cells.length > 0) {
        const rowData = {};
        
        cells.forEach((cell, j) => {
          if (j < headers.length) {
            // 移除HTML標籤並保存數據
            const cellValue = cell.replace(/<[^>]*>/g, '').trim();
            rowData[headers[j]] = cellValue;
          }
        });
        
        result.push(rowData);
      }
    }
    
    return result;
  } catch (error) {
    console.error('解析HTML表格出錯:', error);
    throw error;
  }
}

// 處理 Google Visualization API 數據
function transformVisualizationApiData(jsonData) {
  try {
    // 獲取列標題
    const headers = jsonData.table.cols.map(col => col.label || '');
    
    console.log("變換數據 - 標頭:", headers);
    
    // 找到關鍵標題欄位
    const hasRequiredColumns = headers.includes('屬性') && 
                              headers.includes('品牌') && 
                              headers.includes('商品數') && 
                              headers.includes('動銷率');
    
    // 如果缺少必要欄位，嘗試使用自定義標題
    if (!hasRequiredColumns) {
      console.log('未找到所有必要欄位，嘗試使用自定義標題');
      
      // 檢查欄位內容，嘗試識別標題行
      const potentialHeaderRows = [];
      
      jsonData.table.rows.forEach((row, index) => {
        const rowValues = row.c.map(cell => cell?.v || '');
        const rowStr = rowValues.join(',').toLowerCase();
        
        if (rowStr.includes('屬性') && 
            rowStr.includes('品牌') && 
            rowStr.includes('商品數') && 
            rowStr.includes('動銷率')) {
          potentialHeaderRows.push({ index, values: rowValues });
        }
      });
      
      // 如果找到潛在的標題行，使用它來重新定義標題
      if (potentialHeaderRows.length > 0) {
        const headerRow = potentialHeaderRows[0];
        
        console.log("找到潛在標題行:", headerRow.values);
        
        // 更新標題
        headerRow.values.forEach((header, index) => {
          if (header && index < headers.length) {
            headers[index] = header;
          }
        });
        
        console.log("更新後的標頭:", headers);
        
        // 移除標題行
        jsonData.table.rows = jsonData.table.rows.filter((_, index) => index !== headerRow.index);
      }
    }
    
    // 轉換行數據
    const rows = jsonData.table.rows.map(row => {
      const rowData = {};
      row.c.forEach((cell, index) => {
        // 確保列標題存在，否則使用默認名稱
        const header = headers[index] || `column${index}`;
        
        // 提取值（考慮 null 和 undefined 情況）
        let value = '';
        if (cell !== null && cell !== undefined) {
          if (cell.v !== undefined) {
            value = cell.v;
          } else if (cell.f !== undefined) {
            value = cell.f;  // 使用格式化的值（如果可用）
          }
        }
        
        rowData[header] = value;
      });
      return rowData;
    });
    
    console.log("變換完成的數據樣本:", rows.slice(0, 2));
    
    // 預處理數據：為某些欄位添加默認值
    return rows.map(row => {
      // 如果沒有屬性欄位，添加空字符串
      if (row['屬性'] === undefined) row['屬性'] = '';
      // 如果沒有品牌欄位，添加空字符串
      if (row['品牌'] === undefined) row['品牌'] = '';
      // 如果沒有商品數欄位，添加0
      if (row['商品數'] === undefined) row['商品數'] = 0;
      // 如果沒有單月營業額欄位，添加0
      if (row['單月營業額(30天)'] === undefined) row['單月營業額(30天)'] = 0;
      // 如果沒有動銷率欄位，添加0
      if (row['動銷率'] === undefined) row['動銷率'] = 0;
      
      return row;
    });
  } catch (error) {
    console.error('轉換 Google Visualization API 數據時出錯:', error);
    throw new Error('轉換 Google Visualization API 數據時出錯: ' + error.message);
  }
}

// 計算每個月份的匯總數據和成長率
function calculateMonthlySummary(groupedData) {
  const months = Object.keys(groupedData);
  
  // 如果沒有月份數據，返回空數組
  if (months.length === 0) {
    return [];
  }
  
  // 按月份排序（假設月份格式為"此紀錄為MM/DD~MM/DD(30天內)"）
  months.sort((a, b) => {
    // 從字符串中提取日期信息進行比較
    const getMonthFromString = (str) => {
      // 如果格式是 "此紀錄為MM/DD~MM/DD(30天內)" 提取第一個日期
      const match = str.match(/此紀錄為(\d+)\/(\d+)~/);
      if (match) {
        return parseInt(match[1]) * 100 + parseInt(match[2]); // 轉為數字進行比較
      }
      
      // 處理其他可能的格式
      const otherMatch = str.match(/(\d+)\/(\d+)/);
      if (otherMatch) {
        return parseInt(otherMatch[1]) * 100 + parseInt(otherMatch[2]);
      }
      
      return 0;
    };
    
    return getMonthFromString(a) - getMonthFromString(b);
  });
  
  // 計算每個月的匯總數據
  const summary = months.map((month, index) => {
    const monthData = groupedData[month];
    
    // 如果沒有月數據，返回默認值
    if (!monthData || monthData.length === 0) {
      return {
        month: month,
        displayMonth: month.replace('此紀錄為', '').replace('(30天內)', ''),
        totalSales: 0,
        avgDynamicRate: 0,
        growthAmount: 0,
        growthRate: 0,
        brandSales: {},
        brandCount: 0
      };
    }
    
    // 計算總營業額
    const totalSales = monthData.reduce((sum, item) => {
      let salesValue = item['單月營業額(30天)'];
      
      // 處理各種可能的數據類型
      if (typeof salesValue === 'number') {
        return sum + salesValue;
      } else if (typeof salesValue === 'string') {
        // 移除非數字字符並轉換為數字
        return sum + parseFloat(salesValue.toString().replace(/[^0-9.-]+/g, '') || 0);
      }
      return sum;
    }, 0);
    
    // 計算平均動銷率
    const avgDynamicRate = monthData.reduce((sum, item) => {
      const rate = item['動銷率'];
      
      // 處理各種可能的數據類型
      if (typeof rate === 'number') {
        return sum + rate;
      } else if (typeof rate === 'string') {
        // 移除百分號並轉換為數字
        return sum + parseFloat(rate.toString().replace('%', '') || 0);
      }
      return sum;
    }, 0) / (monthData.length || 1);
    
    // 計算與上個月的成長數和成長比
    let growthAmount = 0;
    let growthRate = 0;
    
    if (index > 0) {
      const prevMonthData = groupedData[months[index - 1]];
      
      // 確保前一個月有數據
      if (prevMonthData && prevMonthData.length > 0) {
        const prevTotalSales = prevMonthData.reduce((sum, item) => {
          let salesValue = item['單月營業額(30天)'];
          
          if (typeof salesValue === 'number') {
            return sum + salesValue;
          } else if (typeof salesValue === 'string') {
            return sum + parseFloat(salesValue.toString().replace(/[^0-9.-]+/g, '') || 0);
          }
          return sum;
        }, 0);
        
        growthAmount = totalSales - prevTotalSales;
        growthRate = prevTotalSales !== 0 ? (growthAmount / prevTotalSales) * 100 : 0;
      }
    }
    
    // 計算每個品牌的銷售額
    const brandSales = {};
    monthData.forEach(item => {
      if (item['品牌']) {
        const brand = item['品牌'];
        
        let salesValue = item['單月營業額(30天)'];
        const sales = typeof salesValue === 'number' 
          ? salesValue 
          : parseFloat(salesValue?.toString().replace(/[^0-9.-]+/g, '') || 0);
        
        const rateValue = item['動銷率'];
        const dynamicRate = typeof rateValue === 'number' 
          ? rateValue 
          : parseFloat(rateValue?.toString().replace('%', '') || 0);
        
        brandSales[brand] = { 
          sales: sales, 
          dynamicRate: dynamicRate,
          count: item['商品數'] || 0,
          avgPrice: item['產品均價'] || 0
        };
      }
    });
    
    return {
      month: month,
      displayMonth: month.replace('此紀錄為', '').replace('(30天內)', ''),
      totalSales: totalSales,
      avgDynamicRate: avgDynamicRate,
      growthAmount: growthAmount,
      growthRate: growthRate,
      brandSales: brandSales,
      brandCount: Object.keys(brandSales).length
    };
  });
  
  return summary;
}

// 提取所有品牌
function extractAllBrands(groupedData) {
  try {
    const allBrands = new Set();
    
    // 遍歷所有月份數據
    Object.values(groupedData).forEach(monthData => {
      monthData.forEach(row => {
        if (row['品牌'] && typeof row['品牌'] === 'string') {
          // 品牌名稱清理和過濾
          const brandName = row['品牌'].trim();
          
          // 過濾掉純數字或太短的品牌名稱
          const isNumericBrand = /^\d+$/.test(brandName);
          const hasPotentialPercentage = brandName.includes('%') || brandName.includes(',');
          const isTooShort = brandName.length < 3;
          
          // 如果品牌名稱不是純數字、不包含逗號或百分比、不過短，則添加到集合中
          if (!isNumericBrand && !hasPotentialPercentage && !isTooShort) {
            allBrands.add(brandName);
          }
        }
      });
    });
    
    // 轉換為數組並按字母順序排序
    return Array.from(allBrands).sort();
  } catch (error) {
    console.error('提取品牌列表時出錯:', error);
    return [];
  }
}

// 改進的 CSV 解析函數，更好地處理中文和特殊字符
function parseCSV(csvText) {
  try {
    const lines = csvText.split('\n');
    if (lines.length === 0) return [];
    
    // 嘗試找到標題行，首先查找包含品牌和商品數的行
    let headerIndex = -1;
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      if (lines[i].includes('屬性') && 
          lines[i].includes('品牌') && 
          lines[i].includes('商品數')) {
        headerIndex = i;
        break;
      }
    }
    
    // 如果沒有找到明確的標題行，假設第一行是標題
    if (headerIndex === -1) headerIndex = 0;
    
    const headers = lines[headerIndex].split(',').map(header => header.trim().replace(/^"|"$/g, ''));
    const result = [];
    
    // 處理每一行數據
    for (let i = 0; i < lines.length; i++) {
      if (i === headerIndex || !lines[i].trim()) continue;
      
      // 處理 CSV 行，考慮引號內的逗號
      let row = [];
      let inQuotes = false;
      let currentValue = '';
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        
        if (char === '"' && (j === 0 || lines[i][j-1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(currentValue.replace(/^"|"$/g, ''));
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      row.push(currentValue.replace(/^"|"$/g, ''));
      
      // 確保 row 和 headers 匹配，並創建對象
      const rowObj = {};
      headers.forEach((header, index) => {
        if (!header) return;  // 跳過空標題
        
        if (index < row.length) {
          rowObj[header] = row[index];
        } else {
          rowObj[header] = '';
        }
      });
      
      // 只添加非空行
      if (Object.values(rowObj).some(val => val && val.trim && val.trim() !== '')) {
        result.push(rowObj);
      }
    }
    
    return result;
  } catch (error) {
    console.error('解析 CSV 數據時出錯:', error);
    throw new Error('解析 CSV 數據時出錯: ' + error.message);
  }
}

// 生成示例數據，以便在實際數據獲取失敗時顯示
function generateExampleData() {
  // 品牌列表
  const brands = [
    'Brand A', 'Brand B', 'Brand C', 'Brand D', 'Brand E',
    'Brand F', 'Brand G', 'Brand H', 'Brand I', 'Brand J'
  ];
  
  // 屬性列表
  const attributes = ['一般', '優選', '商城'];
  
  // 生成三個月的數據
  const months = [
    '此紀錄為10/1~10/30(30天內)',
    '此紀錄為11/1~11/30(30天內)',
    '此紀錄為12/1~12/30(30天內)'
  ];
  
  const result = [];
  
  // 首先添加月份標記行
  months.forEach(month => {
    result.push({
      '屬性': month,
      '品牌': '',
      '商品數': '',
      '單月營業額(30天)': '',
      '成交均價': '',
      '產品均價': '',
      '動銷率': '',
      '排名/依動銷率': ''
    });
  });
  
  // 為每個月份添加品牌數據
  months.forEach((month, monthIndex) => {
    brands.forEach((brand, brandIndex) => {
      // 創建一些變化的數據
      const baseValue = 1000000 + (brandIndex * 100000) + (monthIndex * 500000);
      const randomFactor = 0.8 + Math.random() * 0.4;  // 0.8 到 1.2 之間的隨機因子
      
      result.push({
        '屬性': attributes[brandIndex % attributes.length],
        '品牌': brand,
        '商品數': Math.floor(100 + Math.random() * 900),
        '單月營業額(30天)': baseValue * randomFactor,
        '成交均價': Math.floor(200 + Math.random() * 300),
        '產品均價': Math.floor(250 + Math.random() * 350),
        '動銷率': (50 + Math.random() * 50).toFixed(2) + '%',
        '排名/依動銷率': (brandIndex + 1).toString()
      });
    });
  });
  
  return result;
}

// 檢查頁面方法
async function fetchDirectCSVData() {
  try {
    console.log("嘗試直接獲取CSV數據...");
    
    // 使用直接CSV獲取方式
    const url = 'https://docs.google.com/spreadsheets/d/1-SDpG2WKJ4WyLNR2bQn5YtVXtidB8fC0fuj6h1MlkbI/export?format=csv&gid=483830182';
    
    const response = await axios.get(url, {
      responseType: 'text',
      timeout: 20000,
      headers: {
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (response.status === 200 && response.data) {
      console.log("直接CSV獲取成功!");
      return { success: true, data: response.data };
    } else {
      return { success: false, message: `狀態碼: ${response.status}` };
    }
  } catch (error) {
    console.error("直接獲取CSV數據失敗:", error.message);
    return { success: false, message: error.message };
  }
} 