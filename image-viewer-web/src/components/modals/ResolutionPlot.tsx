// @ts-nocheck
import React from 'react';
import { useViewerStore } from '../../store/useViewerStore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

type PlotData = {
  x: number[];
  groups: number[][];
};

type ResolutionPlotProps = {
  plotData: PlotData;
};

export const ResolutionPlot: React.FC<ResolutionPlotProps> = ({ plotData }) => {

  const { 
    resolutionValues,
    binSize,
  } = useViewerStore();

  const sortedRes = [...resolutionValues].sort((a, b) => a - b).slice(0, 5);

  const LABELS = sortedRes.map((res, i) => {
    if (i < sortedRes.length - 1) {
      return `${sortedRes[i]} ≤ Res < ${sortedRes[i + 1]}`;
    } else {
      return `${sortedRes[i]} ≤ Res`;
    }
  });

  const COLORS = ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#4bc0c0'];

  const chartData = {
    labels: plotData.x,
    datasets: plotData.groups.map((group, idx) => ({
      label: LABELS[idx],
      data: group,
      fill: false,
      borderColor: COLORS[idx],
      backgroundColor: COLORS[idx],
      tension: 0.2,
    })),
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: `Mean Peak Count per Resolution Range (Binned by every ${binSize} images)`,
        font: {
          size: 20,
          weight: 'bold',
        },
      },
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        bodyFont: {
          size: 14,
        },
        titleFont: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: `Image (Binned by every ${binSize} images)`,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
      y: {
        title: {
          display: true,
          text: 'Mean Peak Count',
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};
