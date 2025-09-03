export interface CryptoChartData {
  timestamp: number;
  price: number;
  volume: number;
}

export interface ChartResponse {
  symbol: string;
  timeframe: string;
  data: CryptoChartData[];
}

export const generateMockChartSVG = (changePercent: number, width: number = 60, height: number = 30) => {
  const points = 7;
  const isPositive = changePercent >= 0;
  const color = isPositive ? '#10B981' : '#EF4444';
  
  // Generate mock price points with trend based on change percent
  const baseValue = height * 0.7;
  const trend = (changePercent / 100) * height * 0.3;
  
  let pathData = '';
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * width;
    const randomVariation = (Math.random() - 0.5) * height * 0.2;
    const trendValue = (i / (points - 1)) * trend;
    const y = baseValue - trendValue + randomVariation;
    
    if (i === 0) {
      pathData += `M ${x},${y}`;
    } else {
      pathData += ` L ${x},${y}`;
    }
  }
  
  return `
    <svg viewBox="0 0 ${width} ${height}" class="w-full h-full">
      <path
        d="${pathData}"
        fill="none"
        stroke="${color}"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;
};
