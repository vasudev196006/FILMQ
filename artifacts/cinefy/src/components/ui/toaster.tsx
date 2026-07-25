import React, { useState, useEffect } from 'react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

const BlurRevealText: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [blurred, setBlurred] = useState(true);

  useEffect(() => {
    // Small delay before revealing to allow the toast entry animation to initiate
    const timer = setTimeout(() => setBlurred(false), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <span className={`inline-block transition-all duration-700 ease-out ${blurred ? 'filter blur-md opacity-30 select-none' : 'blur-0 opacity-100'}`}>
      {children}
    </span>
  );
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>
                  <BlurRevealText>{description}</BlurRevealText>
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
