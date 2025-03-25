import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

// 註冊 ChartJS 組件
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const PieChart = ({ data, title }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
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

  return (
    <div className="chart-container">
      <Pie options={options} data={data} />
    </div>
  );
};

export default PieChart; 