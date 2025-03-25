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

// API服務端點配置
const API_ENDPOINT = 'https://api-service-lins-projects-913ae17f.vercel.app';

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
      try {
        const zoom = (await import('chartjs-plugin-zoom')).default;
        setZoomPlugin(zoom);
      } catch (err) {
        console.error('加載縮放插件失敗:', err);
      }
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
      // 使用新部署的API服務獲取數據
      const response = await axios.get(`${API_ENDPOINT}/api/fetch-brand-data`, {
        timeout: 15000,
        params: {
          timestamp: new Date().getTime() // 添加時間戳參數避免緩存
        }
      });
      
      // 處理數據
      const data = response.data;
      
      setBrandSalesData(data.brandSalesData || null);
      setDynamicRateData(data.dynamicRateData || null);
      setAttributeDistributionData(data.attributeDistributionData || null);
      setRawData(data.rawData || []);
      setMonthlyData(data.monthlyData || {});
      setMonthlySummary(data.monthlySummary || []);
      setAllBrands(data.allBrands || []);
      setSelectedBrands(data.selectedBrands || []);
      setComparisonStartMonth(data.comparisonStartMonth || '');
      setComparisonEndMonth(data.comparisonEndMonth || '');
      setBrandSearchTerm(data.brandSearchTerm || '');
      setSelectedGrowthPeriod(data.selectedGrowthPeriod || 0);
      setTrendData(data.trendData || null);
      setTopBrandsData(data.topBrandsData || null);
      setSalesGrowthData(data.salesGrowthData || null);
      setBrandSalesTrendData(data.brandSalesTrendData || null);
      setBrandMonthlyGrowthData(data.brandMonthlyGrowthData || null);
      
    } catch (err) {
      console.error('獲取數據時出錯:', err);
      setError(err.message || '無法載入數據');
      
      // 如果出錯，使用默認數據
      setBrandSalesData(null);
      setDynamicRateData(null);
      setAttributeDistributionData(null);
      setRawData([]);
      setMonthlyData({});
      setMonthlySummary([]);
      setAllBrands([]);
      setSelectedBrands([]);
      setComparisonStartMonth('');
      setComparisonEndMonth('');
      setBrandSearchTerm('');
      setSelectedGrowthPeriod(0);
      setTrendData(null);
      setTopBrandsData(null);
      setSalesGrowthData(null);
      setBrandSalesTrendData(null);
      setBrandMonthlyGrowthData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 數據格式化函數
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString('zh-TW');
  };
  
  // 重置縮放
  const resetZoom = () => {
    if (brandChartRef.current) {
      brandChartRef.current.resetZoom();
    }
  };
  
  // 加載中顯示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="品牌銷售數據" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-xl text-gray-600">載入數據中...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // 錯誤顯示
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="品牌銷售數據" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md inline-block text-left">
              <p className="font-bold">載入失敗</p>
              <p>{error}</p>
            </div>
            <button 
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              重試
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>品牌銷售數據 | 數據儀表板</title>
        <meta name="description" content="品牌銷售數據儀表板" />
      </Head>
      
      <Header title="品牌銷售數據" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 數據概覽卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">總銷售額</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${formatNumber(brandSalesData?.datasets[0].data.reduce((a, b) => a + b, 0))}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">總銷售數量</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatNumber(brandSalesData?.datasets[1].data.reduce((a, b) => a + b, 0))}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">總瀏覽量</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatNumber(dynamicRateData?.datasets[0].data.reduce((a, b) => a + b, 0))}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">平均轉換率</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatNumber(dynamicRateData?.datasets[1].data.reduce((a, b) => a + b, 0))}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">平均售價</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${formatNumber(brandSalesData?.datasets[0].data.reduce((a, b) => a + b, 0) / brandSalesData?.datasets[0].data.length)}
            </p>
          </div>
        </div>
        
        {/* 品牌銷售趨勢圖 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">品牌銷售趨勢</h2>
            <div className="h-96 relative">
              {trendData && trendData.length > 0 ? (
                <>
                  <LineChart 
                    data={trendData} 
                    ref={brandChartRef}
                  />
                  <button 
                    onClick={resetZoom}
                    className="absolute top-2 right-2 text-sm bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                  >
                    重置縮放
                  </button>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    滾動滑鼠滾輪可縮放，按住拖動可平移圖表
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">無趨勢數據可顯示</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 品牌數據表格 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">品牌數據詳情</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      品牌
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      銷售額
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      銷售數量
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      瀏覽量
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      轉換率 (%)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      平均售價
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {brandSalesData?.datasets[0].data.map((sales, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {brandSalesData?.labels[index]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${formatNumber(sales)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(brandSalesData?.datasets[1].data[index])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(dynamicRateData?.datasets[0].data[index])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(dynamicRateData?.datasets[1].data[index])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${formatNumber(brandSalesData?.datasets[0].data[index] / brandSalesData?.datasets[1].data[index])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 