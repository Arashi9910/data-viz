import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import PieChart from '../components/PieChart';
import BarChart from '../components/BarChart';
import { pieChartData, barChartData } from '../data/mockData';

export default function Distribution() {
  // 模擬不同類型的分布數據
  const marketShareData = {
    labels: ['品牌A', '品牌B', '品牌C', '品牌D', '其他'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
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
      },
    ],
  };

  const customerTypeData = {
    labels: ['個人消費者', '小型企業', '中型企業', '大型企業', '政府機構'],
    datasets: [
      {
        data: [40, 30, 15, 10, 5],
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
      },
    ],
  };

  // 客戶年齡分布長條圖
  const ageDistributionData = {
    labels: ['18-24歲', '25-34歲', '35-44歲', '45-54歲', '55-64歲', '65歲以上'],
    datasets: [
      {
        label: '客戶數量',
        data: [15, 30, 25, 18, 8, 4],
        backgroundColor: 'rgba(53, 162, 235, 0.7)',
      },
    ],
  };

  return (
    <div>
      <Head>
        <title>分布分析 | 數據可視化中心</title>
        <meta name="description" content="分布分析數據可視化" />
      </Head>

      <Header />

      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">分布分析</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 產品銷售分布 */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">產品銷售分布</h2>
            <PieChart data={pieChartData} title="產品銷售分布" />
          </div>
          
          {/* 市場佔有率 */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">市場佔有率</h2>
            <PieChart data={marketShareData} title="市場佔有率分布" />
          </div>
          
          {/* 客戶類型分布 */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">客戶類型分布</h2>
            <PieChart data={customerTypeData} title="客戶類型分布" />
          </div>
          
          {/* 客戶年齡分布 */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">客戶年齡分布</h2>
            <BarChart data={ageDistributionData} title="客戶年齡分布" />
          </div>
          
          {/* 區域表現 */}
          <div className="card col-span-1 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">區域月度表現</h2>
            <BarChart data={barChartData} title="各區域月度表現" />
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 py-6 border-t">
        <div className="container text-center text-gray-600">
          <p>© {new Date().getFullYear()} 數據可視化中心. 版權所有.</p>
        </div>
      </footer>
    </div>
  );
} 