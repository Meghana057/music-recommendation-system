// src/components/charts/Histogram.tsx

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
import { Song } from '../../types';
import { generateHistogramData } from '../../utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface HistogramProps {
  songs: Song[];
  title?: string;
  height?: number;
}

const Histogram: React.FC<HistogramProps> = ({
  songs,
  title = "Song Duration Distribution",
  height = 400,
}) => {
  const theme = useTheme();
  const histogramData = generateHistogramData(songs);

  const data = {
    labels: histogramData.map(item => item.label),
    datasets: [
      {
        label: 'Number of Songs',
        data: histogramData.map(item => item.count),
        backgroundColor: theme.custom.chart.secondary + '80',
        borderColor: theme.custom.chart.secondary,
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
          text: 'Duration Range',
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
          text: 'Number of Songs',
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
        <Bar data={data} options={options} />
      </Box>
    </Paper>
  );
};
export default Histogram;