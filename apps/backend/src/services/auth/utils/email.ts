import { BadRequest } from "../../../utils/errors/httpErrors.js";

export const normalizeEmail = (email: string) =>
  email.trim().toLowerCase();

export const validateEmail = (email: string) => {
  const normalized = normalizeEmail(email);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalized)) {
    throw BadRequest("Invalid email address");
  }

  return normalized;
};
