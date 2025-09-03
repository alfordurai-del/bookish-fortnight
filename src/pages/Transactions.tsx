// src/pages/Transactions.tsx

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useUser } from "../context/UserContext"; // Path to your UserContext
import { navigate } from "wouter/use-browser-location";
import TradeSimulationModal from "../components/trade-simulation-modal";
import { Skeleton } from "../components/ui/skeleton";
import { v4 as uuidv4 } from 'uuid'; // For generating fallback IDs if needed
import { formatDate, formatAmount } from '../utils/formatters'; // This is the correct import now!
import { API_BASE_URL } from "../config"; // Ensure this path is correct

// Corrected Trade interface to use camelCase to match TradeSimulationModal
interface Trade {
  id: string;
  userId: string; // Changed from user_id
  cryptoId: number; // Changed from crypto_id
  cryptoName: string; // Changed from crypto_name
  type: 'buy' | 'sell';
  direction: 'up' | 'down';
  amount: number;
  initialPrice: number; // Changed from initial_price
  deliveryTime: number | null; // Changed from delivery_time
  status: 'pending' | 'completed' | 'cancelled'; // Added 'cancelled' for robustness as per trade-simulation-modal.tsx
  timestamp: number;
  email: string;
  outcome: 'win' | 'loss' | 'draw' | null; // Added 'draw' for robustness as per trade-simulation-modal.tsx
  gainPercentage: number | null; // Changed from gain_percentage
  finalAmount: number | null; // Changed from final_amount
  simulatedFinalPrice: number | null; // Changed from simulated_final_price
  currentTradeValue: number | null; // Changed from current_trade_value
  currentGainLossPercentage: number | null; // Changed from current_gain_loss_percentage
  entryPrice: number; // New property added to match trade-simulation-modal.tsx
}

interface Cryptocurrency {
  id: number;
  name: string;
  symbol: string;
  price: number;
  icon: string;
  change24h: number;
  changeAmount24h: number;
  marketCap: number;
  volume24h: number;
  supply: string;
  description: string;
}

