import React, { useEffect, useState, useRef } from 'react';
import { Search, X, HeartHandshake, MapPin, TrendingUp, Calendar, BookOpen, Layers, ShieldCheck, Sparkles, LogIn, ArrowRight } from 'lucide-react';

interface PaletteItem {
  id: string;
  category: 'Fitur' | 'Paket' | 'Studi Kasus' | 'Aksi';
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWizard: () => void;
  onOpenLoveLetter: () => void;
  onOpenLogin: () => void;
  onOpenMarketResearch?: () => void;
  onOpenSalesTarget?: () => void;
  onOpenJalurProyek?: () => void;
  onScrollTo: (sectionId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenWizard,
  onOpenLoveLetter,
  onOpenLogin,
  onOpenMarketResearch,
  onOpenSalesTarget,
  onOpenJalurProyek,
  onScrollTo
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: PaletteItem[] = [
    {
      id: 'wizard',
      category: 'Aksi',
      title: 'Dapatkan Surat Cinta Gratis',
      subtitle: 'Mulai wizard unggah brosur, pricelist & koordinat',
      icon: Sparkles,
      action: () => { onClose(); onOpenWizard(); }
    },
    {
      id: 'login',
      category: 'Aksi',
      title: 'Masuk ke Platform Developer',
      subtitle: 'Akses dasbor sales, CRM & supervisi tim',
      icon: LogIn,
      action: () => { onClose(); onOpenLogin(); }
    },
    {
      id: 'love-letter',
      category: 'Fitur',
      title: 'Surat Cinta 99 Keunggulan',
      subtitle: 'Dokumen narasi editorial 99 poin faktual',
      icon: HeartHandshake,
      action: () => { onClose(); onOpenLoveLetter(); }
    },
    {
      id: 'market-research',
      category: 'Fitur',
      title: 'Riset Pasar & Radius 25 km',
      subtitle: '5 Persona pembeli, fasilitas publik & kompetitor',
      icon: MapPin,
      action: () => { 
        onClose(); 
        if (onOpenMarketResearch) onOpenMarketResearch();
        else onScrollTo('peta-demo'); 
      }
    },
    {
      id: 'sales-target',
      category: 'Fitur',
      title: 'Target Penjualan s.d. Sold Out',
      subtitle: 'Simulasi penyerapan unit per bulan & reverse funnel',
      icon: TrendingUp,
      action: () => { 
        onClose(); 
        if (onOpenSalesTarget) onOpenSalesTarget();
        else onScrollTo('alur-6-langkah'); 
      }
    },
    {
      id: 'jalur-proyek',
      category: 'Fitur',
      title: 'Jalur Proyek (8 Tahap Pipeline)',
      subtitle: 'Alur input brosur, riset, target, kalender hingga landing page',
      icon: Layers,
      action: () => { 
        onClose(); 
        if (onOpenJalurProyek) onOpenJalurProyek();
        else onScrollTo('alur-6-langkah'); 
      }
    },
    {
      id: 'content-calendar',
      category: 'Fitur',
      title: 'Kalender Konten 1 Bulan',
      subtitle: 'Jadwal multi-platform TOFU, MOFU, BOFU',
      icon: Calendar,
      action: () => { onClose(); onScrollTo('alur-6-langkah'); }
    },
    {
      id: 'playbook',
      category: 'Fitur',
      title: 'Playbook Penjualan & Rute Harian SE',
      subtitle: 'SOP sales, TL Full AI & SM Semi-AI',
      icon: BookOpen,
      action: () => { onClose(); onScrollTo('peran-ai'); }
    },
    {
      id: 'case-study',
      category: 'Studi Kasus',
      title: 'Studi Kasus: The Park Townhouse Sukoharjo',
      subtitle: '30 Unit Townhouse, 3 Cluster bernuansa Jepang',
      icon: ShieldCheck,
      action: () => { onClose(); onScrollTo('studi-kasus'); }
    },
    {
      id: 'pricing',
      category: 'Paket',
      title: 'Paket Langganan (Gold, Platinum, Diamond)',
      subtitle: 'Tabel perbandingan fitur & peran otomasi AI',
      icon: Layers,
      action: () => { onClose(); onScrollTo('paket-harga'); }
    }
  ];

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-espresso/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-xl bg-white border border-warmborder rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-warmborder gap-3 bg-sandstone/30">
          <Search className="size-5 text-warmmuted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari fitur, alur, paket, studi kasus... (Ketik atau pilih)"
            className="w-full bg-transparent text-sm font-semibold text-espresso focus:outline-none placeholder:text-warmmuted/70"
          />
          <button 
            onClick={onClose} 
            className="p-1 rounded-md text-warmmuted hover:text-espresso hover:bg-sandstone cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-warmborder/60">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-warmmuted">
              Tidak ada hasil untuk &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                    isSelected ? 'bg-amber-50 text-terracotta' : 'hover:bg-sandstone/60 text-espresso'
                  }`}
                >
                  <div className={`size-8 rounded-lg grid place-items-center shrink-0 ${
                    isSelected ? 'bg-terracotta text-white' : 'bg-sandstone text-warmmuted'
                  }`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-espresso truncate">{item.title}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sandstone text-warmmuted shrink-0 ml-2">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-warmmuted truncate mt-0.5">{item.subtitle}</p>
                  </div>
                  <ArrowRight className={`size-3.5 shrink-0 transition-transform ${
                    isSelected ? 'translate-x-0.5 text-terracotta' : 'text-transparent'
                  }`} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="px-4 py-2 bg-sandstone/50 border-t border-warmborder flex items-center justify-between text-[11px] text-warmmuted">
          <span>Tekan <kbd className="px-1.5 py-0.5 rounded bg-white border border-warmborder font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border border-warmborder font-mono text-[10px]">↓</kbd> untuk memilih</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-warmborder font-mono text-[10px]">ESC</kbd> untuk menutup</span>
        </div>
      </div>
    </div>
  );
};
