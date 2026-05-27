import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface AppButtonProps extends HTMLMotionProps<"button"> {
  isLoading?: boolean;
  color?: string;
  animate?: boolean;
}

const AppButton: React.FC<AppButtonProps> = ({
  children,
  disabled = false,
  isLoading = false,
  className = "",
  type = "button",
  color,
  animate = true,
  ...props
}) => {
  return (
    <motion.button
      type={type}
      disabled={disabled || isLoading}
      whileTap={animate ? { scale: 0.96 } : undefined}
      // whileHover={animate ? { scale: 1.02 } : undefined}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30
      }}
      className={`btn btn-sm rounded-full px-4 cursor-pointer border border-base-content/10 text-white opacity-80 hover:opacity-100 transition ${
        color ?? "bg-cyan-950"
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="loading loading-dots loading-xs"></span>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default AppButton;