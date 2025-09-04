import React, { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  ArrowLeftRight,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartData,
  ChartOptions,
  Filler,
} from "chart.js";
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = 'http://localhost:6061'

// IMPORTANT: Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

// Define types
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

interface TradeSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null; // Allow trade to be null
  currentPrice: number | null;
  onCompleteTrade: (tradeId: string) => Promise<Trade | null>;
}

interface SimulationState {
  trade: Trade;
  chartData: { time: number; value: number }[];
  isCompleted: boolean;
  finalPrice: number | null;
}

export default function TradeSimulationModal({
  isOpen,
  onClose,
  trade,
  currentPrice,
  onCompleteTrade,
}: TradeSimulationModalProps) {
  // CRITICAL FIX: Add a guard clause at the very beginning
  if (!isOpen || !trade) {
    return null;
  }

  const { toast } = useToast();
  const [simulationState, setSimulationState] = useState<SimulationState>(() => {
    const initialTrade = { ...trade, entryPrice: trade.entryPrice, timestamp: trade.timestamp };
    return {
      trade: initialTrade,
      chartData: [{ time: initialTrade.timestamp, value: initialTrade.entryPrice }],
      isCompleted: initialTrade.status === 'completed',
      finalPrice: initialTrade.simulatedFinalPrice || null,
    };
  });
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCompletingTrade, setIsCompletingTrade] = useState(false);
  const [completionTimeLeft, setCompletionTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = null;
      }
      return;
    }

    if (trade.status === 'completed') {
      fetchHistoricalData(trade.timestamp, trade.deliveryTime, trade.entryPrice, trade.simulatedFinalPrice || currentPrice!);
      return;
    }

    let currentSimulatedPrice = trade.entryPrice;
    const deliveryTime = trade.deliveryTime;

    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }

    const startSimulation = () => {
      simulationIntervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const timeLeft = deliveryTime - currentTime;

        if (timeLeft <= 0 && !isCompletingTrade) {
          clearInterval(simulationIntervalRef.current!);
          simulationIntervalRef.current = null;
          // Start the 1-minute completion timer
          setIsCompletingTrade(true);
          setCompletionTimeLeft(60); // Start at 60 seconds
          setTimeout(() => {
            window.location.reload();
          }, 60000);
          completionTimeoutRef.current = setTimeout(async () => {
            const updatedTrade = await onCompleteTrade(trade.id);
            if (updatedTrade) {
              setSimulationState(prev => ({
                ...prev,
                trade: updatedTrade,
                isCompleted: true,
                finalPrice: updatedTrade.simulatedFinalPrice,
              }));
              toast({
                title: "Trade Completed!",
                description: `Trade on ${updatedTrade.cryptoName} has been settled with outcome: ${updatedTrade.outcome}.`,
              });
            } else {
              window.location.reload();
            }
            setIsCompletingTrade(false);
            setCompletionTimeLeft(null);
          }, 60000);
          return;
        }

        if (!isCompletingTrade) {
          const volatility = trade.entryPrice * 0.002;
          const randomChange = (Math.random() - 0.5) * volatility;
          currentSimulatedPrice = Math.max(0.01, currentSimulatedPrice + randomChange);

          setSimulationState(prev => {
            const newChartData = [...prev.chartData, { time: currentTime, value: currentSimulatedPrice }];
            return {
              ...prev,
              chartData: newChartData,
            };
          });
        }
      }, 500);

      // Update completion timer countdown every second
      if (isCompletingTrade) {
        const countdownInterval = setInterval(() => {
          setCompletionTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(countdownInterval);
      }
    };

    startSimulation();

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, [isOpen, trade, onClose, currentPrice, onCompleteTrade, toast, isCompletingTrade]);

  const fetchHistoricalData = async (start: number, end: number, entryPrice: number, finalPrice: number) => {
    const data = [{ time: start, value: entryPrice }];
    const duration = end - start;
    const steps = duration / 500;
    for (let i = 1; i <= steps; i++) {
      const time = start + i * (duration / steps);
      const interpolatedValue = entryPrice + (finalPrice - entryPrice) * (i / steps) + (Math.random() - 0.5) * 0.005 * entryPrice;
      data.push({ time, value: interpolatedValue });
    }
    data.push({ time: end, value: finalPrice });

    setSimulationState(prev => ({
      ...prev,
      chartData: data,
      isCompleted: true,
      finalPrice: finalPrice,
    }));
  };

  const formatNumber = (num: number | null, currency: boolean = false) => {
    if (num === null || isNaN(num)) {
      return currency ? "$0.00" : "N/A";
    }
    const formatted = num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
    return currency ? `$${formatted}` : formatted;
  };

  const tradeDirectionColor = trade.direction === 'up' ? 'text-green-500' : 'text-red-500';

  const formatTimeLeft = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 0) return "0s";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const finalResult = useMemo(() => {
    if (simulationState.isCompleted && simulationState.trade.outcome) {
      const { outcome, gainPercentage, finalAmount, cryptoName } = simulationState.trade;
      if (outcome === 'win') {
        return (
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-green-500">WIN!</span>
            <span className="text-xl font-semibold text-green-400">+{formatNumber(gainPercentage, false)}%</span>
            <span className="text-sm text-gray-400">Final Amount: {formatNumber(finalAmount, true)}</span>
          </div>
        );
      } else if (outcome === 'loss') {
        return (
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-red-500">LOSS</span>
            <span className="text-xl font-semibold text-red-400">-{formatNumber(Math.abs(gainPercentage!), false)}%</span>
            <span className="text-sm text-gray-400">Final Amount: {formatNumber(finalAmount, true)}</span>
          </div>
        );
      } else {
        return (
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-yellow-500">DRAW</span>
            <span className="text-xl font-semibold text-yellow-400">0.00%</span>
            <span className="text-sm text-gray-400">Final Amount: {formatNumber(finalAmount, true)}</span>
          </div>
        );
      }
    }
    return null;
  }, [simulationState.isCompleted, simulationState.trade]);

  const progressPercentage = useMemo(() => {
    if (trade.status === 'completed' || isCompletingTrade) return 100;
    const now = Date.now();
    const totalDuration = trade.deliveryTime - trade.timestamp;
    const elapsed = now - trade.timestamp;
    return Math.min(100, (elapsed / totalDuration) * 100);
  }, [trade, isCompletingTrade]);

  const chartData: ChartData<'line'> = useMemo(() => {
    if (!simulationState.chartData || simulationState.chartData.length === 0) {
      return { datasets: [] };
    }

    const finalPrice = simulationState.trade.status === 'completed' ? simulationState.trade.simulatedFinalPrice : simulationState.finalPrice;
    const isWin = simulationState.trade.outcome === 'win';

    return {
      datasets: [
        {
          label: 'Simulated Price',
          data: simulationState.chartData.map((d) => ({ x: d.time, y: d.value })),
          borderColor: simulationState.trade.outcome ? (isWin ? '#22c55e' : '#ef4444') : '#3b82f6',
          backgroundColor: simulationState.trade.outcome ? (isWin ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)') : 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.1,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Entry Price',
          data: [{ x: trade.timestamp, y: trade.entryPrice }, { x: Date.now(), y: trade.entryPrice }],
          borderColor: 'rgba(255, 255, 255, 0.5)',
          borderDash: [5, 5],
          pointRadius: 0,
          borderWidth: 1,
        },
        ...(simulationState.isCompleted && finalPrice !== null ? [{
          label: 'Final Price',
          data: [{ x: trade.deliveryTime, y: finalPrice }],
          pointStyle: 'crossRot',
          pointBackgroundColor: isWin ? '#22c55e' : '#ef4444',
          pointBorderColor: isWin ? '#22c55e' : '#ef4444',
          pointRadius: 6,
          pointBorderWidth: 2,
          type: 'scatter',
        }] : []),
      ],
    };
  }, [simulationState.chartData, trade.entryPrice, trade.timestamp, simulationState.isCompleted, simulationState.trade.outcome, trade.deliveryTime, simulationState.trade.simulatedFinalPrice, simulationState.finalPrice]);

  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (context) => format(context[0].parsed.x, 'MMM d, h:mm:ss a'),
          label: (context) => `Price: ${context.parsed.y.toFixed(4)}`,
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: { unit: 'second' },
        ticks: { color: 'white' },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
      y: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
    },
    layout: {
      padding: { left: 10, right: 10, top: 10, bottom: 10 },
    },
  }), []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-gray-900 border-gray-700 text-white rounded-xl shadow-lg">
        <DialogHeader className="border-b border-gray-700 pb-4">
          <DialogTitle className="text-lg font-semibold text-white">
            Trade Simulation: {trade.cryptoName}
          </DialogTitle>  
        </DialogHeader>

        <div className="p-4 space-y-6">
          <div className="flex items-center space-x-4 bg-gray-800 p-4 rounded-lg">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full ${tradeDirectionColor}`}>
              {trade.direction === 'up' ? <TrendingUp className="h-8 w-8" /> : <TrendingDown className="h-8 w-8" />}
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-sm">Trade Type</p>
              <p className="font-semibold text-lg">{trade.direction.toUpperCase()}</p>
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-sm">Amount</p>
              <p className="font-semibold text-lg">{formatNumber(trade.amount, true)}</p>
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-sm">Entry Price</p>
              <p className="font-semibold text-lg">{formatNumber(trade.entryPrice, true)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-gray-400 font-semibold text-sm">
              <span>{format(new Date(trade.timestamp), 'h:mm a')}</span>
              <span>{format(new Date(trade.deliveryTime), 'h:mm a')}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className={`bg-blue-500 h-2.5 rounded-full`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white font-semibold">Live Simulation</span>
              <span className="text-gray-400">
                {isCompletingTrade ? (
                  `Completing the trade... ${completionTimeLeft !== null ? `${completionTimeLeft}s` : ''}`
                ) : (
                  `Time Remaining: ${formatTimeLeft(trade.deliveryTime - Date.now())}`
                )}
              </span>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            {simulationState.chartData.length > 0 && (
              <div className="h-[300px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
            {simulationState.chartData.length === 0 && (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Loading simulation data...
              </div>
            )}
          </div>

          <div className="flex justify-center mt-6">
            {finalResult}
          </div>
        </div>
        <div className="border-t border-gray-700 pt-4 flex justify-end space-x-2">
          <Button onClick={onClose} variant="outline" className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}