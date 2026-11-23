import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Compass,
  Users,
  LayoutGrid,
  MapPin,
  PhoneCall,
} from 'lucide-react';

export type MobileNavTab =
  | 'dashboard'
  | 'jalur'
  | 'riset'
  | 'pipeline'
  | 'rute'
  | 'lapangan'
  | 'lainnya';

interface MobileBottomNavProps {
  activeTab: MobileNavTab;
  isMoreOpen: boolean;
  isOtherViewActive?: boolean;
  role?: string;
  onSelectTab: (tab: MobileNavTab) => void;
}

const DEFAULT_NAV_ITEMS: {
  id: MobileNavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jalur', label: 'Jalur Proyek', icon: Layers },
  { id: 'riset', label: 'Riset Pasar', icon: Compass },
  { id: 'pipeline', label: 'Pipeline', icon: Users },
  { id: 'lainnya', label: 'Lainnya', icon: LayoutGrid },
];

const SE_NAV_ITEMS: {
  id: MobileNavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pipeline', label: 'Pipeline', icon: Users },
  { id: 'rute', label: 'Rute', icon: MapPin },
  { id: 'lapangan', label: 'Absen & Call', icon: PhoneCall },
  { id: 'lainnya', label: 'Lainnya', icon: LayoutGrid },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  isMoreOpen,
  isOtherViewActive = false,
  role,
  onSelectTab,
}) => {
  const navItems = role === 'SE' ? SE_NAV_ITEMS : DEFAULT_NAV_ITEMS;
  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-white border-t border-warmborder pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.id === 'lainnya'
              ? isMoreOpen || isOtherViewActive
              : !isMoreOpen && !isOtherViewActive && activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive && item.id !== 'lainnya' ? 'page' : undefined}
              aria-expanded={item.id === 'lainnya' ? isMoreOpen : undefined}
              aria-controls={item.id === 'lainnya' ? 'mobile-more-sheet' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-1 transition-colors cursor-pointer active:bg-sandstone/70 ${
                isActive ? 'text-terracotta font-bold' : 'text-warmmuted font-medium hover:text-espresso'
              }`}
            >
              {/* Indikator aktif berbasis bentuk (garis atas 2px) */}
              <span
                aria-hidden="true"
                className={`absolute top-0 inset-x-3 h-0.5 rounded-b-full transition-opacity ${
                  isActive ? 'bg-terracotta opacity-100' : 'opacity-0'
                }`}
              />
              <Icon className={`size-5 shrink-0 ${isActive ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
              <span className="text-[10px] leading-tight tracking-tight truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
