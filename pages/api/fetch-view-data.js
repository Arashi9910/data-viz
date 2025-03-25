import axios from 'axios';

export default async function handler(req, res) {
  try {
    // 檢查連接
    const hasInternet = await checkInternetConnection();
    if (!hasInternet) {
      return res.status(503).json({
        error: '無法連接到互聯網',
        message: '請檢查您的互聯網連接並重試。',
        exampleData: true,
        data: generateExampleData()
      });
    }
    
    // 從請求中獲取 Google Sheet ID 和 GID
    const sheetId = req.query.sheetId || '1-SDpG2WKJ4WyLNR2bQn5YtVXtidB8fC0fuj6h1MlkbI';
    const gid = req.query.gid || '1540752873'; // 賣場數據表的GID
    
    console.log(`嘗試獲取賣場數據，sheetId: ${sheetId}, gid: ${gid}`);
    
    // 檢查 Google Sheet 可訪問性
    const isSheetAccessible = await checkSheetAccessibility(sheetId);
    if (!isSheetAccessible) {
      return res.status(403).json({
        error: '無法訪問 Google Sheet',
        message: '請確保 Google Sheet 是公開的並且 URL 正確。',
        exampleData: true,
        data: generateExampleData()
      });
    }
    
    // 嘗試使用不同方法獲取數據
    let data;
    let method = '';
    
    try {
      data = await fetchUsingCSVMethod(sheetId, gid);
      method = 'CSV';
    } catch (csvError) {
      console.log('CSV 方法失敗，嘗試可視化 API 方法...');
      
      try {
        data = await fetchUsingVisualizationAPIMethod(sheetId, gid);
        method = 'Visualization API';
      } catch (visError) {
        console.log('可視化 API 方法失敗，提供示例數據...');
        return res.status(500).json({
          error: '無法使用任何方法獲取數據',
          message: '請確保 Google Sheet 是公開的，並且數據格式正確。',
          exampleData: true,
          data: generateExampleData()
        });
      }
    }
    
    // 處理數據
    const processedData = processViewData(data);
    
    return res.status(200).json({
      success: true,
      method: method,
      data: processedData
    });
    
  } catch (error) {
    console.error('獲取數據出錯:', error);
    
    return res.status(500).json({
      error: '獲取數據時出錯',
      message: error.message || '請確保 Google Sheet 是公開的，並且數據格式正確。',
      exampleData: true,
      data: generateExampleData()
    });
  }
}

// 檢查互聯網連接
async function checkInternetConnection() {
  try {
    await axios.head('https://www.google.com', { timeout: 5000 });
    return true;
  } catch (error) {
    console.error('檢查互聯網連接失敗:', error.message);
    return false;
  }
}

// 檢查 Google Sheet 可訪問性
async function checkSheetAccessibility(sheetId) {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
    await axios.head(url, { timeout: 5000 });
    return true;
  } catch (error) {
    console.error('檢查Google Sheet可訪問性失敗:', error.message);
    return false;
  }
}

// 使用CSV方法獲取數據
async function fetchUsingCSVMethod(sheetId, gid, timeout = 10000) {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    const response = await axios.get(csvUrl, { 
      timeout: timeout,
      responseType: 'text'
    });
    
    if (response.status !== 200 || !response.data) {
      throw new Error(`Invalid response: ${response.status}`);
    }
    
    // 解析CSV數據
    const data = parseCSV(response.data);
    return data;
  } catch (error) {
    console.error('使用CSV方法獲取數據失敗:', error.message);
    throw error;
  }
}

