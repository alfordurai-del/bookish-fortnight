import { useState, useRef, useEffect } from "react";
import { Menu, Bell, Search, X, Star, TrendingUp, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import SideNavigation from "@/components/side-navigation";
import CryptoList from "@/components/crypto-list";

export default function MarketPage() {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const searchRef = useRef(null);

  const toggleWatchlist = (id) => {
    if (watchlist.includes(id)) {
      setWatchlist(watchlist.filter(item => item !== id));
    } else {
      setWatchlist([...watchlist, id]);
    }
  };

  const filterOptions = [
    { id: "all", label: "All Markets" },
    { id: "top", label: "Top Gainers" },
    { id: "trending", label: "Trending" },
    { id: "new", label: "New Listings" },
    { id: "watchlist", label: "Watchlist", icon: <Star size={16} /> }
  ];

  const marketStats = [
    { label: "Market Cap", value: "$2.5T", change: "+1.2%" },
    { label: "24h Volume", value: "$152B", change: "+4.8%" },
    { label: "BTC Dominance", value: "48.3%", change: "-0.7%" },
    { label: "Fear & Greed", value: "72 (Greed)", change: "+3" }
  ];

  // Handle search expansion on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSideNavOpen(true)}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <TrendingUp className="text-white" size={20} />
              </div>
              <h1 className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                CryptoMarket
              </h1>
            </div>
          </div>
          
          {/* Responsive Search Area */}
          <div className="flex items-center gap-4">
            <div 
              ref={searchRef}
              className={`relative transition-all duration-300 ${
                isSearchExpanded ? "w-64" : "w-48"
              } hidden md:block`}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search coins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-gray-700/50 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            {/* Mobile Search Button */}
            <button 
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            >
              <Search className="h-6 w-6" />
            </button>
            
            {/* Expanded Search for Mobile */}
            {isSearchExpanded && (
              <div 
                ref={searchRef}
                className="md:hidden absolute top-16 left-0 right-0 z-50 bg-gray-800 p-4 shadow-lg"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search coins..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 py-3 w-full bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button 
                    onClick={() => setIsSearchExpanded(false)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}
            
            <button className="relative text-gray-300 hover:text-white">
              <Bell className="h-6 w-6" />
              {/* <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3</span> */}
            </button>
          </div>
        </div>
      </div>
      
      <SideNavigation 
        isOpen={isSideNavOpen} 
        onClose={() => setIsSideNavOpen(false)} 
      />
      
      {/* Market Stats Banner */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-center gap-6">
          {marketStats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="text-gray-400 text-sm">{stat.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{stat.value}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  stat.change.startsWith('+') 
                    ? 'bg-green-900/30 text-green-400' 
                    : 'bg-red-900/30 text-red-400'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Cryptocurrency Market</h1>
            <p className="text-gray-400">Track prices, trends, and market movements</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              <Filter size={16} />
              Filters
              {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
        </div>

        {/* Advanced Filters - Conditional */}
        {showAdvancedFilters && (
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Market Cap</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Any</option>
                  <option>Small Cap</option>
                  <option>Mid Cap</option>
                  <option>Large Cap</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Price Change (24h)</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Any</option>
                  <option>Gainers Only</option>
                  <option>Losers Only</option>
                  <option>+10% or more</option>
                  <option>-10% or less</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Volume (24h)</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Any</option>
                  <option>High Volume</option>
                  <option>Low Volume</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Algorithm</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Any</option>
                  <option>Proof of Work</option>
                  <option>Proof of Stake</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" className="border-gray-600 hover:bg-gray-700">
                Reset
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90">
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {filterOptions.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "outline"}
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-lg font-medium flex items-center gap-2 ${
                activeFilter === filter.id 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" 
                  : "bg-gray-800 text-slate-300 border-gray-700 hover:bg-gray-700"
              }`}
            >
              {filter.icon && <span>{filter.icon}</span>}
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Market Table Header */}
        <div className="bg-gray-800/50 rounded-xl mb-3 border border-gray-700">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-gray-400 text-sm font-medium">
            <div className="col-span-5 md:col-span-4">Asset</div>
            <div className="col-span-3 text-right">Price</div>
            <div className="col-span-4 md:col-span-3 text-right">24h Change</div>
            <div className="hidden md:col-span-2 text-right">Market Cap</div>
          </div>
        </div>

        {/* Cryptocurrency List */}
        <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700">
          <CryptoList 
            watchlist={watchlist} 
            toggleWatchlist={toggleWatchlist}
            activeFilter={activeFilter}
            searchQuery={searchQuery}
          />
        </div>

        {/* Market Insights */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-400" />
            Market Insights
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-3 rounded-lg">
                 <svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 256 256"><defs><linearGradient id="logosBitcoin0" x1="49.973%" x2="49.973%" y1="-.024%" y2="99.99%"><stop offset="0%" stop-color="#f9aa4b"/><stop offset="100%" stop-color="#f7931a"/></linearGradient></defs><path fill="url(#logosBitcoin0)" d="M252.171 158.954c-17.102 68.608-86.613 110.314-155.123 93.211c-68.61-17.102-110.316-86.61-93.213-155.119C20.937 28.438 90.347-13.268 158.957 3.835c68.51 17.002 110.317 86.51 93.214 155.119"/><path fill="#fff" d="M188.945 112.05c2.5-17-10.4-26.2-28.2-32.3l5.8-23.1l-14-3.5l-5.6 22.5c-3.7-.9-7.5-1.8-11.3-2.6l5.6-22.6l-14-3.5l-5.7 23q-4.65-1.05-9-2.1v-.1l-19.4-4.8l-3.7 15s10.4 2.4 10.2 2.5c5.7 1.4 6.7 5.2 6.5 8.2l-6.6 26.3c.4.1.9.2 1.5.5c-.5-.1-1-.2-1.5-.4l-9.2 36.8c-.7 1.7-2.5 4.3-6.4 3.3c.1.2-10.2-2.5-10.2-2.5l-7 16.1l18.3 4.6c3.4.9 6.7 1.7 10 2.6l-5.8 23.3l14 3.5l5.8-23.1c3.8 1 7.6 2 11.2 2.9l-5.7 23l14 3.5l5.8-23.3c24 4.5 42 2.7 49.5-19c6.1-17.4-.3-27.5-12.9-34.1c9.3-2.1 16.2-8.2 18-20.6m-32.1 45c-4.3 17.4-33.7 8-43.2 5.6l7.7-30.9c9.5 2.4 40.1 7.1 35.5 25.3m4.4-45.3c-4 15.9-28.4 7.8-36.3 5.8l7-28c7.9 2 33.4 5.7 29.3 22.2"/></svg>
                </div>
                <h3 className="font-bold">Bitcoin Analysis</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Bitcoin is showing strong support at $60K. Bullish momentum building as institutional inflows increase.
              </p>
              <div className="text-xs text-blue-400">Updated 2 hours ago</div>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 24 24"><g fill="none"><path fill="#8ffcf3" d="M12 3v6.651l5.625 2.516z"/><path fill="#cabcf8" d="m12 3l-5.625 9.166L12 9.653z"/><path fill="#cba7f5" d="M12 16.478V21l5.625-7.784z"/><path fill="#74a0f3" d="M12 21v-4.522l-5.625-3.262z"/><path fill="#cba7f5" d="m12 15.43l5.625-3.263L12 9.652z"/><path fill="#74a0f3" d="M6.375 12.167L12 15.43V9.652z"/><path fill="#202699" fill-rule="evenodd" d="m12 15.43l-5.625-3.263L12 3l5.624 9.166zm-5.252-3.528l5.161-8.41v6.114zm-.077.229l5.238-2.327v5.364zm5.418-2.327v5.364l5.234-3.037zm0-.198l5.161 2.296l-5.161-8.41z" clip-rule="evenodd"/><path fill="#202699" fill-rule="evenodd" d="m12 16.406l-5.625-3.195L12 21l5.624-7.79zm-4.995-2.633l4.904 2.79v4.005zm5.084 2.79v4.005l4.905-6.795z" clip-rule="evenodd"/></g></svg>
                </div>
                <h3 className="font-bold">Ethereum Upgrade</h3>
              </div>
              <p className="text-gray-400 mb-4">
                The upcoming Ethereum merge is expected to reduce energy consumption by 99% and may trigger a price surge.
              </p>
              <div className="text-xs text-blue-400">Updated 5 hours ago</div>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 48 48"><g fill="none" stroke="#000" stroke-linejoin="round" stroke-width="4"><rect width="8" height="14" x="6" y="20" fill="#2f88ff"/><rect width="8" height="26" x="20" y="14" fill="#2f88ff"/><path stroke-linecap="round" d="M24 44V40"/><rect width="8" height="9" x="34" y="12" fill="#2f88ff"/><path stroke-linecap="round" d="M10 20V10"/><path stroke-linecap="round" d="M38 34V21"/><path stroke-linecap="round" d="M38 12V4"/></g></svg>
                </div>
                <h3 className="font-bold">Market Sentiment</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Fear & Greed Index at 72 (Greed). Analysts caution about potential short-term correction after recent gains.
              </p>
              <div className="text-xs text-blue-400">Updated 1 hour ago</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
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