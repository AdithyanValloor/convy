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
  const [email, setEmail] = useState<string>("divid98109@5nek.com");
  const [password, setPassword] = useState<string>("12345678");
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
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md bg-base-200/40 border border-base-content/20 rounded-3xl shadow-lg p-6 overflow-hidden"
      >
        <h2 className="text-xl font-semibold text-base-content text-center">
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Email */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              placeholder="Email"
              className={`
                w-full h-10 px-4 text-sm rounded-xl
                bg-base-300 text-base-content
                outline-base-content/10 hover:outline
                focus:outline
                ${
                  errors.email
                    ? "border border-red-500"
                    : "border border-base-content/10"
                }
              `}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
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
                className={`
                  w-full h-10 px-4 pr-10 text-sm rounded-xl
                  bg-base-300 text-base-content
                  outline-base-content/10 hover:outline
                  focus:outline
                  ${
                    errors.password
                      ? "border border-red-500"
                      : "border border-base-content/10"
                  }
                `}
              />
              <div
                onClick={() => setShowPass((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content cursor-pointer opacity-60 hover:opacity-100"
              >
                {showPass ? <Eye size={18} /> : <EyeClosed size={18} />}
              </div>
            </div>

            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full h-10 rounded-xl border border-base-content/10 bg-cyan-900 text-white cursor-pointer text-md font-semibold hover:opacity-90 transition"
          >
            Sign In
          </button>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}
        </form>

        <p className="mt-6 text-center text-base-content/70 text-sm opacity-70">
          Not a whisperer?{" "}
          <Link
            href="/register"
            className="font-semibold text-white hover:opacity-80"
          >
            Register
          </Link>
        </p>

        {/* Accent bar */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-cyan-900" />
      </motion.div>
    </>
  );
}
