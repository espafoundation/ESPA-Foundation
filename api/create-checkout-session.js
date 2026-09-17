import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY environment variable is missing' });
  }

  const stripe = new Stripe(key, { apiVersion: '2023-10-16' });
  const { amount } = req.body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'ESPA Foundation Donation',
              description: 'Thank you for supporting our mission.',
            },
            unit_amount: Math.round(Number(amount) * 100), // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://localhost:3000'}/donate?success=true`,
      cancel_url: `${req.headers.origin || 'http://localhost:3000'}/donate?canceled=true`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
}
