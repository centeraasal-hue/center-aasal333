import React from 'react';
import {
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Navigation,
  ExternalLink,
  X,
  Sparkles,
  Building2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BranchesModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-sky-100 max-h-[90vh] overflow-y-auto relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-sky-50 hover:bg-sky-100 text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-sky-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Building2 className="w-3.5 h-3.5 text-amber-300" />
            <span>معارض سنتر العسال بالإسكندرية</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            فروعنا ووسائل التواصل
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            يسعدنا تشريفكم لمعاينة واختيار أرقى المفروشات وتجهيزات العرائس من معارضنا مباشرة
          </p>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Branch 1 */}
          <div className="bg-sky-50/70 p-5 rounded-3xl border border-sky-200/80 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center text-xs font-black">
                  1
                </span>
                <h3 className="font-extrabold text-base text-slate-800">المعرض الرئيسي</h3>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-600 font-semibold mb-3">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>8 شارع أنور السادات – الإسكندرية</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <Clock className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>يومياً من 11:00 صباحاً حتى 11:00 مساءً</span>
              </div>
            </div>

            <div className="pt-3 border-t border-sky-200/60 flex flex-col gap-2">
              <a
                href="https://maps.google.com/?q=8+Anwar+El+Sadat+St+Alexandria+Egypt"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-white hover:bg-sky-100 text-cyan-800 border border-sky-300 py-2.5 rounded-xl text-xs font-bold transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-cyan-600" />
                <span>فتح موقع المعرض على Google Maps</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Branch 2 */}
          <div className="bg-sky-50/70 p-5 rounded-3xl border border-sky-200/80 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs font-black">
                  2
                </span>
                <h3 className="font-extrabold text-base text-slate-800">الفرع الثاني (كرموز)</h3>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-600 font-semibold mb-3">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>95 عمود السواري – كرموز – الإسكندرية</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <Clock className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>يومياً من 11:00 صباحاً حتى 11:00 مساءً</span>
              </div>
            </div>

            <div className="pt-3 border-t border-sky-200/60 flex flex-col gap-2">
              <a
                href="https://maps.google.com/?q=95+Pompey's+Pillar+Karmouz+Alexandria+Egypt"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-white hover:bg-sky-100 text-cyan-800 border border-sky-300 py-2.5 rounded-xl text-xs font-bold transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-cyan-600" />
                <span>فتح موقع المعرض على Google Maps</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

        </div>

        {/* Direct Contacts Bar */}
        <div className="mt-6 bg-gradient-to-r from-cyan-600 via-sky-600 to-cyan-700 text-white p-5 rounded-3xl shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <h4 className="font-bold text-sm sm:text-base">خدمة العملاء والطلبات السريعة</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-bold">
            <a
              href="tel:01277714100"
              className="flex items-center justify-center gap-2 bg-white text-slate-800 hover:bg-sky-50 py-3 rounded-2xl transition-colors shadow-xs"
            >
              <Phone className="w-4 h-4 text-cyan-600" />
              <span>اتصال مباشر: 01277714100</span>
            </a>

            <a
              href="tel:01279207793"
              className="flex items-center justify-center gap-2 bg-white text-slate-800 hover:bg-sky-50 py-3 rounded-2xl transition-colors shadow-xs"
            >
              <Phone className="w-4 h-4 text-cyan-600" />
              <span>اتصال مباشر: 01279207793</span>
            </a>

            <a
              href="https://api.whatsapp.com/send?phone=201277714100&text=مرحباً%20سنتر%20العسال،%20أريد%20الاستفسار%20عن%20المفروشات%20والعروض"
              target="_blank"
              rel="noreferrer"
              className="col-span-1 sm:col-span-2 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl transition-colors shadow-md"
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span>محادثة فورية عبر واتساب (WhatsApp)</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
