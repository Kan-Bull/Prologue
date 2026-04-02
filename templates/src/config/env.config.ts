import * as path from "node:path";
import * as dotenv from "dotenv";

type Environment = "local" | "dev" | "staging" | "production";

interface EnvironmentConfig {
  baseUrl: string;
  apiUrl: string;
  timeout: number;
  retries: number;
  workers: number;
  headless: boolean;
}

const environments: Record<Environment, EnvironmentConfig> = {
  local: {
    baseUrl: "https://your-app.com",
    apiUrl: "https://your-app.com/api",
    timeout: 15_000,
    retries: 0,
    workers: 4,
    headless: false,
  },
  dev: {
    baseUrl: "https://dev.example.com",
    apiUrl: "https://dev.example.com/api",
    timeout: 30_000,
    retries: 1,
    workers: 4,
    headless: true,
  },
  staging: {
    baseUrl: "https://staging.example.com",
    apiUrl: "https://staging.example.com/api",
    timeout: 30_000,
    retries: 2,
    workers: 2,
    headless: true,
  },
  production: {
    baseUrl: "https://app.example.com",
    apiUrl: "https://app.example.com/api",
    timeout: 60_000,
    retries: 2,
    workers: 1,
    headless: true,
  },
};

/**
 * Centralized environment configuration.
 *
 * Reads TEST_ENV from process.env and returns the matching config.
 * All env-specific values live here — no scattered process.env reads.
 *
 * Usage:
 * ```
 * TEST_ENV=staging npx playwright test
 * ```
 */
class EnvironmentManager {
  private readonly env: Environment;
  private readonly config: EnvironmentConfig;

  constructor() {
    dotenv.config({
      path: path.resolve(process.cwd(), `.env.${this.resolveEnv()}`),
    });
    dotenv.config(); // fallback to .env

    this.env = this.resolveEnv();
    this.config = environments[this.env];
  }

  private resolveEnv(): Environment {
    const env = process.env.TEST_ENV ?? "local";
    if (!Object.keys(environments).includes(env)) {
      throw new Error(
        `Unknown TEST_ENV "${env}". Valid: ${Object.keys(environments).join(", ")}`,
      );
    }
    return env as Environment;
  }

  get name(): Environment {
    return this.env;
  }
  get baseUrl(): string {
    return process.env.BASE_URL ?? this.config.baseUrl;
  }
  get apiUrl(): string {
    return process.env.API_URL ?? this.config.apiUrl;
  }
  get timeout(): number {
    return this.config.timeout;
  }
  get retries(): number {
    return this.config.retries;
  }
  get workers(): number {
    return this.config.workers;
  }
  get headless(): boolean {
    return this.config.headless;
  }
}

export const EnvConfig = new EnvironmentManager();
