import React from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import LineChart from '../components/LineChart';
import { weeklyTrendData } from '../data/mockData';

export default function Trends() {
  // 模擬不同時間段的數據
  const monthlyData = {
    labels: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    datasets: [
      {
        label: '銷售額',
        data: [42000, 39000, 55000, 57000, 56000, 68000, 72000, 74000, 78000, 85000, 92000, 105000],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: '利潤',
        data: [18000, 16500, 24000, 25500, 24800, 32000, 34000, 35000, 38000, 41000, 45000, 52000],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const yearlyData = {
    labels: ['2017', '2018', '2019', '2020', '2021', '2022', '2023'],
    datasets: [
      {
        label: '銷售額',
        data: [420000, 580000, 750000, 690000, 850000, 950000, 1150000],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: '利潤',
        data: [180000, 250000, 320000, 290000, 380000, 420000, 520000],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  return (
    <div>
      <Head>
        <title>趨勢分析 | 數據可視化中心</title>
        <meta name="description" content="趨勢分析數據可視化" />
      </Head>

      <Header />

      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">趨勢分析</h1>
        
        <div className="space-y-8">
          {/* 週間趨勢 */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">週間趨勢</h2>
            <LineChart data={weeklyTrendData} title="週間銷售和利潤趨勢" />
          </div>
          
          {/* 月度趨勢 */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">月度趨勢</h2>
            <LineChart data={monthlyData} title="月度銷售和利潤趨勢" />
          </div>
          
          {/* 年度趨勢 */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">年度趨勢</h2>
            <LineChart data={yearlyData} title="年度銷售和利潤趨勢" />
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