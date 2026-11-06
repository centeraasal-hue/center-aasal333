import React, { useState, useEffect } from 'react';
import { Tag, Clock, Copy, Check, Sparkles, ArrowLeft, Percent } from 'lucide-react';
import { Offer } from '../types';

interface Props {
  offers: Offer[];
  onApplyCouponToCart?: (code: string) => void;
  onOpenCatalog: () => void;
}

function getTimeRemaining(endDate: string) {
  const total = Date.parse(endDate) - Date.now();
  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { total, days, hours, minutes, seconds };
}

export const FeaturedOffers: React.FC<Props> = ({ offers, onApplyCouponToCart, onOpenCatalog }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-b from-white to-sky-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>خصومات حصرية ومحدودة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            عروض العسال الكبرى
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            استفد بأقوى التخفيضات اليومية والأسبوعية على أطقم السرير، البطاطين وتجهيز العرائس قبل انتهاء المؤقت!
          </p>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => {
            const timeLeft = getTimeRemaining(offer.end_date);
            const isExpired = timeLeft.total <= 0;

            return (
              <div
                key={offer.id}
                className="bg-white rounded-3xl p-6 shadow-md shadow-sky-100 border-2 border-sky-100 hover:border-cyan-300 transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Discount Badge */}
                <div className="absolute top-4 left-4 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" />
                  <span>خصم {offer.discount_percentage}%</span>
                </div>

                <div>
                  {/* Banner tag */}
                  {offer.banner_text && (
                    <span className="inline-block bg-sky-50 text-cyan-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-sky-200 mb-3">
                      {offer.banner_text}
                    </span>
                  )}

                  <h3 className="font-extrabold text-lg text-slate-800 group-hover:text-cyan-700 transition-colors leading-snug">
                    {offer.title}
                  </h3>

                  <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
                    {offer.description}
                  </p>

                  {/* Price before and after */}
                  {(offer.new_price || offer.old_price) && (
                    <div className="flex items-baseline gap-3 mt-4 pt-3 border-t border-slate-100">
                      {offer.new_price && (
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-cyan-700">{offer.new_price}</span>
                          <span className="text-xs font-bold text-slate-500">ج.م</span>
                        </div>
                      )}
                      {offer.old_price && (
                        <div className="flex items-baseline gap-1 text-slate-400 line-through text-sm">
                          <span>{offer.old_price}</span>
                          <span className="text-xs">ج.م</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Countdown Timer */}
                  <div className="mt-5 bg-sky-50/80 p-3 rounded-2xl border border-sky-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-600 animate-spin" />
                      <span>{isExpired ? 'انتهى وقت العرض' : 'متبقي على انتهاء العرض:'}</span>
                    </div>

                    {!isExpired ? (
                      <div className="grid grid-cols-4 gap-1.5 text-center" dir="ltr">
                        <div className="bg-white py-1.5 px-1 rounded-xl shadow-2xs border border-sky-100">
                          <span className="block text-base font-black text-cyan-700 leading-tight">{timeLeft.days}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">يوم</span>
                        </div>
                        <div className="bg-white py-1.5 px-1 rounded-xl shadow-2xs border border-sky-100">
                          <span className="block text-base font-black text-cyan-700 leading-tight">{timeLeft.hours}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">ساعة</span>
                        </div>
                        <div className="bg-white py-1.5 px-1 rounded-xl shadow-2xs border border-sky-100">
                          <span className="block text-base font-black text-cyan-700 leading-tight">{timeLeft.minutes}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">دقيقة</span>
                        </div>
                        <div className="bg-white py-1.5 px-1 rounded-xl shadow-2xs border border-sky-100">
                          <span className="block text-base font-black text-amber-600 leading-tight">{timeLeft.seconds}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">ثانية</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-rose-500 font-semibold text-center py-1">
                        انتظر العرض القادم غداً!
                      </div>
                    )}
                  </div>
                </div>

                {/* Promo Code & Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                  {offer.promo_code && (
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                      <div className="text-right">
                        <span className="text-[10px] text-amber-800 font-bold block">كود الخصم في السلة:</span>
                        <span className="text-sm font-black text-amber-950 font-mono tracking-wider">{offer.promo_code}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(offer.promo_code!)}
                        className="flex items-center gap-1 bg-white hover:bg-amber-100 text-amber-900 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-amber-300 transition-colors cursor-pointer"
                      >
                        {copiedCode === offer.promo_code ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (offer.promo_code && onApplyCouponToCart) {
                        onApplyCouponToCart(offer.promo_code);
                      }
                      onOpenCatalog();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                  >
                    <Tag className="w-4 h-4 text-amber-200" />
                    <span>تصفح المنتجات واستفد بالعرض</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
