"use client";

import { loginUser } from "@/redux/features/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { Eye, EyeClosed } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

type Errors = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState<string>("biyoja9722@joystill.com");
  const [password, setPassword] = useState<string>("biyoja9722@joystill");
  const [error, setError] = useState<string>("");
  const [showPass, setShowPass] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({
    email: "",
    password: "",
  });

  const dispatch = useAppDispatch();

  const validate = () => {
    let valid = true;
    const newErrors: Errors = { email: "", password: "" };

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
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    try {
      await dispatch(loginUser({ email, password })).unwrap();
      window.location.replace("/chat");
    } catch (err: unknown) {
      if (typeof err === "string") {
        setError(err);
      } else {
        setError("Something went wrong");
      }
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
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
          Welcome Back!
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Email */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              placeholder="Email"
              autoComplete="email"
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
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]"
                    : "border-white/10 focus:border-[#2854D9]/70 focus:shadow-[0_0_0_3px_rgba(40,84,217,0.10)]"
                }
              `}
            />

            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
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
                      ? "border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]"
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

            {/* Forgot Password */}
            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="
              text-xs
              font-medium
              text-white/70
              transition-colors duration-200
              hover:text-white
              hover:underline
            "
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
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
        "
          >
            Sign In
          </button>

          {/* Server Error */}
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
        </form>

        {/* Register */}
        <p className="mt-6 text-center text-sm text-white/65">
          Not on Melo?{" "}
          <Link
            href="/register"
            className="
          font-semibold
          text-white
          transition-colors duration-200
          hover:text-violet-400
        "
          >
            Register
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
    </>
  );
}
