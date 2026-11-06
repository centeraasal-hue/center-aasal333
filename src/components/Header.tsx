import React, { useState } from 'react';
import {
  ShoppingBag,
  CreditCard,
  Search,
  Menu,
  X,
  MapPin,
  Tag,
  ShieldCheck,
  Compass,
  Sparkles,
  Phone
} from 'lucide-react';

interface Props {
  cartCount: number;
  onOpenCart: () => void;
  onOpenLoyalty: () => void;
  onOpenOffers: () => void;
  onOpenBranches: () => void;
  onOpenTrack: () => void;
  onOpenCatalog: (category?: string) => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  onSearchChange: (search: string) => void;
  searchQuery: string;
}

export const Header: React.FC<Props> = ({
  cartCount,
  onOpenCart,
  onOpenLoyalty,
  onOpenOffers,
  onOpenBranches,
  onOpenTrack,
  onOpenCatalog,
  onOpenAdmin,
  isAdminLoggedIn,
  onSearchChange,
  searchQuery
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Brand Identity */}
          <div
            onClick={() => onOpenCatalog()}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-sky-200 group-hover:scale-105 transition-transform border-2 border-white">
              <span className="font-extrabold text-2xl tracking-tighter font-serif text-amber-200 drop-shadow-xs">ع</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl sm:text-2xl text-slate-800 tracking-tight">سنتر العسال</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-sm border border-amber-300">
                  مفروشات
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-cyan-700 font-semibold">
                <span className="tracking-wide">Al-Assal With You</span>
                <span className="text-amber-500">✦</span>
                <span className="text-slate-500">الإسكندرية</span>
              </div>
            </div>
          </div>

          {/* Search bar on desktop */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="ابحث عن ملايات، بطاطين، فوط، لحف عرايس..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  onOpenCatalog();
                }}
                className="w-full bg-sky-50/70 border border-sky-200 rounded-full py-2.5 pr-10 pl-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-cyan-600 absolute right-3.5 top-3" />
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <button
              onClick={() => onOpenCatalog()}
              className="hover:text-cyan-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>المتجر</span>
            </button>
            <button
              onClick={onOpenOffers}
              className="hover:text-cyan-600 transition-colors cursor-pointer flex items-center gap-1 text-sky-700 font-bold"
            >
              <Tag className="w-4 h-4 text-amber-500" />
              <span>عروض العسال</span>
            </button>
            <button
              onClick={onOpenLoyalty}
              className="hover:text-cyan-600 transition-colors cursor-pointer flex items-center gap-1 text-cyan-700 font-bold"
            >
              <CreditCard className="w-4 h-4 text-cyan-600" />
              <span>كارت العسال</span>
            </button>
            <button
              onClick={onOpenTrack}
              className="hover:text-cyan-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Compass className="w-4 h-4 text-sky-600" />
              <span>تتبع طلبك</span>
            </button>
            <button
              onClick={onOpenBranches}
              className="hover:text-cyan-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>الفروع</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-cyan-600 hover:bg-sky-50 transition-colors"
              title="بحث"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Loyalty Card Badge Button */}
            <button
              onClick={onOpenLoyalty}
              className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-cyan-200 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>كارت العسال</span>
            </button>

            {/* Cart Drawer Trigger */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center justify-center p-2.5 bg-sky-50 hover:bg-sky-100 text-cyan-700 rounded-xl transition-all cursor-pointer border border-sky-200/80 group"
              title="سلة المشتريات"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Portal Button */}
            <button
              onClick={onOpenAdmin}
              className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                isAdminLoggedIn
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-500 hover:text-cyan-700 hover:bg-sky-50 border-slate-200'
              }`}
              title={isAdminLoggedIn ? 'لوحة تحكم الإدارة (مسجل دخول)' : 'دخول الإدارة'}
            >
              <ShieldCheck className="w-5 h-5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-700 hover:text-cyan-600 rounded-xl hover:bg-sky-50 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile search bar dropdown */}
        {searchOpen && (
          <div className="lg:hidden pb-3 pt-1">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="ابحث عن المنتجات والمفروشات..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  onOpenCatalog();
                }}
                className="w-full bg-sky-50 border border-sky-200 rounded-full py-2 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                autoFocus
              />
              <Search className="w-4 h-4 text-cyan-600 absolute right-3.5 top-2.5" />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-sky-100 px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <button
            onClick={() => {
              onOpenCatalog();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-sky-50 hover:text-cyan-600 text-right"
          >
            <ShoppingBag className="w-5 h-5 text-cyan-600" />
            <span>تصفح متجر المفروشات</span>
          </button>

          <button
            onClick={() => {
              onOpenOffers();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-sky-50 hover:text-cyan-600 text-right"
          >
            <Tag className="w-5 h-5 text-amber-500" />
            <span>عروض العسال الحصرية والخصومات</span>
          </button>

          <button
            onClick={() => {
              onOpenLoyalty();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-cyan-700 bg-sky-50/80 hover:bg-sky-100 text-right border border-sky-200"
          >
            <CreditCard className="w-5 h-5 text-cyan-600" />
            <span>كارت العسال ونظام المكافآت (Loyalty Card)</span>
          </button>

          <button
            onClick={() => {
              onOpenTrack();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-sky-50 hover:text-cyan-600 text-right"
          >
            <Compass className="w-5 h-5 text-sky-600" />
            <span>متابعة وتتبع حالة طلبك</span>
          </button>

          <button
            onClick={() => {
              onOpenBranches();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-sky-50 hover:text-cyan-600 text-right"
          >
            <MapPin className="w-5 h-5 text-rose-500" />
            <span>عناوين الفروع وموقع الخريطة</span>
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-2">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Phone className="w-3.5 h-3.5 text-cyan-600" />
              للتواصل: 01277714100
            </span>
            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="text-cyan-700 font-bold hover:underline"
            >
              {isAdminLoggedIn ? 'لوحة الإدارة' : 'دخول الإدارة'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
