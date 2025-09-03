// @shared/schema.ts

import { z } from 'zod';

// --- Existing Interfaces (kept for context, assuming they are elsewhere in your project) ---
export interface Cryptocurrency {
  id: string;
  name: string;
  symbol: string;
  pair: string;
  price: string;
  change24h: string;
  changeAmount24h: string;
  color: string;
  icon: string; // e.g., "fa-brands fa-btc"
  marketCap: string;
  volume24h: string;
  supply: string;
  chartData: { time: number; value: number }[]; // Array of historical data points for the main chart
}

export interface UserProfile {
  id: string;
  name: string;
  balance: number;
  email: string;
}

export interface Trade {
  id: string;
  cryptoId: string;
  cryptoName: string;
  amount: number;
  initialPrice: number;
  status: 'pending' | 'completed';
  direction: 'up' | 'down'; // 'up' if user expects price to increase, 'down' if to decrease
  outcome?: 'win' | 'loss'; // Outcome of the trade (only for completed trades)
  gainPercentage?: number; // Percentage gain/loss (e.g., 5.25 for 5.25%)
  finalAmount?: number; // Final value of the trade (initial amount + gain/loss)
  simulatedFinalPrice?: number; // The specific price point at which the trade was considered completed for simulation
  timestamp: number; // When the trade was placed
  completionTime?: number; // When the trade is expected to complete or actually completed
}
// --- End Existing Interfaces ---


// Zod schema for inserting a new KYC record
// This schema strictly represents the data sent from the frontend for KYC.
// - 'uid' is excluded (backend responsibility)
// - 'verificationCode' is excluded (functionality removed)
// - 'balance' is excluded from InsertKyc as it's an account property, not a KYC property.
// - 'id' and 'name' for the account are also excluded from InsertKyc as they're usually backend-derived
//   or part of a separate account creation schema.
export const insertKycSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  country: z.string().min(1, "Country is required"),
  documentType: z.enum(["passport", "id", "license"], {
    errorMap: () => ({ message: "Please select a valid document type" }),
  }),
  email: z.string().email("Invalid email address"),
  accessCode: z.string().min(6, "Access code must be at least 6 characters"),
});

// Infer the TypeScript type from the Zod schema for KYC insertion
export type InsertKyc = z.infer<typeof insertKycSchema>;


// --- IMPORTANT: Review 'accounts' and 'insertAccountSchema' handling ---
// The `accounts` type (e.g., `typeof accounts.$inferSelect`) implies you're using Drizzle ORM.
// If you are, then `insertAccountSchema` might be more directly derived from your Drizzle schema.
// For now, I'll keep a basic 'InsertAccount' schema, but understand its interaction
// with `accounts.$inferSelect` in your actual project is critical.
// If your backend handles account creation from KYC data, you might not even send
// an `insertAccountSchema` explicitly from the frontend in this scenario.
export const insertAccountSchema = z.object({
  id: z.string().uuid(), // Assuming UUIDs are generated for the account ID
  name: z.string().min(1, "Account name is required"),
  balance: z.number().min(0, "Balance cannot be negative"),
  country: z.string().min(1, "Country is required"),
  documentType: z.enum(["passport", "id", "license"]),
  accessCode: z.string().min(6, "Access code must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
});

// Infer the TypeScript type from the Zod schema for account insertion
export type InsertAccount = z.infer<typeof insertAccountSchema>;

// If `accounts` refers to a Drizzle table, ensure it's properly exported/imported.
// For this context, `accounts.$inferSelect` is just a placeholder for the inferred
// type of a selected account record from your DB.
// You'll need to define `accounts` where it's actually declared (e.g., in your Drizzle schema file).
// For the purpose of providing complete, runnable code for *this* file, I'll assume
// `accounts` is indeed a Drizzle table type.
// Example: declare const accounts: any; // A dummy declaration if not explicitly provided elsewhere
// If `accounts` is not coming from a Drizzle schema, this import will fail.
// You might remove `accounts` from the import if you're not using Drizzle directly in the frontend schema file.