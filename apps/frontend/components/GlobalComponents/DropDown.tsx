"use client";

import { useEffect, useRef, useState } from "react";

interface DropdownProps<T> {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  renderLabel?: (value: T) => React.ReactNode;
}

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  renderLabel,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2"
      >
        {renderLabel ? renderLabel(value) : value}
      </button>

      {open && (
        <ul className="absolute right-0 mt-2 z-[100] menu p-2 shadow-lg bg-base-200 border border-base-content/10 rounded-box w-44">
          {options.map((opt) => (
            <li key={opt}>
              <button
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`capitalize ${
                  opt === value ? "active font-medium" : ""
                }`}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}