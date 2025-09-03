// src/data/mockCryptos.ts

import type { Cryptocurrency } from "@shared/schema";

export const mockCryptocurrencies: Cryptocurrency[] = [
  {
    id: "bitcoin", // IMPORTANT: String ID
    name: "Bitcoin",
    symbol: "BTC",
    pair: "BTC/USDT",
    price: "65000.00",
    change24h: "0.55",
    changeAmount24h: "357.50",
    color: "bg-orange-500",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 256 256"><defs><linearGradient id="logosBitcoin0" x1="49.973%" x2="49.973%" y1="-.024%" y2="99.99%"><stop offset="0%" stop-color="#f9aa4b"/><stop offset="100%" stop-color="#f7931a"/></linearGradient></defs><path fill="url(#logosBitcoin0)" d="M252.171 158.954c-17.102 68.608-86.613 110.314-155.123 93.211c-68.61-17.102-110.316-86.61-93.213-155.119C20.937 28.438 90.347-13.268 158.957 3.835c68.51 17.002 110.317 86.51 93.214 155.119"/><path fill="#fff" d="M188.945 112.05c2.5-17-10.4-26.2-28.2-32.3l5.8-23.1l-14-3.5l-5.6 22.5c-3.7-.9-7.5-1.8-11.3-2.6l5.6-22.6l-14-3.5l-5.7 23q-4.65-1.05-9-2.1v-.1l-19.4-4.8l-3.7 15s10.4 2.4 10.2 2.5c5.7 1.4 6.7 5.2 6.5 8.2l-6.6 26.3c.4.1.9.2 1.5.5c-.5-.1-1-.2-1.5-.4l-9.2 36.8c-.7 1.7-2.5 4.3-6.4 3.3c.1.2-10.2-2.5-10.2-2.5l-7 16.1l18.3 4.6c3.4.9 6.7 1.7 10 2.6l-5.8 23.3l14 3.5l5.8-23.1c3.8 1 7.6 2 11.2 2.9l-5.7 23l14 3.5l5.8-23.3c24 4.5 42 2.7 49.5-19c6.1-17.4-.3-27.5-12.9-34.1c9.3-2.1 16.2-8.2 18-20.6m-32.1 45c-4.3 17.4-33.7 8-43.2 5.6l7.7-30.9c9.5 2.4 40.1 7.1 35.5 25.3m4.4-45.3c-4 15.9-28.4 7.8-36.3 5.8l7-28c7.9 2 33.4 5.7 29.3 22.2"/></svg>`, // SVG directly
    marketCap: "1.28T",
    volume24h: "25.0B",
    supply: "19.7M",
    chartData: Array.from({ length: 60 }, (_, i) => ({
      time: i,
      value: 60000 + Math.sin(i * 0.5) * 5000 + Math.cos(i * 0.2) * 2000 + Math.random() * 1000,
    })),
  },
  {
    id: "ethereum", // IMPORTANT: String ID
    name: "Ethereum",
    symbol: "ETH",
    pair: "ETH/USDT",
    price: "3500.00",
    change24h: "-1.20",
    changeAmount24h: "-42.00",
    color: "bg-gray-400",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 24 24"><g fill="none"><path fill="#8ffcf3" d="M12 3v6.651l5.625 2.516z"/><path fill="#cabcf8" d="m12 3l-5.625 9.166L12 9.653z"/><path fill="#cba7f5" d="M12 16.478V21l5.625-7.784z"/><path fill="#74a0f3" d="M12 21v-4.522l-5.625-3.262z"/><path fill="#cba7f5" d="m12 15.43l5.625-3.263L12 9.652z"/><path fill="#74a0f3" d="M6.375 12.167L12 15.43V9.652z"/><path fill="#202699" fill-rule="evenodd" d="m12 15.43l-5.625-3.263L12 3l5.624 9.166zm-5.252-3.528l5.161-8.41v6.114zm-.077.229l5.238-2.327v5.364zm5.418-2.327v5.364l5.234-3.037zm0-.198l5.161 2.296l-5.161-8.41z" clip-rule="evenodd"/><path fill="#202699" fill-rule="evenodd" d="m12 16.406l-5.625-3.195L12 21l5.624-7.79zm-4.995-2.633l4.904 2.79v4.005zm5.084 2.79v4.005l4.905-6.795z" clip-rule="evenodd"/></g></svg>`,
    marketCap: "420B",
    volume24h: "15.0B",
    supply: "120M",
    chartData: Array.from({ length: 60 }, (_, i) => ({
      time: i,
      value: 3000 + Math.sin(i * 0.7) * 400 + Math.cos(i * 0.3) * 150 + Math.random() * 50,
    })),
  },
  {
    id: "solana", // IMPORTANT: String ID
    name: "Solana",
    symbol: "SOL",
    pair: "SOL/USDT",
    price: "150.00",
    change24h: "2.10",
    changeAmount24h: "3.15",
    color: "bg-purple-600",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 48 48"><g fill="none" stroke="#000" stroke-linejoin="round" stroke-width="4"><rect width="8" height="14" x="6" y="20" fill="#2f88ff"/><rect width="8" height="26" x="20" y="14" fill="#2f88ff"/><path stroke-linecap="round" d="M24 44V40"/><rect width="8" height="9" x="34" y="12" fill="#2f88ff"/><path stroke-linecap="round" d="M10 20V10"/><path stroke-linecap="round" d="M38 34V21"/><path stroke-linecap="round" d="M38 12V4"/></g></svg>`, // Placeholder SVG for Solana
    marketCap: "65B",
    volume24h: "3.0B",
    supply: "450M",
    chartData: Array.from({ length: 60 }, (_, i) => ({
      time: i,
      value: 140 + Math.sin(i * 0.4) * 10 + Math.cos(i * 0.8) * 5 + Math.random() * 2,
    })),
  },
  {
    id: "ripple", // IMPORTANT: String ID
    name: "Ripple",
    symbol: "XRP",
    pair: "XRP/USDT",
    price: "0.50",
    change24h: "0.80",
    changeAmount24h: "0.004",
    color: "bg-blue-700",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 256 256"><path fill="#fff" d="M128 0C57.309 0 0 57.309 0 128s57.309 128 128 128s128-57.309 128-128S198.691 0 128 0m-.001 230.134c-56.326 0-102.134-45.807-102.134-102.134S71.673 25.866 127.999 25.866S230.133 71.673 230.133 128S184.326 230.134 128 230.134"/><path fill="#37877e" d="M189.608 128c0 34.053-27.555 61.608-61.608 61.608c-34.053 0-61.608-27.555-61.608-61.608S93.947 66.392 128 66.392S189.608 93.947 189.608 128M128 102.134c-14.286 0-25.866 11.58-25.866 25.866s11.58 25.866 25.866 25.866s25.866-11.58 25.866-25.866s-11.58-25.866-25.866-25.866" opacity=".5"/><path fill="#37877e" d="M128 102.134c-14.286 0-25.866 11.58-25.866 25.866s11.58 25.866 25.866 25.866s25.866-11.58 25.866-25.866s-11.58-25.866-25.866-25.866"/><path fill="#69a3a2" d="M189.608 128c0 34.053-27.555 61.608-61.608 61.608c-34.053 0-61.608-27.555-61.608-61.608S93.947 66.392 128 66.392S189.608 93.947 189.608 128z" opacity=".5"/></svg>`,
    marketCap: "27B",
    volume24h: "1.5B",
    supply: "50B",
    chartData: Array.from({ length: 60 }, (_, i) => ({
      time: i,
      value: 0.48 + Math.sin(i * 0.6) * 0.02 + Math.cos(i * 0.1) * 0.01 + Math.random() * 0.005,
    })),
  }