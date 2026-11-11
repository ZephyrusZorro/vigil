import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Layers,
  FolderKanban,
  BellRing,
  Settings,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/items', label: 'Item Registry', icon: Layers },
    { to: '/categories', label: 'Categories', icon: FolderKanban },
    { to: '/settings', label: 'Rules & Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-zinc-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
          <Shield className="w-5 h-5 fill-white/10" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-white">Vigil</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 font-medium">Deadline Intelligence</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
          Workspace
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-zinc-800/80">
        <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-zinc-200">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Autonomous Engine</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Continuous background expiry verification active.
          </p>
        </div>
      </div>
    </aside>
  );
};
