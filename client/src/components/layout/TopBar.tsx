import React, { useState, useEffect } from 'react';
import { Search, Bell, Plus, Sun, Moon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { alertsApi, searchApi } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import { DaysLeftPill } from '../ui/DaysLeftPill';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface TopBarProps {
  onAddItem: () => void;
  onSelectItem?: (id: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onAddItem, onSelectItem }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('vigil-theme', 'dark');
  const navigate = useNavigate();

  // Debounced search query
  const debouncedSearch = useDebounce(searchQuery, 250);

  // Sync theme to root class
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fetch pending alerts count
  const { data: pendingAlerts = [] } = useQuery({
    queryKey: ['pending-alerts'],
    queryFn: alertsApi.getPending,
    refetchInterval: 30000,
  });

  // Search query
  const { data: searchResults = [] } = useQuery({
    queryKey: ['quick-search', debouncedSearch],
    queryFn: () => searchApi.query(debouncedSearch),
    enabled: debouncedSearch.trim().length > 1,
  });

  return (
    <header className="h-16 px-6 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between sticky top-0 z-30">
      {/* Global Search Bar */}
      <div className="relative w-80 lg:w-96">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            placeholder="Search licenses, contracts, domains..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && debouncedSearch.trim().length > 1 && (
          <div
            className="absolute left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto"
            onMouseLeave={() => setShowSearchResults(false)}
          >
            {searchResults.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-500">
                No matching items found
              </div>
            ) : (
              searchResults.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setShowSearchResults(false);
                    setSearchQuery('');
                    if (onSelectItem) {
                      onSelectItem(item.id);
                    } else {
                      navigate(`/items?id=${item.id}`);
                    }
                  }}
                  className="flex items-center justify-between p-2.5 hover:bg-zinc-800/80 rounded-lg cursor-pointer transition text-xs"
                >
                  <div className="overflow-hidden pr-2">
                    <p className="font-semibold text-zinc-200 truncate">{item.name}</p>
                    <p className="text-[11px] text-zinc-500">{item.category_name || 'Uncategorized'}</p>
                  </div>
                  <DaysLeftPill days={item.days_until_expiry} showIcon={false} />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Pending Alerts Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            className="relative p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
            title="Pending Alerts"
          >
            <Bell className="w-4 h-4" />
            {pendingAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-zinc-950 animate-pulse" />
            )}
          </button>

          {/* Alerts Dropdown */}
          {showAlertsDropdown && (
            <div
              className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-3 z-50"
              onMouseLeave={() => setShowAlertsDropdown(false)}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                <span className="text-xs font-semibold text-zinc-200">Pending Alerts</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium border border-red-500/20">
                  {pendingAlerts.length} Active
                </span>
              </div>

              {pendingAlerts.length === 0 ? (
                <div className="py-4 text-center text-xs text-zinc-500">
                  All alerts clear. No impending deadlines violated.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pendingAlerts.slice(0, 5).map((a: any) => (
                    <div
                      key={a.id}
                      className="p-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-200 truncate max-w-[170px]">
                          {a.item_name}
                        </span>
                        <span className="text-[10px] text-red-400 font-mono">
                          {a.days_before}d warning
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Expires {a.expiry_date}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Item Button */}
        <button
          onClick={onAddItem}
          className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Item</span>
        </button>
      </div>
    </header>
  );
};
