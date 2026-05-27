"use client";

import { useRef, useState } from "react";
import type { Dayjs } from "dayjs";
import { CalendarDays } from "lucide-react";
import IconButton from "../GlobalComponents/IconButtons";
import { DesktopDatePicker } from "@mui/x-date-pickers";

interface DateFilterProps {
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
}

export default function DateFilter({ value, onChange }: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className="relative">
      {/* Icon trigger */}
      <IconButton
        ref={anchorRef}
        ariaLabel="Select date"
        onClick={() => setOpen(true)}
        className={`${open && "bg-base-content/10"}`}
      >
        <CalendarDays size={18} />
      </IconButton>

      <DesktopDatePicker
        open={open}
        disableFuture
        onClose={() => setOpen(false)}
        value={value}
        onChange={(newValue) => {
          onChange(newValue);
          setOpen(false);
        }}
        slotProps={{
          textField: {
            sx: { display: "none" },
          },
          popper: {
            anchorEl: anchorRef.current,
            placement: "bottom-end",
            sx: {
              zIndex: 1500,
            },
          },

          desktopPaper: {
            sx: {
              borderRadius: "1rem",

              overflow: "hidden",
              boxShadow:
                "0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1)",
            },
          },
        }}
      />
    </div>
  );
}
