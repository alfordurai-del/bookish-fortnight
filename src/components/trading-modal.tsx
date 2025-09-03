import { useState, useEffect } from "react";
import { X, Clock, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Cryptocurrency } from "@shared/schema";

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  crypto: Cryptocurrency;
  userBalance: number;
  // UPDATED: onPlaceTrade now expects an object with crypto, amount, direction, and deliveryTimeSeconds
  onPlaceTrade: (tradeDetails: { crypto: Cryptocurrency; amount: number; direction: 'up' | 'down'; deliveryTimeSeconds: number }) => void;
  isPlacingTrade: boolean;
}

export default function TradingModal({
  isOpen,
  onClose,
  crypto,
  userBalance,
  onPlaceTrade,
  isPlacingTrade,
}: TradingModalProps) {
  const [direction, setDirection] = useState<"up" | "down">("up");
  // State for selected delivery time, default to 5 minutes (300 seconds)
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState(300);
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  // Define available delivery time options
  const deliveryTimeOptions = [
    { label: '60s', value: 60 },
    { label: '2 Min', value: 120 },
    { label: '5 Min', value: 300 },
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setDirection("up");
      setSelectedDeliveryTime(300); // Reset to default 5 min when modal opens
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tradeAmount = parseFloat(amount);

    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount.",
        variant: "destructive",
      });
      return;
    }

    if (tradeAmount < 100) {
      toast({
        title: "Minimum Amount",
        description: "Minimum amount is 100 USDT.",
        variant: "destructive",
      });
      return;
    }

    if (tradeAmount > userBalance) { // Simplified check, as previous one allowed very small overdraft
      toast({
        title: "Insufficient Balance",
        description: `Your current balance is US$${userBalance.toFixed(2)}. You cannot trade US$${tradeAmount.toFixed(2)}.`,
        variant: "destructive",
      });
      return;
    }

    // UPDATED: Call the parent's onPlaceTrade function with the full tradeDetails object
    onPlaceTrade({
      crypto: crypto,
      amount: tradeAmount,
      direction: direction,
      deliveryTimeSeconds: selectedDeliveryTime, // Pass the selected time
    });
    // The parent will handle closing the modal on success
  };

  if (!isOpen) return null;

  const potentialGainRange = "5-19%";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-start justify-center">
      <div className="bg-gray-900 w-full h-full max-w-2xl mx-auto p-6 overflow-y-auto text-white shadow-lg border border-gray-700 rounded-none">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            {crypto.name} Delivery
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Trade Info */}
        <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-800 rounded-lg">
          <div className={`w-10 h-10 ${crypto.color} rounded-full flex items-center justify-center text-lg`}>
            {/* Render SVG icon directly using dangerouslySetInnerHTML */}
            <div dangerouslySetInnerHTML={{ __html: crypto.icon }} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-white text-lg">{crypto.name}</div>
            <div className={`text-sm flex items-center ${direction === "up" ? "text-crypto-green" : "text-crypto-red"}`}>
              {direction === "up" ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {direction === "up" ? "Buy Up" : "Sell Down"}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-crypto-blue font-semibold flex items-center justify-end">
              <Clock className="h-4 w-4 mr-1" />
              {/* Display selected delivery time */}
              {selectedDeliveryTime === 60 ? '60s' : `${selectedDeliveryTime / 60} Min`}
            </div>
            {/* Display current crypto price */}
            <div className="text-sm text-gray-400">Current Price: US$ {parseFloat(crypto.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Direction Selection */}
          <div>
            <Label htmlFor="direction" className="text-gray-300 font-medium mb-3 block">Trade Direction</Label>
            <div className="flex space-x-3 mt-3">
              <Button
                type="button"
                onClick={() => setDirection("up")}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-semibold text-lg transition-colors
                  ${direction === "up" ? "bg-green-600 text-white hover:bg-green-600" : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"}
                `}
              >
                <TrendingUp className="h-5 w-5" />
                <span>Up</span>
              </Button>
              <Button
                type="button"
                onClick={() => setDirection("down")}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-semibold text-lg transition-colors
                  ${direction === "down" ? "bg-red-600 text-white hover:bg-crypto-red" : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"}
                `}
              >
                <TrendingDown className="h-5 w-5" />
                <span>Down</span>
              </Button>
            </div>
          </div>

          {/* Delivery Time Selection */}
          <div>
            <Label className="text-gray-300 font-medium mb-3 block">Delivery Time</Label>
            <div className="flex space-x-3 mt-3">
              {deliveryTimeOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedDeliveryTime(option.value)}
                  className={`flex-1 py-3 rounded-lg font-semibold text-lg transition-colors
                    ${selectedDeliveryTime === option.value
                      ? "bg-blue-600 text-white hover:bg-crypto-blue"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"}
                  `}
                >
                  <Clock className="h-5 w-5 mr-2" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Potential Return Display */}
          <div>
            <Label className="text-gray-300 font-medium mb-3 block">Potential Return</Label>
            <div className="bg-gray-800 rounded-lg px-4 py-3 mt-3 text-white flex items-center justify-between">
              <span className="text-crypto-green font-semibold">({potentialGainRange}% Gain)</span>
              <span className="text-gray-400 text-sm">View</span>
            </div>
          </div>

          {/* Purchase Amount */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label htmlFor="amount" className="text-gray-300 font-medium">Purchase Amount</Label>
            </div>
            <div className="flex space-x-3">
              <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-4 py-3 flex-1 border border-gray-700">
                <DollarSign className="text-crypto-green h-5 w-5" />
                <span className="text-gray-400">USDT</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Min 100 USDT"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent border-none shadow-none px-4 text-white focus-visible:ring-0 text-lg"
                  min="100"
                  step="0.01"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAmount(userBalance.toFixed(2))}
                className="bg-gray-700 text-white hover:bg-gray-600 border border-gray-600"
              >
                Max
              </Button>
            </div>
          </div>

          {/* Balance Info */}
          <div className="flex justify-between text-sm text-gray-400 mt-4">
            <span>Your Balance: <span className="font-semibold text-white">US$ {userBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
            <span>Minimum Trade: <span className="font-semibold text-white">US$ 100</span></span>
          </div>

          {/* Trade Button */}
        <Button
          type="submit"
          disabled={isPlacingTrade || !amount || parseFloat(amount) < 100}
          className={`w-full py-4 text-lg font-semibold rounded-lg transition-colors duration-200
            ${isPlacingTrade
              ? "bg-blue-700 text-blue-100 cursor-not-allowed"
              : "bg-blue-700 text-white hover:bg-blue-800"}
          `}
        >
          {isPlacingTrade ? "Processing..." : "Entrust Now"}
        </Button>
        </form>
      </div>
    </div>
  );
}