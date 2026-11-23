import type { Paise, StoreSettings, ZoneId } from "../data/types";

/** Indian PIN codes: 6 digits, first digit 1–8 (9 is the Army Postal Service). */
export function isValidPincode(pin: string) {
  return /^[1-8]\d{5}$/.test(pin.trim());
}

/**
 * Map a PIN code to a delivery zone using its postal-circle prefix.
 * 600xxx Chennai · 60–66 Tamil Nadu & Puducherry · 50–53 AP/Telangana,
 * 56–59 Karnataka, 67–69 Kerala (68255x Lakshadweep is remote) ·
 * 18–19 J&K/Ladakh, 744 Andaman, 78–79 North East → remote · else national.
 */
export function zoneForPincode(pin: string): ZoneId | null {
  const p = pin.trim();
  if (!isValidPincode(p)) return null;
  const two = Number(p.slice(0, 2));
  const three = Number(p.slice(0, 3));
  if (three === 600 || three === 601 || three === 603) return "chennai";
  if (three === 744 || p.startsWith("68255") || two === 18 || two === 19 || two === 78 || two === 79) return "remote";
  if (two >= 60 && two <= 66) return "tamil-nadu";
  if ((two >= 50 && two <= 53) || (two >= 56 && two <= 59) || (two >= 67 && two <= 69)) return "south";
  return "national";
}

export interface ShippingQuote {
  zone: ZoneId;
  zoneLabel: string;
  eta: string;
  weightG: number;
  /** Fee before free-shipping rules */
  baseFee: Paise;
  fee: Paise;
  free: boolean;
  /** Amount still needed for free shipping (0 when free) */
  remainingForFree: Paise;
}

/** Weight-slab fee: base for the first 500 g, then per extra 500 g (or part). */
export function slabFee(weightG: number, base: Paise, perExtra: Paise) {
  const slabs = Math.max(1, Math.ceil(Math.max(weightG, 1) / 500));
  return base + (slabs - 1) * perExtra;
}

export function quoteShipping(params: {
  pincode: string;
  weightG: number;
  /** Subtotal after discounts, used for the free-shipping threshold */
  eligibleSubtotal: Paise;
  settings: StoreSettings;
  forceFree?: boolean;
}): ShippingQuote | null {
  const zone = zoneForPincode(params.pincode);
  if (!zone) return null;
  const rate = params.settings.zones[zone];
  const baseFee = slabFee(params.weightG, rate.base, rate.perExtra500g);
  const threshold = params.settings.freeShippingThreshold;
  const meetsThreshold = threshold > 0 && params.eligibleSubtotal >= threshold;
  const free = Boolean(params.forceFree) || meetsThreshold;
  return {
    zone,
    zoneLabel: rate.label,
    eta: rate.eta,
    weightG: params.weightG,
    baseFee,
    fee: free ? 0 : baseFee,
    free,
    remainingForFree: free ? 0 : Math.max(0, threshold - params.eligibleSubtotal),
  };
}

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;
