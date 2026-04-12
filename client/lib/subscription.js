// ─── Subscription / SaaS Tier System ──────────────────────────────────────────
// Supports plan switching, INR (Razorpay) and Crypto (MATIC) payments.

export const TIERS = {
  FREE: {
    id: "free",
    name: "Free",
    level: 0,
    maxCredentials: 10,
    price: "$0",
    priceINR: "₹0",
    priceMATIC: "0",
    period: "forever",
    color: "#94a3b8",
    gradient: "linear-gradient(135deg, #334155, #475569)",
    features: [
      "Up to 10 saved logins",
      "AES-256-GCM encryption",
      "Blockchain storage",
      "Password strength checker",
    ],
  },
  PREMIUM: {
    id: "premium",
    name: "Premium",
    level: 1,
    maxCredentials: Infinity,
    price: "$2.49",
    priceINR: "₹199",
    priceINRAnnual: "₹1,999",
    priceMATIC: "5",
    priceMaticAnnual: "50",
    period: "/month",
    annualPrice: "$24.99/year",
    annualPriceINR: "₹1,999/year",
    color: "#818cf8",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    badge: "Most Popular",
    features: [
      "Unlimited saved logins",
      "Password health dashboard",
      "Categories & folders",
      "Secure notes",
      "Priority support",
    ],
  },
  FAMILY: {
    id: "family",
    name: "Family",
    level: 2,
    maxCredentials: Infinity,
    maxUsers: 5,
    price: "$4.99",
    priceINR: "₹399",
    priceINRAnnual: "₹3,999",
    priceMATIC: "10",
    priceMaticAnnual: "100",
    period: "/month",
    annualPrice: "$49.99/year",
    annualPriceINR: "₹3,999/year",
    color: "#ec4899",
    gradient: "linear-gradient(135deg, #ec4899, #f43f5e)",
    badge: "Best Value",
    features: [
      "Everything in Premium",
      "Up to 5 family members",
      "Shared vaults & folders",
      "Admin controls",
      "Family password health",
    ],
  },
};

// ─── Payment receiver for crypto payments ─────────────────────────────────────
export const PAYMENT_RECEIVER =
  process.env.NEXT_PUBLIC_PAYMENT_RECEIVER_ADDRESS ||
  "0xAA620c50359e6ee40cFCb7F0b587c6dB9FE97C96";

// ─── Categories for credential organization ──────────────────────────────────
export const CATEGORIES = [
  { key: "social", label: "Social Media", icon: "🌐", color: "#3b82f6" },
  { key: "finance", label: "Finance & Banking", icon: "🏦", color: "#10b981" },
  { key: "shopping", label: "Shopping", icon: "🛒", color: "#f59e0b" },
  { key: "work", label: "Work", icon: "💼", color: "#8b5cf6" },
  { key: "entertainment", label: "Entertainment", icon: "🎬", color: "#ec4899" },
  { key: "email", label: "Email", icon: "📧", color: "#06b6d4" },
  { key: "gaming", label: "Gaming", icon: "🎮", color: "#f43f5e" },
  { key: "education", label: "Education", icon: "📚", color: "#a855f7" },
  { key: "other", label: "Other", icon: "📁", color: "#64748b" },
];

// ─── Subscription persistence ─────────────────────────────────────────────────

const SUB_KEY = (addr) => `sv_sub_${addr.toLowerCase()}`;

/**
 * Get full subscription details for a user.
 * Returns: { tierId, tierName, paymentMethod, txHash, activatedAt, expiresAt }
 */
export const getSubscription = (address) => {
  if (!address) return null;
  try {
    const raw = localStorage.getItem(SUB_KEY(address));
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
};

/**
 * Get the user's current subscription tier object.
 */
export const getUserTier = (address) => {
  const sub = getSubscription(address);
  if (sub?.tierId && TIERS[sub.tierId.toUpperCase()]) {
    return TIERS[sub.tierId.toUpperCase()];
  }
  // Fallback: check legacy key
  if (address) {
    try {
      const legacy = localStorage.getItem(`sv_tier_${address.toLowerCase()}`);
      if (legacy && TIERS[legacy.toUpperCase()]) {
        return TIERS[legacy.toUpperCase()];
      }
    } catch {
      // ignore
    }
  }
  return TIERS.FREE;
};

/**
 * Activate a subscription for the user.
 * @param {string} address - wallet address
 * @param {string} tierId - "premium" or "family"
 * @param {string} paymentMethod - "razorpay" or "crypto"
 * @param {object} details - { txHash, paymentId, orderId, billing }
 */
export const activateSubscription = (address, tierId, paymentMethod, details = {}) => {
  if (!address) return;
  const now = Date.now();
  const billing = details.billing || "monthly";
  const durationMs = billing === "annual" ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

  const sub = {
    tierId,
    tierName: TIERS[tierId.toUpperCase()]?.name || tierId,
    paymentMethod,
    billing,
    txHash: details.txHash || null,
    paymentId: details.paymentId || null,
    orderId: details.orderId || null,
    activatedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + durationMs).toISOString(),
  };

  try {
    localStorage.setItem(SUB_KEY(address), JSON.stringify(sub));
    // Also set legacy key for backward compatibility
    localStorage.setItem(`sv_tier_${address.toLowerCase()}`, tierId);
  } catch {
    // ignore
  }

  return sub;
};

