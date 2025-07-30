// src/components/charts/BarChart.tsx

import React from 'react';
import { Paper, Box, useTheme } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { BarChartData } from '../../types';
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  data: BarChartData[];
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  height?: number;
  color?: string;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  xAxisLabel,
  yAxisLabel,
  height = 400,
  color,
}) => {
  const theme = useTheme();
  const chartColor = color || theme.custom.chart.accent;

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: yAxisLabel,
        data: data.map(item => item.value),
        backgroundColor: chartColor + '80',
        borderColor: chartColor,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.palette.text.primary,
        },
      },
      title: {
        display: true,
        text: title,
        color: theme.palette.text.primary,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xAxisLabel,
          color: theme.palette.text.primary,
        },
        grid: {
          color: theme.custom.chart.grid,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
      },
      y: {
        title: {
          display: true,
          text: yAxisLabel,
          color: theme.palette.text.primary,
        },
        grid: {
          color: theme.custom.chart.grid,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <Paper elevation={2} sx={{ p: 3, height: height + 100 }}>
      <Box height={height}>
        <Bar data={chartData} options={options} />
      </Box>
    </Paper>
  );
};
export default BarChart;