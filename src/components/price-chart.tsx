import React, { useEffect, useRef, memo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

// Define Cryptocurrency type based on your CoinDetail.tsx
interface Cryptocurrency {
  id: number;
  name: string;
  symbol: string;
  pair: string;
  price: number;
  change24h: number;
  price_change_24h: number;
  volume24h: number;
  image: string;
  last_updated: string;
  description?: string;
  marketCap?: number;
  supply?: string;
}

// Helper function to format numbers (copy from CoinDetail.tsx to keep it self-contained or import if possible)
const formatNumber = (num: number, currency: boolean = false) => {
  if (num === null || num === undefined) {
    return currency ? "$0.00" : "0";
  }
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: num < 100 ? 8 : 2,
  });
  return currency ? `$${formatted}` : formatted;
};

interface TradingViewWidgetProps {
  symbol: string;
}

const TradingViewWidget = memo(({ symbol }: TradingViewWidgetProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: 400,
      symbol: `${symbol}USDT`, // Use dynamic symbol
      interval: "1", // Daily interval for 3-month view
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      toolbar_bg: "#0F0F0F",
      enable_publishing: false,
      allow_symbol_change: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      save_image: false,
      container_id: "tradingview_chart",
      backgroundColor: "#0F0F0F",
      gridColor: "rgba(242, 242, 242, 0.06)",
      hide_volume: false, // Show volume bars
      studies: [], // Remove unsupported studies to avoid errors
      withdateranges: true, // Allow date range selection for 3-month view
    });

    const handleScriptError = () => {
      console.error("Failed to load TradingView widget script");
    };

    script.onerror = handleScriptError;
    container.current.innerHTML = ""; // Clear previous content to prevent duplicate scripts
    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = ""; // Cleanup on unmount
      }
    };
  }, [symbol]); // Re-run effect if symbol changes

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "400px", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
});

interface CryptoChartProps {
  coin: Cryptocurrency;
  currentPrice: number | null;
}

const CryptoChart = ({ coin, currentPrice }: CryptoChartProps) => {
  const change24hColor = (coin?.change24h ?? 0) >= 0 ? "text-green-400" : "text-red-400";
  const displayPrice = currentPrice !== null ? currentPrice : coin.price;

  return (
    <div className="glass-card p-2 rounded-lg mb-8 animate-fade-in" style={{ background: '#0f0f0f', border: '1px solid #1f2a44' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-white">{coin.symbol} / USDT</h2>
          <span className="text-gray-400 text-sm">3M • CoinGecko</span>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div> {/* This status indicator might need actual logic */}
        </div>
        <div className="block items-center space-x-2">
          <div className="text-2xl font-bold text-white">{formatNumber(displayPrice, true)}</div>
          <div className={`text-sm ${change24hColor}`}>
            {(coin.change24h ?? 0) >= 0 ? <TrendingUp className="inline-block mr-1 h-4 w-4" /> : <TrendingDown className="inline-block mr-1 h-4 w-4" />}
            {formatNumber(coin.price_change_24h, true)} ({formatNumber(coin.change24h)}%)
          </div>
        </div>
      </div>
      <div className="h-[400px] w-full">
        <TradingViewWidget symbol={coin.symbol} />
      </div>
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Indicators</span>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={false}
                disabled
                className="w-3 h-3 text-yellow-400 bg-gray-700 border-gray-600 rounded focus:ring-yellow-500"
              />
              <span className="text-yellow-400 text-sm">MA20</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={false} // Disabled since studies aren't configured
                disabled
                className="w-3 h-3 text-purple-400 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <span className="text-purple-400 text-sm">MA50</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={true}
                disabled
                className="w-3 h-3 text-blue-400 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-blue-400 text-sm">Volume</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoChart;