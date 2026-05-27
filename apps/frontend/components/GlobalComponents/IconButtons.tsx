"use client";

import React, { forwardRef } from "react";

interface IconButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  tabIndex?: number;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { onClick, ariaLabel, children, className = "", disabled, tabIndex },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        disabled={disabled}
        tabIndex={tabIndex}
        className={`
          relative
          p-2
          rounded-full
          cursor-pointer
          overflow-hidden
          group
          text-base-content
          ${className}
        `}
      >
        <span
          className="
            absolute inset-0
            rounded-full
            scale-70
            duration-200
            ease-out
            group-hover:scale-100
            group-hover:bg-base-content/10
          "
        />

        <span className="relative z-10 flex items-center justify-center">
          {children}
        </span>
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
export default IconButton;