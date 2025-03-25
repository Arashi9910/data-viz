import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import LineChart from '../components/LineChart';
import PieChart from '../components/PieChart';
import 'chart.js/auto';  // 確保Chart.js相關功能可用
import axios from 'axios';

// 動態引入縮放插件，避免服務器端渲染問題
import dynamic from 'next/dynamic';

export default function ViewData() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [distributionData, setDistributionData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [zoomPlugin, setZoomPlugin] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false); // 刷新狀態
  const [autoRefresh, setAutoRefresh] = useState(false); // 自動刷新狀態
  const [lastRefreshTime, setLastRefreshTime] = useState(null); // 上次刷新時間
  const autoRefreshIntervalRef = useRef(null); // 自動刷新定時器引用
  
  // 趨勢圖引用
  const trendChartRef = useRef(null);
  
  // 加載縮放插件
  useEffect(() => {
    const loadZoomPlugin = async () => {
      const zoom = (await import('chartjs-plugin-zoom')).default;
      setZoomPlugin(zoom);
    };
    
    loadZoomPlugin();
  }, []);
  
  // 獲取數據的函數
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    setErrorDetails(null);
    
    try {
      const response = await axios.get('/api/fetch-view-data', { 
        timeout: 15000,
        params: {
          timestamp: new Date().getTime() // 添加時間戳參數避免緩存
        }
      });
      
      // 設置數據
      const result = response.data;
      
      if (result.exampleData) {
        setError('正在顯示示例數據。' + (result.message || ''));
      } else {
        setError(null);
      }
      
      // 設置各種圖表數據
      setViewData(result.data.viewData);
      setTrendData(result.data.trendData);
      setDistributionData(result.data.distributionData);
      setSummary(result.data.summary);
      
      // 更新上次刷新時間
      setLastRefreshTime(new Date());
      
    } catch (err) {
      console.error('獲取數據時出錯:', err);
      let errorMsg = '獲取數據時出錯，請確保 Google Sheet 是公開的';
      let detailsMsg = null;
      
      if (err.response && err.response.data) {
        errorMsg = err.response.data.error || errorMsg;
        detailsMsg = err.response.data.details || null;
      }
      
      setError(errorMsg);
      setErrorDetails(detailsMsg);
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);
  
  // 第一次加載數據
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // 處理自動刷新
  useEffect(() => {
    if (autoRefresh) {
      // 每5分鐘刷新一次數據
      autoRefreshIntervalRef.current = setInterval(() => {
        fetchData(true);
      }, 5 * 60 * 1000);
      
      // 清理定時器
      return () => {
        if (autoRefreshIntervalRef.current) {
          clearInterval(autoRefreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, fetchData]);
  
  // 切換自動刷新
  const toggleAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
    setAutoRefresh(!autoRefresh);
  };
  
  // 手動刷新數據
  const refreshData = () => {
    fetchData(true);
  };
  
  // 重置縮放
  const resetZoom = () => {
    if (trendChartRef.current) {
      trendChartRef.current.resetZoom();
    }
  };
  
  // 格式化數字為易讀格式
  const formatNumber = (num) => {
    return new Intl.NumberFormat('zh-TW').format(num);
  };
  
  // 格式化時間
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // 渲染加載狀態或錯誤
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
                  onClick={refreshData}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  重新載入
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>賣場瀏覽數據 - 數據儀表板</title>
        <meta name="description" content="賣場瀏覽數據分析，顯示總瀏覽數、廣告瀏覽數和自然瀏覽數" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Header title="賣場數據分析儀表板" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">賣場瀏覽數據儀表板</h1>
          
          {!isLoading && (
            <div className="flex items-center space-x-4 mt-2 md:mt-0">
              {lastRefreshTime && (
                <div className="text-sm text-gray-600">
                  上次更新: {lastRefreshTime.toLocaleDateString('zh-TW')} {formatTime(lastRefreshTime)}
                </div>
              )}
              
              <div className="flex items-center">
                <button 
                  className={`px-4 py-2 rounded font-medium flex items-center space-x-2 transition-colors ${
                    isRefreshing 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  onClick={refreshData}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>刷新中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>刷新數據</span>
                    </>
                  )}
                </button>
                
                <button 
                  className={`ml-2 px-4 py-2 rounded font-medium flex items-center space-x-2 transition-colors ${
                    autoRefresh
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                  onClick={toggleAutoRefresh}
                >
                  <span>{autoRefresh ? '關閉自動刷新' : '開啟自動刷新'}</span>
                  {autoRefresh && (
                    <span className="inline-flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {autoRefresh && !isLoading && !error && (
          <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">自動刷新已開啟，每5分鐘刷新一次數據。</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 顯示加載狀態或錯誤 */}
        {renderLoadingOrError()}
        
        {!isLoading && !error && (
          <>
            {/* 數據摘要卡片 */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="card bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700">總瀏覽量</h3>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(summary.totalViews)}</p>
                </div>
                <div className="card bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700">廣告瀏覽量</h3>
                  <p className="text-3xl font-bold text-pink-600">{formatNumber(summary.adViews)}</p>
                  <p className="text-sm text-gray-500">{summary.adViewsPercentage}% 佔總瀏覽量</p>
                </div>
                <div className="card bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700">自然瀏覽量</h3>
                  <p className="text-3xl font-bold text-teal-600">{formatNumber(summary.organicViews)}</p>
                  <p className="text-sm text-gray-500">{summary.organicViewsPercentage}% 佔總瀏覽量</p>
                </div>
                <div className="card bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700">數據來源</h3>
                  <p className="text-md text-gray-600">Google Sheet</p>
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1-SDpG2WKJ4WyLNR2bQn5YtVXtidB8fC0fuj6h1MlkbI/edit?gid=1540752873#gid=1540752873"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    查看原始數據
                  </a>
                </div>
              </div>
            )}
            
            {/* 瀏覽量趨勢圖 */}
            <div className="mb-8">
              <div className="card bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-4">瀏覽量趨勢</h2>
                <div className="chart-container" style={{ height: "400px" }}>
                  {trendData ? (
                    <LineChart 
                      data={trendData} 
                      title="瀏覽量趨勢"
                      ref={trendChartRef}
                      plugins={zoomPlugin ? [zoomPlugin] : []}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: '瀏覽量'
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              boxWidth: 15,
                              padding: 10,
                              font: {
                                size: 12
                              }
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                  label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                  label += formatNumber(context.parsed.y);
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
                    <p className="text-center py-10">無趨勢數據可顯示</p>
                  )}
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
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
            
            {/* 瀏覽量分佈圓餅圖 */}
            <div className="mb-8">
              <div className="card bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-4">瀏覽量來源分佈</h2>
                <div className="chart-container" style={{ height: "400px" }}>
                  {distributionData ? (
                    <PieChart 
                      data={distributionData} 
                      title="瀏覽量來源分佈"
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: {
                          padding: {
                            top: 10,
                            right: 20,
                            bottom: 20,
                            left: 20
                          }
                        },
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              boxWidth: 15,
                              padding: 15,
                              font: {
                                size: 14
                              },
                              generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                  return data.labels.map(function(label, i) {
                                    const meta = chart.getDatasetMeta(0);
                                    const style = meta.controller.getStyle(i);
                                    const value = chart.config.data.datasets[0].data[i];
                                    const total = chart.config.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(2) + '%';
                                    
                                    return {
                                      text: `${label}: ${percentage}`,
                                      fillStyle: style.backgroundColor,
                                      hidden: isNaN(data.datasets[0].data[i]) || meta.data[i].hidden,
                                      index: i
                                    };
                                  });
                                }
                                return [];
                              }
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = context.parsed || 0;
                                return `${label}: ${formatNumber(value)} (${percentage.toFixed(2)}%)`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <p className="text-center py-10">無分佈數據可顯示</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* 數據表格 */}
            <div className="mb-8">
              <div className="card bg-white p-6 rounded-lg shadow overflow-hidden">
                <h2 className="text-2xl font-semibold mb-4">詳細數據表</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="py-2 px-4 border">日期</th>
                        <th className="py-2 px-4 border text-right">總瀏覽數</th>
                        <th className="py-2 px-4 border text-right">廣告瀏覽數</th>
                        <th className="py-2 px-4 border text-right">自然瀏覽數</th>
                        <th className="py-2 px-4 border text-right">廣告佔比</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewData && viewData.map((row, index) => {
                        const adPercentage = (row.adViews / row.totalViews * 100).toFixed(2);
                        return (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="py-2 px-4 border">{row.date}</td>
                            <td className="py-2 px-4 border text-right">{formatNumber(row.totalViews)}</td>
                            <td className="py-2 px-4 border text-right">{formatNumber(row.adViews)}</td>
                            <td className="py-2 px-4 border text-right">{formatNumber(row.organicViews)}</td>
                            <td className="py-2 px-4 border text-right">{adPercentage}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
} 