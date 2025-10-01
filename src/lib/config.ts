// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://testy-leonanie-web3bridge-3c7204a2.koyeb.app',
  VERSION: process.env.NEXT_PUBLIC_API_VERSION || 'v2',
  get API_URL() {
    return `${this.BASE_URL}/api/${this.VERSION}/payment`;
  }
};

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100
};

// Discount Code Configuration
export const DISCOUNT_CONFIG = {
  MAX_CODE_LENGTH: 16,
  MIN_PERCENTAGE: 1,
  MAX_PERCENTAGE: 100,
  MIN_OFFSET: 1,
  MAX_OFFSET: 1000
};
