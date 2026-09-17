"use client";

import { loginUser } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import api from "@/utils/axiosInstance";
import { Eye, EyeClosed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// ── OTP length ────────────────────────────────────────────────────
const OTP_LENGTH = 6;

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState("");

  // OTP state
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Validation ──────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    let valid = true;

    if (!displayName.trim()) {
      newErrors.displayName = "Display name is required";
      valid = false;
    }
    if (!username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    } else if (!/^[a-zA-Z][a-zA-Z0-9]{2,19}$/.test(username)) {
      newErrors.username =
        "Only letters & numbers allowed, must start with a letter";
      valid = false;
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Enter a valid email";
      valid = false;
    }
    if (!password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "At least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // ── Send OTP ────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!validateForm()) return;
    setSendingOtp(true);
    setOtpError("");
    try {
      await api.post("/auth/send-otp", { email });
      setOtpSent(true);
      setStep("otp");
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to send OTP");
      } else {
        setError("Failed to send OTP");
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // ── OTP input handlers ──────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  // ── Verify OTP + Register ───────────────────────────────────────
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < OTP_LENGTH) {
      setOtpError(`Enter the ${OTP_LENGTH}-digit code`);
      return;
    }
    setOtpError("");
    setVerifyingOtp(true);

    try {
      // 1. Verify OTP
      await api.post("/auth/verify-otp", { email, otp: otpValue });

      // 2. Register
      await api.post("/auth/register", {
        displayName,
        username,
        email,
        password,
      });

      // 3. Login
      const res = await dispatch(loginUser({ email, password }));
      if (res.type === "auth/loginUser/fulfilled") {
        router.push("/chat");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || "";
        if (
          msg.toLowerCase().includes("otp") ||
          msg.toLowerCase().includes("code")
        ) {
          setOtpError(msg);
        } else {
          setError(msg || "Registration failed");
        }
      } else {
        setError("Registration failed");
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;
    setSendingOtp(true);
    setOtpError("");
    try {
      await api.post("/auth/send-otp", { email });
      setCountdown(60);
      setOtp(Array(OTP_LENGTH).fill(""));
      otpRefs.current[0]?.focus();
    } catch {
      setOtpError("Failed to resend OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {/* ── STEP 1 : Registration Form ─────────────────────────── */}
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="
              relative
              w-full max-w-md
              overflow-hidden
              rounded-xl
              border border-white/10
              bg-[#18181B]
              p-6
              shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]
              backdrop-blur-xl
            "
          >
            {/* Heading */}
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
              Create an Account
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp();
              }}
              className="mt-6 space-y-4"
            >
              {/* Basic Fields */}
              {[
                {
                  label: "Display Name",
                  value: displayName,
                  setter: setDisplayName,
                  name: "displayName",
                  type: "text",
                },
                {
                  label: "Username",
                  value: username,
                  setter: (v: string) => setUsername(v.toLowerCase()),
                  name: "username",
                  type: "text",
                },
                {
                  label: "Email",
                  value: email,
                  setter: (v: string) => setEmail(v.toLowerCase()),
                  name: "email",
                  type: "email",
                },
              ].map((field) => (
                <div key={field.name}>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    placeholder={field.label}
                    autoComplete={
                      field.name === "email"
                        ? "email"
                        : field.name === "username"
                          ? "username"
                          : "name"
                    }
                    className={`
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
                        errors[field.name]
                          ? "border-red-500 focus:border-red-500"
                          : "border-white/10 focus:border-[#2854D9]/70 focus:shadow-[0_0_0_3px_rgba(40,84,217,0.10)]"
                      }
                    `}
                  />

                  {errors[field.name] && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors[field.name]}
                    </p>
                  )}
                </div>
              ))}

              {/* Password */}
              <div>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="new-password"
                    className={`
                      h-10 w-full
                      rounded-xl
                      border
                      bg-[#0F0F10]
                      px-4 pr-11
                      text-sm
                      text-white
                      outline-none
                      transition-all duration-200
                      placeholder:text-white/45
                      ${
                        errors.password
                          ? "border-red-500 focus:border-red-500"
                          : "border-white/10 focus:border-[#2854D9]/70 focus:shadow-[0_0_0_3px_rgba(40,84,217,0.10)]"
                      }
                    `}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPass((prev) => !prev)}
                    aria-label={showPass ? "Hide password" : "Show password"}
                    className="
                      absolute right-3 top-1/2
                      -translate-y-1/2
                      cursor-pointer
                      text-white/40
                      transition-colors duration-200
                      hover:text-white/80
                    "
                  >
                    {showPass ? <Eye size={18} /> : <EyeClosed size={18} />}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Continue */}
              <button
                type="submit"
                disabled={sendingOtp}
                className="
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
                "
              >
                {sendingOtp ? "Sending OTP…" : "Continue"}
              </button>

              {/* Server Error */}
              {error && (
                <p className="text-center text-sm text-red-500">{error}</p>
              )}
            </form>

            {/* Login */}
            <p className="mt-6 text-center text-sm text-white/65">
              Already on Melo?{" "}
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

            {/* Melo Accent */}
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
          </motion.div>
        )}

        {/* ── STEP 2 : OTP Verification ─────────────────────────── */}
        {step === "otp" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="
              relative
              w-full max-w-md
              overflow-hidden
              rounded-xl
              border border-white/10
              bg-[#18181B]
              p-6
              shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]
              backdrop-blur-xl
            "
          >
            {/* Back */}
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setOtpError("");
                setOtp(Array(OTP_LENGTH).fill(""));
                setError("");
              }}
              className="
                absolute left-5 top-5
                flex items-center gap-1
                text-sm
                text-white/45
                transition-colors duration-200
                hover:text-white/80
              "
            >
              ← Back
            </button>

            {/* Heading */}
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

            <form onSubmit={handleVerifyAndRegister} className="mt-8 space-y-6">
              {/* OTP */}
              <div
                className="flex justify-center gap-2.5"
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, i) => (
                  <motion.input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
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
                      ${otpError ? "border-red-500" : "border-white/10"}
                    `}
                  />
                ))}
              </div>

              {/* OTP Error */}
              {otpError && (
                <p className="-mt-2 text-center text-xs text-red-500">
                  {otpError}
                </p>
              )}

              {/* Resend */}
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
                    {sendingOtp ? "Sending…" : "Resend OTP"}
                  </button>
                )}
              </div>

              {/* Create Account */}
              <button
                type="submit"
                disabled={verifyingOtp || otp.join("").length < OTP_LENGTH}
                className="
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
                "
              >
                {verifyingOtp ? "Verifying…" : "Create Account"}
              </button>

              {/* Server Error */}
              {error && (
                <p className="text-center text-sm text-red-500">{error}</p>
              )}
            </form>

            {/* Login */}
            <p className="mt-6 text-center text-sm text-white/65">
              Already on Melo?{" "}
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

            {/* Melo Accent */}
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
