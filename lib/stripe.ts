import { Stripe, loadStripe } from '@stripe/stripe-js';
import config from './config';

let stripePromise: Promise<Stripe | null>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(config.stripe.publishableKey);
  }
  return stripePromise;
};

// Price IDs from config
export const LIFETIME_PRICE_ID = config.stripe.prices.lifetime;

// Product names from config
export const PRODUCT_NAMES = config.stripe.products; 