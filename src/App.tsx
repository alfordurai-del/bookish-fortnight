import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MarketPage from "@/pages/market";
import CoinDetailPage from "@/pages/coin-detail";
import KycPage from "@/pages/kyc";
import NotFound from "@/pages/not-found";
import CryptoWalletApp from "./pages/account";
import CryptoArbitragePlatform from "./pages/Defi";
import SettingsPage from "./pages/Setings";
import Chatbot from "./pages/ChatBot";
import TransactionsPage from "./pages/Transactions";
import LoginPage from "@/pages/login";
import AdminLoginPage from "./pages/admin";
import AdminDashboard from "./pages/adminDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MarketPage} />
      <Route path="/market" component={MarketPage} />
      <Route path="/coin/:id" component={CoinDetailPage} />
      <Route path="/kyc" component={KycPage} />
      <Route path="/account" component={CryptoWalletApp}/>
      <Route path="/defi" component={CryptoArbitragePlatform} />
      <Route path="/support" component={Chatbot} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/admin" component={AdminLoginPage} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/:rest*" component={() => <div>Page Not Found</div>} />
      {/* Catch-all route for 404 */}
      <Route path="/404" component={NotFound} />
      {/* Fallback route for any unmatched paths */}
      <Route path="/:path" component={NotFound} />      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen crypto-dark text-slate-50">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
