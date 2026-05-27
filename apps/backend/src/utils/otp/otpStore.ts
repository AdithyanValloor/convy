/**
 * In-memory OTP store.
 * Replace with Redis or another shared store for multi-instance deployments.
 */

const store = new Map<string, { otp: string; expiresAt: number }>();

const OTP_TTL_MS = 10 * 60 * 1000;

export const saveOtp = (email: string, otp: string) => {
  store.set(email, { otp, expiresAt: Date.now() + OTP_TTL_MS });
};

export const verifyOtp = (email: string, otp: string): boolean => {
  const entry = store.get(email);
  if (!entry) return false;

  if (Date.now() > entry.expiresAt) {
    store.delete(email);
    return false;
  }

  if (entry.otp !== otp) return false;

  // OTPs are single-use once successfully verified.
  store.delete(email);
  return true;
};

export const markVerified = (email: string) => {
  store.set(email, { otp: "__verified__", expiresAt: Date.now() + OTP_TTL_MS });
};

export const isVerified = (email: string): boolean => {
  const entry = store.get(email);
  return !!entry && entry.otp === "__verified__" && Date.now() <= entry.expiresAt;
};

export const clearEmail = (email: string) => store.delete(email);
