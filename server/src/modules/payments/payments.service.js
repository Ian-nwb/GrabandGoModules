// src/modules/payments/payments.service.js
const axios = require('axios');
const crypto = require('crypto');

const SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const authHeader = Buffer.from(`${SECRET_KEY}:`).toString('base64');

/**
 * Creates a hosted PayMongo Checkout Session for GCash, Maya, or Cards
 */
const createCheckoutSession = async (amount, description = 'Modular App Purchase') => {
  try {
    const amountInCents = Math.round(amount * 100); // PayMongo operates in centavos

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
            payment_method_types: ['gcash', 'paymaya', 'card', 'qrph'], 
            success_url: 'http://localhost:5000/success', 
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

    return {
      sessionId: response.data.data.id,
      checkoutUrl: response.data.data.attributes.checkout_url
    };
  } catch (error) {
    const errorData = error.response?.data?.errors?.[0]?.detail || error.message;
    throw new Error(`PayMongo Error: ${errorData}`);
  }
};

/**
 * Validates that incoming webhook payloads genuinely originated from PayMongo
 */
const verifyWebhookSignature = (signatureHeader, rawBody, webhookSecret) => {
  try {
    const parts = signatureHeader.split(',');
    const timestamp = parts[0].split('=')[1];
    const paymongoSignature = parts[2].split('=')[1];

    const dataToSign = timestamp + '.' + rawBody;
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(dataToSign)
      .digest('hex');

    return computedSignature === paymongoSignature;
  } catch (err) {
    return false;
  }
};

module.exports = {
  createCheckoutSession,
  verifyWebhookSignature
};