// 使用Visualization API獲取數據
async function fetchUsingVisualizationAPIMethod(sheetId, gid, timeout = 10000) {
  try {
    const visApiUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&gid=${gid}`;
    const response = await axios.get(visApiUrl, { 
      timeout: timeout
    });
    
    if (response.status !== 200 || !response.data) {
      throw new Error(`Invalid response: ${response.status}`);
    }
    
    // 處理Visualization API回傳的數據格式
    let jsonData = response.data;
    jsonData = jsonData.replace('/*O_o*/', '');
    jsonData = jsonData.replace(/(google\.visualization\.Query\.setResponse\(|\);$)/g, '');
    
    const parsedData = JSON.parse(jsonData);
    return transformVisualizationApiData(parsedData);
    
  } catch (error) {
    console.error('使用Visualization API獲取數據失敗:', error.message);
    throw error;
  }
}

// 解析CSV數據
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const result = [];
  
  // 處理每一行
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // 處理CSV中的引號和逗號
    const values = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    values.push(currentValue); // 加入最後一個值
    
    // 清理值中的引號
    for (let j = 0; j < values.length; j++) {
      values[j] = values[j].replace(/^"|"$/g, '').replace(/""/g, '"');
      
      // 嘗試轉換為數字
      if (/^[\d,]+$/.test(values[j])) {
        values[j] = parseInt(values[j].replace(/,/g, ''), 10);
      }
    }
    
    result.push(values);
  }
  
  return result;
}

// 轉換Visualization API數據
function transformVisualizationApiData(jsonData) {
  if (!jsonData || !jsonData.table || !jsonData.table.rows) {
    return [];
  }
  
  const columns = jsonData.table.cols.map(col => col.label);
  const rows = jsonData.table.rows;
  
  const result = [];
  result.push(columns); // 添加表頭
  
  rows.forEach(row => {
    const transformedRow = row.c.map(cell => {
      if (!cell) return '';
      // 處理v (value) 和 f (formatted value)
      const value = cell.v !== undefined ? cell.v : (cell.f !== undefined ? cell.f : '');
      
      // 如果是數字格式的字符串，嘗試轉換為數字
      if (typeof value === 'string' && /^[\d,]+$/.test(value)) {
        return parseInt(value.replace(/,/g, ''), 10);
      }
      
      return value;
    });
    
    result.push(transformedRow);
  });
  
  return result;
}

// 處理賣場數據
function processViewData(data) {
  if (!data || !Array.isArray(data) || data.length <= 1) {
    throw new Error('數據格式無效或為空');
  }
  
  try {
    const headers = data[0];
    const rows = data.slice(1).filter(row => row.length >= 4 && row[0]); // 確保行有日期和數據
    
    // 找出日期、總瀏覽數、廣告瀏覽數、自然瀏覽數的列索引
    const dateIndex = headers.findIndex(h => 
      typeof h === 'string' && (h.includes('日期') || h.toLowerCase().includes('date')));
    const totalViewIndex = headers.findIndex(h => 
      typeof h === 'string' && (h.includes('總瀏覽數') || h.toLowerCase().includes('total')));
    const adViewIndex = headers.findIndex(h => 
      typeof h === 'string' && (h.includes('廣告瀏覽數') || h.toLowerCase().includes('ad')));
    const organicViewIndex = headers.findIndex(h => 
      typeof h === 'string' && (h.includes('自然瀏覽數') || h.toLowerCase().includes('organic')));
    
    if (dateIndex === -1 || totalViewIndex === -1 || adViewIndex === -1 || organicViewIndex === -1) {
      throw new Error('找不到必要的數據列');
    }
    
    // 提取所需數據
    const viewData = rows.map(row => ({
      date: row[dateIndex],
      totalViews: typeof row[totalViewIndex] === 'number' ? row[totalViewIndex] : 
        parseInt(row[totalViewIndex].replace(/[^\d]/g, ''), 10) || 0,
      adViews: typeof row[adViewIndex] === 'number' ? row[adViewIndex] : 
        parseInt(row[adViewIndex].replace(/[^\d]/g, ''), 10) || 0,
      organicViews: typeof row[organicViewIndex] === 'number' ? row[organicViewIndex] : 
        parseInt(row[organicViewIndex].replace(/[^\d]/g, ''), 10) || 0
    }));
    
    // 生成趨勢圖數據
    const trendData = {
      labels: viewData.map(item => item.date),
      datasets: [
        {
          label: '總瀏覽數',
          data: viewData.map(item => item.totalViews),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          fill: false
        },
        {
          label: '廣告瀏覽數',
          data: viewData.map(item => item.adViews),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          fill: false
        },
        {
          label: '自然瀏覽數',
          data: viewData.map(item => item.organicViews),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          fill: false
        }
      ]
    };
    
    // 計算平均分佈數據用於圓餅圖
    const totalAdViews = viewData.reduce((sum, item) => sum + item.adViews, 0);
    const totalOrganicViews = viewData.reduce((sum, item) => sum + item.organicViews, 0);
    
    const distributionData = {
      labels: ['廣告瀏覽', '自然瀏覽'],
      datasets: [
        {
          data: [totalAdViews, totalOrganicViews],
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(75, 192, 192, 0.7)'
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(75, 192, 192)'
          ],
          borderWidth: 1
        }
      ]
    };
    
    return {
      viewData: viewData,
      trendData: trendData,
      distributionData: distributionData,
      summary: {
        totalViews: viewData.reduce((sum, item) => sum + item.totalViews, 0),
        adViews: totalAdViews,
        organicViews: totalOrganicViews,
        adViewsPercentage: (totalAdViews / (totalAdViews + totalOrganicViews) * 100).toFixed(2),
        organicViewsPercentage: (totalOrganicViews / (totalAdViews + totalOrganicViews) * 100).toFixed(2)
      }
    };
    
  } catch (error) {
    console.error('處理賣場數據時出錯:', error);
    throw error;
  }
}

// 生成示例數據
function generateExampleData() {
  const dates = [
    '2025/2/4~2/10',
    '2025/2/11~2/17',
    '2025/2/18~2/24',
    '2025/2/25~3/3'
  ];
  
  const viewData = dates.map((date, index) => {
    const totalViews = 3500000 + Math.round(Math.random() * 2000000);
    const adViews = Math.round(totalViews * 0.85);
    const organicViews = totalViews - adViews;
    
    return {
      date,
      totalViews,
      adViews,
      organicViews
    };
  });
  
  // 生成趨勢圖數據
  const trendData = {
    labels: viewData.map(item => item.date),
    datasets: [
      {
        label: '總瀏覽數',
        data: viewData.map(item => item.totalViews),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        fill: false
      },
      {
        label: '廣告瀏覽數',
        data: viewData.map(item => item.adViews),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        fill: false
      },
      {
        label: '自然瀏覽數',
        data: viewData.map(item => item.organicViews),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        fill: false
      }
    ]
  };
  
  // 計算平均分佈數據用於圓餅圖
  const totalAdViews = viewData.reduce((sum, item) => sum + item.adViews, 0);
  const totalOrganicViews = viewData.reduce((sum, item) => sum + item.organicViews, 0);
  
  const distributionData = {
    labels: ['廣告瀏覽', '自然瀏覽'],
    datasets: [
      {
        data: [totalAdViews, totalOrganicViews],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(75, 192, 192, 0.7)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(75, 192, 192)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  return {
    viewData: viewData,
    trendData: trendData,
    distributionData: distributionData,
    summary: {
      totalViews: viewData.reduce((sum, item) => sum + item.totalViews, 0),
      adViews: totalAdViews,
      organicViews: totalOrganicViews,
      adViewsPercentage: (totalAdViews / (totalAdViews + totalOrganicViews) * 100).toFixed(2),
      organicViewsPercentage: (totalOrganicViews / (totalAdViews + totalOrganicViews) * 100).toFixed(2)
    }
  };
} 