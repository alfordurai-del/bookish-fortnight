import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  User, Shield, ShieldCheck, Headphones, Settings, DollarSign, X,
  Home, BarChart2, Wallet, CreditCard, LogOut, HelpCircle,
  ArrowRight, ArrowLeft, Moon, Sun, Gift, LogIn
} from "lucide-react";
import { useUser } from "@/context/UserContext";

interface SideNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideNavigation({ isOpen, onClose }: SideNavigationProps) {
  const [location, setLocation] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activePath, setActivePath] = useState(location);
  const { user, logout } = useUser();
  console.log("SideNavigation: User context:", user); // Debugging log to check user context

  const logoutNow = () => {
    localStorage.clear();
    setLocation("/login");
    window.location.reload();
  };

  useEffect(() => {
    setActivePath(location);
  }, [location]);

  const handleNavigation = (path: string) => {
    setLocation(path);
    onClose();
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Wallet, label: "Wallet", path: "/account" },
    { icon: DollarSign, label: "DeFi", path: "/defi" },
    { icon: BarChart2, label: "Market", path: "/market" },
    { icon: Shield, label: "KYC Verification", path: "/kyc" },
    { icon: CreditCard, label: "Transactions", path: "/transactions" },
    { icon: Headphones, label: "Customer care", path: "/support" },
    ...(!user ? [{ icon: LogIn, label: "Login", path: "/login" }] : []),
  ];

  const bottomItems = [
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: isDarkMode ? Sun : Moon, label: "Theme", action: () => setIsDarkMode(!isDarkMode) },
  ];

  // Determine portfolio value based on user status
  const getPortfolioValue = () => {
    if (!user) {
      return "$0.00"; // Not logged in
    }
    // Use user.status if available, fallback to user.kycStatus
    const status = user.status || user.kycStatus || 'pending';
    if (status === 'verified') {
      return `$${user.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`; // No Demo for verified
    }
    // Show Demo for pending, rejected, or any other status
    return `$${user.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} Demo`;
  };

  // Determine KYC status badge
  const getKycStatusBadge = () => {
    if (!user) {
      return (
        <div className="flex items-center text-red-400 text-sm bg-red-900/30 px-2 py-1 rounded-full">
          <Shield className="h-4 w-4 mr-1" />
          <span>Not Logged In</span>
        </div>
      );
    }
    // Use user.status if available, fallback to user.kycStatus
  const status = (user.status || user.kycStatus || 'pending').toLowerCase();

switch (status) {
  case 'verified':
    return (
      <div className="flex items-center text-green-400 text-sm bg-green-900/30 px-2 py-1 rounded-full">
        <ShieldCheck className="h-4 w-4 mr-1" />
        <span>Verified</span>
      </div>
    );

  case 'pending':
    return (
      <div className="flex items-center text-yellow-400 text-sm bg-yellow-900/30 px-2 py-1 rounded-full">
        <ShieldCheck className="h-4 w-4 mr-1" />
        <span>Pending</span>
      </div>
    );

  case 'rejected':
    return (
      <div className="flex items-center text-red-400 text-sm bg-red-900/30 px-2 py-1 rounded-full">
        <Shield className="h-4 w-4 mr-1" />
        <span>Not Verified</span>
      </div>
    );

  default:
    return (
      <div className="flex items-center text-gray-400 text-sm bg-gray-900/30 px-2 py-1 rounded-full">
        <Shield className="h-4 w-4 mr-1" />
        <span>Unknown</span>
      </div>
    );
}
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Side Navigation */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-b from-gray-900 to-gray-800 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header with User Info */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {user && user.username ? user.username[0] : "U"}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {user && user.username ? user.username : "User Account"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {user && user.uid ? `UID: ${user.uid}` : "Not logged in"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400">Portfolio Value</p>
                  <p className="font-bold text-lg text-white">
                    {getPortfolioValue()}
                  </p>
                </div>
                {/* KYC Status Badge */}
                {getKycStatusBadge()}
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto py-4 px-2">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all ${
                    activePath === item.path
                      ? "bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-white border-l-4 border-blue-500"
                      : "text-gray-300 hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className={`h-5 w-5 mr-3 ${activePath === item.path ? "text-blue-400" : "text-gray-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </nav>

            {/* Divider */}
            <div className="mx-4 my-6 border-t border-gray-700"></div>

            {/* Theme Toggle and Settings */}
            <div className="space-y-1">
              {bottomItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action ? item.action : () => handleNavigation(item.path!)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-gray-300 hover:bg-gray-800/50`}
                >
                  {item.label === "Theme" ? (
                    isDarkMode ? <Sun className="h-5 w-5 mr-3 text-gray-400" /> : <Moon className="h-5 w-5 mr-3 text-gray-400" />
                  ) : (
                    <item.icon className="h-5 w-5 mr-3 text-gray-400" />
                  )}
                  <span>{item.label}</span>
                  {item.label === "Theme" && (
                    <div className="ml-auto relative inline-flex items-center cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsDarkMode(!isDarkMode); }}>
                      <div className={`w-11 h-6 rounded-full transition-colors ${
                        isDarkMode ? 'bg-blue-500' : 'bg-gray-600'
                      }`}>
                        <div className={`absolute top-0.5 left-0.5 bg-white border rounded-full h-5 w-5 transition-transform ${
                          isDarkMode ? 'transform translate-x-5' : ''
                        }`}></div>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            {user ? (
              <button
                onClick={logoutNow}
                className="w-full flex items-center justify-between px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <LogOut className="h-5 w-5 mr-3" />
                  <span>Log Out</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}

            <div className="mt-4 flex justify-center">
              <p className="text-xs text-gray-500">CryptoPlatform v1.2.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}