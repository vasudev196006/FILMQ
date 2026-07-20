import React from 'react';
import { LucideIcon } from 'lucide-react';

export const EmptyState = ({ icon: Icon, title, message }: { icon: LucideIcon, title: string, message: string }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl max-w-md mx-auto my-12" data-testid="empty-state">
    <div className="size-16 rounded-full glass-pill flex items-center justify-center mb-6">
      <Icon className="size-8 text-primary" />
    </div>
    <h3 className="text-xl font-serif text-white mb-2">{title}</h3>
    <p className="text-slate-400">{message}</p>
  </div>
);