/**
 * Clear subscription (downgrade to Free).
 */
export const clearSubscription = (address) => {
  if (!address) return;
  try {
    localStorage.removeItem(SUB_KEY(address));
    localStorage.removeItem(`sv_tier_${address.toLowerCase()}`);
  } catch {
    // ignore
  }
};

/**
 * Set the user's subscription tier (legacy compatibility).
 */
export const setUserTier = (address, tierKey) => {
  if (!address) return;
  try {
    localStorage.setItem(`sv_tier_${address.toLowerCase()}`, tierKey);
  } catch {
    // ignore
  }
};

/**
 * Check if user can add more credentials.
 */
export const canAddCredential = (tier, currentCount) => {
  return currentCount < tier.maxCredentials;
};

/**
 * Get the usage percentage (for progress bars).
 */
export const getUsagePercent = (tier, currentCount) => {
  if (tier.maxCredentials === Infinity) return 0;
  return Math.min(100, Math.round((currentCount / tier.maxCredentials) * 100));
};

/**
 * Determine the relationship between current tier and a target tier.
 * Returns "current", "upgrade", or "downgrade".
 */
export const getTierAction = (currentTier, targetTier) => {
  if (currentTier.id === targetTier.id) return "current";
  return targetTier.level > currentTier.level ? "upgrade" : "downgrade";
};

/**
 * Auto-detect category from a site/domain string.
 */
export const detectCategory = (site = "") => {
  const s = site.toLowerCase();
  if (/facebook|twitter|instagram|linkedin|tiktok|reddit|snapchat|x\.com|threads/i.test(s)) return "social";
  if (/bank|paypal|venmo|stripe|razorpay|cashapp|crypto|binance|coinbase|wise/i.test(s)) return "finance";
  if (/amazon|flipkart|ebay|shopify|etsy|walmart|myntra|aliexpress/i.test(s)) return "shopping";
  if (/slack|jira|notion|confluence|trello|asana|github|gitlab|azure|bitbucket/i.test(s)) return "work";
  if (/netflix|spotify|youtube|disney|hulu|prime|hbo|hotstar|twitch/i.test(s)) return "entertainment";
  if (/gmail|outlook|yahoo|proton|mail|zoho/i.test(s)) return "email";
  if (/steam|epic|riot|blizzard|playstation|xbox|nintendo|roblox/i.test(s)) return "gaming";
  if (/coursera|udemy|edx|skillshare|duolingo|khan|university|school/i.test(s)) return "education";
  return "other";
};

/**
 * Password health analysis.
 */
export const analyzePasswordHealth = (credentials = []) => {
  const results = {
    total: credentials.length,
    strong: 0,
    fair: 0,
    weak: 0,
    reused: 0,
    uniquePasswords: new Set(),
    reusedPasswords: new Map(),
    issues: [],
  };

  const passwordCount = {};
  credentials.forEach((c) => {
    const pwd = c.password || "";
    passwordCount[pwd] = (passwordCount[pwd] || 0) + 1;
  });

  credentials.forEach((c) => {
    const pwd = c.password || "";
    const strength = getPasswordStrengthScore(pwd);

    if (strength >= 80) results.strong++;
    else if (strength >= 50) results.fair++;
    else results.weak++;

    if (passwordCount[pwd] > 1) {
      results.reused++;
      if (!results.reusedPasswords.has(pwd)) {
        results.reusedPasswords.set(pwd, []);
      }
      results.reusedPasswords.get(pwd).push(c.site);
    }

    results.uniquePasswords.add(pwd);
  });

  if (results.total > 0) {
    const strengthScore = ((results.strong * 100) + (results.fair * 60) + (results.weak * 20)) / results.total;
    const reuseScore = results.reused > 0 ? Math.max(0, 100 - (results.reused / results.total) * 100) : 100;
    results.overallScore = Math.round((strengthScore * 0.6) + (reuseScore * 0.4));
  } else {
    results.overallScore = 100;
  }

  return results;
};

const getPasswordStrengthScore = (pwd = "") => {
  let s = 0;
  if (pwd.length >= 8) s += 20;
  if (pwd.length >= 12) s += 20;
  if (pwd.length >= 16) s += 10;
  if (/[a-z]/.test(pwd)) s += 10;
  if (/[A-Z]/.test(pwd)) s += 10;
  if (/[0-9]/.test(pwd)) s += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) s += 20;
  return Math.min(s, 100);
};
