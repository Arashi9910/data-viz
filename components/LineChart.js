import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// 註冊 ChartJS 組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LineChart = forwardRef(({ data, title, options: customOptions, plugins }, ref) => {
  // 創建內部引用來存儲圖表實例
  const chartRef = useRef(null);
  
  // 暴露圖表方法給父組件
  useImperativeHandle(ref, () => ({
    // 重置縮放方法
    resetZoom: () => {
      if (chartRef.current && chartRef.current.resetZoom) {
        chartRef.current.resetZoom();
      }
    },
    // 檢查數據集是否可見
    isDatasetVisible: (datasetIndex) => {
      if (chartRef.current && chartRef.current.data) {
        const meta = chartRef.current.getDatasetMeta(datasetIndex);
        return !meta.hidden;
      }
      return true;
    },
    // 獲取數據集元數據
    getDatasetMeta: (datasetIndex) => {
      if (chartRef.current) {
        return chartRef.current.getDatasetMeta(datasetIndex);
      }
      return null;
    },
    // 更新圖表
    update: () => {
      if (chartRef.current) {
        chartRef.current.update();
      }
    }
  }));

  // 合併默認選項和自定義選項
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
        },
      },
    },
  };

  const options = customOptions ? { ...defaultOptions, ...customOptions } : defaultOptions;

  return (
    <div className="chart-container">
      <Line 
        ref={chartRef} 
        plugins={plugins} 
        options={options} 
        data={data}
      />
    </div>
  );
});

// 添加顯示名稱，方便調試
LineChart.displayName = 'LineChart';

export default LineChart; 