const TransactionList = ({
  transactions,
  onViewTransaction,
  isLoading,
}: {
  transactions: Trade[];
  onViewTransaction: (transaction: Trade) => void;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="mt-12 space-y-4">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }

  if (!transactions.length) {
    return <p className="text-center text-gray-400 mt-12">No transactions found.</p>;
  }

  return (
    <div>
      <div className="divide-y divide-gray-700 mt-12">
        {transactions.map((transaction) => {
          return (
            <div
              key={transaction.id}
              className="p-4 flex justify-between items-center hover:bg-gray-700/30 transition rounded-lg"
            >
              <div>
                <p className="font-medium text-white">{transaction.cryptoName || "Unknown Crypto"}</p>
                <p className="text-sm text-gray-400">
                  {transaction.type?.toUpperCase() || "N/A"} (Direction: {transaction.direction?.toUpperCase() || "N/A"})
                </p>
                <p className="text-xs text-gray-500">Placed: {formatDate(transaction.timestamp)}</p>
                <p className="text-xs text-gray-500">Amount: {formatAmount(transaction.amount)}</p>
                <p className="text-xs text-gray-500">Initial Price: {formatAmount(transaction.initialPrice)}</p> {/* Changed from initial_price */}
                {transaction.status === 'completed' && (
                  <>
                    <p className="text-xs text-gray-500">Final Amount: {formatAmount(transaction.finalAmount)}</p> {/* Changed from final_amount */}
                    <p className={`text-xs ${transaction.outcome === 'win' ? 'text-green-500' : (transaction.outcome === 'loss' ? 'text-red-500' : 'text-gray-500')}`}>
                      Gain/Loss: {transaction.gainPercentage !== null ? `${transaction.gainPercentage.toFixed(2)}%` : 'N/A'} {/* Changed from gain_percentage */}
                    </p>
                    {/* THIS IS THE CRITICAL LINE TO ENSURE IT'S PRESENT */}
                    <p className="text-xs text-gray-500">Completed: {formatDate(transaction.deliveryTime)}</p> {/* Changed from delivery_time */}
                  </>
                )}
              </div>
              <div>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  onClick={() => onViewTransaction(transaction)}
                >
                  View Simulation
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function TransactionsPage() {
  const { user, isLoading: isUserLoading, error: userError } = useUser();
  const [transactions, setTransactions] = useState<Trade[]>([]);
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [selectedTradeForSimulation, setSelectedTradeForSimulation] = useState<Trade | null>(null);
  const [currentPriceForSimulation, setCurrentPriceForSimulation] = useState<number | null>(null);

  const parseTimestamp = (value: any): number | null => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
  };

  const fetchTransactions = useCallback(async () => {
    setFetchError(null);

    if (isUserLoading || !user?.email) {
      console.log(`TransactionsPage: Skipping transaction fetch. isUserLoading: ${isUserLoading}, user.email present: ${!!user?.email}`);
      if (!user?.email) {
        setTransactions([]);
      }
      return;
    }

    setIsFetchingTransactions(true);
    try {
      console.log(`TransactionsPage: Fetching transactions for email: ${user.email} from ${API_BASE_URL}/api/transactions`);
      const response = await fetch(`${API_BASE_URL}/api/transactions?email=${user.email}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorText}`);
      }
      const rawData: any[] = await response.json();
      console.log("TransactionsPage: Raw API response data:", rawData);

      const transformed: Trade[] = rawData.map((tx: any) => {
        const amount = parseFloat(tx.amount || '0');
        const initialPrice = parseFloat(tx.initial_price || '0'); // Corrected
        const finalAmount = (tx.final_amount !== null && tx.final_amount !== undefined) ? parseFloat(tx.final_amount) : null; // Corrected
        const gainPercentage = (tx.gain_percentage !== null && tx.gain_percentage !== undefined) ? parseFloat(tx.gain_percentage) : null; // Corrected
        const simulatedFinalPrice = (tx.simulated_final_price !== null && tx.simulated_final_price !== undefined) ? parseFloat(tx.simulated_final_price) : null; // Corrected
        const currentTradeValue = (tx.current_trade_value !== null && tx.current_trade_value !== undefined) ? parseFloat(tx.current_trade_value) : null; // Corrected
        const currentGainLossPercentage = (tx.current_gain_loss_percentage !== null && tx.current_gain_loss_percentage !== undefined) ? parseFloat(tx.current_gain_loss_percentage) : null; // Corrected

        // Use the new parseTimestamp helper for robustness
        const timestamp = parseTimestamp(tx.timestamp);
        const deliveryTime = parseTimestamp(tx.delivery_time); // Corrected

        return {
          id: tx.id || uuidv4(),
          userId: tx.user_id || 'unknown_user', // Corrected
          cryptoId: Number(tx.crypto_id) || 0, // Corrected
          cryptoName: tx.crypto_name || "Unknown", // Corrected
          type: (tx.type === 'buy' || tx.type === 'sell') ? tx.type : 'buy',
          direction: (tx.direction === 'up' || tx.direction === 'down') ? tx.direction : 'up',
          amount: amount,
          initialPrice: initialPrice, // Corrected
          deliveryTime: deliveryTime, // Corrected
          status: (tx.status === 'pending' || tx.status === 'completed' || tx.status === 'cancelled') ? tx.status : 'pending', // Added 'cancelled'
          timestamp: timestamp || Date.now(), // Fallback for timestamp if it's ever null/invalid
          email: tx.email || user.email || 'no-email@example.com',
          outcome: (tx.outcome === 'win' || tx.outcome === 'loss' || tx.outcome === 'draw') ? tx.outcome : null,
          gainPercentage: gainPercentage, // Corrected
          finalAmount: finalAmount, // Corrected
          simulatedFinalPrice: simulatedFinalPrice, // Corrected
          currentTradeValue: currentTradeValue, // Corrected
          currentGainLossPercentage: currentGainLossPercentage, // Corrected
          entryPrice: initialPrice, // Set entryPrice to initialPrice as it's the same concept for this context
        };
      });

      console.log("TransactionsPage: Transformed transactions:", transformed);
      setTransactions(transformed);
    } catch (error: any) {
      console.error("TransactionsPage: Failed to fetch transactions", error);
      setFetchError(error.message || "An unknown error occurred while fetching transactions.");
      setTransactions([]);
    } finally {
      setIsFetchingTransactions(false);
    }
  }, [user?.email, isUserLoading]);

  const handleViewTransaction = useCallback(async (trade: Trade) => {
    setSelectedTradeForSimulation(null);
    setCurrentPriceForSimulation(null);

    try {
        const response = await fetch(`${API_BASE_URL}/api/cryptocurrencies`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allCryptos: Cryptocurrency[] = await response.json();
        const cryptoDetails = allCryptos.find(c => c.id === trade.cryptoId); // Corrected

        if (cryptoDetails) {
            setCurrentPriceForSimulation(cryptoDetails.price);
        } else {
            console.warn(`Crypto details for ID ${trade.cryptoId} not found. Using initial price as fallback.`); // Corrected
            setCurrentPriceForSimulation(trade.initialPrice); // Corrected
        }
    } catch (error) {
        console.error("Error fetching current crypto price:", error);
        setCurrentPriceForSimulation(trade.initialPrice); // Corrected
    } finally {
        setSelectedTradeForSimulation(trade);
        setIsSimulationModalOpen(true);
    }
  }, [API_BASE_URL]);

  const handleCloseSimulationModal = useCallback(() => {
    setIsSimulationModalOpen(false);
    setSelectedTradeForSimulation(null);
    setCurrentPriceForSimulation(null);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const isLoadingContent = isUserLoading || isFetchingTransactions;

  if (isLoadingContent) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <p className="text-gray-400 text-lg mb-4">Loading your transactions...</p>
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-16 w-full mb-2 rounded-lg" />
        <Skeleton className="h-16 w-full mb-2 rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <p className="text-red-400 text-lg">Error loading user profile: {userError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-blue-600 rounded hover:bg-blue-700">Retry Page Load</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <p className="text-red-400 text-lg">Please log in to view your transactions.</p>
        <button onClick={() => navigate("/login")} className="mt-4 px-6 py-2 bg-blue-600 rounded hover:bg-blue-700">Go to Login</button>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <p className="text-red-400 text-lg">Error fetching transactions: {fetchError}</p>
        <button onClick={fetchTransactions} className="mt-4 px-6 py-2 bg-blue-600 rounded hover:bg-blue-700">Retry Fetch</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 flex items-center gap-2 text-blue-400 hover:text-blue-600"
      >
        <ArrowLeft size={20} />
        Back
      </button>
      <h1 className="text-xl font-bold mb-4 text-center">Past Transactions</h1>
      <TransactionList
        transactions={transactions}
        onViewTransaction={handleViewTransaction}
        isLoading={isFetchingTransactions}
      />

      {selectedTradeForSimulation && (
        <TradeSimulationModal
          isOpen={isSimulationModalOpen}
          onClose={handleCloseSimulationModal}
          trade={selectedTradeForSimulation}
          currentPrice={currentPriceForSimulation}
        />
      )}
    </div>
  );
}