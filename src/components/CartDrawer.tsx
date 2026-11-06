import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Tag,
  Check,
  Send,
  Truck,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem } from '../types';
import { validateCoupon, submitOrder } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: number, qty: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  initialCouponCode?: string;
  onOpenTrack: () => void;
}

export const CartDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  initialCouponCode,
  onOpenTrack
}) => {
  const [promoCode, setPromoCode] = useState(initialCouponCode || '');
  const [discountInfo, setDiscountInfo] = useState<{
    code: string;
    percentage: number;
    amount: number;
    title: string;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Checkout form
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [pickupBranch, setPickupBranch] = useState('المعرض الرئيسي: 8 شارع أنور السادات');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = discountInfo ? Math.round((subtotal * discountInfo.percentage) / 100) : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await validateCoupon(promoCode, subtotal);
      setDiscountInfo({
        code: res.code,
        percentage: res.discountPercentage,
        amount: res.discountAmount,
        title: res.title
      });
    } catch (err: any) {
      setPromoError(err.message || 'كود غير صحيح');
      setDiscountInfo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setOrderError('يرجى كتابة الاسم ورقم الهاتف لإتمام الطلب');
      return;
    }

    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      setOrderError('يرجى تحديد عنوان التوصيل بالتفصيل داخل الإسكندرية');
      return;
    }

    setOrderLoading(true);
    try {
      const branchOrAddress = deliveryType === 'pickup' ? pickupBranch : deliveryAddress;
      const res = await submitOrder({
        customerName,
        customerPhone,
        deliveryType,
        branchOrAddress,
        notes: orderNotes,
        items: items.map(i => ({ id: i.product.id, quantity: i.quantity })),
        promoCode: discountInfo ? discountInfo.code : undefined,
        referralCode: referralCode.trim() || undefined
      });

      setCompletedOrder({
        orderNumber: res.orderNumber,
        total: res.total,
        customerName,
        customerPhone,
        deliveryType,
        branchOrAddress,
        items: [...items]
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      setStep('success');
      onClearCart();
    } catch (err: any) {
      setOrderError(err.message || 'فشل إرسال الطلب، يرجى المحاولة مرة أخرى');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleSendToWhatsApp = () => {
    if (!completedOrder) return;
    const itemsSummary = completedOrder.items
      .map((i: any) => `- ${i.product.name} (عدد: ${i.quantity}) بسعر: ${i.product.price * i.quantity} ج`)
      .join('\n');

    const msg = encodeURIComponent(
      `السلام عليكم سنتر العسال.. أريد تأكيد طلبي الجديد عبر المنصة:\n\n` +
      `📌 رقم الطلب: ${completedOrder.orderNumber}\n` +
      `👤 اسم العميل: ${completedOrder.customerName}\n` +
      `📱 رقم الهاتف: ${completedOrder.customerPhone}\n` +
      `📍 الاستلام/العنوان: ${completedOrder.branchOrAddress}\n\n` +
      `📦 المنتجات:\n${itemsSummary}\n\n` +
      `💰 المبلغ الإجمالي: ${completedOrder.total} جنيه مصري\n` +
      `شكراً لكم!`
    );

    window.open(`https://api.whatsapp.com/send?phone=201277714100&text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-r border-sky-100 animate-in slide-in-from-left duration-300">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-sky-100 flex items-center justify-between bg-sky-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-100 text-cyan-800 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800">
                {step === 'cart' && 'سلة المشتريات'}
                {step === 'checkout' && 'إتمام وتأكيد الطلب'}
                {step === 'success' && 'تم استلام طلبك بنجاح!'}
              </h3>
              <p className="text-xs text-slate-500">
                {step === 'cart' && `${items.length} منتجات مضافة`}
                {step === 'checkout' && 'خطوة أخيرة لتأكيد طلبك'}
                {step === 'success' && 'سنتر العسال في خدمتك'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && step === 'cart' && (
              <button
                onClick={onClearCart}
                className="flex items-center gap-1 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-rose-200 shadow-2xs"
                title="إفراغ وحذف جميع المنتجات من السلة"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف الكل</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* STEP 1: CART ITEMS */}
          {step === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-16 h-16 bg-sky-50 text-sky-300 rounded-full flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-700">سلة المشتريات فارغة</h4>
                  <p className="text-xs text-slate-400">تصفح متجر المفروشات وأضف ما يعجبك بسهولة</p>
                  <button
                    onClick={onClose}
                    className="mt-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                  >
                    تصفح المفروشات الآن
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="bg-white p-3 rounded-2xl border border-sky-100 shadow-2xs flex items-center gap-3"
                    >
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-xl object-cover bg-sky-50 shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                          {item.product.name}
                        </h4>
                        <div className="text-xs text-cyan-700 font-black mt-1">
                          {item.product.price} ج.م
                        </div>

                        {/* Quantity controls & Delete */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded cursor-pointer"
                              title="تقليل الكمية"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded cursor-pointer"
                              title="زيادة الكمية"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="flex items-center gap-1 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-rose-200"
                            title="حذف هذا المنتج من السلة"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>

                      <div className="text-left font-black text-xs text-slate-800 shrink-0">
                        {item.product.price * item.quantity} ج
                      </div>
                    </div>
                  ))}

                  {/* Promo Code Input */}
                  <div className="pt-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="كود الخصم (مثل: ASSAL25)"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="w-full bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-xs font-bold uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono"
                        />
                        <Tag className="w-3.5 h-3.5 text-cyan-600 absolute left-3 top-2.5" />
                      </div>
                      <button
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoCode.trim()}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {promoLoading ? '...' : 'تطبيق'}
                      </button>
                    </div>

                    {promoError && (
                      <p className="text-rose-600 text-[11px] font-semibold mt-1">{promoError}</p>
                    )}

                    {discountInfo && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-xl text-xs mt-2 flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          تم خصم {discountInfo.percentage}% ({discountAmount} ج)
                        </span>
                        <button
                          onClick={() => {
                            setDiscountInfo(null);
                            setPromoCode('');
                          }}
                          className="text-rose-500 hover:underline text-[10px]"
                        >
                          إلغاء
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </>
          )}

          {/* STEP 2: CHECKOUT FORM */}
          {step === 'checkout' && (
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              {orderError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="اكتب اسمك الكريم"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-sky-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  placeholder="رقم الهاتف للتواصل وتأكيد الطلب"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-sky-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 text-center font-bold"
                  dir="ltr"
                />
                <span className="text-[10px] text-slate-400 block">
                  سيتم ربط طلبك بكارت العسال تلقائياً لإضافة نقاطك فور التأكيد.
                </span>
              </div>

              {/* Delivery or Pickup */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">طريقة الاستلام والتسليم *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      deliveryType === 'pickup'
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                    <span>استلام من المعرض</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      deliveryType === 'delivery'
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-cyan-600" />
                    <span>توصيل بالإسكندرية</span>
                  </button>
                </div>
              </div>

              {deliveryType === 'pickup' ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">اختر الفرع للاستلام:</label>
                  <select
                    value={pickupBranch}
                    onChange={(e) => setPickupBranch(e.target.value)}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="المعرض الرئيسي: 8 شارع أنور السادات">
                      المعرض الرئيسي: 8 شارع أنور السادات
                    </option>
                    <option value="الفرع الثاني: 95 عمود السواري – كرموز">
                      الفرع الثاني: 95 عمود السواري – كرموز
                    </option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">عنوان التوصيل بالتفصيل بالإسكندرية *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="المنطقة، الشارع، رقم العمارة والدور"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-sky-50/50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              )}

              {/* Referral code */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">كود دعوة من صديق (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: REF-1234"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono uppercase"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ملاحظات إضافية (ألوان، مقاسات معينة)</label>
                <input
                  type="text"
                  placeholder="أي طلب خاص أو وقت مفضل للاتصال"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                />
              </div>
            </form>
          )}

          {/* STEP 3: ORDER SUCCESS */}
          {step === 'success' && completedOrder && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  تم حفظ طلبك بنجاح
                </span>
                <h4 className="text-xl font-extrabold text-slate-900 mt-2">
                  شكراً لتسوقك من سنتر العسال!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  رقم متابعة الطلب الخاص بك:
                </p>
                <div className="mt-2 inline-block bg-sky-100 text-sky-900 font-mono font-black text-lg px-4 py-1.5 rounded-xl border border-sky-300">
                  {completedOrder.orderNumber}
                </div>
              </div>

              <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 text-right text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">اسم العميل:</span>
                  <span className="font-bold text-slate-800">{completedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم الهاتف:</span>
                  <span className="font-bold text-slate-800 font-mono" dir="ltr">{completedOrder.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المكان / الفرع:</span>
                  <span className="font-bold text-slate-800">{completedOrder.branchOrAddress}</span>
                </div>
                <div className="flex justify-between border-t border-sky-200/60 pt-2 font-black text-sm">
                  <span>المبلغ الإجمالي:</span>
                  <span className="text-cyan-800">{completedOrder.total} جنيه</span>
                </div>
              </div>

              {/* Direct WhatsApp Confirmation Button */}
              <button
                onClick={handleSendToWhatsApp}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs sm:text-sm shadow-md shadow-emerald-200 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال تفاصيل الطلب لواتساب المعرض الآن</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenTrack();
                }}
                className="w-full bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                متابعة حالة الطلب برقم المتابعة
              </button>
            </div>
          )}

        </div>

        {/* Drawer Footer Actions */}
        {items.length > 0 && step !== 'success' && (
          <div className="p-4 sm:p-5 border-t border-sky-100 bg-sky-50/50 space-y-3">
            {/* Calculation summary */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>إجمالي المنتجات:</span>
                <span className="font-bold">{subtotal} ج.م</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>الخصم المطبق:</span>
                  <span>-{discountAmount} ج.م</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-extrabold text-base pt-1 border-t border-slate-200">
                <span>المبلغ النهائي:</span>
                <span className="text-cyan-800">{total} جنيه</span>
              </div>
            </div>

            {/* Buttons */}
            {step === 'cart' ? (
              <button
                onClick={() => setStep('checkout')}
                className="w-full bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white font-black py-3 rounded-2xl text-sm shadow-md shadow-cyan-200 transition-all cursor-pointer"
              >
                متابعة وإدخال بيانات الطلب ({total} ج)
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-3 rounded-xl text-xs cursor-pointer"
                >
                  رجوع للسلة
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutSubmit}
                  disabled={orderLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {orderLoading ? 'جاري تسجيل الطلب...' : `تأكيد وإرسال الطلب (${total} ج)`}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
