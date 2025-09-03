import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { FaBitcoin, FaEthereum, FaDollarSign, FaCoins, FaExchangeAlt, FaArrowUp, FaArrowDown, FaPlus, FaCopy, FaCheck, FaQrcode, FaExternalLinkAlt } from 'react-icons/fa';
import { SiTether, SiDogecoin, SiLitecoin, SiDash, SiBinance } from 'react-icons/si';
import toast, { Toaster } from 'react-hot-toast';

import { useUser } from '../context/UserContext';
import { fetchCryptoToUsdRates } from '../data/mockExchangeRates';

const CryptoWalletApp = () => {
  // --- ALL HOOK CALLS MUST BE AT THE TOP LEVEL ---
  const { user, isLoading: isUserLoading, error: userError, updateUserBalance, refetchUser } = useUser();

  const [activeTab, setActiveTab] = useState('send');
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [transferStatus, setTransferStatus] = useState(null);
  const [withdrawalStatus, setWithdrawalStatus] = useState(null);
  const [transferProgress, setTransferProgress] = useState(0);
  const [withdrawalProgress, setWithdrawalProgress] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [exchange, setExchange] = useState('binance');
  const [withdrawalAmountInput, setWithdrawalAmountInput] = useState('');
  const [withdrawalInputMode, setWithdrawalInputMode] = useState('crypto'); // 'crypto' or 'usd'
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [depositAmountInput, setDepositAmountInput] = useState(''); // NEW: State for deposit amount
  const [, setLocation] = useLocation();

  const [cryptoExchangeRates, setCryptoExchangeRates] = useState({});

  // NEW: States to hold wallet info during processing animations
  const [processingWalletIcon, setProcessingWalletIcon] = useState(null);
  const [processingWalletSymbol, setProcessingWalletSymbol] = useState('');

  // Define initial wallet templates (without balances)
  // Balances will be dynamically calculated
  const walletTemplates = [
    {
      id: 'btc',
      name: 'Bitcoin',
      symbol: 'BTC',
      icon: <FaBitcoin className="text-orange-500" />,
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      depositNote: 'Only send Bitcoin (BTC) to this address'
    },
    {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      icon: <FaEthereum className="text-purple-500" />,
      address: '4v8yY7NkA1PM4QwPfKDid5S2JqhnhX9ZAmtLsTUKDPeV',
      depositNote: 'Only send Ethereum (ETH) to this address'
    },
    {
      id: 'usdt',
      name: 'Tether',
      symbol: 'USDT',
      icon: <SiTether className="text-emerald-500" />,
      address: '0xB153A7F1f837d09fC4B98aa85476c2D825283d41',
      depositNote: 'Only send Tether (USDT) to this address'
    },
    {
      id: 'trx',
      name: 'TRON',
      symbol: 'TRX',
      icon: <FaExchangeAlt className="text-red-500" />,
      address: 'TDKGVvFhhUwgizAcrE8QmhTC1fe4AxKWWe',
      depositNote: 'Only send TRON (TRX) to this address'
    },
    {
      id: 'doge',
      name: 'Dogecoin',
      symbol: 'DOGE',
      icon: <SiDogecoin className="text-yellow-400" />,
      address: 'DLmoXqAq9VRha12gd2XokjMWom2exCHvH3',
      depositNote: 'Only send Dogecoin (DOGE) to this address'
    },
  ];

  // State to hold the wallets with their calculated balances
  const [walletsState, setWallets] = useState([]);

  // Fetch exchange rates on component mount
  useEffect(() => {
    const getRates = async () => {
      try {
        const rates = await fetchCryptoToUsdRates();
        setCryptoExchangeRates(rates);
      } catch (err) {
        console.error("Failed to fetch exchange rates:", err);
      }
    };
    getRates();
  }, []);

  // --- EFFECT TO CALCULATE AND SET WALLET BALANCES ---
  useEffect(() => {
    if (user && user.balance !== undefined && Object.keys(cryptoExchangeRates).length > 0) {
      const usdBalance = user.balance;

      const updatedWallets = walletTemplates.map(template => {
        const rate = cryptoExchangeRates[template.symbol];
        // Calculate the crypto balance by converting the entire USD balance
        const calculatedCryptoBalance = rate ? (usdBalance / rate) : 0;
        return {
          ...template,
          balance: calculatedCryptoBalance
        };
      });
      setWallets(updatedWallets);

      // NEW: If a wallet is already selected, update its reference to the one with the new balance
      // This is crucial to ensure selectedWallet always has the latest balance from walletsState
      if (selectedWallet) {
        const updatedSelectedWallet = updatedWallets.find(w => w.id === selectedWallet.id);
        if (updatedSelectedWallet) {
          setSelectedWallet(updatedSelectedWallet);
        }
      }
    }
  }, [user, cryptoExchangeRates]);

  // Derive USD balance from user context
  const usdBalance = user?.balance ?? 0;

  // This useCallback must also be at the top level
  const calculatedEquivalentAmount = useCallback(() => {
    if (!withdrawalAmountInput || !selectedWallet || !cryptoExchangeRates[selectedWallet.symbol]) {
      return null;
    }
    const amount = parseFloat(withdrawalAmountInput);
    if (isNaN(amount) || amount <= 0) {
      return null;
    }

    const rate = cryptoExchangeRates[selectedWallet.symbol];

    if (withdrawalInputMode === 'usd') {
      return (amount / rate).toFixed(6);
    } else { // 'crypto' mode
      return (amount * rate).toFixed(2);
    }
  }, [withdrawalAmountInput, selectedWallet, cryptoExchangeRates, withdrawalInputMode]);

  const exchanges = [
    { id: 'binance', name: 'Binance', icon: <SiBinance className="text-yellow-400" /> },
    { id: 'coinbase', name: 'Coinbase', icon: <div className="bg-blue-600 rounded p-1"><FaDollarSign className="text-white" /></div> },
    { id: 'kraken', name: 'Kraken', icon: <div className="bg-purple-600 rounded p-1"><FaCoins className="text-white" /></div> },
  ];

  const handleCopyAddress = (address, id) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(id);
    toast.success('Address copied to clipboard!');
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const simulateDeposit = (walletId) => {
    // Ensure selectedWallet is not null before starting processing
    if (!selectedWallet) {
      toast.error("Please select a wallet to deposit to.");
      return;
    }

    // Validate deposit amount
    const inputAmount = parseFloat(depositAmountInput);
    if (!depositAmountInput || isNaN(inputAmount) || inputAmount <= 0) {
      toast.error("Please enter a valid positive deposit amount.");
      return;
    }

    setIsTransferring(true);
    setTransferStatus('processing');
    setTransferProgress(0);
    setProcessingWalletIcon(selectedWallet.icon); // Set icon for processing display
    setProcessingWalletSymbol(selectedWallet.symbol); // Set symbol for processing display
    toast.loading('Processing deposit...');

    const interval = setInterval(() => {
      setTransferProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);

          setTimeout(async () => {
            const depositedAmount = inputAmount; // Use the input amount
            const usdDepositedAmount = depositedAmount * cryptoExchangeRates[selectedWallet.symbol]; // Convert to USD
            // Update client-side wallet balance
            setWallets(prevWallets =>
              prevWallets.map(wallet =>
                wallet.id === walletId
                  ? { ...wallet, balance: wallet.balance + depositedAmount }
                  : wallet
              )
            );
            // Update user balance in USD
            updateUserBalance(usdBalance + usdDepositedAmount);
            setTransferStatus('completed');
            setIsTransferring(false);
            setDepositAmountInput(''); // Clear input field
            // After completion, clear processing states
            setProcessingWalletIcon(null);
            setProcessingWalletSymbol('');

            const walletSymbol = walletsState.find(w => w.id === walletId)?.symbol || 'crypto';
            try {
              const response = await fetch('https://myblog.alwaysdata.net/api/send-deposit-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user?.id,
                  userEmail: user?.email,
                  amount: depositedAmount,
                  symbol: walletSymbol
                }),
              });

              if (response.ok) {
                const data = await response.json();
                console.log("Backend email API success:", data.message);
                toast.success(`Deposit of ${depositedAmount} ${walletSymbol} completed! The team is processing your transaction`);
              } else {
                const errorData = await response.json();
                console.error("Backend email API failed:", errorData.error);
                toast.error(`Deposit completed, but failed to send notification email. Error: ${errorData.error}`);
              }
            } catch (error) {
              console.error("Error calling backend email API:", error);
              toast.error("Deposit completed, but an error occurred while trying to send the notification email.");
            }
          }, 1000);

          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const simulateWithdrawal = async () => {
    // --- START FORM VALIDATION ---
    if (!selectedWallet) {
      toast.error("Please select a cryptocurrency wallet to withdraw from.");
      return;
    }
    if (!withdrawalAmountInput) {
      toast.error("Please enter the amount you wish to withdraw.");
      return;
    }
    if (!withdrawalAddress) {
      toast.error("Please enter the recipient's wallet address.");
      return;
    }
    if (!user || !user.id) {
      toast.error("You must be logged in to initiate a withdrawal.");
      return;
    }

    const inputAmount = parseFloat(withdrawalAmountInput);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      toast.error("Please enter a valid positive amount.");
      return;
    }

    // Basic recipient address length validation (a real app would use more specific regex)
    if (withdrawalAddress.trim().length < 10) {
      toast.error("Please enter a valid recipient address (too short or invalid format).");
      return;
    }

    let cryptoAmountToWithdraw;
    let usdAmountToDeduct;
    const currentWalletDerivedBalance = selectedWallet.balance; // The crypto balance derived from USD

    const rate = cryptoExchangeRates[selectedWallet.symbol];
    if (!rate) {
      toast.error(`Exchange rate for ${selectedWallet.symbol} is not available. Please try again later.`);
      return;
    }

    if (withdrawalInputMode === 'usd') {
      usdAmountToDeduct = inputAmount;
      cryptoAmountToWithdraw = usdAmountToDeduct / rate;

      if (usdAmountToDeduct > usdBalance) {
        toast.error(`Insufficient USD balance. You only have $${usdBalance.toFixed(2)} available.`);
        return;
      }
      // Check if the equivalent crypto amount is more than the derived balance
      if (cryptoAmountToWithdraw > currentWalletDerivedBalance) {
        toast.error(`Insufficient ${selectedWallet.symbol} balance. Your available derived balance is ${currentWalletDerivedBalance.toFixed(6)} ${selectedWallet.symbol}.`);
        return;
      }
    } else { // withdrawalInputMode === 'crypto'
      cryptoAmountToWithdraw = inputAmount;
      usdAmountToDeduct = cryptoAmountToWithdraw * rate;

      if (cryptoAmountToWithdraw > currentWalletDerivedBalance) {
        toast.error(`Insufficient ${selectedWallet.symbol} balance. You only have ${currentWalletDerivedBalance.toFixed(6)} ${selectedWallet.symbol} available.`);
        return;
      }
      // Since crypto balances are derived from USD, any crypto withdrawal implies a USD deduction.
      if (usdAmountToDeduct > usdBalance) {
        toast.error(`Insufficient USD balance to cover the equivalent value of this withdrawal. You only have $${usdBalance.toFixed(2)} available.`);
        return;
      }
    }
    // --- END FORM VALIDATION ---

    setIsWithdrawing(true);
    setWithdrawalStatus('processing');
    setWithdrawalProgress(0);
    setProcessingWalletIcon(selectedWallet.icon); // Set icon for processing display
    setProcessingWalletSymbol(selectedWallet.symbol); // Set symbol for processing display
    toast.loading('Processing withdrawal...');

    const interval = setInterval(() => {
      setWithdrawalProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);

          setTimeout(async () => {
            try {
              // --- Backend Call Simulation ---
              const response = await fetch('https://myblog.alwaysdata.net/api/withdraw-crypto', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                  walletId: selectedWallet.id,
                  amount: cryptoAmountToWithdraw, // Amount of crypto being withdrawn
                  withdrawalAddress: withdrawalAddress,
                  symbol: selectedWallet.symbol,
                  usdDeduction: usdAmountToDeduct // How much USD to deduct from the user's main balance
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
              }

              // --- Client-side State Update After Backend Success ---
              updateUserBalance(usdBalance - usdAmountToDeduct);

              setWithdrawalStatus('completed');
              setIsWithdrawing(false);
              setWithdrawalAmountInput('');
              setWithdrawalAddress('');
              setSelectedWallet(null); // Clear selected wallet after successful withdrawal
              // After completion, clear processing states
              setProcessingWalletIcon(null);
              setProcessingWalletSymbol('');
              toast.success('Withdrawal completed successfully!');
            } catch (error) {
              console.error("Failed to process withdrawal:", error);
              setWithdrawalStatus('failed');
              setIsWithdrawing(false);
              // Ensure processing states are cleared even on failure
              setProcessingWalletIcon(null);
              setProcessingWalletSymbol('');
              toast.error(`Withdrawal failed: ${error.message}`);
            }
          }, 1000); // Simulate network delay

          return 100;
        }
        return prev + 10;
      });
    }, 200); // Progress update interval
  };

  // --- Conditional Renders (MUST COME AFTER ALL HOOKS) ---
  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
        Loading user data...
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-red-400 flex items-center justify-center">
        Error: {userError}
      </div>
    );
  }

  if (!user || !user.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-400 flex items-center justify-center">
        Please log in to access your wallet.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-6 md:p-8">
      <Toaster />
      <div className="max-w-4xl mx-auto">
        {/* Back Arrow */}
        <button
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            CryptoWallet
          </h1>
          <p className="text-gray-400 mt-2">Secure cryptocurrency management</p>
          <div className="mt-4 text-xl font-semibold">
            USD Balance: <span className="text-green-400">${usdBalance.toFixed(2)}</span>
          </div>
        </header>

        {/* Action Tabs */}
        <div className="bg-gray-800 rounded-xl p-1 mb-8 flex">
          <button
            onClick={() => {
              setActiveTab('send');
              setSelectedWallet(null); // Clear selected wallet on tab change
              setIsTransferring(false); // Reset transfer state
              setTransferStatus(null);
              setIsWithdrawing(false); // Reset withdrawal state
              setWithdrawalStatus(null);
              setDepositAmountInput(''); // Clear deposit amount
            }}
            className={`flex-1 py-3 px-4 rounded-lg text-center transition-all ${
              activeTab === 'send'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg'
                : 'hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FaArrowUp className="text-sm" /> Deposit Crypto
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('withdraw');
              setSelectedWallet(null); // Clear selected wallet on tab change
              setIsTransferring(false); // Reset transfer state
              setTransferStatus(null);
              setIsWithdrawing(false); // Reset withdrawal state
              setWithdrawalStatus(null);
              setDepositAmountInput(''); // Clear deposit amount
            }}
            className={`flex-1 py-3 px-4 rounded-lg text-center transition-all ${
              activeTab === 'withdraw'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg'
                : 'hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FaArrowDown className="text-sm" /> Withdraw Crypto
            </div>
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Empty State Guidance */}
          {walletsState.length > 0 && walletsState.every(w => w.balance === 0) && usdBalance === 0 && (
            <div className="p-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-b border-gray-700">
              <div className="flex items-start">
                <div className="bg-blue-500/20 p-3 rounded-full">
                  <FaPlus className="text-blue-400" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold">Your wallets are empty</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Add funds to your wallets to start trading or withdrawing.
                  </p>
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => setActiveTab('send')}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Deposit Crypto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {walletsState.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              Loading wallet data...
            </div>
          )}

          {/* Deposit Crypto Panel */}
          {activeTab === 'send' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FaDollarSign className="text-green-400" /> Deposit Crypto
              </h2>

              {!isTransferring ? (
                <>
                  <div className="bg-gray-700/50 rounded-xl p-5 mb-6">
                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-2">Select Currency to Deposit (External Transfer)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {walletTemplates.map(template => (
                          <button
                            key={template.id}
                            onClick={() => setSelectedWallet(template)}
                            className={`flex flex-col items-center p-3 rounded-lg ${
                              selectedWallet?.id === template.id
                                ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500'
                                : 'bg-gray-600 hover:bg-gray-500'
                            }`}
                          >
                            <div className="text-2xl mb-1">{template.icon}</div>
                            <span className="text-sm">{template.symbol}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {selectedWallet && (
                    <div className="bg-gray-700/50 rounded-xl p-5 border border-gray-600">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-3xl">{selectedWallet.icon}</div>
                        <div>
                          <h3 className="font-bold text-lg">{selectedWallet.name} ({selectedWallet.symbol})</h3>
                          <p className="text-gray-400 text-sm">Your Deposit Address</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-1">Amount to Deposit</label>
                        <div className="flex bg-gray-800 border border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                          <input
                            type="number"
                            placeholder="0.00"
                            value={depositAmountInput}
                            onChange={(e) => setDepositAmountInput(e.target.value)}
                            className="flex-1 bg-transparent px-4 py-3 focus:outline-none"
                          />
                          <div className="flex items-center p-2 border-l border-gray-600">
                            <span className="px-3 py-1 rounded-md text-sm font-medium bg-blue-500 text-white">
                              {selectedWallet.symbol}
                            </span>
                          </div>
                        </div>
                        {depositAmountInput && cryptoExchangeRates[selectedWallet.symbol] && (
                          <p className="text-sm text-gray-400 mt-2">
                            Equivalent to ~ ${(parseFloat(depositAmountInput) * cryptoExchangeRates[selectedWallet.symbol]).toFixed(2)} USD
                          </p>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm text-gray-400">Your {selectedWallet.name} Address</label>
                          <button
                            onClick={() => handleCopyAddress(selectedWallet.address, selectedWallet.id)}
                            className="text-xs flex items-center gap-1 bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
                          >
                            {copiedAddress === selectedWallet.id ? (
                              <>
                                <FaCheck className="text-green-400" /> Copied!
                              </>
                            ) : (
                              <>
                                <FaCopy /> Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                          <div className="font-mono text-sm truncate">{selectedWallet.address}</div>
                          <button className="text-gray-400 hover:text-white">
                            <FaQrcode />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{selectedWallet.depositNote}</p>
                      </div>

                      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 mb-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <FaExternalLinkAlt className="text-blue-400" />
                          How to transfer from {exchanges.find(e => e.id === exchange)?.name}
                        </h4>
                        <ol className="text-sm text-gray-300 list-decimal list-inside space-y-1">
                          <li>Log in to your {exchanges.find(e => e.id === exchange)?.name} account</li>
                          <li>Navigate to the withdrawal section</li>
                          <li>Select {selectedWallet.symbol} as the cryptocurrency</li>
                          <li>Paste the address above as the recipient address</li>
                          <li>Enter the amount to transfer</li>
                          <li>Complete the transfer on the exchange</li>
                          <li>Click "Complete Deposit" below once done</li>
                        </ol>
                      </div>

                      <button
                        onClick={() => simulateDeposit(selectedWallet.id)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        Complete Deposit
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-4 border-blue-500/30 animate-ping absolute"></div>
                      <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 animate-ping absolute delay-300"></div>
                      <div className="w-24 h-24 rounded-full bg-blue-900/30 border-4 border-blue-500 flex items-center justify-center">
                        {processingWalletIcon}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mb-2">
                    {transferStatus === 'processing'
                      ? 'Processing Deposit...'
                      : 'Deposit Completed!'}
                  </h3>

                  {transferStatus === 'processing' ? (
                    <>
                      <p className="text-gray-400 mb-4">Confirming transaction on blockchain</p>
                      <div className="max-w-md mx-auto bg-gray-700 rounded-full h-2.5 mb-4">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full"
                          style={{ width: `${transferProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500">Estimated time: {transferProgress < 50 ? '30 seconds' : '10 seconds'}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-green-400 mb-4">{parseFloat(depositAmountInput).toFixed(6)} {processingWalletSymbol} has been added to your wallet!</p>
                      <button
                        onClick={() => {
                          setTransferStatus(null);
                          setIsTransferring(false);
                          setTransferProgress(0);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg"
                      >
                        Done
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Withdraw Crypto Panel */}
          {activeTab === 'withdraw' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FaArrowDown className="text-red-400" /> Withdraw Crypto
              </h2>

              {!isWithdrawing ? (
                <>
                  <div className="bg-gray-700/50 rounded-xl p-5 mb-6">
                    <label className="block text-sm text-gray-400 mb-2">Select Wallet to Withdraw From</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {walletsState.map(wallet => (
                        <button
                          key={wallet.id}
                          onClick={() => {
                            if (wallet.balance > 0) {
                              setSelectedWallet(wallet);
                            } else {
                              toast.error(`You have no ${wallet.symbol} to withdraw from this wallet.`);
                            }
                          }}
                          className={`flex flex-col items-center p-3 rounded-lg ${
                            selectedWallet?.id === wallet.id
                              ? 'bg-gradient-to-r from-red-600/30 to-rose-600/30 border border-red-500'
                              : 'bg-gray-600 hover:bg-gray-500'
                          } ${
                            wallet.balance === 0 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="text-2xl mb-1">{wallet.icon}</div>
                          <span className="text-sm">{wallet.symbol}</span>
                          <span className="text-xs text-gray-400 mt-1">Balance: {wallet.balance.toFixed(6)} {wallet.symbol}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedWallet && (
                    <div className="bg-gray-700/50 rounded-xl p-5 border border-gray-600">
                      <h3 className="font-bold text-lg mb-4 text-center">Withdraw {selectedWallet.symbol}</h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Recipient Address</label>
                          <input
                            type="text"
                            placeholder="Enter recipient wallet address"
                            value={withdrawalAddress}
                            onChange={(e) => setWithdrawalAddress(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Amount to Withdraw</label>
                          <div className="flex bg-gray-800 border border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-red-500">
                            <input
                              type="number"
                              placeholder="0.00"
                              value={withdrawalAmountInput}
                              onChange={(e) => setWithdrawalAmountInput(e.target.value)}
                              className="flex-1 bg-transparent px-4 py-3 focus:outline-none"
                            />
                            <div className="flex items-center p-2 border-l border-gray-600">
                              <button
                                onClick={() => setWithdrawalInputMode('crypto')}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  withdrawalInputMode === 'crypto' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                {selectedWallet.symbol}
                              </button>
                              <button
                                onClick={() => setWithdrawalInputMode('usd')}
                                className={`ml-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  withdrawalInputMode === 'usd' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                USD
                              </button>
                            </div>
                          </div>
                          {withdrawalInputMode === 'crypto' && (
                            <p className="text-xs text-gray-500 mt-1">
                              Available: {selectedWallet.balance.toFixed(6)} {selectedWallet.symbol}
                            </p>
                          )}
                          {withdrawalInputMode === 'usd' && (
                            <p className="text-xs text-gray-500 mt-1">
                              Available USD: ${usdBalance.toFixed(2)}
                            </p>
                          )}

                          {/* Display converted amount */}
                          {withdrawalAmountInput && selectedWallet && cryptoExchangeRates[selectedWallet.symbol] && (
                            <p className="text-sm text-gray-400 mt-2">
                              {withdrawalInputMode === 'usd' ? (
                                <>You will withdraw ~ {calculatedEquivalentAmount()} {selectedWallet.symbol}</>
                              ) : (
                                <>Equivalent to ~ ${calculatedEquivalentAmount()} USD</>
                              )}
                            </p>
                          )}
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={simulateWithdrawal}
                            className="w-full bg-gradient-to-r from-red-500 to-rose-600 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
                            disabled={isWithdrawing} // Disable while processing to prevent double-clicks
                          >
                            {isWithdrawing ? 'Processing...' : 'Initiate Withdrawal'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-4 border-red-500/30 animate-ping absolute"></div>
                      <div className="w-24 h-24 rounded-full border-4 border-red-500/20 animate-ping absolute delay-300"></div>
                      <div className="w-24 h-24 rounded-full bg-red-900/30 border-4 border-red-500 flex items-center justify-center">
                        {processingWalletIcon}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mb-2">
                    {withdrawalStatus === 'processing'
                      ? 'Processing Withdrawal...'
                      : withdrawalStatus === 'completed'
                      ? 'Withdrawal Completed!'
                      : 'Withdrawal Failed!'}
                  </h3>

                  {withdrawalStatus === 'processing' ? (
                    <>
                      <p className="text-gray-400 mb-4">Sending transaction to blockchain</p>
                      <div className="max-w-md mx-auto bg-gray-700 rounded-full h-2.5 mb-4">
                        <div
                          className="bg-gradient-to-r from-red-500 to-rose-500 h-2.5 rounded-full"
                          style={{ width: `${withdrawalProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500">Estimated time: {withdrawalProgress < 50 ? '30 seconds' : '10 seconds'}</p>
                    </>
                  ) : withdrawalStatus === 'completed' ? (
                    <>
                      <p className="text-green-400 mb-4">Your {processingWalletSymbol} withdrawal has been processed!</p>
                      <button
                        onClick={() => {
                          setWithdrawalStatus(null);
                          setIsWithdrawing(false);
                          setWithdrawalProgress(0);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg"
                      >
                        Done
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-red-400 mb-4">There was an error processing your withdrawal.</p>
                      <button
                        onClick={() => {
                          setWithdrawalStatus(null);
                          setIsWithdrawing(false);
                          setWithdrawalProgress(0);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg"
                      >
                        Try Again
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoWalletApp;