import React, { useState } from 'react';
import {
  Compass,
  Search,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MapPin,
  X,
  Phone,
  AlertCircle
} from 'lucide-react';
import { Order } from '../types';
import { trackOrder } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setOrders(null);

    try {
      const res = await trackOrder(query);
      setOrders(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'لم نجد طلبات برقم المتابعة أو رقم الهاتف');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'new': return 1;
      case 'confirmed': return 2;
      case 'delivered': return 3;
      case 'cancelled': return -1;
      default: return 1;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-sky-100 max-h-[90vh] overflow-y-auto relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-sky-50 hover:bg-sky-100 text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-800 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Compass className="w-3.5 h-3.5 text-cyan-600" />
            <span>متابعة حالة طلبات المفروشات</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            تتبع طلبك – سنتر العسال
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            أدخل رقم الطلب الخاص بك (مثل: ORD-2026-1042) أو رقم هاتفك لمعرفة حالة الشحن والتجهيز
          </p>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="رقم الطلب أو رقم الهاتف المسجل..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-sky-50/70 border border-sky-200 rounded-2xl py-3 pr-10 pl-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 font-bold tracking-wide"
              />
              <Search className="w-4 h-4 text-cyan-600 absolute right-3.5 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'جاري البحث...' : 'تتبع'}
            </button>
          </div>
        </form>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Orders Results */}
        {orders && orders.length > 0 && (
          <div className="space-y-6">
            {orders.map((ord) => {
              const currentStep = getStatusStep(ord.status);
              const isCancelled = ord.status === 'cancelled';

              return (
                <div key={ord.id} className="bg-sky-50/60 rounded-3xl p-5 border border-sky-100 shadow-xs space-y-4">
                  {/* Order Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-sky-200/60">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">رقم الطلب:</span>
                      <span className="font-mono font-black text-sm text-cyan-900">{ord.order_number}</span>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 font-semibold block">تاريخ الإنشاء:</span>
                      <span className="text-xs font-bold text-slate-700">
                        {new Date(ord.created_at).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>

                  {/* Status Progress Line */}
                  {!isCancelled ? (
                    <div className="pt-2">
                      <div className="grid grid-cols-3 text-center gap-2 relative">
                        {/* 1 */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            currentStep >= 1 ? 'bg-cyan-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                          }`}>
                            <Package className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 mt-1.5">تم استلام الطلب</span>
                        </div>

                        {/* 2 */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            currentStep >= 2 ? 'bg-cyan-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                          }`}>
                            <Clock className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 mt-1.5">تم التأكيد والتجهيز</span>
                        </div>

                        {/* 3 */}
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            currentStep >= 3 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                          }`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 mt-1.5">تم التسليم بنجاح</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-100 text-rose-800 rounded-xl text-center text-xs font-bold">
                      تم إلغاء هذا الطلب
                    </div>
                  )}

                  {/* Order Details */}
                  <div className="bg-white p-3.5 rounded-2xl border border-sky-100 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">العميل:</span>
                      <span className="font-bold text-slate-800">{ord.customer_name}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">طريقة الاستلام:</span>
                      <span className="font-bold text-slate-800">
                        {ord.delivery_type === 'pickup' ? 'استلام من المعرض' : 'توصيل منزلي'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">المكان / العنوان:</span>
                      <span className="font-bold text-slate-800">{ord.branch_or_address}</span>
                    </div>

                    {ord.items && ord.items.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <span className="font-bold text-slate-700 block">المنتجات المطلوبة:</span>
                        {ord.items.map((it: any) => (
                          <div key={it.id} className="flex justify-between text-slate-600 text-[11px]">
                            <span>{it.product_name} (عدد {it.quantity})</span>
                            <span className="font-bold">{it.total} ج</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex justify-between font-black text-slate-900">
                      <span>إجمالي الفاتورة:</span>
                      <span className="text-cyan-700">{ord.total} جنيه مصري</span>
                    </div>
                  </div>

                  {/* Points Notice */}
                  {ord.points_awarded === 1 && (
                    <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تم احتساب وإضافة نقاط هذا الطلب إلى كارت العسال الخاص بك بنجاح!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
