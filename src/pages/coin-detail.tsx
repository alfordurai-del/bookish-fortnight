import { useParams } from "wouter";
import { useState, useEffect, useMemo, useCallback, useRef, Component, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import CryptoChart from "../components/price-chart";
import TradingModal from "../components/trading-modal";
import { useToast } from "../hooks/use-toast";
import TradeSimulationModal from "../components/trade-simulation-modal";
import { Skeleton } from "../components/ui/skeleton";
import { useUser } from "../context/UserContext";
import { navigate } from "wouter/use-browser-location";
import { v4 as uuidv4 } from 'uuid';
import { API_BASE_URL } from "../config";

interface Cryptocurrency {
  id: string;
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

interface Trade {
  id: string;
  userId: string;
  cryptoId: string;
  cryptoName: string;
  cryptoSymbol: string;
  type: 'buy' | 'sell';
  direction: 'up' | 'down';
  amount: number;
  initialPrice: number;
  deliveryTime: number;
  status: 'pending' | 'completed' | 'cancelled';
  timestamp: number;
  email: string;
  outcome: 'win' | 'loss' | 'draw' | null;
  gainPercentage: number | null;
  finalAmount: number | null;
  simulatedFinalPrice: number | null;
  currentTradeValue: number | null;
  currentGainLossPercentage: number | null;
  entryPrice: number;
}

interface UserProfile {
  id: string;
  username: string | null;
  email: string;
  balance: number;
  kycStatus: string | null;
  country: string | null;
  documentType: string | null;
  accessCode: string | null;
  uid: string;
}

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

const formatTimestampToTime = (timestamp: number | string): string => {
  const date = new Date(Number(timestamp));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const arraysOfTradesAreEqual = (arr1: Trade[], arr2: Trade[]): boolean => {
  if (arr1.length !== arr2.length) {
    return false;
  }
  const sortedArr1 = [...arr1].sort((a, b) => a.id.localeCompare(b.id));
  const sortedArr2 = [...arr2].sort((a, b) => a.id.localeCompare(b.id));

  for (let i = 0; i < sortedArr1.length; i++) {
    const trade1 = sortedArr1[i];
    const trade2 = sortedArr2[i];

    if (trade1.id !== trade2.id ||
        trade1.status !== trade2.status ||
        trade1.amount !== trade2.amount ||
        trade1.entryPrice !== trade2.entryPrice ||
        trade1.type !== trade2.type ||
        trade1.direction !== trade2.direction ||
        trade1.deliveryTime !== trade2.deliveryTime ||
        trade1.timestamp !== trade2.timestamp ||
        trade1.outcome !== trade2.outcome ||
        trade1.gainPercentage !== trade2.gainPercentage ||
        trade1.finalAmount !== trade2.finalAmount ||
        trade1.simulatedFinalPrice !== trade2.simulatedFinalPrice ||
        trade1.currentTradeValue !== trade2.currentTradeValue ||
        trade1.currentGainLossPercentage !== trade2.currentGainLossPercentage ||
        trade1.cryptoId !== trade2.cryptoId ||
        trade1.userId !== trade2.userId
    ) {
      return false;
    }
  }
  return true;
};

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong with the trade simulation. Please try again.</div>;
    }
    return this.props.children;
  }
}

