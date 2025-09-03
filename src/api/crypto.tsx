// Fetch prices for a list of coin IDs from your backend
export const fetchCryptoPrices = async (coinIds: string[]) => {
  const res = await fetch("https://myblog.alwaysdata.net/api/cryptocurrencies");
  if (!res.ok) throw new Error("Failed to fetch crypto prices");
  const data = await res.json();

  // Map to expected format
  const priceMap = new Map();
  for (const id of coinIds) {
    const coin = data.find((c: any) => c.id === id);
    if (coin) {
      priceMap.set(id, {
        price: parseFloat(coin.price),
        change24h: parseFloat(coin.change24h),
      });
    }
  }
  return priceMap;
};

// Fetch chart data for a coin from your backend (or generate dummy data)
export const fetchCryptoChartData = async (
  coinId: string,
  days: string,
  interval: 'hourly' | 'daily' | 'minutely'
) => {
  // Try to fetch from backend (if you implement this endpoint)
  const res = await fetch(`https://myblog.alwaysdata.net/api/cryptocurrencies/${coinId}`);
  if (!res.ok) throw new Error("Failed to fetch crypto chart data");
  const coin = await res.json();

  // If your backend doesn't provide chartData, generate dummy data
  if (coin.chartData && Array.isArray(coin.chartData)) {
    return coin.chartData;
  }
  // Fallback: flat chart with current price
  const now = Date.now();
  return Array.from({ length: 60 }, (_, i) => ({
    time: now - (60 - i) * 60 * 1000,
    value: parseFloat(coin.price),
  }));
};