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
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md bg-base-200/40 border border-base-content/20 rounded-3xl shadow-lg p-6 overflow-hidden"
          >
            <h2 className="text-xl font-semibold text-base-content text-center">
              Create an Account
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOtp();
              }}
              className="mt-6 space-y-4"
            >
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
                    className={`w-full h-10 px-4 text-sm rounded-xl bg-base-300 text-base-content outline-base-content/10 hover:outline focus:outline ${
                      errors[field.name]
                        ? "border border-red-500"
                        : "border border-base-content/10"
                    }`}
                  />
                  {errors[field.name] && (
                    <p className="text-xs text-red-500 mt-1">
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
                    className={`w-full h-10 px-4 pr-10 text-sm rounded-xl bg-base-300 text-base-content outline-base-content/10 hover:outline focus:outline ${
                      errors.password
                        ? "border border-red-500"
                        : "border border-base-content/10"
                    }`}
                  />
                  <div
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-base-content opacity-60 hover:opacity-100"
                  >
                    {showPass ? <Eye size={18} /> : <EyeClosed size={18} />}
                  </div>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={sendingOtp}
                className="w-full h-10 rounded-xl border border-base-content/10 bg-cyan-900 text-white cursor-pointer text-md font-semibold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sendingOtp ? "Sending OTP…" : "Continue"}
              </button>

              {error && (
                <p className="text-center text-sm text-red-500">{error}</p>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-base-content/70 opacity-70">
              Already a whisperer?{" "}
              <Link
                href="/login"
                className="font-semibold text-white hover:opacity-80"
              >
                Login
              </Link>
            </p>

            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-cyan-900" />
          </motion.div>
        )}

        {/* ── STEP 2 : OTP Verification ──────────────────────────── */}
        {step === "otp" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md bg-base-200/40 border border-base-content/20 rounded-3xl shadow-lg p-6 overflow-hidden"
          >
            {/* Back button */}
            <button
              onClick={() => {
                setStep("form");
                setOtpError("");
                setOtp(Array(OTP_LENGTH).fill(""));
                setError("");
              }}
              className="absolute top-5 left-5 text-base-content/50 hover:text-base-content transition text-sm flex items-center gap-1"
            >
              ← Back
            </button>

            <div className="text-center mt-4">
              <h2 className="text-xl font-semibold text-base-content">
                Verify your Email
              </h2>
              <p className="mt-2 text-sm text-base-content/60">
                We sent a {OTP_LENGTH}-digit code to
              </p>
              <p className="text-sm font-medium text-cyan-400 mt-0.5 truncate px-4">
                {email}
              </p>
            </div>

            <form onSubmit={handleVerifyAndRegister} className="mt-8 space-y-6">
              {/* OTP boxes */}
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
                      w-11 h-12 text-center text-lg font-semibold rounded-xl
                      bg-base-300 text-base-content caret-cyan-400
                      border transition-all duration-150 outline-none
                      focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40
                      ${otpError ? "border-red-500" : "border-base-content/15"}
                    `}
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-center text-xs text-red-500 -mt-2">
                  {otpError}
                </p>
              )}

              {/* Resend */}
              <div className="text-center text-sm text-base-content/50">
                {countdown > 0 ? (
                  <span>
                    Resend code in{" "}
                    <span className="text-cyan-400 font-medium tabular-nums">
                      {countdown}s
                    </span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={sendingOtp}
                    className="text-white font-semibold hover:opacity-80 transition disabled:opacity-40"
                  >
                    {sendingOtp ? "Sending…" : "Resend OTP"}
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={verifyingOtp || otp.join("").length < OTP_LENGTH}
                className="w-full h-10 rounded-xl border border-base-content/10 bg-cyan-900 text-white cursor-pointer text-md font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyingOtp ? "Verifying…" : "Create Account"}
              </button>

              {error && (
                <p className="text-center text-sm text-red-500">{error}</p>
              )}
            </form>

            <p className="mt-6 text-center text-sm text-base-content/70 opacity-70">
              Already a whisperer?{" "}
              <Link
                href="/login"
                className="font-semibold text-white hover:opacity-80"
              >
                Login
              </Link>
            </p>

            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-cyan-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