export default function CoinDetail() {
  const { id } = useParams<{ id: string }>();

  const [coin, setCoin] = useState<Cryptocurrency | null>(null);
  const [currentCryptoPrice, setCurrentCryptoPrice] = useState<number | null>(null);
  const [isLoadingCoinDetails, setIsLoadingCoinDetails] = useState(true);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  const [isTradingModalOpen, setIsTradingModalOpen] = useState(false);
  const [isTradeSimulationModalOpen, setIsTradeSimulationModalOpen] = useState(false);
  const [selectedTradeForSimulation, setSelectedTradeForSimulation] = useState<Trade | null>(null);
  const [historicalData, setHistoricalData] = useState<{ time: number; value: number }[]>([]);
  const [pendingTrades, setPendingTrades] = useState<Trade[]>([]);
  const [completedTrades, setCompletedTrades] = useState<Trade[]>([]);
  const [isPlacingTrade, setIsPlacingTrade] = useState(false);

  const tradeStatusPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sixMinuteRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { user, refetchUser } = useUser();
  const { toast } = useToast();

  const userProfile: UserProfile = useMemo(() => ({
    id: user?.id || 'default-id-if-not-logged-in',
    username: user?.username || 'Guest User',
    balance: user?.balance ?? 0.00,
    email: user?.email || 'guest@example.com',
    kycStatus: user?.kycStatus || null,
    country: user?.country || null,
    documentType: user?.documentType || null,
    accessCode: user?.accessCode || null,
    uid: user?.uid || '',
  }), [user]);

  const isPageLoading = useMemo(() => {
    return isLoadingCoinDetails || !coin;
  }, [isLoadingCoinDetails, coin]);

  useEffect(() => {
    const fetchCoinData = async () => {
      setIsLoadingCoinDetails(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/cryptocurrencies`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allCryptos: Cryptocurrency[] = await response.json();
        const cryptoData = allCryptos.find(c => c.id === id);

        if (cryptoData) {
          setCoin(cryptoData);
          setCurrentCryptoPrice(cryptoData.price);
        } else {
          toast({
            title: "Not Found",
            description: `Cryptocurrency with ID "${id}" not found.`,
            variant: "destructive",
          });
          setCoin(null);
        }
      } catch (error: any) {
        console.error("Error fetching crypto data:", error);
        toast({
          title: "Error",
          description: `Failed to fetch cryptocurrency details: ${error.message}`,
          variant: "destructive",
        });
        setCoin(null);
      } finally {
        setIsLoadingCoinDetails(false);
      }
    };

    if (id) {
      fetchCoinData();
    }
  }, [id, toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (coin && !isPageLoading) {
      interval = setInterval(() => {
        setCurrentCryptoPrice(prevPrice => {
          const baseForCalculation = prevPrice !== null ? prevPrice : coin.price;
          const volatility = baseForCalculation * 0.002;
          const randomChange = (Math.random() - 0.5) * volatility;
          const newPrice = Math.max(0.01, baseForCalculation + randomChange);
          const finalPrice = parseFloat(newPrice.toFixed(2));
          setHistoricalData(prevData => {
            const updatedData = [...prevData, { time: Date.now(), value: finalPrice }];
            if (updatedData.length > 200) {
              updatedData.shift();
            }
            return updatedData;
          });
          return finalPrice;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [coin, isPageLoading]);

  const fetchTrades = useCallback(async () => {
    if (!user?.email) {
      setPendingTrades([]);
      setCompletedTrades([]);
      setIsLoadingTrades(false);
      return;
    }
    setIsLoadingTrades(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions?email=${user.email}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const fetchedTrades: Trade[] = await response.json();
      console.log('Fetched trades from /api/transactions:', fetchedTrades);
      fetchedTrades.forEach(trade => {
        if (!trade.direction) {
          console.error(`Trade ${trade.id} has no direction`, trade);
        }
      });
      const newPendingTrades = fetchedTrades.filter(t => t.status === 'pending');
      const newCompletedTrades = fetchedTrades.filter(t => t.status === 'completed');

      setPendingTrades(prev => arraysOfTradesAreEqual(prev, newPendingTrades) ? prev : newPendingTrades);
      setCompletedTrades(prev => arraysOfTradesAreEqual(prev, newCompletedTrades) ? prev : newCompletedTrades);
    } catch (error: any) {
      console.error("Error fetching trades:", error);
      toast({
        title: "Error",
        description: `Failed to fetch your trades: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingTrades(false);
    }
  }, [user?.email, toast]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handleSimulateTradeCompletion = useCallback((trade: Trade) => {
    console.log('Selected trade for simulation:', trade);
    if (!trade.direction) {
      console.error('Invalid trade: direction is undefined', trade);
      toast({
        title: "Error",
        description: "Cannot simulate trade: missing direction.",
        variant: "destructive",
      });
      return;
    }
    setSelectedTradeForSimulation(trade);
    setIsTradeSimulationModalOpen(true);
  }, [toast]);

  const completeTrade = useCallback(async (tradeId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trades/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tradeId, email: userProfile.email }),
      });

      if (!response.ok) {
        throw new Error(`Failed to complete trade: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Complete trade response:', responseData);

      if (responseData.message === 'Trade resolution process initiated successfully.') {
        // Poll the trade list since individual trade fetch fails with 404
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second for BE to process
        const tradesResponse = await fetch(`${API_BASE_URL}/api/transactions?email=${userProfile.email}`);
        if (!tradesResponse.ok) {
          throw new Error(`Failed to fetch trades: ${tradesResponse.statusText}`);
        }
        const trades: Trade[] = await tradesResponse.json();
        const updatedTrade = trades.find(t => t.id === tradeId);
        if (!updatedTrade) {
          throw new Error(`Updated trade ${tradeId} not found in trade list`);
        }
        console.log('Polled updated trade from trade list:', updatedTrade);
        return updatedTrade;
      }

      return responseData as Trade;
    } catch (error: any) {
      console.error('Error completing trade:', error);
      // toast({
      //   title: "Error",
      //   description: `Failed to complete trade: ${error.message}`,
      //   variant: "destructive",
      // });
      return null;
    }
  }, [userProfile.email, toast]);

  const handlePlaceTrade = useCallback(async ({ crypto: tradedCrypto, amount: tradeAmount, direction, deliveryTimeSeconds }: { crypto: Cryptocurrency; amount: number; direction: 'up' | 'down'; deliveryTimeSeconds: number }) => {
    if (currentCryptoPrice === null) {
      toast({
        title: "Error",
        description: "Crypto price not available.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      console.error("Invalid trade amount:", tradeAmount);
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount for the trade.",
        variant: "destructive",
      });
      return;
    }

    if (userProfile.balance < tradeAmount) {
      toast({
        title: "Insufficient Balance",
        description: "You do not have enough funds to place this trade.",
        variant: "destructive",
      });
      return;
    }

    setIsPlacingTrade(true);

    try {
      const tradeId = uuidv4();
      const deliveryTime = Date.now() + deliveryTimeSeconds * 1000;
      const tradeDataToSend: Trade = {
        id: tradeId,
        userId: userProfile.id,
        email: userProfile.email,
        cryptoId: tradedCrypto.id,
        cryptoName: tradedCrypto.name,
        cryptoSymbol: tradedCrypto.symbol,
        amount: tradeAmount,
        entryPrice: currentCryptoPrice,
        type: 'buy',
        direction: direction,
        status: 'pending',
        deliveryTime: deliveryTime,
        timestamp: Date.now(),
        outcome: null,
        gainPercentage: null,
        finalAmount: null,
        simulatedFinalPrice: null,
        currentTradeValue: null,
        currentGainLossPercentage: null,
      };

      console.log('Sending trade data to /api/trades:', tradeDataToSend);

      const tradeResponse = await fetch(`${API_BASE_URL}/api/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeDataToSend),
      });

      if (!tradeResponse.ok) {
        const errorData = await tradeResponse.json();
        if (tradeResponse.status === 400 && errorData.error === "Insufficient funds to place trade.") {
          throw new Error("Insufficient funds to place this trade.");
        }
        throw new Error(errorData.message || `Failed to place trade: ${tradeResponse.statusText}`);
      }

      const responseData = await tradeResponse.json();
      console.log('Raw API response from /api/trades:', responseData);

      let newTrade: Trade;
      if (!responseData.id || !responseData.direction) {
        console.error('Invalid trade response:', responseData);
        console.warn('Using tradeDataToSend as fallback due to invalid server response');
        newTrade = tradeDataToSend;
      } else {
        newTrade = responseData as Trade;
      }

      console.log('Parsed new trade:', newTrade);

      await refetchUser();
      toast({
        title: "Trade Placed!",
        description: `Your ${newTrade.direction} trade for ${formatNumber(tradeAmount)} on ${tradedCrypto.name} is now pending.`,
      });
      setIsTradingModalOpen(false);
      setPendingTrades(prev => [...prev, newTrade]);
      
      setSelectedTradeForSimulation(newTrade);
      setIsTradeSimulationModalOpen(true);

      if (sixMinuteRefreshTimeoutRef.current) {
        clearTimeout(sixMinuteRefreshTimeoutRef.current);
      }
      sixMinuteRefreshTimeoutRef.current = setTimeout(() => {
        console.log("6-minute fallback refresh triggered. Reloading page.");
        fetchTrades();
      }, 6 * 60 * 1000);

    } catch (error: any) {
      console.error("Error placing trade:", error);
      toast({
        title: "Trade Failed",
        description: error.message || "Could not place trade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingTrade(false);
    }
  }, [userProfile.balance, userProfile.id, userProfile.email, currentCryptoPrice, toast, refetchUser, fetchTrades]);

  const onTradeSimulationModalClose = useCallback(async () => {
    if (selectedTradeForSimulation) {
      try {
        // Fetch the latest trade data from the trade list due to 404 on individual trade
        const tradesResponse = await fetch(`${API_BASE_URL}/api/transactions?email=${userProfile.email}`);
        if (!tradesResponse.ok) {
          throw new Error(`Failed to fetch trades: ${tradesResponse.statusText}`);
        }
        const trades: Trade[] = await tradesResponse.json();
        const updatedTrade = trades.find(t => t.id === selectedTradeForSimulation.id);
        if (!updatedTrade) {
          throw new Error(`Updated trade ${selectedTradeForSimulation.id} not found`);
        }
        console.log('Fetched updated trade from trade list:', updatedTrade);

        setSelectedTradeForSimulation(updatedTrade);

        if (updatedTrade.status === 'completed' && updatedTrade.outcome) {
          const { outcome, gainPercentage, cryptoName, amount } = updatedTrade;
          let toastTitle = "";
          let toastDescription = "";
          let toastVariant: "default" | "destructive" = "default";

          if (outcome === 'win') {
            toastTitle = "Trade Won!";
            toastDescription = `Your trade on ${cryptoName} resulted in a ${formatNumber(gainPercentage || 0, false)}% gain! Your balance has been updated.`;
            toastVariant = "default";
          } else if (outcome === 'loss') {
            toastTitle = "Trade Lost!";
            toastDescription = `Your trade on ${cryptoName} resulted in a ${formatNumber(Math.abs(gainPercentage || 0), false)}% loss. Your balance has been updated.`;
            toastVariant = "destructive";
          } else {
            toastTitle = "Trade Draw!";
            toastDescription = `Your trade on ${cryptoName} resulted in a draw. Your initial amount of ${formatNumber(amount, true)} has been returned.`;
            toastVariant = "default";
          }

          toast({
            title: toastTitle,
            description: toastDescription,
            variant: toastVariant,
          });

          await fetchTrades();
          await refetchUser();
          if (tradeStatusPollIntervalRef.current) {
            clearInterval(tradeStatusPollIntervalRef.current);
            tradeStatusPollIntervalRef.current = null;
          }
          if (sixMinuteRefreshTimeoutRef.current) {
            clearTimeout(sixMinuteRefreshTimeoutRef.current);
            sixMinuteRefreshTimeoutRef.current = null;
          }
          setIsTradeSimulationModalOpen(false);
          setSelectedTradeForSimulation(null);
          window.location.reload();
        } else {
          // Trade is still pending, keep polling
          const pollTradeStatus = async () => {
            if (!userProfile.email || !selectedTradeForSimulation?.id) {
              if (tradeStatusPollIntervalRef.current) {
                clearInterval(tradeStatusPollIntervalRef.current);
                tradeStatusPollIntervalRef.current = null;
              }
              setSelectedTradeForSimulation(null);
              setIsTradeSimulationModalOpen(false);
              return;
            }

            try {
              const tradesResponse = await fetch(`${API_BASE_URL}/api/transactions?email=${userProfile.email}`);
              if (!tradesResponse.ok) {
                throw new Error(`Failed to fetch trade status: ${tradesResponse.statusText}`);
              }
              const trades: Trade[] = await tradesResponse.json();
              const updatedTrade = trades.find(t => t.id === selectedTradeForSimulation.id);
              if (!updatedTrade) {
                throw new Error(`Updated trade ${selectedTradeForSimulation.id} not found`);
              }
              console.log('Polled trade status:', updatedTrade);

              if (updatedTrade.status === 'completed') {
                clearInterval(tradeStatusPollIntervalRef.current!);
                tradeStatusPollIntervalRef.current = null;
                setSelectedTradeForSimulation(updatedTrade);
                setIsTradeSimulationModalOpen(false);
                await fetchTrades();
                await refetchUser();
                window.location.reload();
              }
            } catch (error) {
              console.error("Error during trade status polling:", error);
              if (tradeStatusPollIntervalRef.current) {
                clearInterval(tradeStatusPollIntervalRef.current);
                tradeStatusPollIntervalRef.current = null;
              }
              await fetchTrades();
              await refetchUser();
              setSelectedTradeForSimulation(null);
              setIsTradeSimulationModalOpen(false);
              window.location.reload();
            }
          };

          if (tradeStatusPollIntervalRef.current) {
            clearInterval(tradeStatusPollIntervalRef.current);
            tradeStatusPollIntervalRef.current = null;
          }
          tradeStatusPollIntervalRef.current = setInterval(pollTradeStatus, 3000);
        }
      } catch (error: any) {
        console.error("Error fetching trade on modal close:", error);
        toast({
          title: "Error",
          description: `Failed to fetch trade status: ${error.message}`,
          variant: "destructive",
        });
        await fetchTrades();
        await refetchUser();
        setIsTradeSimulationModalOpen(false);
        setSelectedTradeForSimulation(null);
        window.location.reload();
      }
    } else {
      setIsTradeSimulationModalOpen(false);
      setSelectedTradeForSimulation(null);
    }
  }, [selectedTradeForSimulation, toast, userProfile.email, fetchTrades, refetchUser]);

  useEffect(() => {
    return () => {
      if (tradeStatusPollIntervalRef.current) {
        clearInterval(tradeStatusPollIntervalRef.current);
        tradeStatusPollIntervalRef.current = null;
      }
      if (sixMinuteRefreshTimeoutRef.current) {
        clearTimeout(sixMinuteRefreshTimeoutRef.current);
        sixMinuteRefreshTimeoutRef.current = null;
      }
    };
  }, []);

  const getRandomInRange = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  if (isPageLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl min-h-screen">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-2/3">
            <Skeleton className="h-10 w-48 mb-4" />
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-[300px] w-full mb-6" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="md:w-1/3">
            <Skeleton className="h-64 w-full mb-6" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const marketCap = coin?.marketCap ?? getRandomInRange(20_000_000_000, 100_000_000_000);
  const volume24h = coin?.volume24h ?? getRandomInRange(1_000_000_000, 10_000_000_000);
  const supply = parseFloat(coin?.supply || '0') || getRandomInRange(10_000_000, 200_000_000);
  const symbol = coin?.symbol?.toUpperCase() || "N/A";

  if (!coin || currentCryptoPrice === null) {
    return (
      <div className="container mx-auto p-4 max-w-4xl text-center text-gray-400 min-h-screen flex items-center justify-center">
        <p>Could not load cryptocurrency details. Please try again or check the URL.</p>
      </div>
    );
  }

  const change24hColor = coin.change24h >= 0 ? "text-green-500" : "text-red-500";

  return (
    <div className="container mx-auto p-4 max-w-4xl bg-gray-900 text-white min-h-screen">
      <Button
        variant="ghost"
        className="text-gray-400 hover:text-black p-4"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cryptocurrencies
      </Button>

      <div className="mt-8 flex flex-col md:flex-row gap-8">
        <div className="md:w-2/3">
          {coin && currentCryptoPrice !== null && (
            <CryptoChart coin={coin} currentPrice={currentCryptoPrice} />
          )}

          <div className="bg-gray-800 rounded-lg p-6 shadow-md mb-6">
            <h2 className="text-2xl font-semibold mb-4">About {coin.name || "Unknown Coin"}</h2>
            <p className="text-gray-300 leading-relaxed">
              {coin.description || `${coin.name || "This coin"} is a digital asset used for secure and decentralized transactions.`}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Market Stats</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-300">
              <div className="flex justify-between">
                <span>Market Cap:</span>
                <span className="font-semibold">
                  {formatNumber(marketCap, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>24h Volume:</span>
                <span className="font-semibold">
                  {formatNumber(volume24h, true)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Circulating Supply:</span>
                <span className="font-semibold">
                  {formatNumber(supply)} {coin.symbol}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:w-1/3 flex flex-col gap-6">
          <div className="bg-gray-800 rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Trade {coin.symbol}</h2>
            <p className="text-gray-400 mb-4">
              Current Balance: <span className="font-bold text-white">{formatNumber(userProfile.balance, true)}</span>
            </p>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => setIsTradingModalOpen(true)}
              disabled={isPlacingTrade}
            >
              {isPlacingTrade ? "Placing Trade..." : "Place New Trade"}
            </Button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-md mb-6">
            <h2 className="text-2xl font-semibold mb-4">Your Active Trades</h2>
            {isLoadingTrades ? (
              <Skeleton className="h-16 w-full" />
            ) : pendingTrades.filter((trade: Trade) => trade.cryptoId === id).length === 0 ? (
              <p className="text-gray-400">No active trades for this coin.</p>
            ) : (
              pendingTrades
                .filter((trade: Trade) => trade.cryptoId === id)
                .map((trade) => (
                  <div key={trade.id} className="border-b border-gray-700 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">
                        {trade.cryptoName || 'N/A'} ({trade.direction ? trade.direction.toUpperCase() : 'N/A'})
                      </span>
                      <span className="font-semibold text-yellow-500">Pending</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatNumber(trade.amount, true)} @ {formatNumber(trade.entryPrice, true)}</span>
                      <span>Resolves: {formatTimestampToTime(trade.deliveryTime)}</span>
                    </div>
                    <Button
                      variant="link"
                      className="text-blue-400 text-xs p-0 h-auto"
                      onClick={() => handleSimulateTradeCompletion(trade)}
                    >
                      View Simulation
                    </Button>
                  </div>
                ))
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-md flex-grow">
            <h2 className="text-2xl font-semibold mb-4">Your Recent Trades</h2>
            {isLoadingTrades ? (
              <Skeleton className="h-24 w-full" />
            ) : completedTrades.filter((trade: Trade) => trade.cryptoId === id).length === 0 ? (
              <p className="text-gray-400">No recently completed trades for this coin.</p>
            ) : (
              completedTrades
                .filter((trade: Trade) => trade.cryptoId === id)
                .map((trade) => (
                  <div key={trade.id} className="border-b border-gray-700 pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">{trade.cryptoName || 'N/A'}</span>
                      <span className={`font-semibold ${trade.outcome === 'win' ? 'text-green-500' : trade.outcome === 'loss' ? 'text-red-500' : 'text-gray-500'}`}>
                        {trade.outcome === 'win' ? `+${formatNumber(trade.gainPercentage || 0, false)}%` : 
                         trade.outcome === 'loss' ? `-${formatNumber(Math.abs(trade.gainPercentage || 0), false)}%` : 
                         'Draw'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatNumber(trade.amount, true)}</span>
                      <span>Completed: {formatTimestampToTime(trade.deliveryTime || trade.timestamp)}</span>
                    </div>
                    {trade.status === 'completed' && trade.outcome && (
                      <Button
                        variant="link"
                        className="text-blue-400 text-xs p-0 h-auto"
                        onClick={() => handleSimulateTradeCompletion(trade)}
                      >
                        View Simulation
                      </Button>
                    )}
                  </div>
                ))
            )}
            {completedTrades.filter((trade: Trade) => trade.cryptoId === id).length > 0 && (
              <Button variant="outline" className="w-full mt-4 bg-gray-700/50 border-gray-600 hover:bg-gray-600"
                onClick={() => navigate("/transactions")}>
                View All Completed Trades
              </Button>
            )}
          </div>
        </div>
      </div>

      <TradingModal
        isOpen={isTradingModalOpen}
        onClose={() => setIsTradingModalOpen(false)}
        crypto={coin}
        onPlaceTrade={handlePlaceTrade}
        userBalance={userProfile.balance}
        isPlacingTrade={isPlacingTrade}
      />

      {isTradeSimulationModalOpen && selectedTradeForSimulation && (
        <>
          {!selectedTradeForSimulation.direction && (
            console.error('Invalid trade for simulation: direction is undefined', selectedTradeForSimulation)
          )}
          {selectedTradeForSimulation.direction && (
            <ErrorBoundary>
              <TradeSimulationModal
                isOpen={isTradeSimulationModalOpen}
                onClose={onTradeSimulationModalClose}
                trade={selectedTradeForSimulation}
                currentPrice={currentCryptoPrice}
                onCompleteTrade={completeTrade}
              />
            </ErrorBoundary>
          )}
        </>
      )}

      <footer className="mt-12 border-t border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500">© 2025 CryptoMarket. All rights reserved.</p>
          <p className="text-gray-500 mt-2 text-sm">
            Cryptocurrency investments are volatile and high risk. Only invest what you can afford to lose.
          </p>
        </div>
      </footer>
    </div>
  );
}