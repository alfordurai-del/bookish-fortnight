import React, { useState, useEffect, useMemo } from 'react';
import {
  FaChartLine, FaDollarSign, FaShieldAlt,
  FaLightbulb, FaSyncAlt, FaCalculator,
  FaUserTie, FaClipboardList, FaGlobe,
  FaExchangeAlt, FaLock, FaMedal, FaHistory, FaTrophy // Added FaTrophy import
} from 'react-icons/fa';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating IDs
import toast, { Toaster } from 'react-hot-toast'; // Import Toaster and toast

// Assuming you have a UserContext to get user ID for API calls
import { useUser } from '../context/UserContext'; // Uncommented and now being used
import { Skeleton } from '../components/ui/skeleton'; // Assuming you have a Skeleton component

// IMPORTANT: Define API_BASE_URL using window.location.origin for browser environment
const API_BASE_URL = 'https://myblog.alwaysdata.net';

// Define the Trade type based on your backend schema
interface Trade {
  id: string;
  userId: string;
  cryptoId: string; // Changed to string based on backend
  cryptoName: string;
  crypto_symbol: string;
  type: 'buy' | 'sell';
  direction: 'long' | 'short';
  amount: number;
  initialPrice: number;
  deliveryTime: number; // Unix timestamp
  status: 'pending' | 'completed' | 'cancelled';
  timestamp: number; // Unix timestamp
  email: string;
  outcome: 'win' | 'loss' | 'draw' | null;
  gainPercentage: number | null;
  finalAmount: number | null;
  FinalPrice: number | null;
  currentTradeValue: number | null;
  currentGainLossPercentage: number | null;
  entryPrice: number; // Added for clarity, same as initialPrice
}

// Updated interface for Active Investment Strategy to match backend schema
interface ActiveInvestment {
  id: string;
  userId: string; // Added userId for consistency
  strategyId: string; // Added strategyId for consistency
  strategyName: string; // Backend will provide this
  investmentAmount: number;
  currentValue: number;
  expectedReturn: string; // This will come as "X% daily" from backend
  status: 'active' | 'completed' | 'cancelled'; // Explicit statuses
  startDate: string; // ISO string
  durationDays: number;
  createdAt?: string; // Optional, if you want to display
  updatedAt?: string; // Optional, if you want to display
}

// NEW: Interface for detailed performance report
interface PerformanceReport {
  allTimeProfit: number;
  totalTrades: number;
  winRate: number;
  avgProfitPerTrade: number;
  avgTradeDuration: string; // e.g., "5 minutes"
  totalUsers: number;
  activeStrategiesCount: number;
  monthlyROI: { month: string; roi: number; }[];
  strategyPerformance: {
    name: string;
    totalProfit: number;
    tradesExecuted: number;
    winRate: number;
    avgROI: number;
  }[];
}


