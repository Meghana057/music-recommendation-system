// src/components/charts/ScatterChart.tsx

import React from 'react';
import { Paper,Box, useTheme } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { Song } from '../../types';
import { generateScatterData } from '../../utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ScatterChartProps {
  songs: Song[];
  title?: string;
  height?: number;
}

const ScatterChart: React.FC<ScatterChartProps> = ({
  songs,
  title = "Danceability vs Energy",
  height = 400,
}) => {
  const theme = useTheme();
  const scatterData = generateScatterData(songs);

  const data = {
    datasets: [
      {
        label: 'Songs',
        data: scatterData.map(point => ({
          x: point.x,
          y: point.y,
          title: point.title,
        })),
        backgroundColor: theme.custom.chart.primary + '80', // Add transparency
        borderColor: theme.custom.chart.primary,
        borderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6,
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
        callbacks: {
          title: (context: TooltipItem<'scatter'>[]) => {
            const point = context[0].raw as any;
            return point.title || 'Unknown Song';
          },
          label: (context: TooltipItem<'scatter'>) => {
            return [
              `Danceability: ${context.parsed.x.toFixed(3)}`,
              `Energy: ${context.parsed.y.toFixed(3)}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        title: {
          display: true,
          text: 'Danceability',
          color: theme.palette.text.primary,
        },
        grid: {
          color: theme.custom.chart.grid,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
        min: 0,
        max: 1,
      },
      y: {
        title: {
          display: true,
          text: 'Energy',
          color: theme.palette.text.primary,
        },
        grid: {
          color: theme.custom.chart.grid,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
        min: 0,
        max: 1,
      },
    },
  };

  return (
    <Paper elevation={2} sx={{ p: 3, height: height + 100 }}>
      <Box height={height}>
        <Scatter data={data} options={options} />
      </Box>
    </Paper>
  );
};
export default ScatterChart;