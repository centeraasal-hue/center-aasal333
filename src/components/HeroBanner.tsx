import React from 'react';
import {
  Sparkles,
  ShoppingBag,
  CreditCard,
  MapPin,
  CheckCircle2,
  Gift,
  ShieldCheck,
  Truck,
  ArrowLeft
} from 'lucide-react';
import { SiteSettings } from '../types';

interface Props {
  settings: SiteSettings | null;
  onOpenCatalog: () => void;
  onOpenLoyalty: () => void;
  onOpenOffers: () => void;
  onOpenBranches: () => void;
  onOpenChat: () => void;
}

export const HeroBanner: React.FC<Props> = ({
  settings,
  onOpenCatalog,
  onOpenLoyalty,
  onOpenOffers,
  onOpenBranches,
  onOpenChat
}) => {
  const title = settings?.welcome_title || 'العسال معاك.. كل يوم عرض ومكافأة جديدة';
  const subtitle = settings?.welcome_subtitle || 'سنتر العسال لتجارة المفروشات بالإسكندرية – وجهتك الأولى لأرقى المفروشات، الملايات القطنية، البطاطين الإسبانية والتركية وتجهيز العرائس بأفضل الأسعار وأعلى جودة.';

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-100/70 via-sky-50 to-white pt-8 pb-14 border-b border-sky-100">
      {/* Decorative cheerful background bubbles */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Hero Content */}
          <div className="lg:col-span-7 text-right space-y-6">
            
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 bg-white/90 border border-sky-200 shadow-xs px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold text-cyan-800">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping"></span>
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>سنتر العسال لتجارة المفروشات • بالإسكندرية</span>
            </div>

            {/* Main Welcome Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
              {title}
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
              {subtitle}
            </p>

            {/* Feature Checkpoints */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs sm:text-sm font-semibold text-slate-700">
              <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-sky-100 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>قطن مصري 100%</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-sky-100 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>بطاطين تركي وإسباني</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-sky-100 shadow-xs col-span-2 sm:col-span-1">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                <span>نقاط ومكافآت كارت العسال</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={onOpenCatalog}
                className="flex items-center gap-2 bg-gradient-to-r from-sky-500 via-cyan-600 to-sky-600 hover:from-sky-600 hover:to-cyan-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-md shadow-cyan-200 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm sm:text-base"
              >
                <ShoppingBag className="w-5 h-5 text-amber-200" />
                <span>تصفح أحدث المفروشات</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenLoyalty}
                className="flex items-center gap-2 bg-white hover:bg-sky-50 text-cyan-700 border-2 border-cyan-400 font-bold px-5 py-3.5 rounded-2xl shadow-xs transition-all cursor-pointer text-sm sm:text-base"
              >
                <CreditCard className="w-5 h-5 text-amber-500" />
                <span>كارت العسال ونقاطك</span>
              </button>

              <button
                onClick={onOpenChat}
                className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>اسأل المساعد الذكي</span>
              </button>
            </div>

            {/* Quick Branches Preview */}
            <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs text-slate-600">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                فروعنا بالإسكندرية:
              </span>
              <button
                onClick={onOpenBranches}
                className="hover:text-cyan-700 hover:underline cursor-pointer bg-white/70 px-2.5 py-1 rounded-lg border border-sky-100"
              >
                المعرض الرئيسي: 8 ش أنور السادات
              </button>
              <button
                onClick={onOpenBranches}
                className="hover:text-cyan-700 hover:underline cursor-pointer bg-white/70 px-2.5 py-1 rounded-lg border border-sky-100"
              >
                الفرع الثاني: 95 عمود السواري – كرموز
              </button>
            </div>

          </div>

          {/* Visual Showcase Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-white p-4 rounded-3xl shadow-xl shadow-sky-100 border border-sky-100 overflow-hidden">
              {/* Highlight badge */}
              <div className="absolute top-6 right-6 z-20 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-black text-xs px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-white">
                <Gift className="w-3.5 h-3.5 text-slate-950" />
                <span>تجهيز عرائس بالتقسيط والكاش</span>
              </div>

              {/* Main Image Banner */}
              <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"
                  alt="مفروشات سنتر العسال"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                  <span className="text-xs font-semibold text-cyan-200">أطقم سراير قطن عامري مطرزة</span>
                  <p className="font-extrabold text-lg text-white">خامات فاخرة تليق بكل بيت مصري</p>
                </div>
              </div>

              {/* Mini Features Footer */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-100">
                  <Truck className="w-4 h-4 text-cyan-600 mx-auto mb-1" />
                  <p className="text-[11px] font-bold text-slate-700">توصيل سريع</p>
                  <p className="text-[10px] text-slate-500">لكل الإسكندرية</p>
                </div>
                <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <p className="text-[11px] font-bold text-slate-700">معاينة قبل الاستلام</p>
                  <p className="text-[10px] text-slate-500">ضمان الجودة</p>
                </div>
                <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-100">
                  <CreditCard className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <p className="text-[11px] font-bold text-slate-700">كارت العسال</p>
                  <p className="text-[10px] text-slate-500">نقاط ومكافآت</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
