import React from 'react';
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
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TelemetryChart = ({ telemetryData }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#00ff88',
          font: {
            family: 'Consolas'
          }
        }
      },
      title: {
        display: true,
        text: 'Real-time Telemetry Data',
        color: '#00ff88',
        font: {
          family: 'Consolas',
          size: 16
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#00ff88',
          maxTicksLimit: 10
        },
        grid: {
          color: 'rgba(0, 255, 136, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#00ff88'
        },
        grid: {
          color: 'rgba(0, 255, 136, 0.1)'
        }
      },
    },
    elements: {
      point: {
        radius: 2
      }
    }
  };

  const data = {
    labels: telemetryData.timestamps,
    datasets: [
      {
        label: 'Battery %',
        data: telemetryData.battery,
        borderColor: 'rgb(0, 255, 136)',
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Signal Strength %',
        data: telemetryData.signalStrength,
        borderColor: 'rgb(255, 206, 84)',
        backgroundColor: 'rgba(255, 206, 84, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Temperature °C',
        data: telemetryData.temperature,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.4,
      }
    ],
  };

  return (
    <div className="telemetry-chart">
      <Line options={options} data={data} />
    </div>
  );
};

export default TelemetryChart;
