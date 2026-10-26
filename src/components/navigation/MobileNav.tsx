import React from 'react';
import { LayoutDashboard, BookOpen, TrendingUp, Calendar, Menu } from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenMobileMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMobileMenu,
}) => {
  const items = [
    { id: 'overview' as NavTab, label: 'Home', icon: LayoutDashboard },
    { id: 'journal' as NavTab, label: 'Journal', icon: BookOpen },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: TrendingUp },
    { id: 'calendar' as NavTab, label: 'Calendar', icon: Calendar },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E0E0E]/95 backdrop-blur-md border-t border-[#222222] px-2 py-2 flex items-center justify-around"
      aria-label="Mobile Navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center w-16 py-1 rounded-xl transition ${
              isActive ? 'text-[#D4AF37]' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
          </button>
        );
      })}

      {/* Menu / Secondary Tools */}
      <button
        onClick={onOpenMobileMenu}
        aria-label="More Options & Tools"
        className="flex flex-col items-center justify-center w-16 py-1 text-zinc-400 hover:text-zinc-200 rounded-xl transition"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-medium tracking-tight">More</span>
      </button>
    </nav>
  );
};
