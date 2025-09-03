// src/api/mockExchangeRates.ts (rename or update this file to exchangeRates.ts if preferred)
export const fetchCryptoToUsdRates = async () => {
  // Fetch real-time prices from CoinGecko API
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,tron,dogecoin&vs_currencies=usd');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Map the API response to the expected format { BTC: price, ETH: price, ... }
    return {
      BTC: data.bitcoin?.usd || 0,
      ETH: data.ethereum?.usd || 0,
      USDT: data.tether?.usd || 1, // Default to 1 if unavailable
      TRX: data.tron?.usd || 0,
      DOGE: data.dogecoin?.usd || 0,
    };
  } catch (error) {
    console.error("Failed to fetch real exchange rates:", error);
    // Fallback to mock rates in case of error
    return {
      BTC: 60000,
      ETH: 3000,
      USDT: 1,
      TRX: 0.1,
      DOGE: 0.15,
    };
  }
};