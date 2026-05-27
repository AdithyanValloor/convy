"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  iconClassName?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  autoFocus = false,
  className = "",
  inputClassName = "",
  iconClassName = "",
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={16}
        aria-hidden
        className={`absolute text-base-content left-4 top-1/2 -translate-y-1/2 opacity-60 ${iconClassName}`}
      />
      <input
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className={`
          w-full h-10 pl-10 pr-4 text-sm rounded-full text-base-content outline-base-content/10 hover:outline
          bg-base-300 focus:outline
          ${inputClassName}
        `}
      />
    </div>
  );
}