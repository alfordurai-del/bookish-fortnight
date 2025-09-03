import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Cryptocurrency } from "@shared/schema";
import { generateMockChartSVG } from "@/lib/crypto-data";
import { Skeleton } from "@/components/ui/skeleton";

// IMPORTANT: Define API_BASE_URL using import.meta.env
// Ensure VITE_APP_API_BASE_URL is set as an environment variable in Render for your service
// (e.g., VITE_APP_API_BASE_URL = https://super-sniffle-xw5d.onrender.com)
const API_BASE_URL = 'https://myblog.alwaysdata.net';

export default function CryptoList() {
  const [, setLocation] = useLocation();

  // Debugging line to see the base URL being used
  console.log("API_BASE_URL (CryptoList):", API_BASE_URL);

  const fetchCryptocurrencies = async (): Promise<Cryptocurrency[]> => {
    // Add a check to ensure API_BASE_URL is defined at runtime
    if (!API_BASE_URL) {
      console.error("VITE_APP_API_BASE_URL is not defined. Please set it as an environment variable.");
      throw new Error("API base URL is not configured.");
    }

    const response = await fetch(`${API_BASE_URL}/api/cryptocurrencies`);
    if (!response.ok) {
      const errorText = await response.text(); // Get response body for more details
      console.error(`API Fetch Error: ${response.status} - ${response.statusText}`, errorText);
      throw new Error(`Failed to fetch cryptocurrencies: ${response.statusText} (${response.status})`);
    }
    const data = await response.json();

    // Crucial runtime type check: ensure the response is an array
    if (!Array.isArray(data)) {
        console.error("API response was not an array:", data);
        throw new Error("Invalid API response: Expected an array of cryptocurrencies.");
    }
    return data;
  };

  const { data: cryptos, isLoading, error } = useQuery<Cryptocurrency[]>({
    queryKey: ["cryptocurrencies"],
    queryFn: fetchCryptocurrencies,
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    retry: 2, // Retry failed queries
    retryDelay: 1000, // Wait 1 second before retrying
  });

  const handleCoinClick = (id: number) => {
    setLocation(`/coin/${id}`);
  };

  // --- Start of robust rendering logic ---

  if (isLoading) {
    // This block correctly handles the initial loading state
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="crypto-surface rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <div className="text-center">
                <Skeleton className="w-16 h-8 mb-1" />
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    // This block handles any errors from the fetcher
    console.error("Error fetching cryptocurrency data:", error);
    return (
      <div className="text-center py-8">
        <p className="text-red-400">
          Failed to load cryptocurrency data: {(error as Error).message || "Unknown error."}
        </p>
        {/* Optional: Add a retry button */}
        {/* <button onClick={() => refetch()}>Try Again</button> */}
      </div>
    );
  }

  // **CRITICAL CHANGE:** Explicitly check if 'cryptos' is an array before mapping
  // This handles cases where `data` might be undefined, null, or not an array
  // even after loading, due to unexpected API responses or React's rendering lifecycle.
  if (!Array.isArray(cryptos) || cryptos.length === 0) {
    // If not an array or empty, display a message
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No cryptocurrencies available.</p>
      </div>
    );
  }

  // If we reach here, cryptos is guaranteed to be a non-empty array
  return (
    <div className="space-y-4">
      {cryptos.map((coin) => { // This line is now safe to call .map()
        const changePercent = parseFloat(coin.change24h);
        const isPositive = changePercent >= 0;
        const price = parseFloat(coin.price);

        return (
          <div
            key={coin.id}
            onClick={() => handleCoinClick(coin.id)}
            className="crypto-surface rounded-lg p-4 cursor-pointer hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${coin.color} rounded-full flex items-center justify-center`}>
                <span
                  className="text-white"
                  dangerouslySetInnerHTML={{ __html: coin.icon }}
                  aria-label={coin.name}
                />
              </div>
              <div>
                <div className="font-semibold text-white">{coin.name}</div>
                <div className="text-slate-400 text-sm">{coin.pair}</div>
              </div>
            </div>
            <div className="text-center">
              <div
                className="w-16 h-8 mb-1"
                dangerouslySetInnerHTML={{
                  __html: generateMockChartSVG(changePercent)
                }}
              />
            </div>
            <div className="text-right">
              <div className="font-semibold text-white">
                US${price < 1
                  ? price.toFixed(6)
                  : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
              </div>
              <div className={`text-sm ${isPositive ? 'text-crypto-green' : 'text-crypto-red'}`}>
                {isPositive ? '+' : ''}{changePercent}% 24Hrs
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}