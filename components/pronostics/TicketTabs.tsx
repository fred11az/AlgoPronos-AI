'use client';

import { Target, Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface Tab {
  id: string;
  label: string;
  icon: any;
  color: string;
}

const TABS: Tab[] = [
  { id: 'standard', label: 'Ticket du Jour', icon: Target, color: 'text-primary' },
  { id: 'montante', label: 'La Montante', icon: ShieldCheck, color: 'text-green-400' },
  { id: 'optimus',  label: "L'Optimus IA", icon: Zap, color: 'text-secondary' },
];

interface TicketTabsProps {
  activeTab: string;
  availableTypes: string[];
}

export function TicketTabs({ activeTab, availableTypes }: TicketTabsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isAvailable = availableTypes.includes(tab.id);
        
        if (tab.id !== 'standard' && !isAvailable) return null;

        return (
          <Link
            key={tab.id}
            href={`/pronostics?type=${tab.id}`}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all duration-300 ${
              isActive
                ? `bg-surface border-white/20 shadow-xl shadow-black/20 ${tab.color}`
                : 'bg-transparent border-transparent text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? tab.color : 'text-text-muted'}`} />
            <span className="font-bold text-sm uppercase tracking-tight">{tab.label}</span>
            {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse ml-1" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
