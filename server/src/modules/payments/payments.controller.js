// src/modules/payments/payments.controller.js
const paymentsService = require('./payments.service');

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

module.exports = {
  checkout
};