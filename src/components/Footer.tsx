import React from 'react';
import {
  MapPin,
  Phone,
  MessageCircle,
  CreditCard,
  Tag,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  Heart
} from 'lucide-react';
import { SiteSettings } from '../types';

interface Props {
  settings: SiteSettings | null;
  onOpenCatalog: () => void;
  onOpenLoyalty: () => void;
  onOpenOffers: () => void;
  onOpenBranches: () => void;
  onOpenTrack: () => void;
  onOpenAdmin: () => void;
  onOpenChat: () => void;
}

export const Footer: React.FC<Props> = ({
  settings,
  onOpenCatalog,
  onOpenLoyalty,
  onOpenOffers,
  onOpenBranches,
  onOpenTrack,
  onOpenAdmin,
  onOpenChat
}) => {
  return (
    <footer className="bg-white border-t border-sky-100 pt-12 pb-8 text-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-sky-200">
                <span className="font-extrabold text-2xl font-serif text-amber-200">ع</span>
              </div>
              <div>
                <span className="font-black text-xl text-slate-800 tracking-tight block">سنتر العسال</span>
                <span className="text-xs text-cyan-700 font-bold">Al-Assal With You • تجارة المفروشات</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              رواد تجارة وتجهيز المفروشات بالإسكندرية. أحدث تشكيلات الملايات القطنية، البطاطين الإسبانية والتركية، وأطقم العرائس الملكية بجودة لا تضاهى.
            </p>

            <div className="inline-flex items-center gap-1.5 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100 text-xs font-bold text-cyan-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>العسال معاك.. كل يوم عرض ومكافأة جديدة</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 border-b border-sky-100 pb-2">
              روابط سريعة
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-600">
              <li>
                <button onClick={onOpenCatalog} className="hover:text-cyan-700 transition-colors flex items-center gap-1.5 cursor-pointer">
                  <ShoppingBag className="w-3.5 h-3.5 text-cyan-600" />
                  <span>تصفح متجر المفروشات</span>
                </button>
              </li>
              <li>
                <button onClick={onOpenOffers} className="hover:text-cyan-700 transition-colors flex items-center gap-1.5 cursor-pointer">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>عروض العسال والخصومات</span>
                </button>
              </li>
              <li>
                <button onClick={onOpenLoyalty} className="hover:text-cyan-700 transition-colors flex items-center gap-1.5 cursor-pointer">
                  <CreditCard className="w-3.5 h-3.5 text-cyan-600" />
                  <span>كارت العسال ونظام المكافآت</span>
                </button>
              </li>
              <li>
                <button onClick={onOpenTrack} className="hover:text-cyan-700 transition-colors flex items-center gap-1.5 cursor-pointer">
                  <span>تتبع طلبك برقم المتابعة</span>
                </button>
              </li>
              <li>
                <button onClick={onOpenChat} className="hover:text-cyan-700 transition-colors flex items-center gap-1.5 cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>مساعد سنتر العسال الذكي</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Branches in Alexandria */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 border-b border-sky-100 pb-2">
              فروعنا بالإسكندرية
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-100 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  المعرض الرئيسي:
                </span>
                <p className="text-slate-500 pr-4">8 شارع أنور السادات – الإسكندرية</p>
              </div>

              <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-100 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  الفرع الثاني:
                </span>
                <p className="text-slate-500 pr-4">95 عمود السواري – كرموز – الإسكندرية</p>
              </div>

              <button
                onClick={onOpenBranches}
                className="text-cyan-700 font-bold hover:underline cursor-pointer block pt-1"
              >
                عرض مواقع الفروع على الخريطة ←
              </button>
            </div>
          </div>

          {/* Contacts & Working Hours */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 border-b border-sky-100 pb-2">
              تواصل معنا
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600">
              <a
                href="tel:01277714100"
                className="flex items-center gap-2 font-mono font-bold text-slate-800 hover:text-cyan-700 transition-colors"
                dir="ltr"
              >
                <Phone className="w-4 h-4 text-cyan-600" />
                <span>01277714100</span>
              </a>

              <a
                href="tel:01279207793"
                className="flex items-center gap-2 font-mono font-bold text-slate-800 hover:text-cyan-700 transition-colors"
                dir="ltr"
              >
                <Phone className="w-4 h-4 text-cyan-600" />
                <span>01279207793</span>
              </a>

              <a
                href="https://api.whatsapp.com/send?phone=201277714100"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>محادثة واتساب سريعة</span>
              </a>

              <p className="text-[11px] text-slate-400 pt-1">
                مواعيد العمل: يومياً من 11 صباحاً حتى 11 مساءً
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} سنتر العسال لتجارة المفروشات (Al-Assal With You). جميع الحقوق محفوظة.</p>
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              صُنع بكل <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> لخدمة أهل الإسكندرية
            </span>

            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 text-slate-400 hover:text-cyan-700 font-bold transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>بوابة الإدارة</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
