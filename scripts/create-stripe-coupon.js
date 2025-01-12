const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createCoupon(isTest = false) {
  try {
    // Validate the key type matches the intended environment
    const keyType = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'test' : 'live';
    if (isTest && keyType !== 'test') {
      throw new Error('Test mode requires a test key (sk_test_)');
    }
    if (!isTest && keyType !== 'live') {
      throw new Error('Live mode requires a live key (sk_live_)');
    }

    const coupon = await stripe.coupons.create({
      duration: 'once',
      id: 'FOUNDER2024',
      percent_off: 100,
      max_redemptions: 100,
      name: 'Founder Access'
    });
    
    console.log(`Created ${keyType} mode coupon:`, coupon);
  } catch (error) {
    console.error('Error creating coupon:', error.message);
  }
}

// Run in live mode
createCoupon(false); 