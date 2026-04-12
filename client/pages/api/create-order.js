// ─── Razorpay: Create Order ───────────────────────────────────────────────────
// POST /api/create-order
// Body: { tierId: "premium" | "family", billing: "monthly" | "annual" }
// Returns: { orderId, amount, currency, keyId }

import Razorpay from "razorpay";

const PRICING_INR = {
  premium: { monthly: 19900, annual: 199900 },  // paise (₹199, ₹1999)
  family:  { monthly: 39900, annual: 399900 },  // paise (₹399, ₹3999)
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { tierId, billing = "monthly" } = req.body;

  if (!tierId || !PRICING_INR[tierId]) {
    return res.status(400).json({ error: "Invalid tier" });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({
      error: "Razorpay credentials not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env",
    });
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amount = PRICING_INR[tierId][billing];
    const planLabel = tierId.charAt(0).toUpperCase() + tierId.slice(1);
    const billingLabel = billing === "annual" ? "Annual" : "Monthly";

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `sv_${tierId}_${Date.now()}`,
      notes: {
        tierId,
        billing,
        product: "SecureVault Subscription",
      },
    });

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      tierName: `SecureVault ${planLabel} — ${billingLabel}`,
    });
  } catch (err) {
    console.error("Razorpay create-order error:", err);
    return res.status(500).json({ error: err.message || "Failed to create order" });
  }
}
