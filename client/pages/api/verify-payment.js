// ─── Razorpay: Verify Payment ─────────────────────────────────────────────────
// POST /api/verify-payment
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, tierId }
// Returns: { verified: true/false }

import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    tierId,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment details" });
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({
      error: "Razorpay secret not configured",
    });
  }

  try {
    // Generate the expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({
        verified: false,
        error: "Payment verification failed — signature mismatch",
      });
    }

    // Payment is verified!
    // In production, you'd update a database here to record the subscription.
    // For now, the frontend handles tier activation via localStorage.
    return res.status(200).json({
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      tierId,
    });
  } catch (err) {
    console.error("Razorpay verify error:", err);
    return res.status(500).json({
      verified: false,
      error: err.message || "Verification failed",
    });
  }
}