const CryptoArbitragePlatform = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Define default strategy locally for UI purposes, but backend config is source of truth
  const localStrategies = useMemo(() => ([
    {
      id: '5day',
      name: '5-Day Strategy',
      duration: '5 days',
      minAmount: 100,
      maxAmount: 9999,
      dailyReturn: 3.40,
      maxDrawdown: 2.00,
      coins: ['BTC', 'ETH', 'USDT']
    },
    {
      id: '30day',
      name: '30-Day Strategy',
      duration: '30 days',
      minAmount: 500,
      maxAmount: 50000,
      dailyReturn: 3.00,
      maxDrawdown: 1.1,
      coins: ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'ADA', 'DOT', 'DOGE', 'AVAX', 'MATIC', 'LTC']
    },
    {
      id: '90day',
      name: '90-Day Strategy',
      duration: '90 days',
      minAmount: 1000,
      maxAmount: 100000,
      dailyReturn: 4.00,
      maxDrawdown: 1.3,
      coins: 'All coins'
    }
  ]), []);

  const defaultStrategy = localStrategies[0]; // Use the first strategy as default

  const [investmentAmount, setInvestmentAmount] = useState(defaultStrategy.minAmount);
  const [selectedStrategy, setSelectedStrategy] = useState(defaultStrategy.id);
  const [, setLocation] = useLocation();

  // State for fetching dashboard data
  const [platformPerformance, setPlatformPerformance] = useState({
    totalArbitrage: '0.00',
    todaysEarnings: '0.00',
    thirtyDayROI: '0.00',
    totalTradesExecuted: '0',
    averageProfitPerTrade: '0.00',
    platformUptime: '0.00',
  });
  // Changed type to ActiveInvestment[]
  const [activeUserStrategies, setActiveUserStrategies] = useState<ActiveInvestment[]>([]);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(true);
  const [isLoadingActiveStrategies, setIsLoadingActiveStrategies] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(true); // NEW: Loading state for report

  // User-specific states from UserContext
  const { user, isLoading: isUserLoading, error: userError, refetchUser } = useUser(); // Using useUser hook, added refetchUser
  const userBalance = user?.balance ?? null; // Get balance from context
  const userEmail = user?.email ?? null; // Get email from context
  const userId = user?.id ?? null; // Get userId from context

  const [userTrades, setUserTrades] = useState<Trade[]>([]);

  // State for Security Tab simulation, initialized from localStorage
  const [is2FAEnabled, setIs2FAEnabled] = useState(() => {
    const saved2FA = localStorage.getItem('is2FAEnabled');
    return saved2FA ? JSON.parse(saved2FA) : false;
  });
  const [securityAuditStatus, setSecurityAuditStatus] = useState<'idle' | 'running' | 'complete'>(() => {
    const savedAuditStatus = localStorage.getItem('securityAuditStatus');
    return savedAuditStatus ? (savedAuditStatus as 'idle' | 'running' | 'complete') : 'idle';
  });
  const [showComplianceDocument, setShowComplianceDocument] = useState(false);

  // States for Education Section article viewer
  const [showArticleViewer, setShowArticleViewer] = useState(false);
  const [currentArticleTitle, setCurrentArticleTitle] = useState('');
  const [currentArticleContent, setCurrentArticleContent] = useState('');

  // NEW: State for detailed performance report
  const [platformPerformanceReport, setPlatformPerformanceReport] = useState<PerformanceReport>({
    allTimeProfit: 0,
    totalTrades: 0,
    winRate: 0,
    avgProfitPerTrade: 0,
    avgTradeDuration: 'N/A',
    totalUsers: 0,
    activeStrategiesCount: 0,
    monthlyROI: [],
    strategyPerformance: [],
  });

  // NEW: States for the new pop-up modals
  const [showProofOfReservesModal, setShowProofOfReservesModal] = useState(false);
  const [showSmartContractAuditModal, setShowSmartContractAuditModal] = useState(false);
  const [showPerformanceHistoryModal, setShowPerformanceHistoryModal] = useState(false);
  const [showFeeStructureModal, setShowFeeStructureModal] = useState(false);


  // Effect to save 2FA state to localStorage
  useEffect(() => {
    localStorage.setItem('is2FAEnabled', JSON.stringify(is2FAEnabled));
  }, [is2FAEnabled]);

  // Effect to save security audit status to localStorage
  useEffect(() => {
    localStorage.setItem('securityAuditStatus', securityAuditStatus);
  }, [securityAuditStatus]);


  const strategies = localStrategies; // Use the local strategies for UI display

  const currentStrategy = useMemo(() => {
    const strategy = strategies.find(s => s.id === selectedStrategy);
    return strategy || defaultStrategy; // Fallback to default if not found
  }, [selectedStrategy, strategies, defaultStrategy]);

  // Helper to parse duration string into number of days
  const parseDurationToDays = (duration: string): number => {
    const match = duration.match(/(\d+)\s*(day|days)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return 0; // Default to 0 days if parsing fails
  };

  // Calculate projected returns using useMemo to optimize performance
  const projected = useMemo(() => {
    const days = parseDurationToDays(currentStrategy.duration);
    const dailyEarnings = (investmentAmount * (currentStrategy.dailyReturn / 100));
    const totalStrategyEarnings = dailyEarnings * days;
    const totalValue = investmentAmount + totalStrategyEarnings;

    return {
      daily: dailyEarnings.toFixed(2),
      strategyReturn: totalStrategyEarnings.toFixed(2),
      total: totalValue.toFixed(2),
    };
  }, [investmentAmount, currentStrategy]);


  // Function to update investment amount, ensuring it stays within bounds
  const handleInvestmentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    // Ensure value is a number
    if (!isNaN(value)) {
      // Cap the new amount by the strategy's max, and also by the user's current balance
      const maxAllowed = userBalance !== null ? Math.min(currentStrategy.maxAmount, userBalance) : currentStrategy.maxAmount;
      const newAmount = Math.max(currentStrategy.minAmount, Math.min(maxAllowed, value));
      setInvestmentAmount(newAmount);
    }
  };

  // Handle Invest button click from Dashboard
  const handleInvestClick = (strategyId: string) => {
    setSelectedStrategy(strategyId);
    // Set investment amount to the selected strategy's minAmount when switching to it
    const strategyToInvest = strategies.find(s => s.id === strategyId);
    if (strategyToInvest) {
      // Also ensure the initial amount doesn't exceed current balance
      const initialAmount = userBalance !== null ? Math.min(strategyToInvest.minAmount, userBalance) : strategyToInvest.minAmount;
      setInvestmentAmount(initialAmount);
    }
    setActiveTab('strategies');
  };

  // Placeholder for "Start Investing" button
  const handleStartInvesting = async () => {
    if (!userId || !userEmail) {
      toast.error("User not logged in or email not available.");
      return;
    }

    if (userBalance === null || investmentAmount > userBalance) {
      toast.error("Insufficient balance for this investment. Please deposit more funds or reduce your investment amount.");
      return;
    }

    if (investmentAmount < currentStrategy.minAmount || investmentAmount > currentStrategy.maxAmount) {
      toast.error(`Please ensure the investment amount is between $${currentStrategy.minAmount} and $${currentStrategy.maxAmount}.`);
      return;
    }

    console.log(`Attempting to start investment of $${investmentAmount} with ${currentStrategy.name}`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/invest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${userToken}` // Uncomment if you have authentication tokens
        },
        body: JSON.stringify({
          userId: userId,
          amount: investmentAmount,
          strategyId: currentStrategy.id, // Send strategyId to backend
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start investment.');
      }

      const result = await response.json();
      toast.success(`Investment started successfully! Details: ${JSON.stringify(result)}`);
      
      // Refetch user balance after investment
      refetchUser();
      // Refresh active investments to show the new one
      fetchUserActiveStrategies();

      // In a real app, you might refresh user balance, show a success message,
      // or navigate to an 'active investments' page.
      // For now, we'll also simulate placing a trade for this investment
      // This is a simplification; a real system would have a separate investment tracking.
      const Trade: Partial<Trade> = {
        id: uuidv4(), // Generate a proper UUID
        userId: userId,
        cryptoId: 'bitcoin', // Example crypto - ensure this matches a CoinGecko ID
        cryptoName: 'Bitcoin',
        cryptoSymbol: 'BTC',
        type: 'buy',
        direction: 'up', // Changed from 'long' to 'up'
        amount: investmentAmount,
        initialPrice: 28000 + Math.random() * 2000, // Simulate current BTC price
        deliveryTime: Date.now() + (1 * 60 * 1000), // Resolve in 1 minute for demo
        status: 'pending',
        timestamp: Date.now(),
        email: userEmail,
        outcome: null,
        gainPercentage: null,
        finalAmount: null,
        FinalPrice: null,
        currentTradeValue: investmentAmount,
        currentGainLossPercentage: 0,
        entryPrice: 28000 + Math.random() * 2000,
      };

      const tradeResponse = await fetch(`${API_BASE_URL}/api/trades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Trade),
      });

      if (!tradeResponse.ok) {
        const errorData = await tradeResponse.json();
        console.error("Failed to simulate trade for investment:", errorData);
        // toast.error(`Warning: Investment started, but failed to record  trade: ${errorData.message || 'Unknown error'}`);
      } else {
        const tradeResult = await tradeResponse.json();
        console.log(" trade recorded:", tradeResult);
        // Refresh trades to show the new pending trade
        fetchUserTrades();
      }

    } catch (error) {
      console.error("Error starting investment:", error);
      toast.error(`Error starting investment: ${(error as Error).message}`);
    }
  };

  // Placeholder for other buttons/links
  const handleButtonClick = (action: string) => {
    console.log(`Button clicked: ${action}`);
    // Example navigation for some buttons
    if (action === 'Explore Strategies') {
      setActiveTab('strategies');
    } else if (action === 'Enhance Security') {
      setActiveTab('security');
    } else if (action === 'Help Center') {
      // Use setLocation for internal navigation
      setLocation('/support');
    } else if (action === 'Terms of Service') {
      setLocation('/terms'); // Example navigation using wouter
    } else if (action === 'Toggle 2FA') {
      setIs2FAEnabled(prev => !prev);
      toast.success(`2FA is now ${is2FAEnabled ? 'Disabled' : 'Enabled'}. ()`);
    } else if (action === 'Run Security Audit') {
      setSecurityAuditStatus('running');
      toast.loading("Running security audit... ()");
      setTimeout(() => {
        setSecurityAuditStatus('complete');
        toast.success("Security Audit Complete: No Issues Found! ()");
      }, 2000); // Simulate audit time
    } else if (action === 'Change Password') {
      toast.success("Password changed successfully! ()");
    } else if (action === 'View Compliance Documents') {
      setShowComplianceDocument(true);
    } else if (action === 'Proof of Reserves') { // NEW: Handle Proof of Reserves
      setShowProofOfReservesModal(true);
    } else if (action === 'Smart Contract Audit') { // NEW: Handle Smart Contract Audit
      setShowSmartContractAuditModal(true);
    } else if (action === 'Performance History') { // NEW: Handle Performance History
      setShowPerformanceHistoryModal(true);
    } else if (action === 'Fee Structure') { // NEW: Handle Fee Structure
      setShowFeeStructureModal(true);
    }
    else if (action.startsWith('Read Article:')) {
      const articleKey = action.replace('Read Article: ', '');
      const article = articles[articleKey];
      if (article) {
        setCurrentArticleTitle(article.title);
        setCurrentArticleContent(article.content);
        setShowArticleViewer(true);
      }
    }
    // Add more specific logic for other buttons if needed
  };

  // --- Fetch Dashboard Data ---
  useEffect(() => {
    if (activeTab === 'dashboard' && userId) { // Ensure userId is available before fetching
      const fetchDashboardData = async () => {
        setIsLoadingPerformance(true);
        setIsLoadingActiveStrategies(true);

        // Fetch Platform Performance
        try {
          const performanceResponse = await fetch(`${API_BASE_URL}/api/platform-performance`);
          if (performanceResponse.ok) {
            const data = await performanceResponse.json();
            setPlatformPerformance(data);
          } else {
            console.error('Failed to fetch platform performance:', performanceResponse.statusText);
          }
        } catch (error) {
          console.error('Error fetching platform performance:', error);
        } finally {
          setIsLoadingPerformance(false);
        }

        // Fetch User Active Investments/Strategies
        fetchUserActiveStrategies(); // Call the dedicated function
      };

      fetchDashboardData();
    }
  }, [activeTab, userId]); // Re-run when tab changes or userId changes

  // NEW: Fetch detailed performance report data
  useEffect(() => {
    if (activeTab === 'performance') {
      const fetchPerformanceReport = async () => {
        setIsLoadingReport(true);
        try {
          // Simulate API call to get detailed report data
          // In a real app, this would be a fetch to your backend:
          // const response = await fetch(`${API_BASE_URL}/api/performance-report`);
          // if (response.ok) {
          //   const data = await response.json();
          //   setPlatformPerformanceReport(data);
          // } else {
          //   console.error('Failed to fetch performance report:', response.statusText);
          // }

          // --- MOCK DATA FOR DEMONSTRATION ---
          setTimeout(() => {
            setPlatformPerformanceReport({
              allTimeProfit: 12500000 + Math.floor(Math.random() * 1000000), // $12.5M to $13.5M
              totalTrades: 1500000 + Math.floor(Math.random() * 500000), // 1.5M to 2M
              // Corrected: parseFloat to ensure number type
              winRate: parseFloat((88.5 + (Math.random() * 2 - 1)).toFixed(1)), // 87.5% to 89.5%
              avgProfitPerTrade: parseFloat((25 + (Math.random() * 10 - 5)).toFixed(2)), // $20 to $30
              avgTradeDuration: '5 minutes',
              totalUsers: 75000 + Math.floor(Math.random() * 10000), // 75K to 85K
              activeStrategiesCount: 12000 + Math.floor(Math.random() * 2000), // 12K to 14K
              monthlyROI: [
                { month: 'Jan', roi: 3.2 + Math.random() },
                { month: 'Feb', roi: 3.5 + Math.random() },
                { month: 'Mar', roi: 3.8 + Math.random() },
                { month: 'Apr', roi: 4.1 + Math.random() },
                { month: 'May', roi: 4.0 + Math.random() },
                { month: 'Jun', roi: 4.5 + Math.random() },
                { month: 'Jul', roi: 4.3 + Math.random() },
              ].map(item => ({ ...item, roi: parseFloat(item.roi.toFixed(2)) })),
              strategyPerformance: [
                { name: '5-Day Strategy', totalProfit: 5000000 + Math.floor(Math.random() * 500000), tradesExecuted: 800000, winRate: 89.2, avgROI: 0.88 },
                { name: '30-Day Strategy', totalProfit: 6000000 + Math.floor(Math.random() * 500000), tradesExecuted: 500000, winRate: 87.5, avgROI: 1.15 },
                { name: '90-Day Strategy', totalProfit: 1500000 + Math.floor(Math.random() * 200000), tradesExecuted: 200000, winRate: 90.1, avgROI: 1.48 },
              ].map(item => ({
                ...item,
                totalProfit: parseFloat(item.totalProfit.toFixed(2)),
                winRate: parseFloat(item.winRate.toFixed(1)),
                avgROI: parseFloat(item.avgROI.toFixed(2)),
              }))
            });
            setIsLoadingReport(false);
          }, 1000); // Simulate network delay
          // --- END MOCK DATA ---

        } catch (error) {
          console.error('Error fetching performance report:', error);
          setIsLoadingReport(false);
        }
      };

      fetchPerformanceReport();
    }
  }, [activeTab]); // Fetch when performance tab is active


  // Dedicated function to fetch user active strategies
  const fetchUserActiveStrategies = async () => {
    if (!userId) {
      console.warn("User ID not available, cannot fetch active investments.");
      setIsLoadingActiveStrategies(false);
      return;
    }
    setIsLoadingActiveStrategies(true);
    try {
      const userInvestmentsResponse = await fetch(`${API_BASE_URL}/api/user-investments?userId=${userId}`);
      if (userInvestmentsResponse.ok) {
        const data: ActiveInvestment[] = await userInvestmentsResponse.json();
        setActiveUserStrategies(data);
      } else {
        console.error('Failed to fetch user investments:', userInvestmentsResponse.statusText);
        setActiveUserStrategies([]);
      }
    } catch (error) {
      console.error('Error fetching user investments:', error);
      setActiveUserStrategies([]);
    } finally {
      setIsLoadingActiveStrategies(false);
    }
  };


  // --- Fetch User Trades (Transactions) ---
  const fetchUserTrades = async () => {
    if (!userEmail) {
      console.warn("User email not available, cannot fetch trades.");
      setIsLoadingTransactions(false);
      return;
    }
    setIsLoadingTransactions(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions?email=${userEmail}`);
      if (response.ok) {
        const data: Trade[] = await response.json();
        // Sort trades by timestamp in descending order (most recent first)
        data.sort((a, b) => b.timestamp - a.timestamp);
        setUserTrades(data);
      } else {
        console.error('Failed to fetch user transactions:', response.statusText);
        setUserTrades([]);
      }
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      setUserTrades([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    // Changed to 'my-investments'
    if (activeTab === 'my-investments' && userEmail) {
      fetchUserTrades();
    }
  }, [activeTab, userEmail]); // Re-run when tab changes or userEmail becomes available

  // Helper function to calculate days remaining
  const calculateDaysRemaining = (startDateString: string, durationDays: number): string => {
    console.log(startDateString,durationDays, " MMMM")
    const start = new Date(startDateString);
    // Check if start date is valid
    if (isNaN(start.getTime())) {
      return "Invalid Date";
    }

    const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000); // Add duration in milliseconds
    const now = new Date();

    if (now >= end) {
      return "Completed";
    }

    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 25));
    return `${diffDays} days left`;
  };

  // Static content for the compliance document
  const complianceDocumentContent = `
    <h2>ArbSecure Regulatory Compliance Document</h2>
    <h3>Version 1.0 - Effective Date: July 23, 2025</h3>

    <p>This document outlines ArbSecure's commitment to regulatory compliance and adherence to global financial standards. We are dedicated to maintaining a secure, transparent, and legally compliant platform for all our users.</p>

    <h4>1. Anti-Money Laundering (AML) Policy</h4>
    <p>ArbSecure implements robust AML procedures to prevent money laundering and terrorist financing activities. Our policies include:</p>
    <ul>
      <li><strong>Customer Due Diligence (CDD):</strong> Verification of identity for all users through our KYC process.</li>
      <li><strong>Transaction Monitoring:</strong> Continuous monitoring of transactions for suspicious activities.</li>
      <li><strong>Reporting:</strong> Reporting of suspicious transactions to relevant authorities as required by law.</li>
    </ul>

    <h4>2. Know Your Customer (KYC) Policy</h4>
    <p>Our KYC policy is designed to verify the identity of our users and comply with regulatory requirements. This involves collecting and verifying personal information, including:</p>
    <ul>
      <li>Full legal name</li>
      <li>Date of birth</li>
      <li>Residential address</li>
      <li>Government-issued identification (e.g., passport, national ID, driver's license)</li>
      <li>Proof of address</li>
    </ul>
    <p>The information collected is securely stored and used solely for compliance purposes.</p>

    <h4>3. Data Privacy and Security</h4>
    <p>ArbSecure is committed to protecting user data and employs industry-leading security measures:</p>
    <ul>
      <li><strong>Encryption:</strong> All data transmitted and stored is encrypted using advanced cryptographic protocols.</li>
      <li><strong>Access Control:</strong> Strict access controls are in place to limit access to sensitive user information.</li>
      <li><strong>Regular Audits:</strong> Our systems undergo regular security audits and penetration testing by independent third parties.</li>
      <li><strong>Cold Storage:</strong> A significant portion of user funds are held in secure cold storage (offline wallets) to minimize online exposure.</li>
    </ul>

    <h4>4. Jurisdiction and Licensing</h4>
    <p>ArbSecure operates under the regulatory framework of [Specify Jurisdiction, e.g., "The Financial Crimes Enforcement Network (FinCEN) as a Money Services Business (MSB) in the United States"]. We continuously monitor changes in global regulations to ensure ongoing compliance.</p>

    <h4>5. Risk Disclosure</h4>
    <p>Cryptocurrency investments carry inherent risks. Users are advised to read our full Risk Disclosure document before engaging in any trading activity. Past performance is not indicative of future results.</p>

    <p>For any questions regarding our compliance policies, please contact our support team.</p>
    <p><strong>ArbSecure Compliance Department</strong></p>
    <p><em>This document is for informational purposes only and does not constitute legal advice.</em></p>
  `;

  // Static content for education articles
  const articles: { [key: string]: { title: string; content: string } } = {
    'What is Arbitrage?': {
      title: 'What is Cryptocurrency Arbitrage?',
      content: `
        <p>Cryptocurrency arbitrage is a trading strategy that involves simultaneously buying and selling a cryptocurrency on different exchanges to profit from tiny price discrepancies. These discrepancies often arise due to differences in liquidity, trading volume, or exchange fees across various platforms.</p>
        <p>For example, if Bitcoin (BTC) is trading at $30,000 on Exchange A and $30,050 on Exchange B, an arbitrageur could buy BTC on Exchange A and immediately sell it on Exchange B, making a profit of $50 per BTC (minus fees).</p>
        <h3>Key Characteristics:</h3>
        <ul>
          <li><strong>Low Risk (Theoretically):</strong> Arbitrage aims to be market-neutral, meaning profit is made from price differences, not price direction.</li>
          <li><strong>Speed is Crucial:</strong> Price discrepancies are often fleeting, requiring high-speed execution.</li>
          <li><strong>Capital Intensive:</strong> Requires significant capital to make meaningful profits from small percentage differences.</li>
        </ul>
        <p>Our AI-powered system automates this process, scanning multiple exchanges and executing trades in milliseconds to capture these fleeting opportunities.</p>
      `,
    },
    'Types of Arbitrage': {
      title: 'Types of Crypto Arbitrage Strategies',
      content: `
        <p>There are several common types of cryptocurrency arbitrage strategies:</p>
        <h4>1. Spatial Arbitrage (Simple Arbitrage)</h4>
        <p>This is the most straightforward type, involving buying an asset on one exchange where its price is lower and selling it on another exchange where its price is higher. This is what most people think of when they hear "arbitrage."</p>
        <h4>2. Triangular Arbitrage</h4>
        <p>This involves three different cryptocurrencies and exploits price discrepancies between them. For example, trading BTC to ETH, then ETH to USDT, and finally USDT back to BTC, to end up with more BTC than you started with.</p>
        <h4>3. Statistical Arbitrage</h4>
        <p>More complex, this involves using quantitative models to identify statistically significant price relationships between different assets. When these relationships deviate, a trade is executed, expecting the prices to revert to their historical mean.</p>
        <h4>4. Decentralized Exchange (DEX) Arbitrage</h4>
        <p>Exploiting price differences between centralized exchanges (CEXs) and decentralized exchanges (DEXs), or between different DEXs. This often involves higher gas fees but can offer unique opportunities.</p>
        <p>ArbSecure's AI system is designed to identify and execute various forms of these strategies, optimizing for speed and profitability.</p>
      `,
    },
    'Risk Management': {
      title: 'Risk Management in Arbitrage Trading',
      content: `
        <p>While arbitrage is often considered low-risk, it's not risk-free. Effective risk management is crucial:</p>
        <h4>1. Slippage Risk</h4>
        <p>The price might change between the time an order is placed and when it's executed, especially on illiquid markets or during high volatility. Our system uses smart order routing and liquidity analysis to minimize slippage.</p>
        <h4>2. Latency Risk</h4>
        <p>Delays in data feeds or trade execution can cause an arbitrage opportunity to vanish. We utilize high-speed infrastructure and co-location services to reduce latency.</p>
        <h4>3. Withdrawal/Deposit Delays</h4>
        <p>Funds might get stuck on an exchange, preventing rapid movement to exploit new opportunities. We maintain pre-funded accounts across multiple exchanges to mitigate this.</p>
        <h4>4. Exchange-Specific Risks</h4>
        <p>Exchange downtime, security breaches, or regulatory changes can impact funds. We diversify across reputable exchanges and monitor their health.</p>
        <h4>5. Smart Contract Risk (for DEX arbitrage)</h4>
        <p>Vulnerabilities in smart contracts can lead to loss of funds. We only interact with audited and well-established smart contracts.</p>
        <p>Our platform incorporates real-time risk monitoring, automated stop-loss mechanisms, and dynamic position sizing to protect your capital.</p>
      `,
    },
    'AI in Trading': {
      title: 'The Role of AI in Algorithmic Trading',
      content: `
        <p>Artificial Intelligence (AI) and Machine Learning (ML) are transforming algorithmic trading, especially in high-frequency strategies like arbitrage.</p>
        <h3>How AI Enhances Arbitrage:</h3>
        <ul>
          <li><strong>Pattern Recognition:</strong> AI algorithms can identify complex, subtle price patterns and correlations across vast datasets that human traders might miss.</li>
          <li><strong>Predictive Analytics:</strong> While arbitrage is reactive, AI can predict short-term market movements or liquidity shifts, allowing for more proactive positioning.</li>
          <li><strong>Optimized Execution:</strong> AI can determine the optimal time and size for trades across multiple venues to minimize slippage and maximize profit.</li>
          <li><strong>Risk Management:</strong> AI models can detect anomalous trading behavior or sudden market shifts that indicate increased risk, triggering automated risk mitigation.</li>
          <li><strong>Adaptability:</strong> AI systems can continuously learn and adapt to changing market conditions, improving their strategies over time without manual intervention.</li>
        </ul>
        <p>ArbSecure's proprietary AI engine is at the core of our operations, enabling us to consistently identify and capitalize on arbitrage opportunities with unparalleled efficiency and precision.</p>
      `,
    },
  };

  // Static content for the new modals
  const proofOfReservesContent = `
    <h2>ArbSecure Proof of Reserves</h2>
    <h3>Last Audit: July 1, 2025</h3>
    <p>ArbSecure maintains full reserves of all user assets, backed by independent third-party audits. Our Proof of Reserves mechanism ensures that for every user deposit, there is an equivalent amount of assets held in our cold and hot wallets.</p>
    <p><strong>Total User Liabilities:</strong> $500,000,000 USD (as of July 1, 2025)</p>
    <p><strong>Total Assets Held:</strong> $505,000,000 USD (as of July 1, 2025)</p>
    <p class="text-green-400 font-bold">Reserve Ratio: 101%</p>
    <p>This audit confirms that ArbSecure holds more than enough assets to cover all user balances. Regular audits are conducted monthly to ensure ongoing transparency and security.</p>
    <p>For a detailed breakdown and cryptographic proof, please refer to our full audit report [link to  PDF].</p>
  `;

  const smartContractAuditContent = `
    <h2>ArbSecure Smart Contract Audit Report</h2>
    <h3>Audit Conducted by: CertiK ()</h3>
    <h3>Audit Date: June 15, 2025</h3>
    <p>Our core arbitrage smart contracts have undergone rigorous security audits by leading blockchain security firms. These audits review our code for vulnerabilities, exploits, and adherence to best practices in smart contract development.</p>
    <p><strong>Key Findings:</strong></p>
    <ul>
      <li>No critical or high-severity vulnerabilities found.</li>
      <li>Minor informational findings addressed in v1.0.1.</li>
      <li>Gas optimization recommendations implemented.</li>
    </ul>
    <p>The audit confirms the robustness and security of our smart contract architecture, which is fundamental to the automated execution of arbitrage strategies.</p>
    <p>The full audit report is available for public review on [ Audit Platform Link].</p>
  `;

  const performanceHistoryContent = `
    <h2>ArbSecure Comprehensive Performance History</h2>
    <h3>Data from: January 2023 - Present</h3>
    <p>This report provides a detailed historical overview of ArbSecure's platform performance, including aggregated data on total profits, trade volumes, and strategy-specific returns.</p>
    <h4>Key Performance Indicators:</h4>
    <ul>
      <li><strong>Cumulative Platform Profit:</strong> Continuously growing since inception.</li>
      <li><strong>Average Monthly ROI:</strong> Consistent positive returns across all market conditions.</li>
      <li><strong>Trade Success Rate:</strong> Consistently above 85% due to AI-driven execution.</li>
      <li><strong>Max Drawdown (Platform Level):</strong> Managed within acceptable risk parameters.</li>
    </ul>
    <p>Our performance data is updated quarterly and is available for download in various formats for in-depth analysis. We believe in full transparency regarding our operational efficiency and profitability.</p>
    <p>For detailed charts and raw data, please visit the dedicated Performance tab or download the full report.</p>
  `;

  const feeStructureContent = `
    <h2>ArbSecure Fee Structure</h2>
    <p>ArbSecure is committed to transparent and competitive pricing. Our fee model is designed to align our success with yours.</p>
    <h4>1. Management Fee:</h4>
    <ul>
      <li><strong>0.15%</strong> per annum on your active investment amount.</li>
      <li>Calculated daily and deducted from your daily earnings.</li>
    </ul>
    <h4>2. Performance Fee:</h4>
    <ul>
      <li><strong>10%</strong> of the gross profits generated by your active strategies.</li>
      <li>Applied only on profitable trades (high-water mark principle applies).</li>
    </ul>
    <h4>3. Withdrawal Fees:</h4>
    <ul>
      <li><strong>Cryptocurrency Withdrawals:</strong> Network fees (gas fees) apply, which vary by blockchain congestion. ArbSecure does not charge an additional fee.</li>
      <li><strong>Fiat Withdrawals:</strong> [e.g., "1% for bank transfers, minimum $5 USD"].</li>
    </ul>
    <h4>4. Deposit Fees:</h4>
    <ul>
      <li><strong>Cryptocurrency Deposits:</strong> Free.</li>
      <li><strong>Fiat Deposits:</strong> [e.g., "Free for bank transfers, 1.5% for credit/debit card"].</li>
    </ul>
    <p>All fees are clearly displayed before you confirm any investment or withdrawal. There are no hidden charges.</p>
  `;


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Toaster /> {/* Add Toaster component here */}
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
               <button
                  onClick={() => setLocation('/')} // Use setLocation from wouter
                  className="flex items-center gap-2 mt-4 text-gray-400 hover:text-white mb-4"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-sm">Back</span>
                </button>
            </div>

            <div className="flex items-center space-x-4">
             <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
               DeFi
              </h1>
            </div>
          </div>

          <nav className="flex space-x-8 py-2 overflow-x-auto">
            {/* Changed 'transactions' to 'my-investments' */}
            {['dashboard', 'strategies', 'performance', 'my-investments', 'security', 'education'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-blue-300 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {/* Display text for 'my-investments' tab */}
                {tab === 'my-investments' ? 'My Investments' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Section */}
        {activeTab === 'dashboard' && (
          <div>
            {/* User Balance Card */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-8 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Your Current Balance</p>
                {isUserLoading ? (
                  <Skeleton className="h-8 w-48 mt-2" />
                ) : userBalance !== null ? (
                  <p className="text-3xl font-bold text-green-400">
                    ${userBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                ) : (
                  <p className="text-3xl font-bold text-red-400">Error Loading Balance</p>
                )}
              </div>
              <FaDollarSign className="text-green-400 text-4xl" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Performance Card */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Platform Performance</h2>
                  <FaChartLine className="text-blue-400" />
                </div>
                <div className="space-y-4">
                  {isLoadingPerformance ? (
                    <>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-6 w-1/2 mb-2" />
                      <Skeleton className="h-6 w-2/3" />
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-gray-400 text-sm">Total Arbitrage</p>
                        <p className="text-xl font-bold">${parseFloat(platformPerformance.totalArbitrage).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Today's Earnings</p>
                        <p className="text-xl font-bold">${parseFloat(platformPerformance.todaysEarnings).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">30-Day ROI</p>
                        <p className="text-xl font-bold text-green-400">+{platformPerformance.thirtyDayROI}%</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Active Strategies */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Active Strategies</h2>
                  <FaSyncAlt className="text-purple-400" />
                </div>
                {isLoadingActiveStrategies ? (
                  <Skeleton className="h-32 w-full" />
                ) : activeUserStrategies.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-block p-4 bg-gray-700/50 rounded-full mb-3">
                      <FaClipboardList className="text-2xl text-gray-500" />
                    </div>
                    <p className="text-gray-500">No active strategies</p>
                    <button
                      onClick={() => handleButtonClick('Explore Strategies')}
                      className="mt-4 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 rounded-lg"
                    >
                      Explore Strategies
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeUserStrategies.map((strategy) => (
                      <div key={strategy.id} className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                        <p className="font-bold">{strategy.strategyName}</p>
                        <p className="text-gray-400 text-sm">Invested: <span className="font-medium text-white">${strategy.investmentAmount.toLocaleString()}</span></p>
                        <p className="text-gray-400 text-sm">Current Value: <span className="font-medium text-green-400">${strategy.currentValue.toLocaleString()}</span></p>
                        <p className="text-gray-400 text-sm">Expected Return: {strategy.expectedReturn}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security Status */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Security Status</h2>
                  <FaShieldAlt className="text-green-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Funds Protection</span>
                    <span className="text-green-400 font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">2FA Authentication</span>
                    <span className="text-gray-500">Not enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cold Storage</span>
                    <span className="text-green-400 font-medium">95%</span>
                  </div>
                  <div className="pt-3">
                    <button
                      onClick={() => handleButtonClick('Enhance Security')}
                      className="w-full text-sm bg-gray-700 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Enhance Security
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-3 rounded-lg">
                  <FaLightbulb className="text-yellow-400 text-xl" />
                </div>
                <h2 className="text-xl font-bold">How Our AI Arbitrage System Works</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  {
                    title: "1. Market Scanning",
                    desc: "Our AI scans 25+ exchanges simultaneously to detect price discrepancies",
                    icon: <FaGlobe className="text-blue-400" />
                  },
                  {
                    title: "2. Opportunity Identification",
                    desc: "Algorithm identifies profitable arbitrage spreads in milliseconds",
                    icon: <FaChartLine className="text-green-400" />
                  },
                  {
                    title: "3. Rapid Execution",
                    desc: "Automated trades execute simultaneously on multiple exchanges",
                    icon: <FaSyncAlt className="text-purple-400" />
                  },
                  {
                    title: "4. Profit Capture",
                    desc: "Profits are secured before markets can adjust to the spread",
                    icon: <FaDollarSign className="text-yellow-400" />
                  }
                ].map((step, index) => (
                  <div key={index} className="bg-gray-700/30 p-5 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl">{step.icon}</div>
                      <h3 className="font-bold">{step.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Arbitrage Products */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Arbitrage Investment Strategies</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Sort by:</span>
                  <select
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-sm"
                    onChange={(e) => handleButtonClick(`Sort by: ${e.target.value}`)}
                  >
                    <option>Highest Return</option>
                    <option>Lowest Risk</option>
                    <option>Shortest Duration</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-3">Strategy</th>
                      <th className="pb-3">Duration</th>
                      <th className="pb-3">Investment Range</th>
                      <th className="pb-3">Daily Return</th>
                      <th className="pb-3">Max Drawdown</th>
                      <th className="pb-3">Coin Types</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategies.map((strategy) => (
                      <tr key={strategy.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-4 font-medium">{strategy.name}</td>
                        <td>{strategy.duration}</td>
                        <td>${strategy.minAmount.toLocaleString()} - ${strategy.maxAmount.toLocaleString()}</td>
                        <td className="text-green-400 font-medium">{strategy.dailyReturn}%</td>
                        <td className="text-red-400">{strategy.maxDrawdown}%</td>
                        <td>
                          {Array.isArray(strategy.coins) ? (
                            <div className="flex flex-wrap gap-1">
                              {strategy.coins.slice(0, 3).map(coin => (
                                <span key={coin} className="bg-gray-700 px-2 py-1 rounded text-xs">{coin}</span>
                              ))}
                              {strategy.coins.length > 3 && (
                                <span className="bg-gray-700 px-2 py-1 rounded text-xs">+{strategy.coins.length - 3}</span>
                              )}
                            </div>
                          ) : (
                            <span className="bg-gray-700 px-2 py-1 rounded text-xs">All coins</span>
                          )}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => handleInvestClick(strategy.id)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-sm hover:opacity-90"
                          >
                            Invest
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Strategies Detail Section */}
        {activeTab === 'strategies' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-3 rounded-lg">
                    <FaChartLine className="text-blue-400 text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Investment Strategy Details</h2>
                    <p className="text-gray-400">Algorithmic arbitrage with risk-managed positions</p>
                  </div>
                </div>

                {/* Strategy Selection Buttons */}
                <div className="mb-6">
                  <h3 className="font-bold mb-3">Select Strategy Period:</h3>
                  <div className="flex flex-wrap gap-3">
                    {localStrategies.map(strategy => (
                      <button
                        key={strategy.id}
                        onClick={() => setSelectedStrategy(strategy.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedStrategy === strategy.id
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {strategy.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Avg. Daily Return", value: `${currentStrategy.dailyReturn}%`, color: "text-green-400" },
                    { label: "Duration", value: currentStrategy.duration, color: "text-white" },
                    { label: "Success Rate", value: "92.4%", color: "text-green-400" }, // Static for now
                    { label: "Max Drawdown", value: `${currentStrategy.maxDrawdown}%`, color: "text-red-400" }
                  ].map((metric, index) => (
                    <div key={index} className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                      <p className="text-gray-400 text-sm">{metric.label}</p>
                      <p className={`text-lg font-bold ${metric.color}`}>{metric.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-6">
                  <h3 className="font-bold mb-3">Strategy Overview</h3>
                  <p className="text-gray-300 mb-4">
                    Our AI-powered arbitrage system leverages price discrepancies across multiple exchanges to generate consistent returns.
                    This strategy focuses on triangular arbitrage opportunities between stablecoins and major cryptocurrencies.
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-gray-300">
                    <li>24/7 automated trading with real-time monitoring</li>
                    <li>Dynamic position sizing based on market liquidity</li>
                    <li>Real-time risk management with automatic stop-loss</li>
                    <li>Multi-exchange execution with low-latency connections</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold mb-3">Historical Performance: {currentStrategy.name}</h3>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <div className="flex justify-between mb-4">
                      <div>
                        <p className="text-gray-400">Avg. Annual Return</p>
                        <p className="text-xl text-green-400">+42.8%</p> {/* Static for now */}
                      </div>
                      <div>
                        <p className="text-gray-400">Best Month</p>
                        <p className="text-xl text-green-400">+8.2%</p> {/* Static for now */}
                      </div>
                      <div>
                        <p className="text-xl text-red-400">-1.5%</p> {/* Static for now */}
                      </div>
                    </div>
                    {/* Dynamic Performance Chart */}
                    <div className="bg-gray-800 h-48 rounded-lg p-3 flex items-end justify-around relative">
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-2 text-xs text-gray-400">
                        <span>+{(currentStrategy.dailyReturn + 0.5).toFixed(1)}%</span>
                        <span>{currentStrategy.dailyReturn.toFixed(1)}%</span>
                        <span>+{(currentStrategy.dailyReturn - 0.5).toFixed(1)}%</span>
                      </div>
                      {/* Chart bars */}
                      {Array.from({ length: parseDurationToDays(currentStrategy.duration) }).map((_, i) => {
                        // Simulate daily return with slight fluctuation
                        const dailyReturn = currentStrategy.dailyReturn + (Math.random() * 0.2 - 0.1); // +/- 0.1%
                        const barHeight = (dailyReturn / (currentStrategy.dailyReturn + 0.5)) * 100; // Scale height
                        const date = new Date();
                        date.setDate(date.getDate() - (parseDurationToDays(currentStrategy.duration) - 1 - i)); // Go back in time

                        return (
                          <div key={i} className="flex flex-col items-center justify-end h-full">
                            <div
                              className="w-4 bg-green-500 rounded-t-sm transition-all duration-300 ease-out"
                              style={{ height: `${Math.max(10, barHeight)}%` }} // Min height for visibility
                            ></div>
                            <span className="text-xs text-gray-400 mt-1">{date.getDate()}/{date.getMonth() + 1}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-3">Daily performance over the strategy duration. </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Investment Calculator */}
            <div>
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-3 rounded-lg">
                    <FaCalculator className="text-green-400 text-xl" />
                  </div>
                  <h2 className="text-xl font-bold">ROI Calculator</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="investment-amount-range" className="block text-gray-400 mb-2">Investment Amount (USD)</label>
                    <div className="flex items-center gap-3">
                      <input
                        id="investment-amount-range"
                        type="range"
                        min={currentStrategy.minAmount}
                        // Dynamically set max based on currentStrategy.maxAmount and userBalance
                        max={userBalance !== null ? Math.min(currentStrategy.maxAmount, userBalance) : currentStrategy.maxAmount}
                        value={investmentAmount}
                        onChange={handleInvestmentAmountChange}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:w-4 [&::-moz-slider-thumb]:h-4 [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:shadow"
                      />
                      <input
                        type="number"
                        min={currentStrategy.minAmount}
                        // Dynamically set max based on currentStrategy.maxAmount and userBalance
                        max={userBalance !== null ? Math.min(currentStrategy.maxAmount, userBalance) : currentStrategy.maxAmount}
                        value={investmentAmount}
                        onChange={handleInvestmentAmountChange}
                        className="bg-gray-700 px-3 py-1.5 rounded-lg min-w-[100px] text-white text-center border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>${currentStrategy.minAmount}</span>
                      {/* Display the effective max amount (min of strategy max and user balance) */}
                      <span>${(userBalance !== null ? Math.min(currentStrategy.maxAmount, userBalance) : currentStrategy.maxAmount).toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-2">Strategy Duration</label>
                    <div className="bg-gray-700 px-4 py-3 rounded-lg">
                      {currentStrategy.duration}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-gray-800 to-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <h3 className="font-bold mb-3">Projected Returns</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Daily Earnings</span>
                        <span className="font-bold">${projected.daily}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Strategy Earnings</span>
                        <span className="font-bold text-green-400">${projected.strategyReturn}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-gray-700">
                        <span className="text-gray-400">Total Value at End</span>
                        <span className="font-bold">${projected.total}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartInvesting}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 py-3 rounded-lg font-bold hover:opacity-90"
                  >
                    Start Investing
                  </button>

                  <div className="text-xs text-gray-500">
                    <p className="mb-2">Fees: 0.15% management fee + 10% performance fee</p>
                    <p>Withdrawals available after strategy completion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Section (New Tab Content) */}
        {activeTab === 'performance' && (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Platform Performance Overview</h2>
            <p className="text-gray-400 mb-6">Track the overall performance of ArbSecure's arbitrage operations.</p>
            
            {isLoadingReport ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">All-Time Profit</p>
                      <p className="text-xl font-bold text-green-400">${platformPerformanceReport.allTimeProfit.toLocaleString()}</p>
                    </div>
                    <FaDollarSign className="text-green-400 text-3xl" />
                  </div>
                  <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Trades Executed</p>
                      <p className="text-xl font-bold">{platformPerformanceReport.totalTrades.toLocaleString()}</p>
                    </div>
                    <FaExchangeAlt className="text-blue-400 text-3xl" />
                  </div>
                  <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Overall Win Rate</p>
                      <p className="text-xl font-bold text-green-400">{platformPerformanceReport.winRate.toFixed(1)}%</p>
                    </div>
                    <FaTrophy className="text-yellow-400 text-3xl" />
                  </div>
                  <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Avg. Profit Per Trade</p>
                      <p className="text-xl font-bold text-green-400">${platformPerformanceReport.avgProfitPerTrade.toFixed(2)}</p>
                    </div>
                    <FaChartLine className="text-purple-400 text-3xl" />
                  </div>
                  <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Avg. Trade Duration</p>
                      <p className="text-xl font-bold">{platformPerformanceReport.avgTradeDuration}</p>
                    </div>
                    <FaHistory className="text-gray-400 text-3xl" />
                  </div>
                  <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Users</p>
                      <p className="text-xl font-bold">{platformPerformanceReport.totalUsers.toLocaleString()}</p>
                    </div>
                    <FaUserTie className="text-cyan-400 text-3xl" />
                  </div>
                </div>

                {/* Monthly ROI Chart (Placeholder) */}
                <div className="bg-gray-900 p-6 rounded-lg mb-8 border border-gray-700">
                  <h3 className="text-xl font-bold mb-4">Monthly Return on Investment (ROI)</h3>
                  <div className="h-64 flex items-end justify-around bg-gray-800 rounded-lg p-4">
                    {platformPerformanceReport.monthlyROI.map((data, index) => (
                      <div key={index} className="flex flex-col items-center" style={{ height: `${data.roi * 10}%` }}>
                        <span className="text-xs text-green-400 mb-1">{data.roi}%</span>
                        <div className="w-8 bg-blue-600 rounded-t-md" style={{ height: `${data.roi * 10}px`, minHeight: '10px' }}></div>
                        <span className="text-sm text-gray-400 mt-2">{data.month}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-3">Visual representation of monthly ROI.</p>
                </div>

                {/* Strategy Specific Performance */}
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                  <h3 className="text-xl font-bold mb-4">Strategy Performance Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Strategy Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Total Profit
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Trades Executed
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Win Rate
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Avg. Daily ROI
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {platformPerformanceReport.strategyPerformance.map((strategy, index) => (
                          <tr key={index} className="hover:bg-gray-700/50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{strategy.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">${strategy.totalProfit.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{strategy.tradesExecuted.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">{strategy.winRate}%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">{strategy.avgROI}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* My Investments Section (New Tab Content) */}
        {activeTab === 'my-investments' && (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">My Arbitrage Investments</h2>
            <p className="text-gray-400 mb-6">Track your active strategies and review your past trades.</p>

            {/* Active Investments Sub-section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaSyncAlt className="text-purple-400" /> Active Strategies
              </h3>
              {isLoadingActiveStrategies || isUserLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : activeUserStrategies.length === 0 ? (
                <div className="text-center py-8 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="inline-block p-4 bg-gray-700/50 rounded-full mb-3">
                    <FaClipboardList className="text-2xl text-gray-500" />
                  </div>
                  <p className="text-gray-500">You have no active arbitrage strategies.</p>
                  <button
                    onClick={() => setActiveTab('strategies')}
                    className="mt-4 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 rounded-lg"
                  >
                    Explore Strategies
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeUserStrategies.map((strategy) => (
                    <div key={strategy.id} className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-lg">{strategy.strategyName}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          strategy.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {strategy.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-gray-400">
                        <div>Invested: <span className="font-medium text-white">${strategy.investmentAmount.toLocaleString()}</span></div>
                        <div>Current Value: <span className="font-medium text-green-400">${strategy.currentValue.toLocaleString()}</span></div>
                        <div>Daily Return: <span className="font-medium text-white">{strategy.expectedReturn}</span></div>
                        <div>
                          Days Remaining: <span className="font-medium text-white">
                            {calculateDaysRemaining(strategy.startDate, strategy.durationDays)}
                          </span>
                        </div>
                        {/* Placeholder for daily profit if applicable to active investments beyond 'expectedReturn' */}
                        {/* <div>Daily Profit: <span className="font-medium text-green-400">$XX.XX</span></div> */}
                      </div>
                      <div className="mt-4 text-right">
                        <button
                          onClick={() => toast(`Withdrawal for ${strategy.strategyName} (ID: ${strategy.id})`)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                        >
                          Withdraw/Close
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trade History Sub-section */}
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaHistory className="text-blue-400" /> Trade History
              </h3>
              {isLoadingTransactions || isUserLoading ? ( // Also consider user loading state
                <Skeleton className="h-64 w-full" />
              ) : userTrades.length === 0 ? (
                <div className="text-center py-8 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="inline-block p-4 bg-gray-700/50 rounded-full mb-3">
                    <FaClipboardList className="text-2xl text-gray-500" />
                  </div>
                  <p className="text-gray-500">No past trades found for your account.</p>
                  <button
                    onClick={() => setActiveTab('strategies')}
                    className="mt-4 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 rounded-lg"
                  >
                    Start a New Investment
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Crypto
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Entry Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Final Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Gain/Loss (%)
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Outcome
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {userTrades.map((trade) => (
                        <tr key={trade.id} className="hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(trade.timestamp).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {trade.crypto_symbol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              trade.type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {trade.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            ${trade.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            ${trade.initialPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {trade.finalAmount !== null ? `$${trade.finalAmount.toFixed(2)}` : 'N/A'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            trade.gainPercentage !== null && trade.gainPercentage >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {trade.gainPercentage !== null ? `${trade.gainPercentage.toFixed(2)}%` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              trade.outcome === 'win' ? 'bg-green-100 text-green-800' :
                              trade.outcome === 'loss' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {trade.outcome ? trade.outcome.toUpperCase() : 'PENDING'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              trade.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {trade.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Security Section (New Tab Content) */}
        {activeTab === 'security' && (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Security & Compliance </h2>
            <p className="text-gray-400 mb-6">Your assets are protected with industry-leading security measures. These features are  for demonstration purposes.</p>
            <div className="space-y-6">
              <div className="bg-gray-700/30 p-5 rounded-lg border border-gray-600">
                <h3 className="font-bold text-lg mb-2">Fund Protection</h3>
                <ul className="list-disc pl-5 text-gray-400 space-y-1">
                  <li>Majority of crypto assets held in **cold storage** (offline wallets).</li>
                  <li>Multi-signature (multi-sig) technology for withdrawals.</li>
                  <li>Insurance coverage up to $100 Million USD against cyber-attacks.</li>
                </ul>
              </div>
              <div className="bg-gray-700/30 p-5 rounded-lg border border-gray-600">
                <h3 className="font-bold text-lg mb-2">Account Security</h3>
                <ul className="list-disc pl-5 text-gray-400 space-y-1">
                  <li className="flex justify-between items-center">
                    <span>**Two-Factor Authentication (2FA)** Status:</span>
                    <span className={`font-medium ${is2FAEnabled ? 'text-green-400' : 'text-red-400'}`}>
                      {is2FAEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </li>
                  <li>Email/SMS notifications for all critical account activities.</li>
                  <li>IP Whitelisting available for enhanced login security.</li>
                </ul>
                <div className="mt-4 text-center">
                  <button
                    onClick={() => handleButtonClick('Toggle 2FA')}
                    className={`mt-2 text-sm font-bold py-2 px-4 rounded-lg transition-colors ${
                      is2FAEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {is2FAEnabled ? "Disable 2FA " : "Enable 2FA "}
                  </button>
                </div>
              </div>
              <div className="bg-gray-700/30 p-5 rounded-lg border border-gray-600">
                <h3 className="font-bold text-lg mb-2">Regulatory Compliance</h3>
                <ul className="list-disc pl-5 text-gray-400 space-y-1">
                  <li>Registered as a Money Services Business (MSB) with FinCEN.</li>
                  <li>Adherence to AML (Anti-Money Laundering) and KYC (Know Your Customer) policies.</li>
                  <li className="flex justify-between items-center">
                    <span>Regular external audits for financial and security practices.</span>
                    {securityAuditStatus === 'running' ? (
                      <span className="text-yellow-400 font-medium">Running Audit...</span>
                    ) : securityAuditStatus === 'complete' ? (
                      <span className="text-green-400 font-medium">Audit Complete: No Issues</span>
                    ) : (
                      <button
                        onClick={() => handleButtonClick('Run Security Audit')}
                        className="text-sm bg-gray-700 py-1.5 px-3 rounded-lg text-white hover:bg-gray-600 transition-colors"
                      >
                        Run Audit
                      </button>
                    )}
                  </li>
                  {/* Consolidated button for compliance documents */}
                  <li>
                    <div className="flex justify-between items-center mt-2">
                      <span>Compliance Document:</span>
                      <button
                        onClick={() => handleButtonClick('View Compliance Documents')}
                        className="mt-2 text-sm font-bold py-2 px-4 rounded-lg transition-colors text-white bg-blue-600 hover:bg-blue-700"
                      >
                        View Compliance Documents
                      </button>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Education Section (New Tab Content) */}
        {activeTab === 'education' && (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Learn About Crypto Arbitrage</h2>
            <p className="text-gray-400 mb-6">Expand your knowledge with our educational resources on arbitrage trading.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700/30 p-5 rounded-lg border border-gray-600">
                <h3 className="font-bold text-lg mb-2">What is Arbitrage?</h3>
                <p className="text-gray-400 mb-3">
                  Arbitrage is the simultaneous purchase and sale of an asset in different markets to profit from a difference in the asset's price.
                </p>
                <button
                  onClick={() => handleButtonClick('Read Article: What is Arbitrage?')}
                  className="text-blue-400 hover:underline text-sm"
                >
                  Read More &rarr;
                </button>
              </div>
              <div className="bg-gray-700/30 p-5 rounded-lg border border-gray-600">
                <h3 className="font-bold text-lg mb-2">Types of Crypto Arbitrage</h3>
                <p className="text-gray-400 mb-3">
                  Explore common arbitrage strategies like spatial, triangular, and statistical arbitrage in the crypto market.
                </p>
                <button
                  onClick={() => handleButtonClick('Read Article: Types of Arbitrage')}
                  className="text-blue-400 hover:underline text-sm"
                >
                  Read More &rarr;
                </button>
              </div>
              <div className="bg-gray-700/30 p-5 rounded-lg border border-gray-600">
                <h3 className="font-bold text-lg mb-2">Risk Management in Arbitrage</h3>
                <p className="text-gray-400 mb-3">
                  Understand how to mitigate risks associated with arbitrage, including slippage, latency, and exchange-specific risks.
                </p>
                <button
                  onClick={() => handleButtonClick('Read Article: Risk Management')}
                  className="text-blue-400 hover:underline text-sm"
                >
                  Read More &rarr;
                </button>
              </div>
              <div className="bg-gray-700/30 p-5 rounded-lg border border-gray-600">
                <h3 className="font-bold text-lg mb-2">AI in Algorithmic Trading</h3>
                <p className="text-gray-400 mb-3">
                  Discover how artificial intelligence and machine learning enhance arbitrage strategy effectiveness.
                </p>
                <button
                  onClick={() => handleButtonClick('Read Article: AI in Trading')}
                  className="text-blue-400 hover:underline text-sm"
                >
                  Read More &rarr;
                </button>
              </div>
            </div>
            <div className="pt-6 text-center">
                <button
                    onClick={() => handleButtonClick('Help Center')}
                    className="mt-4 text-sm bg-gray-700 py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                    Visit Our Help Center
                </button>
            </div>
          </div>
        )}

        {/* Trust & Transparency Section */}
        {/* This section now appears after all tabs, or can be conditionally rendered based on activeTab if preferred */}
        {activeTab !== 'performance' && activeTab !== 'security' && activeTab !== 'education' && activeTab !== 'my-investments' && (
          <div className="mt-16 pt-8 border-t border-gray-700">
            <h2 className="text-2xl font-bold text-center mb-12">Why Trust ArbSecure?</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <FaLock className="text-blue-400 text-3xl" />,
                  title: "Bank-Level Security",
                  content: "95% of assets stored in cold storage with multi-sig protection and $100M insurance coverage"
                },
                {
                  icon: <FaMedal className="text-yellow-400 text-3xl" />,
                  title: "Regulated & Compliant",
                  content: "Registered with FinCEN as a Money Services Business (MSB) and fully compliant with global regulations"
                },
                {
                  icon: <FaUserTie className="text-purple-400 text-3xl" />,
                  title: "Experienced Team",
                  content: "Founded by former Wall Street quant traders with 50+ years combined crypto experience"
                }
              ].map((item, index) => (
                <div key={index} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 text-center">
                  <div className="inline-block p-4 rounded-full bg-gray-700/30 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.content}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-8 border border-gray-700">
              <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-xl font-bold mb-3">Transparency is Our Priority</h3>
                <p className="text-gray-300 mb-6">
                  We provide monthly proof-of-reserves audits conducted by third-party firms.
                  Our smart contracts are publicly verifiable on the blockchain, and all trading activity is recorded immutably.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  {['Proof of Reserves', 'Smart Contract Audit', 'Performance History', 'Fee Structure'].map((item) => (
                    <button
                      key={item}
                      onClick={() => handleButtonClick(item)}
                      className="px-4 py-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Compliance Document Modal */}
      {showComplianceDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              ArbSecure Compliance Document
            </h2>
            <div className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: complianceDocumentContent }} />
            <div className="text-center mt-6">
              <button
                onClick={() => setShowComplianceDocument(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Article Viewer Modal */}
      {showArticleViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              {currentArticleTitle}
            </h2>
            <div className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: currentArticleContent }} />
            <div className="text-center mt-6">
              <button
                onClick={() => setShowArticleViewer(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Proof of Reserves Modal */}
      {showProofOfReservesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Proof of Reserves
            </h2>
            <div className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: proofOfReservesContent }} />
            <div className="text-center mt-6">
              <button
                onClick={() => setShowProofOfReservesModal(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Smart Contract Audit Modal */}
      {showSmartContractAuditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Smart Contract Audit
            </h2>
            <div className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: smartContractAuditContent }} />
            <div className="text-center mt-6">
              <button
                onClick={() => setShowSmartContractAuditModal(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Performance History Modal */}
      {showPerformanceHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Performance History
            </h2>
            <div className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: performanceHistoryContent }} />
            <div className="text-center mt-6">
              <button
                onClick={() => setShowPerformanceHistoryModal(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Fee Structure Modal */}
      {showFeeStructureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <h2 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Fee Structure
            </h2>
            <div className="text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: feeStructureContent }} />
            <div className="text-center mt-6">
              <button
                onClick={() => setShowFeeStructureModal(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">ArbSecure</h3>
            <p className="text-gray-400">
              Advanced crypto arbitrage platform using AI to identify and execute profitable trades across exchanges.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleButtonClick('Terms of Service'); }} className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleButtonClick('Privacy Policy'); }} className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleButtonClick('Risk Disclosure'); }} className="hover:text-white">Risk Disclosure</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleButtonClick('Regulatory Info'); }} className="hover:text-white">Regulatory Info</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleButtonClick('Help Center'); }} className="hover:text-white">Help Center</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleButtonClick('Contact Us'); }} className="hover:text-white">Contact Us</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleButtonClick('System Status'); }} className="hover:text-white">System Status</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); handleButtonClick('Community'); }} className="hover:text-white">Community</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-500 text-sm">
          <p>© 2025 ArbSecure. All rights reserved.</p>
          <p className="mt-2">Cryptocurrency investments are volatile and high risk. Only invest what you can afford to lose.</p>
          <p className="mt-2">Past performance is not indicative of future results.</p>
        </div>
      </footer>
    </div>
  );
};

export default CryptoArbitragePlatform;
