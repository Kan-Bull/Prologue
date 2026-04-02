/**
 * Domain types used across test data builders and page objects.
 *
 * Keep these aligned with the application's actual models.
 * These are NOT API response types — they represent the data
 * shape your tests work with.
 */

export interface User {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user" | "readonly";
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export type { ExampleData } from "./example";

/**
 * Add your domain-specific types below.
 *
 * Example:
 * ```ts
 * export interface LoanApplication {
 *   applicantName: string;
 *   amount: number;
 *   currency: string;
 *   term: number;
 *   riskRating: 'A' | 'B' | 'C' | 'D';
 * }
 * ```
 */
