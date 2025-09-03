import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Clock, ArrowRight, CheckCircle, XCircle, ChevronRight,
  ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Type Definitions (Ensure these match your @shared/schema/index.ts) ---
interface Trade {
  id: string;
  user_id: string;
  crypto_id: number;
  crypto_name: string;
  type: 'buy' | 'sell';
  direction: 'up' | 'down';
  amount: number;
  initial_price: number;
  delivery_time: number; // Unix timestamp in milliseconds
  status: 'pending' | 'completed';
  timestamp: number; // Unix timestamp in milliseconds
  email: string;
  outcome: 'win' | 'loss' | null;
  gain_percentage: number | null;
  final_amount: number | null;
  simulated_final_price: number | null;
  current_trade_value: number | null;
  current_gain_loss_percentage: number | null;
}
// --- END Type Definitions ---

interface TradeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null;
  // Add a prop to refresh the parent's trade data after completion
  onTradeStatusChange?: (tradeId: string) => void; 
}

const TradeDetailsModal = ({ isOpen, onClose, trade, onTradeStatusChange }: TradeDetailsModalProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // If the modal is not open or no trade is provided, return null (don't render)
  if (!isOpen || !trade) return null;

  const isCompleted = trade.status === 'completed';
  const isWin = isCompleted && trade.outcome === 'win';
  const gainLossPercent = trade.gain_percentage !== null ? trade.gain_percentage : null;
  const finalAmount = trade.final_amount !== null ? trade.final_amount : null;

  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    const deliveryTimeMs = trade.delivery_time;

    if (!isCompleted && deliveryTimeMs) {
      const calculateRemaining = () => {
        const now = Date.now();
        const diffSeconds = Math.max(0, Math.floor((deliveryTimeMs - now) / 1000));
        setRemainingSeconds(diffSeconds);

        // console.log(`[Frontend Countdown] Trade ID: ${trade.id}, Delivery: ${new Date(deliveryTimeMs).toLocaleTimeString()}, Now: ${new Date(now).toLocaleTimeString()}, Remaining: ${diffSeconds}s`);

        if (diffSeconds === 0) {
          if (timerId) clearInterval(timerId);
          // --- IMPORTANT: Trigger parent to re-fetch trade data ---
          // This will update the 'trade' prop and flip isCompleted to true
          if (onTradeStatusChange) {
            console.log(`[Frontend Countdown] Delivery time reached for trade ${trade.id}. Triggering status refresh.`);
            onTradeStatusChange(trade.id);
          }
        }
      };

      calculateRemaining(); // Initial calculation
      timerId = setInterval(calculateRemaining, 1000); // Update every second
    } else {
      setRemainingSeconds(null); // Reset if trade is completed or no delivery time
    }

    // Cleanup function for the effect
    return () => {
      if (timerId) {
        clearInterval(timerId);
        // console.log(`[Frontend Countdown] Cleared timer for trade ${trade.id}`);
      }
    };
  }, [trade.delivery_time, isCompleted, trade.id, onTradeStatusChange]); // Added trade.id and onTradeStatusChange to dependencies

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700 w-full max-w-lg mx-auto transform transition-all duration-300 scale-95 opacity-0 animate-scaleIn">
        <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
          <h2 className="text-2xl font-bold text-white">Trade Details</h2>
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </Button>
        </div>

        <div className="space-y-4 text-gray-300">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Trade ID:</span>
            <span className="text-sm text-white break-all">{trade.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Cryptocurrency:</span>
            <span className="text-white">{trade.crypto_name} ({trade.direction?.toUpperCase()})</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Type:</span>
            <span className="text-white">{trade.type.toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Amount:</span>
            <span className="text-white">US${trade.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Entry Price:</span>
            <span className="text-white">US${trade.initial_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">Placed On:</span>
            <span className="text-white">{new Date(trade.timestamp).toLocaleString()}</span>
          </div>

          <div className="border-t border-gray-700 pt-4 mt-4">
            <h3 className="text-lg font-bold text-white mb-3">Outcome Summary</h3>
            {isCompleted ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isWin ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {isWin ? 'WIN' : 'LOSS'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Final Value:</span>
                  <span className="text-white">US${finalAmount !== null ? finalAmount.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Gain/Loss Percentage:</span>
                  <span className={`font-bold text-lg flex items-center gap-1 ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                    {isWin ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    {gainLossPercent !== null ? Math.abs(gainLossPercent).toFixed(2) : '0.00'}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Simulated Final Price:</span>
                  <span className="text-white">US${trade.simulated_final_price !== null ? trade.simulated_final_price.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Completed On:</span>
                  <span className="text-white">{trade.delivery_time ? new Date(trade.delivery_time).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Clock size={32} className="text-yellow-400 mx-auto mb-3" />
                <p className="text-lg font-semibold text-yellow-400">Trade Pending...</p>
                <p className="text-gray-400 text-sm mt-1">
                  This trade will complete around {trade.delivery_time ? new Date(trade.delivery_time).toLocaleString() : 'N/A'}.
                  {remainingSeconds !== null && remainingSeconds > 0 && ( // Only show if > 0
                    <span className="text-blue-400 font-bold ml-2">
                       ({remainingSeconds}s remaining)
                    </span>
                  )}
                  {remainingSeconds === 0 && ( // Show "Due now" if 0
                    <span className="text-orange-400 font-bold ml-2">
                      (Due now)
                    </span>
                  )}
                </p>
                <div className="flex justify-between items-center mt-3">
                  <span className="font-semibold">Current Value:</span>
                  <span className="text-white">US${trade.current_trade_value ? trade.current_trade_value.toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Current Change:</span>
                  <span className={`font-bold text-md flex items-center gap-1 ${
                      (trade.current_gain_loss_percentage || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {(trade.current_gain_loss_percentage || 0) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {(trade.current_gain_loss_percentage || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default TradeDetailsModal;