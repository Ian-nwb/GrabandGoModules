// src/modules/payments/payments.service.js
const axios = require('axios');

const SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

// PayMongo requires the Secret Key to be Base64 encoded as a Basic Auth header
const authHeader = Buffer.from(`${SECRET_KEY}:`).toString('base64');

const createCheckoutSession = async (amount, description = 'Modular App Purchase') => {
  try {
    // PayMongo processes amounts in cents (e.g., ₱100.00 must be sent as 10000)
    const amountInCents = Math.round(amount * 100);

    const response = await axios.post(
      'https://api.paymongo.com/v1/checkout_sessions',
      {
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            description: description,
            line_items: [
              {
                amount: amountInCents,
                currency: 'PHP',
                name: description,
                quantity: 1
              }
            ],
            payment_method_types: ['gcash', 'maya', 'card'], // Grab-and-go payment local channels
            success_url: 'http://localhost:5000/success', // Swap with your frontend success page URL later
            cancel_url: 'http://localhost:5000/cancel'
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`
        }
      }
    );

    // This returns the checkout URL where you must redirect the user
    return {
      sessionId: response.data.data.id,
      checkoutUrl: response.data.data.attributes.checkout_url
    };
  } catch (error) {
    const errorData = error.response?.data?.errors?.[0]?.detail || error.message;
    throw new Error(`PayMongo Error: ${errorData}`);
  }
};

module.exports = {
  createCheckoutSession
};