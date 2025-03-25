import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import LineChart from '../components/LineChart';
import PieChart from '../components/PieChart';
import BarChart from '../components/BarChart';
import 'chart.js/auto';  // 確保Chart.js相關功能可用
import axios from 'axios';

// 動態引入縮放插件，避免服務器端渲染問題
import dynamic from 'next/dynamic';

export default function SheetData() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [brandSalesData, setBrandSalesData] = useState(null);
  const [dynamicRateData, setDynamicRateData] = useState(null);
  const [attributeDistributionData, setAttributeDistributionData] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [monthlyData, setMonthlyData] = useState({});
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('最新月份');
  const [trendData, setTrendData] = useState(null);
  const [topBrandsData, setTopBrandsData] = useState(null);
  const [salesGrowthData, setSalesGrowthData] = useState(null);
  const [brandSalesTrendData, setBrandSalesTrendData] = useState(null);
  const [brandMonthlyGrowthData, setBrandMonthlyGrowthData] = useState(null);
  
  // 品牌比較功能相關狀態
  const [allBrands, setAllBrands] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [brandComparisonData, setBrandComparisonData] = useState(null);
  const [comparisonStartMonth, setComparisonStartMonth] = useState('');
  const [comparisonEndMonth, setComparisonEndMonth] = useState('');
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // 添加新狀態來跟踪分頁
  const [selectedGrowthPeriod, setSelectedGrowthPeriod] = useState(0);

  // 添加圖表引用和插件狀態
  const brandChartRef = useRef(null);
  const [zoomPlugin, setZoomPlugin] = useState(null);
  
  // 在客戶端加載縮放插件
  useEffect(() => {
    const loadZoomPlugin = async () => {
      const zoom = (await import('chartjs-plugin-zoom')).default;
      setZoomPlugin(zoom);
    };
    
    loadZoomPlugin();
  }, []);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    
    try {
      // 使用Vercel API路由而不是Netlify函數
      const response = await axios.get('/api/fetch-sheet-data', { 
        timeout: 15000 
      });
      
      // 保存原始數據，以便在表格中顯示
      const result = response.data;
      
      if (result.exampleData) {
        setError('正在顯示示例數據。' + (result.message || ''));
      } else {
        setError(null);
      }
      
      // 從API響應中提取數據
      const sheetData = result.data;
      const allBrandsList = result.allBrands || [];
      
      // 如果數據處理在API中執行，使用處理後的數據
      const groupedData = result.groupedData || {};
      const monthlySummary = result.monthlySummary || [];
      
      // 如果服務器沒有處理，嘗試前端處理
      const needClientProcessing = Object.keys(groupedData).length === 0;
      
      if (needClientProcessing && sheetData && sheetData.length > 0) {
        console.log('從前端處理數據...');
        // 這裡可以添加前端數據處理邏輯
        // 為了簡單起見，使用示例數據
        generateAndApplySampleData();
      } else {
        // 使用服務器處理好的數據
        setRawData(sheetData);
        setMonthlyData(groupedData);
        setMonthlySummary(monthlySummary);
        setAllBrands(allBrandsList);
        
        // 識別可用的月份
        const months = Object.keys(groupedData);
        setAvailableMonths(months);
        
        // 預設選擇最新的月份
        if (months.length > 0) {
          setSelectedMonth(months[months.length - 1]);
          
          // 設置默認的比較月份（預設從10月開始，如果有的話）
          const octoberMonth = months.find(m => m.includes('10/'));
          if (octoberMonth) {
            setComparisonStartMonth(octoberMonth);
          } else {
            setComparisonStartMonth(months[0]);
          }
          setComparisonEndMonth(months[months.length - 1]);
        }
        
        // 處理視覺化數據
        processData(sheetData);
        processTrendData(groupedData);
        processSalesGrowthData(monthlySummary);
        processBrandSalesTrend(monthlySummary);
        processBrandMonthlyGrowth(monthlySummary);
        
        // 預設選擇前5個品牌進行比較
        setSelectedBrands(allBrandsList.slice(0, Math.min(5, allBrandsList.length)));
      }
    } catch (err) {
      console.error('獲取數據時出錯:', err);
      setError(err.message || '獲取數據時出錯，請確保 Google Sheet 是公開的');
      
      // 如果出錯，生成並應用示例數據
      generateAndApplySampleData();
    } finally {
      setIsLoading(false);
    }
  };
  
  // 生成和應用示例數據的輔助函數
  const generateAndApplySampleData = () => {
    const sampleData = {
      rawData: [
        ['品牌', '一月', '二月', '三月', '四月', '五月', '六月'],
        ['品牌1', 100, 120, 140, 160, 180, 200],
        ['品牌2', 200, 180, 160, 140, 120, 100],
        ['品牌3', 150, 150, 150, 150, 150, 150],
        ['品牌4', 80, 100, 120, 140, 160, 180],
        ['品牌5', 220, 200, 180, 160, 140, 120]
      ],
      brands: ['品牌1', '品牌2', '品牌3', '品牌4', '品牌5'],
      months: ['一月', '二月', '三月', '四月', '五月', '六月']
    };
    
    setRawData(sampleData.rawData);
    setAllBrands(sampleData.brands);
    setSelectedBrands(sampleData.brands.slice(0, 5));
    setAvailableMonths(sampleData.months);
    
    // 創建示例數據用於各個圖表
    setMonthlyTrendData(generateSampleTrendData());
    setSalesGrowthData(generateSampleGrowthData());
  };
  
  // 生成示例趨勢數據
  const generateSampleTrendData = () => {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月'];
    return months.map(month => ({
      name: month,
      總營業額: Math.floor(Math.random() * 5000) + 5000,
      品牌數量: Math.floor(Math.random() * 10) + 20
    }));
  };
  
  // 生成示例成長數據
  const generateSampleGrowthData = () => {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月'];
    return months.map((month, index) => ({
      name: month,
      營業額: Math.floor(Math.random() * 5000) + 5000,
      成長率: index === 0 ? 0 : (Math.random() * 20) - 10
    }));
  };
  
  // 重試獲取數據
  const handleRetry = () => {
    fetchData();
  };
  
  // 打開Google Sheet共享設置
  const openSharingSettings = () => {
    window.open('https://docs.google.com/spreadsheets/d/1-SDpG2WKJ4WyLNR2bQn5YtVXtidB8fC0fuj6h1MlkbI/edit#gid=483830182', '_blank');
  };

  // 當選擇的月份變化時，更新數據
  useEffect(() => {
    if (selectedMonth && monthlyData[selectedMonth]) {
      processMonthData(monthlyData[selectedMonth]);
    }
  }, [selectedMonth, monthlyData]);
  
  // 當選擇的品牌或比較月份變化時，更新品牌比較數據
  useEffect(() => {
    if (monthlySummary.length > 0 && selectedBrands.length > 0 && comparisonStartMonth && comparisonEndMonth) {
      processBrandComparisonData(monthlySummary, selectedBrands, comparisonStartMonth, comparisonEndMonth);
    }
  }, [selectedBrands, comparisonStartMonth, comparisonEndMonth, monthlySummary]);

  // 處理品牌比較數據
  const processBrandComparisonData = (monthlySummaryData, brandList, startMonth, endMonth) => {
    if (!monthlySummaryData || monthlySummaryData.length === 0 || brandList.length === 0) return;
    
    try {
      // 找出開始和結束月份的索引
      const monthNames = monthlySummaryData.map(item => item.month);
      console.log("可用月份:", monthNames);
      console.log("嘗試比較的月份範圍:", startMonth, "到", endMonth);
      
      let startIndex = monthNames.indexOf(startMonth);
      let endIndex = monthNames.indexOf(endMonth);
      
      // 如果找不到確切的月份名稱，則嘗試模糊匹配
      if (startIndex === -1) {
        // 如果startMonth包含10/，則嘗試找到包含10/的月份
        if (startMonth.includes('10/')) {
          startIndex = monthNames.findIndex(m => m.includes('10/'));
        }
        
        // 如果仍然找不到，使用第一個月份
        if (startIndex === -1) {
          startIndex = 0;
          console.log("無法找到開始月份，使用第一個月份:", monthNames[0]);
        }
      }
      
      if (endIndex === -1) {
        // 如果找不到結束月份，使用最後一個月份
        endIndex = monthNames.length - 1;
        console.log("無法找到結束月份，使用最後一個月份:", monthNames[endIndex]);
      }
      
      if (startIndex > endIndex) {
        console.log("開始月份索引大於結束月份索引，交換它們");
        [startIndex, endIndex] = [endIndex, startIndex];
      }
      
      console.log("最終月份範圍索引:", startIndex, "到", endIndex);
      
      // 獲取指定月份範圍的數據
      const relevantMonths = monthlySummaryData.slice(startIndex, endIndex + 1);
      console.log("相關月份數據數量:", relevantMonths.length);
      
      if (relevantMonths.length === 0) {
        console.error("沒有找到相關月份的數據");
        return;
      }
      
      // 為每個選定的品牌創建數據集
      const salesDatasets = [];
      const rateDatasets = [];
      
      // 顏色配置
      const colors = [
        { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.5)' },
        { border: 'rgb(53, 162, 235)', background: 'rgba(53, 162, 235, 0.5)' },
        { border: 'rgb(255, 206, 86)', background: 'rgba(255, 206, 86, 0.5)' },
        { border: 'rgb(75, 192, 192)', background: 'rgba(75, 192, 192, 0.5)' },
        { border: 'rgb(153, 102, 255)', background: 'rgba(153, 102, 255, 0.5)' },
        { border: 'rgb(255, 159, 64)', background: 'rgba(255, 159, 64, 0.5)' },
        { border: 'rgb(54, 235, 162)', background: 'rgba(54, 235, 162, 0.5)' },
      ];
      
      // 檢查品牌數據是否存在
      const allBrandsValid = brandList.every(brand => {
        const hasBrandData = relevantMonths.some(month => month.brandSales && month.brandSales[brand]);
        if (!hasBrandData) {
          console.log(`品牌 ${brand} 在選定的月份範圍內沒有數據`);
        }
        return hasBrandData;
      });
      
      if (!allBrandsValid) {
        console.log("一些品牌在選定月份範圍內沒有數據，但仍將繼續處理");
      }
      
      brandList.forEach((brand, index) => {
        const colorIndex = index % colors.length;
        
        // 銷售額數據集
        salesDatasets.push({
          label: `${brand} - 營業額`,
          data: relevantMonths.map(month => {
            return month.brandSales && month.brandSales[brand] ? month.brandSales[brand].sales || 0 : 0;
          }),
          borderColor: colors[colorIndex].border,
          backgroundColor: colors[colorIndex].background,
          yAxisID: 'y',
        });
        
        // 動銷率數據集
        rateDatasets.push({
          label: `${brand} - 動銷率`,
          data: relevantMonths.map(month => {
            return month.brandSales && month.brandSales[brand] ? month.brandSales[brand].dynamicRate || 0 : 0;
          }),
          borderColor: colors[colorIndex].border,
          backgroundColor: colors[colorIndex].background,
          yAxisID: 'y1',
          borderDash: [5, 5], // 使用虛線區分動銷率
        });
      });
      
      console.log("成功創建品牌比較數據集:", salesDatasets.length, "個銷售數據集,", rateDatasets.length, "個動銷率數據集");
      
      // 設置品牌比較圖表數據
      setBrandComparisonData({
        labels: relevantMonths.map(item => item.displayMonth || item.month),
        datasets: [...salesDatasets, ...rateDatasets],
      });
      
    } catch (err) {
      console.error('Error processing brand comparison data:', err);
    }
  };
  
  // 處理每個品牌的營業額趨勢數據
  const processBrandSalesTrend = (monthlySummaryData) => {
    if (!monthlySummaryData || monthlySummaryData.length < 1) {
      console.error('月度匯總數據無效或不足');
      return;
    }
    
    try {
      // 使用所有可用月份的數據
      const relevantData = monthlySummaryData;
      console.log("處理品牌營業額趨勢數據，月份數量:", relevantData.length);
      
      // 找出所有品牌
      const allBrands = new Set();
      relevantData.forEach(monthData => {
        if (monthData.brandSales) {
          Object.keys(monthData.brandSales).forEach(brand => {
            if (
              typeof brand === 'string' && 
              brand.trim() !== '' &&
              brand.length >= 2 &&
              !/^\d+$/.test(brand) &&     // 不是純數字
              !brand.includes('%') &&     // 不包含百分比符號
              !brand.includes(',')        // 不包含逗號
            ) {
              allBrands.add(brand);
            }
          });
        }
      });
      
      // 顏色配置 - 更多顏色以支持更多品牌
      const colors = [
        { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.5)' },
        { border: 'rgb(53, 162, 235)', background: 'rgba(53, 162, 235, 0.5)' },
        { border: 'rgb(255, 206, 86)', background: 'rgba(255, 206, 86, 0.5)' },
        { border: 'rgb(75, 192, 192)', background: 'rgba(75, 192, 192, 0.5)' },
        { border: 'rgb(153, 102, 255)', background: 'rgba(153, 102, 255, 0.5)' },
        { border: 'rgb(255, 159, 64)', background: 'rgba(255, 159, 64, 0.5)' },
        { border: 'rgb(54, 235, 162)', background: 'rgba(54, 235, 162, 0.5)' },
        { border: 'rgb(255, 127, 80)', background: 'rgba(255, 127, 80, 0.5)' },
        { border: 'rgb(138, 43, 226)', background: 'rgba(138, 43, 226, 0.5)' },
        { border: 'rgb(0, 128, 128)', background: 'rgba(0, 128, 128, 0.5)' },
        { border: 'rgb(124, 252, 0)', background: 'rgba(124, 252, 0, 0.5)' },
        { border: 'rgb(220, 20, 60)', background: 'rgba(220, 20, 60, 0.5)' },
        { border: 'rgb(65, 105, 225)', background: 'rgba(65, 105, 225, 0.5)' },
        { border: 'rgb(128, 0, 128)', background: 'rgba(128, 0, 128, 0.5)' },
        { border: 'rgb(50, 205, 50)', background: 'rgba(50, 205, 50, 0.5)' },
        { border: 'rgb(210, 105, 30)', background: 'rgba(210, 105, 30, 0.5)' },
        { border: 'rgb(100, 149, 237)', background: 'rgba(100, 149, 237, 0.5)' },
        { border: 'rgb(143, 188, 143)', background: 'rgba(143, 188, 143, 0.5)' },
        { border: 'rgb(188, 143, 143)', background: 'rgba(188, 143, 143, 0.5)' },
        { border: 'rgb(72, 61, 139)', background: 'rgba(72, 61, 139, 0.5)' },
      ];
      
      // 計算每個品牌總銷售額以確定初始顯示的品牌
      const brandTotalSales = {};
      Array.from(allBrands).forEach(brand => {
        brandTotalSales[brand] = relevantData.reduce((sum, month) => {
          return sum + (month.brandSales && month.brandSales[brand] ? month.brandSales[brand].sales || 0 : 0);
        }, 0);
      });
      
      // 按照總銷售額排序品牌
      const sortedBrands = Object.entries(brandTotalSales)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
      
      // 為所有品牌創建數據集
      const brandSalesDatasets = [];
      
      // 添加總營業額趨勢線（放在前面，確保它在圖例的最上方）
      brandSalesDatasets.push({
        label: '總營業額',
        data: relevantData.map(month => month.totalSales || 0),
        borderColor: 'rgb(0, 0, 0)',
        backgroundColor: 'transparent',
        borderWidth: 3,
        borderDash: [5, 5],
        order: 0,
        hidden: false // 可以通過圖例切換顯示/隱藏
      });
      
      // 添加各品牌數據
      sortedBrands.forEach((brand, index) => {
        const colorIndex = index % colors.length;
        
        // 品牌營業額趨勢
        brandSalesDatasets.push({
          label: `${brand}`,
          data: relevantData.map(month => {
            return month.brandSales && month.brandSales[brand] ? month.brandSales[brand].sales || 0 : 0;
          }),
          borderColor: colors[colorIndex].border,
          backgroundColor: 'transparent',
          borderWidth: 2,
          hidden: false, // 顯示所有品牌
        });
      });
      
      // 不再需要額外添加總營業額趨勢線，因為已經在前面添加了
      
      console.log("品牌營業額趨勢數據處理完成，數據集數量:", brandSalesDatasets.length);
      
      // 設置營業額趨勢數據
      setBrandSalesTrendData({
        labels: relevantData.map(month => month.displayMonth || month.month),
        datasets: brandSalesDatasets,
      });
      
    } catch (err) {
      console.error('處理品牌營業額趨勢數據時出錯:', err);
    }
  };
  
  // 處理營業額成長數據 (放入另一個圖表)
  const processSalesGrowthData = (monthlySummaryData) => {
    if (!monthlySummaryData || monthlySummaryData.length < 2) {
      console.error('月度匯總數據無效或不足以計算成長率');
      return;
    }
    
    try {
      // 使用所有可用月份的數據
      const relevantData = monthlySummaryData;
      
      // 計算成長量和成長率
      const growthAmounts = [];
      const growthRates = [];
      
      for (let i = 1; i < relevantData.length; i++) {
        const prevMonth = relevantData[i-1];
        const currentMonth = relevantData[i];
        
        // 計算總體成長量
        const growthAmount = currentMonth.totalSales - prevMonth.totalSales;
        growthAmounts.push(growthAmount);
        
        // 計算總體成長率
        let growthRate = 0;
        if (prevMonth.totalSales > 0) {
          growthRate = (growthAmount / prevMonth.totalSales) * 100;
        }
        growthRates.push(growthRate);
      }
      
      // 設置營業額成長數據
      const labels = [];
      for (let i = 1; i < relevantData.length; i++) {
        const prevMonth = relevantData[i-1].displayMonth || relevantData[i-1].month;
        const currMonth = relevantData[i].displayMonth || relevantData[i].month;
        labels.push(`${prevMonth} → ${currMonth}`);
      }
      
      setSalesGrowthData({
        labels: labels,
        datasets: [
          {
            type: 'bar',
            label: '營業額成長數',
            data: growthAmounts,
            backgroundColor: growthAmounts.map(val => 
              val >= 0 ? 'rgba(75, 192, 192, 0.7)' : 'rgba(255, 99, 132, 0.7)'
            ),
            borderColor: growthAmounts.map(val => 
              val >= 0 ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)'
            ),
            borderWidth: 1,
            order: 1,
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: '營業額成長率 (%)',
            data: growthRates,
            borderColor: 'rgb(153, 102, 255)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            yAxisID: 'y1',
            order: 0,
          }
        ],
      });
      
    } catch (err) {
      console.error('處理營業額成長數據時出錯:', err);
    }
  };

  // 處理每個品牌的月度成長數據
  const processBrandMonthlyGrowth = (monthlySummaryData) => {
    if (!monthlySummaryData || monthlySummaryData.length < 2) {
      console.error('月度匯總數據無效或不足以計算成長率');
      return;
    }
    
    try {
      // 使用所有可用月份的數據
      const relevantData = monthlySummaryData;
      console.log("處理品牌月度成長數據，月份數量:", relevantData.length);
      
      // 找出所有品牌
      const allBrands = new Set();
      relevantData.forEach(monthData => {
        if (monthData.brandSales) {
          Object.keys(monthData.brandSales).forEach(brand => {
            if (
              typeof brand === 'string' && 
              brand.trim() !== '' &&
              brand.length >= 2 &&
              !/^\d+$/.test(brand) &&     // 不是純數字
              !brand.includes('%') &&     // 不包含百分比符號
              !brand.includes(',')        // 不包含逗號
            ) {
              allBrands.add(brand);
            }
          });
        }
      });
      
      // 計算每個品牌在每個月的成長數據
      const growthData = [];
      
      // 為每個月份（從第二個月開始）計算成長數據
      for (let i = 1; i < relevantData.length; i++) {
        const currentMonth = relevantData[i];
        const previousMonth = relevantData[i-1];
        const monthGrowth = {
          previousMonth: previousMonth.displayMonth || previousMonth.month,
          currentMonth: currentMonth.displayMonth || currentMonth.month,
          periodLabel: `${previousMonth.displayMonth || previousMonth.month} → ${currentMonth.displayMonth || currentMonth.month}`,
          brands: {}
        };
        
        // 計算每個品牌的成長
        Array.from(allBrands).forEach(brand => {
          const currentBrandData = currentMonth.brandSales && currentMonth.brandSales[brand] ? 
            currentMonth.brandSales[brand] : null;
          
          const previousBrandData = previousMonth.brandSales && previousMonth.brandSales[brand] ? 
            previousMonth.brandSales[brand] : null;
          
          const currentSales = currentBrandData ? currentBrandData.sales || 0 : 0;
          const previousSales = previousBrandData ? previousBrandData.sales || 0 : 0;
          
          // 獲取當前月份的動銷率
          const dynamicRate = currentBrandData ? currentBrandData.dynamicRate || 0 : 0;
          
          // 計算成長數額
          const growthAmount = currentSales - previousSales;
          
          // 計算成長率 (避免除以零)
          let growthRate = 0;
          if (previousSales > 0) {
            growthRate = (growthAmount / previousSales) * 100;
          }
          
          // 只添加有銷售數據的品牌
          if (currentSales > 0 || previousSales > 0) {
            monthGrowth.brands[brand] = {
              currentSales,
              previousSales,
              growthAmount,
              growthRate,
              dynamicRate  // 存儲動銷率
            };
          }
        });
        
        growthData.push(monthGrowth);
      }
      
      setBrandMonthlyGrowthData(growthData);
      console.log("品牌月度成長數據處理完成，期間數量:", growthData.length);
      
    } catch (err) {
      console.error('處理品牌月度成長數據時出錯:', err);
    }
  };

  // 處理 Google Sheets 數據為圖表所需格式
  const processData = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('數據無效或為空');
      return;
    }

    try {
      // 過濾有效的數據行
      const validData = data.filter(row => 
        row['品牌'] && 
        row['商品數'] && 
        row['動銷率'] && 
        !row['屬性']?.includes('此紀錄為')
      );
      
      // 0. 按動銷率排序數據（降序）
      const sortedData = [...validData].sort((a, b) => {
        const rateA = parseFloat(a['動銷率']?.replace('%', '') || 0);
        const rateB = parseFloat(b['動銷率']?.replace('%', '') || 0);
        return rateB - rateA;
      });
      
      // 只取前15名用於可視化
      const top15Data = sortedData.slice(0, 15);
      
      // 1. 品牌銷售額數據
      const brandLabels = top15Data.map(item => item['品牌'] || '未知品牌');
      const salesValues = top15Data.map(item => 
        parseFloat(item['單月營業額(30天)']?.replace(/[^0-9.-]+/g, '') || 0)
      );
      
      // 2. 動銷率數據
      const dynamicRateValues = top15Data.map(item => 
        parseFloat(item['動銷率']?.replace('%', '') || 0)
      );
      
      // 3. 按屬性分類統計
      const attributeMap = {};
      validData.forEach(item => {
        const attr = item['屬性'] || '未分類';
        if (!attributeMap[attr]) {
          attributeMap[attr] = {
            count: 0,
            totalSales: 0
          };
        }
        attributeMap[attr].count += 1;
        attributeMap[attr].totalSales += parseFloat(item['單月營業額(30天)']?.replace(/[^0-9.-]+/g, '') || 0);
      });
      
      const attributeLabels = Object.keys(attributeMap);
      const attributeValues = attributeLabels.map(attr => attributeMap[attr].count);
      const attributeSales = attributeLabels.map(attr => attributeMap[attr].totalSales);

      // 設置品牌銷售額圖表數據
      setBrandSalesData({
        labels: brandLabels,
        datasets: [
          {
            label: '單月營業額(30天)',
            data: salesValues,
            backgroundColor: 'rgba(53, 162, 235, 0.7)',
          }
        ],
      });

      // 設置動銷率圖表數據
      setDynamicRateData({
        labels: brandLabels,
        datasets: [
          {
            label: '動銷率(%)',
            data: dynamicRateValues,
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1
          }
        ],
      });

      // 設置屬性分布圖表數據
      setAttributeDistributionData({
        labels: attributeLabels,
        datasets: [
          {
            data: attributeValues,
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          }
        ],
      });
    } catch (err) {
      console.error('處理數據時出錯:', err);
    }
  };
  
  // 處理特定月份的數據
  const processMonthData = (monthData) => {
    if (!monthData || monthData.length === 0) return;
    
    try {
      // 按動銷率排序（降序）
      const sortedData = [...monthData].sort((a, b) => {
        const rateA = parseFloat(a['動銷率']?.replace('%', '') || 0);
        const rateB = parseFloat(b['動銷率']?.replace('%', '') || 0);
        return rateB - rateA;
      });
      
      // 只取前15名用於可視化
      const top15Data = sortedData.slice(0, 15);
      
      // 品牌銷售額數據
      const brandLabels = top15Data.map(item => item['品牌'] || '未知品牌');
      const salesValues = top15Data.map(item => 
        parseFloat(item['單月營業額(30天)']?.replace(/[^0-9.-]+/g, '') || 0)
      );
      
      // 動銷率數據
      const dynamicRateValues = top15Data.map(item => 
        parseFloat(item['動銷率']?.replace('%', '') || 0)
      );
      
      // 設置品牌銷售額圖表數據
      setBrandSalesData({
        labels: brandLabels,
        datasets: [
          {
            label: '單月營業額(30天)',
            data: salesValues,
            backgroundColor: 'rgba(53, 162, 235, 0.7)',
          }
        ],
      });

      // 設置動銷率圖表數據
      setDynamicRateData({
        labels: brandLabels,
        datasets: [
          {
            label: '動銷率(%)',
            data: dynamicRateValues,
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1
          }
        ],
      });
    } catch (err) {
      console.error('Error processing month data:', err);
    }
  };
  
  // 處理趨勢數據，比較不同月份
  const processTrendData = (groupedData) => {
    if (!groupedData || Object.keys(groupedData).length === 0) {
      console.error('月度數據無效或為空');
      // 創建一些示例數據
      const sampleData = generateSampleTrendData();
      setMonthlyTrendData(sampleData);
      return;
    }
    
    try {
      // 獲取所有月份
      const months = Object.keys(groupedData);
      
      // 準備月度匯總數據
      const monthlySummary = months.map(month => {
        const monthData = groupedData[month];
        
        // 計算總營業額
        const totalSales = monthData.reduce((sum, item) => 
          sum + parseFloat(item['單月營業額(30天)']?.replace(/[^0-9.-]+/g, '') || 0), 0
        );
        
        // 計算平均動銷率
        const avgDynamicRate = monthData.reduce((sum, item) => 
          sum + parseFloat(item['動銷率']?.replace('%', '') || 0), 0
        ) / monthData.length;
        
        return {
          month: month.replace('此紀錄為', '').replace('(30天內)', ''),
          totalSales: totalSales,
          avgDynamicRate: avgDynamicRate
        };
      });
      
      // 設置趨勢圖數據
      setTrendData({
        labels: monthlySummary.map(item => item.month),
        datasets: [
          {
            label: '月度總營業額',
            data: monthlySummary.map(item => item.totalSales),
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            yAxisID: 'y',
          },
          {
            label: '平均動銷率(%)',
            data: monthlySummary.map(item => item.avgDynamicRate),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            yAxisID: 'y1',
          }
        ],
      });
      
      // 找出每個月份的前5名品牌
      const topBrands = new Set();
      months.forEach(month => {
        const monthData = groupedData[month];
        const sorted = [...monthData].sort((a, b) => {
          const rateA = parseFloat(a['動銷率']?.replace('%', '') || 0);
          const rateB = parseFloat(b['動銷率']?.replace('%', '') || 0);
          return rateB - rateA;
        });
        
        sorted.slice(0, 5).forEach(item => {
          if (item['品牌']) topBrands.add(item['品牌']);
        });
      });
      
      // 準備每個月頂級品牌的數據
      const brandsArray = Array.from(topBrands);
      
      // 為每個品牌創建一個數據集
      const brandDatasets = brandsArray.map((brand, index) => {
        const colorIndex = index % 5;
        const colors = [
          { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.5)' },
          { border: 'rgb(53, 162, 235)', background: 'rgba(53, 162, 235, 0.5)' },
          { border: 'rgb(255, 206, 86)', background: 'rgba(255, 206, 86, 0.5)' },
          { border: 'rgb(75, 192, 192)', background: 'rgba(75, 192, 192, 0.5)' },
          { border: 'rgb(153, 102, 255)', background: 'rgba(153, 102, 255, 0.5)' }
        ];
        
        return {
          label: brand,
          data: months.map(month => {
            const item = groupedData[month].find(d => d['品牌'] === brand);
            return item ? parseFloat(item['動銷率']?.replace('%', '') || 0) : 0;
          }),
          borderColor: colors[colorIndex].border,
          backgroundColor: colors[colorIndex].background
        };
      });
      
      // 只取前7個品牌，避免圖表過於擁擠
      setTopBrandsData({
        labels: months.map(month => month.replace('此紀錄為', '').replace('(30天內)', '')),
        datasets: brandDatasets.slice(0, 7)
      });
      
    } catch (err) {
      console.error('處理趨勢數據時出錯:', err);
    }
  };

  // 處理品牌選擇
  const handleBrandSelection = (brand) => {
    setSelectedBrands(prev => {
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand);
      } else {
        return [...prev, brand];
      }
    });
  };

  // 搜索並過濾品牌
  const filteredBrands = React.useMemo(() => {
    return allBrands
      .filter(brand => {
        // 過濾掉包含特殊字符或只有數字的品牌
        const isValidBrand = typeof brand === 'string' && 
                             !/^\d+$/.test(brand) && 
                             !brand.includes(',') &&
                             brand.length >= 2;
        
        if (!isValidBrand) return false;
        
        // 根據搜索詞過濾
        if (!brandSearchTerm) return true;
        return brand.toLowerCase().includes(brandSearchTerm.toLowerCase());
      })
      .sort((a, b) => a.localeCompare(b, 'zh-TW')); // 使用中文排序
  }, [allBrands, brandSearchTerm]);

  // 切換所有品牌選擇
  const toggleAllBrands = () => {
    if (selectedBrands.length >= filteredBrands.length) {
      // 如果所有品牌都已選中，則取消全部選擇
      setSelectedBrands([]);
    } else {
      // 否則選中所有過濾後的品牌
      setSelectedBrands([...filteredBrands]);
    }
  };

  // 渲染品牌選擇區域
  const renderBrandSelector = () => (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg font-bold mb-2">品牌選擇</h3>
      <div className="flex mb-2">
        <input
          type="text"
          value={brandSearchTerm}
          onChange={(e) => setBrandSearchTerm(e.target.value)}
          placeholder="搜索品牌..."
          className="border rounded p-2 mr-2 flex-grow"
        />
        <button
          onClick={toggleAllBrands}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {selectedBrands.length >= filteredBrands.length ? '取消全選' : '全選'}
        </button>
      </div>
      <div className="flex flex-wrap max-h-48 overflow-y-auto">
        {filteredBrands.map(brand => (
          <div key={brand} className="w-1/3 p-1">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => handleBrandSelection(brand)}
                className="mr-1"
              />
              <span className="truncate" title={brand}>
                {brand}
              </span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  // 格式化貨幣顯示
  const formatCurrency = (value) => {
    if (!value) return 'NT$ 0';
    const numValue = parseFloat(value.toString().replace(/[^0-9.-]+/g, ''));
    return 'NT$ ' + numValue.toLocaleString('en-US');
  };

  // 格式化百分比
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return '0%';
    return value.toFixed(2) + '%';
  };

  // 渲染異常或加載狀態
  const renderLoadingOrError = () => {
    if (isLoading) {
      return (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg">正在獲取數據，請稍候...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
              {errorDetails && (
                <div className="mt-2 text-xs text-yellow-600">
                  <p>{errorDetails}</p>
                </div>
              )}
              <div className="mt-4">
                <button
                  onClick={handleRetry}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  重新嘗試
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // 渲染品牌月度成長數據表格
  const renderBrandMonthlyGrowthTable = () => {
    if (!brandMonthlyGrowthData || brandMonthlyGrowthData.length === 0) {
      return <p className="text-center py-4">無品牌月度成長數據可顯示</p>;
    }
    
    // 只顯示當前選中的期間
    const currentPeriod = brandMonthlyGrowthData[selectedGrowthPeriod];
    
    // 獲取該期間所有品牌
    const brandsInPeriod = Object.keys(currentPeriod.brands);
    
    // 按動銷率排序（從高到低）
    const sortedBrands = brandsInPeriod.sort((a, b) => {
      const brandA = currentPeriod.brands[a];
      const brandB = currentPeriod.brands[b];
      
      // 如果動銷率存在，則按動銷率排序
      if (brandA.dynamicRate !== undefined && brandB.dynamicRate !== undefined) {
        return brandB.dynamicRate - brandA.dynamicRate;
      }
      
      // 如果動銷率不存在，則按銷售額排序
      return brandB.currentSales - brandA.currentSales;
    });
    
    return (
      <div className="mt-6">
        {/* 分頁導航 */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-md shadow">
            {brandMonthlyGrowthData.map((period, index) => (
              <button
                key={index}
                className={`px-4 py-2 text-sm font-medium ${
                  index === selectedGrowthPeriod
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${
                  index === 0 
                    ? 'rounded-l-md' 
                    : index === brandMonthlyGrowthData.length - 1 
                      ? 'rounded-r-md' 
                      : ''
                } border ${
                  index === selectedGrowthPeriod 
                    ? 'border-blue-600' 
                    : 'border-gray-300'
                }`}
                onClick={() => setSelectedGrowthPeriod(index)}
              >
                {period.periodLabel}
              </button>
            ))}
          </div>
        </div>
        
        {/* 當前期間的數據 */}
        <div>
          <h3 className="text-xl font-semibold mb-3">{currentPeriod.periodLabel} 品牌成長數據（按動銷率排序）</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-2 px-4 border text-left">品牌</th>
                  <th className="py-2 px-4 border text-right">動銷率</th>
                  <th className="py-2 px-4 border text-right">前期營業額</th>
                  <th className="py-2 px-4 border text-right">本期營業額</th>
                  <th className="py-2 px-4 border text-right">營業額成長數</th>
                  <th className="py-2 px-4 border text-right">營業額成長率</th>
                </tr>
              </thead>
              <tbody>
                {sortedBrands.map((brand, brandIndex) => {
                  const brandData = currentPeriod.brands[brand];
                  const isPositiveGrowth = brandData.growthAmount >= 0;
                  
                  return (
                    <tr key={brandIndex} className={brandIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4 border">{brand}</td>
                      <td className="py-2 px-4 border text-right">{brandData.dynamicRate ? formatPercentage(brandData.dynamicRate) : '-'}</td>
                      <td className="py-2 px-4 border text-right">{formatCurrency(brandData.previousSales)}</td>
                      <td className="py-2 px-4 border text-right">{formatCurrency(brandData.currentSales)}</td>
                      <td className={`py-2 px-4 border text-right ${isPositiveGrowth ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(brandData.growthAmount)}
                      </td>
                      <td className={`py-2 px-4 border text-right ${isPositiveGrowth ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(brandData.growthRate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 重置縮放
  const resetZoom = () => {
    if (brandChartRef.current) {
      brandChartRef.current.resetZoom();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>銷售數據儀表板 - 品牌分析</title>
        <meta name="description" content="銷售數據儀表板，顯示品牌銷售分析、動銷率和成長趨勢" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Header title="銷售數據分析儀表板" />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">商品優化數據儀表板</h1>
        
        {/* 顯示加載狀態或錯誤 */}
        {renderLoadingOrError()}
        
        {!isLoading && !error && (
          <>
            {/* 品牌營業額趨勢圖 */}
            <div className="mb-8">
              <div className="card">
                <h2 className="text-2xl font-semibold mb-4">品牌營業額趨勢</h2>
                <div className="chart-container" style={{ height: "500px" }}>
                  {brandSalesTrendData ? (
                    <LineChart 
                      data={brandSalesTrendData} 
                      title="品牌營業額趨勢"
                      ref={brandChartRef}
                      plugins={zoomPlugin ? [zoomPlugin] : []}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: false,
                            title: {
                              display: true,
                              text: '營業額 (NT$)'
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'bottom',  // 將圖例移到底部
                            align: 'start',
                            labels: {
                              boxWidth: 15,
                              padding: 10,
                              font: {
                                size: 12
                              },
                              generateLabels: function(chart) {
                                const datasets = chart.data.datasets;
                                return datasets.map((dataset, i) => {
                                  const isTotal = dataset.label === '總營業額';
                                  return {
                                    text: dataset.label,
                                    fillStyle: isTotal ? 'black' : dataset.borderColor,
                                    hidden: !chart.isDatasetVisible(i),
                                    lineDash: isTotal ? [5, 5] : [],
                                    lineWidth: isTotal ? 3 : 2,
                                    strokeStyle: dataset.borderColor,
                                    pointStyle: isTotal ? 'line' : 'circle',
                                    datasetIndex: i
                                  };
                                });
                              }
                            },
                            display: true,
                            // 不再需要overflow屬性，因為底部有足夠空間
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                  label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                  label += new Intl.NumberFormat('zh-TW', { 
                                    style: 'currency', 
                                    currency: 'TWD',
                                    maximumFractionDigits: 0 
                                  }).format(context.parsed.y);
                                }
                                return label;
                              }
                            }
                          },
                          zoom: zoomPlugin ? {
                            pan: {
                              enabled: true,
                              mode: 'xy'
                            },
                            zoom: {
                              wheel: {
                                enabled: true,
                              },
                              pinch: {
                                enabled: true
                              },
                              mode: 'xy',
                            }
                          } : {}
                        }
                      }}
                    />
                  ) : (
                    <p className="text-center py-10">無品牌營業額趨勢數據可顯示</p>
                  )}
                </div>

                {/* 獨立的品牌選擇器 */}
                {brandSalesTrendData && brandSalesTrendData.datasets && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="text-lg font-medium mb-2">品牌顯示控制</h3>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                        {brandSalesTrendData.datasets.map((dataset, index) => {
                          const isTotal = dataset.label === '總營業額';
                          const color = isTotal ? 'black' : dataset.borderColor;
                          
                          // 創建一個ref來存儲圖表實例
                          const isVisible = brandChartRef.current ? 
                            brandChartRef.current.isDatasetVisible(index) : 
                            true;
                          
                          return (
                            <div key={index} className="flex items-center">
                              <div 
                                className="w-4 h-4 mr-2 rounded-sm cursor-pointer"
                                style={{ 
                                  backgroundColor: isVisible ? color : 'transparent',
                                  borderStyle: 'solid',
                                  borderWidth: '1px',
                                  borderColor: color,
                                  borderStyle: isTotal && isVisible ? 'dashed' : 'solid'
                                }}
                                onClick={() => {
                                  if (brandChartRef.current) {
                                    const meta = brandChartRef.current.getDatasetMeta(index);
                                    meta.hidden = meta.hidden === null ? !brandChartRef.current.isDatasetVisible(index) : null;
                                    brandChartRef.current.update();
                                  }
                                }}
                              ></div>
                              <span className="text-sm truncate" title={dataset.label}>
                                {dataset.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    <p>* 點擊上方的品牌方塊可以切換顯示/隱藏對應的品牌數據</p>
                    <p>* 黑色虛線代表總營業額趨勢，可作為比較基準</p>
                    <p>* 可以使用滑鼠滾輪或觸控板進行縮放，按住滑鼠拖動可平移圖表</p>
                  </div>
                  <button
                    onClick={resetZoom}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    重置縮放
                  </button>
                </div>
              </div>
            </div>
            
            {/* 營業額成長趨勢 */}
            <div className="mb-8">
              <div className="card">
                <h2 className="text-2xl font-semibold mb-4">營業額成長趨勢</h2>
                <div className="chart-container">
                  {salesGrowthData ? (
                    <LineChart 
                      data={salesGrowthData} 
                      title="營業額成長數與成長比" 
                      options={{
                        scales: {
                          y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                              display: true,
                              text: '營業額成長數 (NT$)'
                            },
                            grid: {
                              drawOnChartArea: true,
                            },
                          },
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                              display: true,
                              text: '營業額成長比率 (%)'
                            },
                            grid: {
                              drawOnChartArea: false,
                            },
                          },
                        }
                      }}
                    />
                  ) : (
                    <p className="text-center py-10">無營業額成長數據可顯示</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* 品牌月度成長數據 */}
            <div className="mb-8">
              <div className="card">
                <h2 className="text-2xl font-semibold mb-4">品牌月度成長數據</h2>
                {renderBrandMonthlyGrowthTable()}
              </div>
            </div>
            
            {/* 品牌比較功能 */}
            <div className="mb-8">
              <div className="card">
                <h2 className="text-2xl font-semibold mb-4">品牌對比分析</h2>
                
                {/* 時間範圍選擇 */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">選擇比較時間範圍</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">開始月份</label>
                      <select 
                        className="border rounded p-2 w-48"
                        value={comparisonStartMonth}
                        onChange={(e) => setComparisonStartMonth(e.target.value)}
                      >
                        {availableMonths.map((month, index) => (
                          <option key={index} value={month}>
                            {month.replace('此紀錄為', '').replace('(30天內)', '')}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">結束月份</label>
                      <select 
                        className="border rounded p-2 w-48"
                        value={comparisonEndMonth}
                        onChange={(e) => setComparisonEndMonth(e.target.value)}
                      >
                        {availableMonths.map((month, index) => (
                          <option key={index} value={month}>
                            {month.replace('此紀錄為', '').replace('(30天內)', '')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* 品牌選擇 */}
                {renderBrandSelector()}
                
                {/* 比較圖表 */}
                <div className="chart-container">
                  {brandComparisonData && selectedBrands.length > 0 ? (
                    <LineChart 
                      data={brandComparisonData} 
                      title="品牌表現對比" 
                      options={{
                        scales: {
                          y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                              display: true,
                              text: '營業額 (NT$)'
                            },
                            grid: {
                              drawOnChartArea: true,
                            },
                          },
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                              display: true,
                              text: '動銷率 (%)'
                            },
                            grid: {
                              drawOnChartArea: false,
                            },
                          },
                        }
                      }}
                    />
                  ) : (
                    <p className="text-center py-10">請選擇要比較的品牌</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
} 