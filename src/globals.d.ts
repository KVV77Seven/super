declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    NODE_ENV: 'production' | 'development';
    DATABASE_URL: string;

    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;

    JWT_ACCESS_TTL: string;
    JWT_ACCESS_COOKIE_TTL: string;
    JWT_REFRESH_TTL: string;
    JWT_REFRESH_COOKIE_TTL: string;
  }
}
