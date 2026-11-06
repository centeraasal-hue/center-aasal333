import React from 'react';
import { Sparkles, Phone, MapPin, Tag } from 'lucide-react';

interface Props {
  announcement: string;
  onOpenOffers: () => void;
  onOpenBranches: () => void;
}

export const AnnouncementBar: React.FC<Props> = ({ announcement, onOpenOffers, onOpenBranches }) => {
  return (
    <div className="bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white text-xs sm:text-sm py-2 px-4 shadow-sm border-b border-sky-400/30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden text-center md:text-right">
          <span className="bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full text-xs shrink-0 flex items-center gap-1 shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-900 animate-spin" />
            جديد العسال
          </span>
          <p className="font-medium truncate text-sky-50">
            {announcement || 'مهرجان المفروشات وتجهيز العرائس بسنتر العسال بالإسكندرية! خصومات وهدايا كارت العسال'}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-xs font-medium">
          <button
            onClick={onOpenOffers}
            className="flex items-center gap-1 hover:text-amber-300 transition-colors cursor-pointer bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md"
          >
            <Tag className="w-3.5 h-3.5 text-amber-300" />
            <span>عروض اليوم</span>
          </button>

          <button
            onClick={onOpenBranches}
            className="flex items-center gap-1 hover:text-cyan-200 transition-colors cursor-pointer bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-200" />
            <span>فروع الإسكندرية</span>
          </button>

          <a
            href="tel:01277714100"
            className="hidden sm:flex items-center gap-1 hover:text-amber-200 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-amber-300" />
            <span dir="ltr">01277714100</span>
          </a>
        </div>
      </div>
    </div>
  );
};
