'use client';

import React from 'react';
import { useToastStore } from '@/lib/stores/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = {
            success: CheckCircle2,
            error: AlertCircle,
            info: Info,
          }[toast.type];

          const colorClass = {
            success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-450',
            error: 'border-rose-500/20 bg-rose-500/10 text-rose-450',
            info: 'border-clinical-500/20 bg-clinical-500/10 text-clinical-450',
          }[toast.type];

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start justify-between p-4 border rounded-xl backdrop-blur-md shadow-2xl ${colorClass}`}
            >
              <div className="flex gap-3">
                <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white leading-tight">{toast.title}</h4>
                  {toast.description && (
                    <p className="text-[11px] text-slate-300 leading-relaxed">{toast.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded transition"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
