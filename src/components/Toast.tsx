"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      const closeTimer = setTimeout(onClose, 200);
      return () => clearTimeout(closeTimer);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-50 mx-auto max-w-[480px] transition-all duration-200 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <div
        className={`rounded-lg px-4 py-3 text-center text-sm font-medium text-white ${
          type === "success" ? "bg-green-600" : "bg-red-600"
        }`}
      >
        {message}
      </div>
    </div>
  );
}
