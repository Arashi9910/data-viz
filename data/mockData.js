// 週間趨勢數據
export const weeklyTrendData = {
  labels: ['第1週', '第2週', '第3週', '第4週', '第5週', '第6週', '第7週', '第8週'],
  datasets: [
    {
      label: '銷售額',
      data: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000],
      borderColor: 'rgb(53, 162, 235)',
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
    },
    {
      label: '利潤',
      data: [5000, 8000, 6000, 11000, 9500, 14000, 13000, 17000],
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    },
  ],
};

// 圓餅圖數據
export const pieChartData = {
  labels: ['產品A', '產品B', '產品C', '產品D', '產品E'],
  datasets: [
    {
      data: [30, 25, 20, 15, 10],
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

// 長條圖數據
export const barChartData = {
  labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
  datasets: [
    {
      label: '北區',
      data: [65, 59, 80, 81, 56, 55],
      backgroundColor: 'rgba(255, 99, 132, 0.7)',
    },
    {
      label: '中區',
      data: [45, 70, 60, 75, 85, 90],
      backgroundColor: 'rgba(54, 162, 235, 0.7)',
    },
    {
      label: '南區',
      data: [30, 40, 50, 60, 70, 80],
      backgroundColor: 'rgba(75, 192, 192, 0.7)',
    },
  ],
}; 