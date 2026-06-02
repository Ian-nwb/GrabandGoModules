// src/modules/payments/payments.controller.js
const paymentsService = require('./payments.service');

/**
 * Handles generating a new hosted checkout session url (GCash, Maya, Card)
 */
const checkout = async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'A valid transaction amount is required.' });
    }

    const sessionData = await paymentsService.createCheckoutSession(amount, description);
    
    res.status(200).json({
      message: 'Checkout session generated successfully',
      data: sessionData
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Listens for server-to-server webhook events hitting from PayMongo
 */
const handleWebhook = async (req, res) => {
  const signatureHeader = req.headers['paymongo-signature'];
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

  if (!signatureHeader) {
    return res.status(400).json({ error: 'Missing signature header' });
  }

  try {
    const rawBody = JSON.stringify(req.body);
    const isValid = paymentsService.verifyWebhookSignature(signatureHeader, rawBody, webhookSecret);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.data.attributes;
    const eventType = event.type; 

    if (eventType === 'checkout_session.payment.paid') {
      const checkoutSessionObj = event.data;
      const sessionId = checkoutSessionObj.id;
      const totalPaid = checkoutSessionObj.attributes.amount / 100;

      console.log(`💰 SUCCESS: Checkout Session ${sessionId} was paid ₱${totalPaid}!`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  checkout,
  handleWebhook
};