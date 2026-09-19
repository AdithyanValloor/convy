"use client";

import api from "@/utils/axiosInstance";
import { Eye, EyeClosed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";

const OTP_LENGTH = 6;

type Step = "email" | "otp" | "password";

type PasswordErrors = {
  password: string;
  confirmPassword: string;
};

export default function ForgotPasswordPage() {
  const router = useRouter();

  // ── Flow ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("email");

  // ── Email ─────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // ── OTP ───────────────────────────────────────────────────────────
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Password ──────────────────────────────────────────────────────
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({
    password: "",
    confirmPassword: "",
  });

  // ── General ───────────────────────────────────────────────────────
  const [error, setError] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // ── Countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // ── Email validation ──────────────────────────────────────────────
  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Enter a valid email");
      return false;
    }

    setEmailError("");
    return true;
  };

  // ── Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setError("");

    if (!validateEmail()) return;

    setSendingOtp(true);

    try {
      await api.post("/auth/forgot-password-send-otp", {
        email,
      });

      setOtp(Array(OTP_LENGTH).fill(""));
      setOtpError("");
      setCountdown(60);
      setStep("otp");

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 150);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Failed to send verification code",
        );
      } else {
        setError("Failed to send verification code");
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // ── OTP input ────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const next = [...otp];
    next[index] = value.slice(-1);

    setOtp(next);
    setOtpError("");

    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    const next = Array(OTP_LENGTH).fill("");

    pasted.split("").forEach((digit, index) => {
      next[index] = digit;
    });

    setOtp(next);
    setOtpError("");

    const focusIndex = Math.min(
      pasted.length,
      OTP_LENGTH - 1,
    );

    otpRefs.current[focusIndex]?.focus();
  };

  // ── Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpValue = otp.join("");

    if (otpValue.length < OTP_LENGTH) {
      setOtpError(`Enter the ${OTP_LENGTH}-digit code`);
      return;
    }

    setOtpError("");
    setError("");
    setVerifyingOtp(true);

    try {
      await api.post("/auth/verify-otp", {
        email,
        otp: otpValue,
      });

      setStep("password");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message =
          err.response?.data?.message || "";

        setOtpError(
          message || "Invalid or expired verification code",
        );
      } else {
        setOtpError(
          "Invalid or expired verification code",
        );
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0 || sendingOtp) return;

    setSendingOtp(true);
    setOtpError("");
    setError("");

    try {
      await api.post("/auth/forgot-password-send-otp", {
        email,
      });

      setOtp(Array(OTP_LENGTH).fill(""));
      setCountdown(60);

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 50);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setOtpError(
          err.response?.data?.message ||
            "Failed to resend OTP",
        );
      } else {
        setOtpError("Failed to resend OTP");
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Password validation ──────────────────────────────────────────
  const validatePassword = () => {
    const newErrors: PasswordErrors = {
      password: "",
      confirmPassword: "",
    };

    let valid = true;

    if (!password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters";
      valid = false;
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword =
        "Please confirm your password";
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        "Passwords do not match";
      valid = false;
    }

    setPasswordErrors(newErrors);

    return valid;
  };

  // ── Update password ──────────────────────────────────────────────
  const handleUpdatePassword = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    setError("");

    if (!validatePassword()) return;

    setUpdatingPassword(true);

    try {
      await api.patch("/auth/forgot-password", {
        email,
        newPassword: password,
      });

      // Password reset completed.
      // Return to login instead of automatically creating a session.
      router.replace("/login");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Failed to reset password",
        );
      } else {
        setError("Failed to reset password");
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  // ── Shared card ──────────────────────────────────────────────────
  const cardClassName = `
    relative
    w-full max-w-md
    overflow-hidden
    rounded-xl
    border border-white/10
    bg-[#18181B]
    p-6
    shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]
    backdrop-blur-xl
  `;

  const inputClassName = (hasError: boolean) => `
    h-10 w-full
    rounded-xl
    border
    bg-[#0F0F10]
    px-4
    text-sm
    text-white
    outline-none
    transition-all duration-200
    placeholder:text-white/45
    ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]"
        : "border-white/10 focus:border-[#2854D9]/70 focus:shadow-[0_0_0_3px_rgba(40,84,217,0.10)]"
    }
  `;

  const primaryButtonClass = `
    h-10 w-full
    cursor-pointer
    rounded-xl
    border border-blue-400/10
    bg-[#2854D9]
    text-sm
    font-semibold
    text-white
    shadow-md
    transition-all duration-200
    hover:bg-[#3262E8]
    hover:shadow-[0_8px_24px_-8px_rgba(47,102,249,0.65)]
    active:scale-[0.985]
    disabled:cursor-not-allowed
    disabled:opacity-50
    disabled:hover:bg-[#2854D9]
    disabled:hover:shadow-none
  `;

  const meloAccent = (
    <div
      className="
        absolute
        bottom-0 left-0
        h-[7px] w-full
        bg-gradient-to-r
        from-blue-600
        via-violet-600
        to-pink-500
      "
    />
  );

  return (
    <AnimatePresence mode="wait">
      {/* ─────────────────────────────────────────────────────────────
          STEP 1 — EMAIL
      ───────────────────────────────────────────────────────────── */}
      {step === "email" && (
        <motion.div
          key="email"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cardClassName}
        >
          <h2
            className="
              py-3
              text-center
              text-2xl
              font-[var(--font-quicksand)]
              font-semibold
              text-white
            "
          >
            Forgot Password?
          </h2>

          <p className="mt-1 text-center text-sm leading-relaxed text-white/50">
            Enter your email and we&apos;ll send you a
            verification code.
          </p>

          <form
            onSubmit={handleSendOtp}
            className="mt-7 space-y-4"
          >
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value.toLowerCase());
                  setEmailError("");
                  setError("");
                }}
                placeholder="Email"
                autoComplete="email"
                className={inputClassName(!!emailError)}
              />

              {emailError && (
                <p className="mt-1 text-xs text-red-500">
                  {emailError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={sendingOtp}
              className={primaryButtonClass}
            >
              {sendingOtp ? "Sending OTP…" : "Send OTP"}
            </button>

            {error && (
              <p className="text-center text-sm text-red-500">
                {error}
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-white/65">
            Remember your password?{" "}
            <Link
              href="/login"
              className="
                font-semibold
                text-white
                transition-colors duration-200
                hover:text-violet-400
              "
            >
              Login
            </Link>
          </p>

          {meloAccent}
        </motion.div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 2 — OTP
      ───────────────────────────────────────────────────────────── */}
      {step === "otp" && (
        <motion.div
          key="otp"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cardClassName}
        >
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setOtp(Array(OTP_LENGTH).fill(""));
              setOtpError("");
              setError("");
            }}
            className="
              absolute left-5 top-5
              text-sm
              text-white/45
              transition-colors duration-200
              hover:text-white/80
            "
          >
            ← Back
          </button>

          <div className="mt-4 text-center">
            <h2
              className="
                text-2xl
                font-[var(--font-quicksand)]
                font-semibold
                text-white
              "
            >
              Verify your Email
            </h2>

            <p className="mt-2 text-sm text-white/55">
              We sent a {OTP_LENGTH}-digit code to
            </p>

            <p className="mt-0.5 truncate px-4 text-sm font-medium text-[#4B7AFF]">
              {email}
            </p>
          </div>

          <form
            onSubmit={handleVerifyOtp}
            className="mt-8 space-y-6"
          >
            <div
              className="flex justify-center gap-2.5"
              onPaste={handleOtpPaste}
            >
              {otp.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={(element) => {
                    otpRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={
                    index === 0 ? "one-time-code" : "off"
                  }
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(index, e.target.value)
                  }
                  onKeyDown={(e) =>
                    handleOtpKeyDown(index, e)
                  }
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    delay: index * 0.05,
                  }}
                  className={`
                    h-12 w-11
                    rounded-xl
                    border
                    bg-[#0F0F10]
                    text-center
                    text-lg
                    font-semibold
                    text-white
                    caret-[#2854D9]
                    outline-none
                    transition-all duration-150
                    focus:border-[#2854D9]
                    focus:ring-1
                    focus:ring-[#2854D9]/30
                    ${
                      otpError
                        ? "border-red-500"
                        : "border-white/10"
                    }
                  `}
                />
              ))}
            </div>

            {otpError && (
              <p className="-mt-2 text-center text-xs text-red-500">
                {otpError}
              </p>
            )}

            <div className="text-center text-sm text-white/50">
              {countdown > 0 ? (
                <span>
                  Resend code in{" "}
                  <span className="font-medium tabular-nums text-[#4B7AFF]">
                    {countdown}s
                  </span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={sendingOtp}
                  className="
                    font-semibold
                    text-white
                    transition-colors duration-200
                    hover:text-[#4B7AFF]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  {sendingOtp
                    ? "Sending…"
                    : "Resend OTP"}
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={
                verifyingOtp ||
                otp.join("").length < OTP_LENGTH
              }
              className={primaryButtonClass}
            >
              {verifyingOtp
                ? "Verifying…"
                : "Verify Email"}
            </button>

            {error && (
              <p className="text-center text-sm text-red-500">
                {error}
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-white/65">
            Remember your password?{" "}
            <Link
              href="/login"
              className="
                font-semibold
                text-white
                transition-colors duration-200
                hover:text-[#4B7AFF]
              "
            >
              Login
            </Link>
          </p>

          {meloAccent}
        </motion.div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 3 — NEW PASSWORD
      ───────────────────────────────────────────────────────────── */}
      {step === "password" && (
        <motion.div
          key="password"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cardClassName}
        >
          <button
            type="button"
            onClick={() => {
              setStep("otp");
              setPassword("");
              setConfirmPassword("");
              setPasswordErrors({
                password: "",
                confirmPassword: "",
              });
              setError("");
            }}
            className="
              absolute left-5 top-5
              text-sm
              text-white/45
              transition-colors duration-200
              hover:text-white/80
            "
          >
            ← Back
          </button>

          <div className="mt-4 text-center">
            <h2
              className="
                text-2xl
                font-[var(--font-quicksand)]
                font-semibold
                text-white
              "
            >
              Reset Password
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-white/50">
              Create a new password for your Melo account.
            </p>
          </div>

          <form
            onSubmit={handleUpdatePassword}
            className="mt-7 space-y-4"
          >
            {/* New password */}
            <div>
              <div className="relative">
                <input
                  type={
                    showPassword ? "text" : "password"
                  }
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordErrors((current) => ({
                      ...current,
                      password: "",
                    }));
                    setError("");
                  }}
                  placeholder="New password"
                  autoComplete="new-password"
                  className={`
                    ${inputClassName(
                      !!passwordErrors.password,
                    )}
                    pr-11
                  `}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="
                    absolute right-3 top-1/2
                    -translate-y-1/2
                    cursor-pointer
                    text-white/40
                    transition-colors duration-200
                    hover:text-white/80
                  "
                >
                  {showPassword ? (
                    <Eye size={18} />
                  ) : (
                    <EyeClosed size={18} />
                  )}
                </button>
              </div>

              {passwordErrors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {passwordErrors.password}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <div className="relative">
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordErrors((current) => ({
                      ...current,
                      confirmPassword: "",
                    }));
                    setError("");
                  }}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  className={`
                    ${inputClassName(
                      !!passwordErrors.confirmPassword,
                    )}
                    pr-11
                  `}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current,
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="
                    absolute right-3 top-1/2
                    -translate-y-1/2
                    cursor-pointer
                    text-white/40
                    transition-colors duration-200
                    hover:text-white/80
                  "
                >
                  {showConfirmPassword ? (
                    <Eye size={18} />
                  ) : (
                    <EyeClosed size={18} />
                  )}
                </button>
              </div>

              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className={primaryButtonClass}
            >
              {updatingPassword
                ? "Updating password…"
                : "Reset Password"}
            </button>

            {error && (
              <p className="text-center text-sm text-red-500">
                {error}
              </p>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-white/65">
            Remember your password?{" "}
            <Link
              href="/login"
              className="
                font-semibold
                text-white
                transition-colors duration-200
                hover:text-violet-400
              "
            >
              Login
            </Link>
          </p>

          {meloAccent}
        </motion.div>
      )}
    </AnimatePresence>
  );
}