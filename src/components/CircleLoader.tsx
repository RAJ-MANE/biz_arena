import React from "react";

export function CircleLoader({ size = 48, color = "#2563eb" }) {
  return (
    <div className="flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        className="animate-spin"
        style={{ display: "block" }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray="31.4 31.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
