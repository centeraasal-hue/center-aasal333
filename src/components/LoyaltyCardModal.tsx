import React, { useState } from 'react';
import {
  CreditCard,
  Gift,
  Share2,
  CheckCircle2,
  Sparkles,
  QrCode,
  Copy,
  Check,
  Phone,
  User,
  History,
  AlertCircle,
  X,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Customer, Reward } from '../types';
import { lookupCustomer, registerCustomer, redeemReward } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rewards: Reward[];
  activeCustomer: Customer | null;
  setActiveCustomer: (c: Customer | null) => void;
}

export const LoyaltyCardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  rewards,
  activeCustomer,
  setActiveCustomer
}) => {
  const [tab, setTab] = useState<'card' | 'rewards' | 'referral' | 'history'>('card');
  const [lookupPhone, setLookupPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regReferral, setRegReferral] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!lookupPhone.trim()) {
      setErrorMsg('يرجى كتابة رقم الهاتف للبحث');
      return;
    }

    setLoading(true);
    try {
      const data = await lookupCustomer(lookupPhone);
      setActiveCustomer(data.customer);
      setCustomerDetails(data);
      setSuccessMsg(`أهلاً بك يا ${data.customer.name}! رصيدك الحالي هو ${data.customer.points} نقطة.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'لم نجد عضوية مسجلة بهذا الرقم. يمكنك الاشتراك الآن مجاناً!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regPhone.trim()) {
      setErrorMsg('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }

    setLoading(true);
    try {
      const res = await registerCustomer({
        name: regName,
        phone: regPhone,
        referralCode: regReferral.trim() || undefined
      });
      setActiveCustomer(res.customer);
      setSuccessMsg(res.message);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل التسجيل في كارت العسال');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!activeCustomer) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (activeCustomer.points < reward.points_required) {
      setErrorMsg(`رصيدك (${activeCustomer.points} نقطة) غير كافٍ لهذه المكافأة (${reward.points_required} نقطة). تضاف النقاط مع مشترياتك المؤكدة!`);
      return;
    }

    setLoading(true);
    try {
      const res = await redeemReward(activeCustomer.phone, reward.id);
      setActiveCustomer(res.updatedCustomer);
      setSuccessMsg(res.message);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 }
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل استبدال المكافأة');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (!activeCustomer) return;
    navigator.clipboard.writeText(activeCustomer.referral_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareViaWhatsApp = () => {
    if (!activeCustomer) return;
    const text = encodeURIComponent(
      `مرحباً! جربت مفروشات سنتر العسال بالإسكندرية وخاماتهم وملاياتهم والبطاطين ممتازة جداً. استخدم كود دعوتي (${activeCustomer.referral_code}) عند الشراء واستفد بأقوى عروض المفروشات وتجهيز العرائس!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-sky-100 max-h-[92vh] overflow-y-auto relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-sky-50 hover:bg-sky-100 text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-sky-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs mb-2">
            <CreditCard className="w-3.5 h-3.5 text-amber-300" />
            <span>نظام ولاء عملاء سنتر العسال</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            كارت العسال والمكافآت (Al-Assal Card)
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            اجمع نقاطاً مع كل عملية شراء مؤكدة واستبدلها بهدايا وخصومات فورية
          </p>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* If NO active customer, show Login / Register Tabs */}
        {!activeCustomer ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Lookup Existing Member */}
              <div className="bg-sky-50/70 p-5 rounded-3xl border border-sky-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-cyan-800 font-extrabold text-sm mb-1">
                    <Phone className="w-4 h-4 text-cyan-600" />
                    <span>لديك كارت مسجل بالفعل؟</span>
                  </div>
                  <p className="text-slate-500 text-xs mb-4">
                    اكتب رقم هاتفك لعرض الكارت والرصيد والهدايا
                  </p>
                  <form onSubmit={handleLookup} className="space-y-3">
                    <div>
                      <input
                        type="tel"
                        placeholder="رقم الهاتف (مثل: 01277714100)"
                        value={lookupPhone}
                        onChange={(e) => setLookupPhone(e.target.value)}
                        className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 text-center font-bold tracking-wider"
                        dir="ltr"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                    >
                      {loading ? 'جاري البحث...' : 'عرض كارت العسال ورصيدي'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Register New Member */}
              <div className="bg-gradient-to-br from-amber-50 to-sky-50 p-5 rounded-3xl border border-amber-200">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>انضم لكارت العسال مجاناً</span>
                </div>
                <p className="text-slate-600 text-xs mb-3">
                  سجل بالاسم ورقم الهاتف واحصل على رقم عضويتك وكود دعوة أصدقائك
                </p>
                <form onSubmit={handleRegister} className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="اسمك الكريم"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <input
                    type="tel"
                    placeholder="رقم الهاتف للتواصل وإضافة النقاط"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 text-center font-bold"
                    dir="ltr"
                  />
                  <input
                    type="text"
                    placeholder="كود دعوة من صديق (اختياري)"
                    value={regReferral}
                    onChange={(e) => setRegReferral(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400 text-center font-mono uppercase"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black py-2.5 rounded-xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                  >
                    {loading ? 'جاري التفعيل...' : 'تفعيل الكارت الرقمي فوراً'}
                  </button>
                </form>
              </div>

            </div>

            {/* Loyalty Program Rules Highlight */}
            <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 text-xs text-slate-600 space-y-1.5">
              <p className="font-bold text-cyan-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                كيف يعمل نظام كارت العسال؟
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-500 pr-2">
                <li>لا تُمنح النقاط لمجرد التسجيل، بل تُحسب تلقائياً فور تأكيد وتنفيذ أي طلب شراء حقيقي (10 نقاط لكل 100 جنيه).</li>
                <li>يمنحك نظام "ادعُ صديقك" 50 نقطة هدية فور تأكيد أول طلب شراء لصديقك.</li>
                <li>استبدل نقاطك بأطقم فوط هدايا، ملايات قطن وقسائم خصم فورية على فاتورتك.</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Active Member Screen */
          <div className="space-y-6">
            
            {/* Virtual Membership Card Visual */}
            <div className="relative rounded-3xl p-6 text-white shadow-xl overflow-hidden bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-700 border-2 border-white/50">
              {/* Golden corner flourishes */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/15 rounded-bl-full pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/10 rounded-tr-full pointer-events-none"></div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-amber-300 text-xl font-serif">
                    ع
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg tracking-wide text-white">كارت العسال الرقمي</h3>
                    <p className="text-[10px] text-cyan-100 font-semibold">Al-Assal VIP Loyalty Club</p>
                  </div>
                </div>

                <div className="text-left">
                  <span className="text-[10px] text-cyan-100 font-mono block">رقم العضوية</span>
                  <span className="font-mono font-black text-amber-300 text-sm sm:text-base tracking-wider bg-black/10 px-2 py-0.5 rounded-md">
                    {activeCustomer.membership_id}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 items-end">
                <div>
                  <span className="text-[11px] text-cyan-100 block font-medium">اسم حامل الكارت</span>
                  <p className="font-black text-base sm:text-lg text-white truncate">{activeCustomer.name}</p>
                  <p className="text-xs text-cyan-200 font-mono" dir="ltr">{activeCustomer.phone}</p>
                </div>

                <div className="text-left bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                  <span className="text-[11px] text-cyan-100 block font-medium">رصيد النقاط الفعالة</span>
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-amber-300">{activeCustomer.points}</span>
                    <span className="text-xs font-bold text-white">نقطة</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] text-cyan-100">
                <span>سنتر العسال لتجارة المفروشات • الإسكندرية</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  عضوية معتمدة
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-sky-100 text-xs sm:text-sm font-bold">
              <button
                onClick={() => setTab('card')}
                className={`flex-1 py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
                  tab === 'card'
                    ? 'border-cyan-600 text-cyan-700 bg-sky-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                المكافآت المتاحة
              </button>

              <button
                onClick={() => setTab('referral')}
                className={`flex-1 py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
                  tab === 'referral'
                    ? 'border-cyan-600 text-cyan-700 bg-sky-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                ادعُ صديقك (اربح 50 نقطة)
              </button>

              <button
                onClick={() => setTab('history')}
                className={`flex-1 py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
                  tab === 'history'
                    ? 'border-cyan-600 text-cyan-700 bg-sky-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                سجل النقاط
              </button>
            </div>

            {/* Tab 1: Available Rewards to Redeem */}
            {tab === 'card' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  اختر المكافأة أو الهدية المناسبة لرصيدك واستلمها فوراً من المعرض أو مع طلبك القادم:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rewards.map((reward) => {
                    const canRedeem = activeCustomer.points >= reward.points_required;
                    return (
                      <div
                        key={reward.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          canRedeem
                            ? 'bg-white border-cyan-200 shadow-xs hover:border-cyan-400'
                            : 'bg-slate-50/70 border-slate-200 opacity-80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-extrabold text-sm text-slate-800">
                              {reward.title}
                            </span>
                            <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2 py-0.5 rounded-full">
                              {reward.points_required} نقطة
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed mb-3">
                            {reward.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleRedeem(reward)}
                          disabled={!canRedeem || loading}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            canRedeem
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>{canRedeem ? 'استبدال هذه المكافأة الآن' : `تحتاج ${reward.points_required - activeCustomer.points} نقطة إضافية`}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Refer a Friend */}
            {tab === 'referral' && (
              <div className="bg-gradient-to-br from-amber-50 to-sky-50 p-5 rounded-3xl border border-amber-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-amber-600" />
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-800">
                    نظام دعوة الأصدقاء – شارك واربح 50 نقطة
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  شارك كود دعوتك الخاص مع أصدقائك وأقاربك. عند استخدام الكود في سلة المشتريات وإتمام أول عملية شراء مؤكدة، ستتم إضافة 50 نقطة فورية إلى كارت العسال الخاص بك!
                </p>

                <div className="bg-white p-3.5 rounded-2xl border border-amber-300 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">كود الدعوة الخاص بك:</span>
                    <span className="text-lg font-black text-amber-700 font-mono tracking-widest">{activeCustomer.referral_code}</span>
                  </div>
                  <button
                    onClick={copyReferralCode}
                    className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'تم النسخ' : 'نسخ الكود'}</span>
                  </button>
                </div>

                <button
                  onClick={shareViaWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs sm:text-sm shadow-md shadow-emerald-200 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة الكود فوراً عبر واتساب</span>
                </button>
              </div>
            )}

            {/* Tab 3: History & Rules */}
            {tab === 'history' && (
              <div className="space-y-3">
                <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between font-bold text-slate-800 mb-2">
                    <span>حالة الحساب وتأكيد العمليات:</span>
                    <span className="text-cyan-700">عضوية نشطة</span>
                  </div>
                  <p>تتم مراجعة وإضافة النقاط من خلال الإدارة فور تسليم أو استلام الطلب من المعرض لضمان صحة المعاملات ومنع أي تكرار.</p>
                </div>

                {customerDetails?.history && customerDetails.history.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">آخر حركات النقاط:</p>
                    {customerDetails.history.map((h: any) => (
                      <div key={h.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-800">{h.reason}</p>
                          <span className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleDateString('ar-EG')}</span>
                        </div>
                        <span className={`font-black ${h.points_change > 0 ? 'text-emerald-600' : 'text-rose-600'}`} dir="ltr">
                          {h.points_change > 0 ? `+${h.points_change}` : h.points_change} نقطة
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    لم تسجل أي حركات نقاط سابقة حتى الآن. ستظهر هنا فور تأكيد طلباتك!
                  </div>
                )}
              </div>
            )}

            {/* Logout from Loyalty View */}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400">للاستفسار: 01277714100</span>
              <button
                onClick={() => {
                  setActiveCustomer(null);
                  setCustomerDetails(null);
                }}
                className="text-rose-500 hover:underline font-bold"
              >
                تبديل الحساب / تسجيل خروج
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
