"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirm = (opts: ConfirmOptions | string): Promise<boolean> => {
    if (typeof opts === "string") {
      setOptions({ message: opts });
    } else {
      setOptions(opts);
    }
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver({ resolve });
    });
  };

  const handleConfirm = () => {
    resolver?.resolve(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    resolver?.resolve(false);
    setIsOpen(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancel} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-orange-100 w-full max-w-sm p-6 sm:p-8 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
              <AlertTriangle className="h-7 w-7 text-red-500" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {options.title || "Confirm Action"}
            </h3>
            <p className="text-sm text-gray-500 mb-8 whitespace-pre-wrap">
              {options.message}
            </p>
            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl h-11"
                onClick={handleCancel}
              >
                {options.cancelText || "Cancel"}
              </Button>
              <Button 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 border-transparent shadow-sm hover:shadow"
                onClick={handleConfirm}
              >
                {options.confirmText || "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
