import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Package,
  ShoppingBag,
  Tag,
  Users,
  Settings,
  FileSpreadsheet,
  KeyRound,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  RefreshCw,
  Eye,
  CheckCircle2
} from 'lucide-react';
import {
  AdminUser,
  AdminStats,
  Product,
  Order,
  Offer,
  Customer,
  SiteSettings
} from '../types';
import {
  fetchAdminStats,
  fetchAdminProducts,
  saveAdminProduct,
  deleteAdminProduct,
  fetchAdminOrders,
  updateAdminOrderStatus,
  deleteAdminOrder,
  fetchAdminOffers,
  saveAdminOffer,
  deleteAdminOffer,
  fetchAdminCustomers,
  adjustCustomerPoints,
  fetchAdminSettings,
  saveAdminSettings,
  changeAdminPassword,
  adminLogout,
  downloadExcelExport
} from '../services/api';

interface Props {
  admin: AdminUser;
  onLogout: () => void;
  onClose: () => void;
  onRefreshPublicData: () => void;
}

export const AdminDashboard: React.FC<Props> = ({
  admin,
  onLogout,
  onClose,
  onRefreshPublicData
}) => {
  const [activeTab, setActiveTab] = useState<
    'stats' | 'products' | 'orders' | 'offers' | 'customers' | 'settings' | 'export' | 'security'
  >('stats');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    category: 'ملايات',
    price: 0,
    original_price: null,
    image_url: '',
    description: '',
    in_stock: 1,
    badge: '',
    is_featured: 0
  });

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Offers
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offerForm, setOfferForm] = useState<Partial<Offer>>({
    title: '',
    description: '',
    discount_percentage: 20,
    old_price: null,
    new_price: null,
    promo_code: '',
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    banner_text: '',
    is_active: 1
  });

  // Customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [adjustPointsModal, setAdjustPointsModal] = useState<Customer | null>(null);
  const [pointsChangeInput, setPointsChangeInput] = useState<number>(0);
  const [pointsChangeReason, setPointsChangeReason] = useState<string>('مكافأة خاصة من الإدارة');

  // Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Initial Data Load
  const loadStats = async () => {
    try {
      const s = await fetchAdminStats();
      setStats(s);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const loadProducts = async () => {
    try {
      const p = await fetchAdminProducts();
      setProducts(p);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const loadOrders = async () => {
    try {
      const o = await fetchAdminOrders();
      setOrders(o);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const loadOffers = async () => {
    try {
      const off = await fetchAdminOffers();
      setOffers(off);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const loadCustomers = async () => {
    try {
      const c = await fetchAdminCustomers();
      setCustomers(c);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const loadSettings = async () => {
    try {
      const s = await fetchAdminSettings();
      setSiteSettings(s);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  useEffect(() => {
    loadStats();
    loadProducts();
    loadOrders();
    loadOffers();
    loadCustomers();
    loadSettings();
  }, []);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Product Actions
  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm(product);
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        category: 'ملايات',
        price: 350,
        original_price: 450,
        image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
        description: '',
        in_stock: 1,
        badge: '',
        is_featured: 0
      });
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveAdminProduct(productForm, !!editingProduct, editingProduct?.id);
      showNotification(editingProduct ? 'تم تحديث المنتج بنجاح' : 'تمت إضافة المنتج بنجاح');
      setProductModalOpen(false);
      loadProducts();
      loadStats();
      onRefreshPublicData();
    } catch (err: any) {
      showNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await deleteAdminProduct(id);
      showNotification('تم حذف المنتج');
      loadProducts();
      loadStats();
      onRefreshPublicData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Order Actions
  const handleOrderStatusChange = async (orderId: number, status: string) => {
    try {
      await updateAdminOrderStatus(orderId, status);
      showNotification(
        status === 'confirmed'
          ? 'تم تأكيد الطلب واحتساب وإضافة نقاط العميل تلقائياً إلى كارت العسال!'
          : 'تم تحديث حالة الطلب بنجاح'
      );
      loadOrders();
      loadStats();
      loadCustomers();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) return;
    try {
      await deleteAdminOrder(id);
      showNotification('تم حذف الطلب');
      loadOrders();
      loadStats();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Offer Actions
  const handleOpenOfferModal = (offer?: Offer) => {
    if (offer) {
      setEditingOffer(offer);
      setOfferForm(offer);
    } else {
      setEditingOffer(null);
      setOfferForm({
        title: '',
        description: '',
        discount_percentage: 20,
        old_price: 1000,
        new_price: 800,
        promo_code: 'ASSAL' + Math.floor(10 + Math.random() * 90),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        banner_text: 'عرض خاص لفترة محدودة',
        is_active: 1
      });
    }
    setOfferModalOpen(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveAdminOffer(offerForm, !!editingOffer, editingOffer?.id);
      showNotification(editingOffer ? 'تم تحديث العرض' : 'تم إنشاء العرض بنجاح');
      setOfferModalOpen(false);
      loadOffers();
      onRefreshPublicData();
    } catch (err: any) {
      showNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (id: number) => {
    if (!window.confirm('هل تريد حذف هذا العرض؟')) return;
    try {
      await deleteAdminOffer(id);
      showNotification('تم حذف العرض');
      loadOffers();
      onRefreshPublicData();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Customer Points Adjustment
  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustPointsModal) return;
    setLoading(true);
    try {
      await adjustCustomerPoints(adjustPointsModal.id, pointsChangeInput, pointsChangeReason);
      showNotification(`تم تعديل نقاط العميل ${adjustPointsModal.name} بنجاح`);
      setAdjustPointsModal(null);
      loadCustomers();
      loadStats();
    } catch (err: any) {
      showNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;
    setLoading(true);
    try {
      await saveAdminSettings(siteSettings);
      showNotification('تم حفظ إعدادات الموقع ونصوص الرئيسية بنجاح');
      onRefreshPublicData();
    } catch (err: any) {
      showNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Change Password
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showNotification('كلمتا المرور غير متطابقتين', true);
      return;
    }
    setLoading(true);
    try {
      await changeAdminPassword(currentPassword, newPassword);
      showNotification('تم تغيير كلمة مرور الإدارة بنجاح. يرجى تذكرها جيداً!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAdmin = async () => {
    await adminLogout();
    onLogout();
    onClose();
  };

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-6xl h-[95vh] shadow-2xl border border-sky-100 flex flex-col overflow-hidden animate-in fade-in">
        
        {/* Top Navbar */}
        <div className="bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-amber-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg">
                لوحة إدارة سنتر العسال (Al-Assal With You)
              </h2>
              <p className="text-xs text-cyan-100">
                مرحباً بك: <span className="font-bold text-amber-200">{admin.display_name}</span> • وضع التحكم الشامل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogoutAdmin}
              className="flex items-center gap-1.5 bg-rose-500/80 hover:bg-rose-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 flex items-center gap-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-800 text-xs px-4 py-2.5 flex items-center gap-2 font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Body with Sidebar Tabs */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-sky-50/30">
          
          {/* Tabs Navigation Sidebar */}
          <div className="w-full md:w-60 bg-white border-l border-sky-100 p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer shrink-0 ${
                activeTab === 'stats' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-sky-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>الإحصائيات العامة</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer shrink-0 ${
                activeTab === 'products' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-sky-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>إدارة المنتجات ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer shrink-0 ${
                activeTab === 'orders' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-sky-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>إدارة الطلبات ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('offers')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer shrink-0 ${
                activeTab === 'offers' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-sky-50'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>العروض والخصومات</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer shrink-0 ${
                activeTab === 'customers' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-sky-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>كارت العسال والعملاء</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer shrink-0 ${
                activeTab === 'settings' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-sky-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>محتوى الصفحة والفروع</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer shrink-0 ${
                activeTab === 'export' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-sky-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>تصدير إكسل (Excel)</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer shrink-0 ${
                activeTab === 'security' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-sky-50'
              }`}
            >
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>أمان الحساب وكلمة المرور</span>
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            
            {/* TAB 1: STATS OVERVIEW */}
            {activeTab === 'stats' && stats && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800">إحصائيات المنصة والمبيعات</h3>
                  <p className="text-xs text-slate-500">نظرة سريعة ومباشرة على أداء المعرض والطلبات والعملاء</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs">
                    <span className="text-slate-500 text-xs font-semibold block">إجمالي مبيعات الطلبات المؤكدة</span>
                    <div className="text-2xl font-black text-emerald-700 mt-1">{stats.totalSales} ج.م</div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs">
                    <span className="text-slate-500 text-xs font-semibold block">الطلبات الجديدة (قيد المراجعة)</span>
                    <div className="text-2xl font-black text-amber-600 mt-1">{stats.newOrders}</div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs">
                    <span className="text-slate-500 text-xs font-semibold block">أعضاء كارت العسال المسجلين</span>
                    <div className="text-2xl font-black text-cyan-700 mt-1">{stats.totalCustomers}</div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs">
                    <span className="text-slate-500 text-xs font-semibold block">إجمالي المنتجات في المتجر</span>
                    <div className="text-2xl font-black text-slate-800 mt-1">{stats.totalProducts}</div>
                  </div>
                </div>

                {/* Recent Orders List */}
                <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-extrabold text-sm text-slate-800">أحدث الطلبات المستلمة</h4>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-cyan-700 hover:underline text-xs font-bold"
                    >
                      عرض جميع الطلبات ({orders.length})
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-sky-50 text-slate-600 border-b border-sky-100">
                        <tr>
                          <th className="p-2.5">رقم الطلب</th>
                          <th className="p-2.5">العميل</th>
                          <th className="p-2.5">الهاتف</th>
                          <th className="p-2.5">المبلغ</th>
                          <th className="p-2.5">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stats.recentOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-sky-50/50">
                            <td className="p-2.5 font-mono font-bold text-cyan-900">{ord.order_number}</td>
                            <td className="p-2.5 font-semibold text-slate-800">{ord.customer_name}</td>
                            <td className="p-2.5 text-slate-500 font-mono" dir="ltr">{ord.customer_phone}</td>
                            <td className="p-2.5 font-black text-slate-900">{ord.total} ج</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                ord.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                                ord.status === 'delivered' ? 'bg-teal-100 text-teal-800' :
                                ord.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {ord.status === 'confirmed' ? 'مؤكد' :
                                 ord.status === 'delivered' ? 'تم التسليم' :
                                 ord.status === 'cancelled' ? 'ملغي' : 'جديد'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRODUCTS MANAGEMENT */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">إدارة المنتجات والمفروشات</h3>
                    <p className="text-xs text-slate-500">إضافة، تعديل، ضبط الأسعار وحالة المخزون والشارات</p>
                  </div>
                  <button
                    onClick={() => handleOpenProductModal()}
                    className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة منتج جديد</span>
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-sky-100 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-sky-50 text-slate-600 border-b border-sky-100">
                        <tr>
                          <th className="p-3">الصورة</th>
                          <th className="p-3">اسم المنتج</th>
                          <th className="p-3">القسم</th>
                          <th className="p-3">السعر</th>
                          <th className="p-3">المخزون</th>
                          <th className="p-3">الشارة</th>
                          <th className="p-3 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-sky-50/50">
                            <td className="p-3">
                              <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-sky-50" />
                            </td>
                            <td className="p-3 font-bold text-slate-800 max-w-xs">{p.name}</td>
                            <td className="p-3 text-slate-600 font-semibold">{p.category}</td>
                            <td className="p-3 font-black text-cyan-800">{p.price} ج.م</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                p.in_stock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {p.in_stock ? 'متوفر' : 'غير متوفر'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-semibold">{p.badge || '-'}</td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenProductModal(p)}
                                  className="p-1.5 bg-sky-50 hover:bg-sky-100 text-cyan-700 rounded-lg cursor-pointer"
                                  title="تعديل"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ORDERS MANAGEMENT */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">إدارة ومتابعة الطلبات</h3>
                    <p className="text-xs text-slate-500">تغيير حالة الطلب وتوزيع نقاط الولاء بأمان</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">تصفية:</span>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="all">جميع الطلبات ({orders.length})</option>
                      <option value="new">الطلبات الجديدة فقط</option>
                      <option value="confirmed">الطلبات المؤكدة</option>
                      <option value="delivered">الطلبات المسلمة</option>
                      <option value="cancelled">الملغية</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-sky-100 text-slate-400 text-xs">
                      لا توجد طلبات تطابق الفلتر المختار
                    </div>
                  ) : (
                    filteredOrders.map((ord) => (
                      <div key={ord.id} className="bg-white p-5 rounded-3xl border border-sky-100 shadow-2xs space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-base text-cyan-900">{ord.order_number}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                ord.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                                ord.status === 'delivered' ? 'bg-teal-100 text-teal-800' :
                                ord.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {ord.status === 'confirmed' ? 'مؤكد' :
                                 ord.status === 'delivered' ? 'تم التسليم' :
                                 ord.status === 'cancelled' ? 'ملغي' : 'جديد'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {new Date(ord.created_at).toLocaleString('ar-EG')}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600">تحديث الحالة:</span>
                            <select
                              value={ord.status}
                              onChange={(e) => handleOrderStatusChange(ord.id, e.target.value)}
                              className="bg-sky-50 border border-sky-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                            >
                              <option value="new">جديد (قيد المراجعة)</option>
                              <option value="confirmed">تأكيد الطلب (إضافة النقاط)</option>
                              <option value="delivered">تم التسليم بنجاح</option>
                              <option value="cancelled">إلغاء الطلب</option>
                            </select>

                            <button
                              onClick={() => handleDeleteOrder(ord.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                              title="حذف الطلب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Customer & Delivery Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-sky-50/50 p-3 rounded-2xl">
                          <div>
                            <span className="text-slate-400 block font-semibold">اسم العميل:</span>
                            <span className="font-bold text-slate-800">{ord.customer_name}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold">رقم الهاتف:</span>
                            <span className="font-bold text-slate-800 font-mono" dir="ltr">{ord.customer_phone}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold">طريقة الاستلام والعنوان:</span>
                            <span className="font-bold text-slate-800">{ord.branch_or_address}</span>
                          </div>
                        </div>

                        {/* Ordered Items List */}
                        {ord.items && ord.items.length > 0 && (
                          <div className="text-xs">
                            <span className="font-bold text-slate-700 block mb-1">المنتجات المطلوبة:</span>
                            <div className="space-y-1">
                              {ord.items.map((it) => (
                                <div key={it.id} className="flex justify-between text-slate-600 bg-white p-2 rounded-xl border border-slate-100">
                                  <span>{it.product_name} × {it.quantity}</span>
                                  <span className="font-bold">{it.total} ج</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Totals & Loyalty Points status */}
                        <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-sm text-slate-900">
                              الإجمالي: <span className="text-cyan-800">{ord.total} جنيه</span>
                            </span>
                            {ord.discount_amount > 0 && (
                              <span className="text-emerald-600 font-bold">
                                (خصم: {ord.discount_amount} ج بكود {ord.promo_code})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {ord.points_awarded === 1 ? (
                              <span className="bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                تمت إضافة النقاط لكارت العسال
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-amber-200">
                                لم تضاف النقاط بعد (ستضاف فور التأكيد)
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: OFFERS & DISCOUNTS */}
            {activeTab === 'offers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">إدارة العروض والخصومات</h3>
                    <p className="text-xs text-slate-500">أكواد الخصم، مؤقتات الانتهاء، ونسب التخفيضات</p>
                  </div>
                  <button
                    onClick={() => handleOpenOfferModal()}
                    className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إنشاء عرض جديد</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offers.map((off) => (
                    <div key={off.id} className="bg-white p-5 rounded-3xl border border-sky-100 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-extrabold text-sm text-slate-800">{off.title}</span>
                          <span className="bg-amber-100 text-amber-900 font-black text-xs px-2.5 py-1 rounded-full">
                            خصم {off.discount_percentage}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">{off.description}</p>
                        
                        <div className="bg-sky-50 p-2.5 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between font-mono">
                            <span className="text-slate-500">كود الخصم:</span>
                            <span className="font-bold text-cyan-800">{off.promo_code || 'بدون كود'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">ينتهي في:</span>
                            <span className="font-bold text-slate-700">{new Date(off.end_date).toLocaleDateString('ar-EG')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                        <span className={`font-bold ${off.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {off.is_active ? 'مفعل ويظهر للعملاء' : 'معطل'}
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenOfferModal(off)}
                            className="p-1.5 bg-sky-50 hover:bg-sky-100 text-cyan-700 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(off.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: CUSTOMERS & LOYALTY CARDS */}
            {activeTab === 'customers' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">قائمة عملاء كارت العسال</h3>
                  <p className="text-xs text-slate-500">عرض أرقام العضوية، رصيد النقاط وتعديلها يدوياً</p>
                </div>

                <div className="bg-white rounded-3xl border border-sky-100 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-sky-50 text-slate-600 border-b border-sky-100">
                        <tr>
                          <th className="p-3">رقم العضوية</th>
                          <th className="p-3">اسم العميل</th>
                          <th className="p-3">رقم الهاتف</th>
                          <th className="p-3">رصيد النقاط</th>
                          <th className="p-3">كود الدعوة</th>
                          <th className="p-3 text-center">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customers.map((c) => (
                          <tr key={c.id} className="hover:bg-sky-50/50">
                            <td className="p-3 font-mono font-black text-cyan-800">{c.membership_id}</td>
                            <td className="p-3 font-bold text-slate-800">{c.name}</td>
                            <td className="p-3 text-slate-600 font-mono" dir="ltr">{c.phone}</td>
                            <td className="p-3">
                              <span className="bg-amber-100 text-amber-950 font-black px-2.5 py-1 rounded-full">
                                {c.points} نقطة
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-500 font-bold">{c.referral_code}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  setAdjustPointsModal(c);
                                  setPointsChangeInput(50);
                                  setPointsChangeReason('مكافأة خاصة من الإدارة');
                                }}
                                className="bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                              >
                                تعديل النقاط
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: SITE SETTINGS */}
            {activeTab === 'settings' && siteSettings && (
              <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl bg-white p-6 rounded-3xl border border-sky-100 shadow-xs">
                <div>
                  <h3 className="text-lg font-black text-slate-800">محتوى الصفحة الرئيسية والفروع</h3>
                  <p className="text-xs text-slate-500">تعديل شريط الإعلانات، أرقام التواصل والعناوين مباشرة</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">نص شريط الإعلانات العلوي:</label>
                  <input
                    type="text"
                    value={siteSettings.announcement_bar}
                    onChange={(e) => setSiteSettings({ ...siteSettings, announcement_bar: e.target.value })}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">عنوان الترحيب الرئيسي:</label>
                  <input
                    type="text"
                    value={siteSettings.welcome_title}
                    onChange={(e) => setSiteSettings({ ...siteSettings, welcome_title: e.target.value })}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">وصف سنتر العسال الترحيبي:</label>
                  <textarea
                    rows={3}
                    value={siteSettings.welcome_subtitle}
                    onChange={(e) => setSiteSettings({ ...siteSettings, welcome_subtitle: e.target.value })}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2.5 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">هاتف التواصل 1:</label>
                    <input
                      type="text"
                      value={siteSettings.phone1}
                      onChange={(e) => setSiteSettings({ ...siteSettings, phone1: e.target.value })}
                      className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">هاتف التواصل 2:</label>
                    <input
                      type="text"
                      value={siteSettings.phone2}
                      onChange={(e) => setSiteSettings({ ...siteSettings, phone2: e.target.value })}
                      className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">عنوان المعرض الرئيسي:</label>
                  <input
                    type="text"
                    value={siteSettings.main_branch}
                    onChange={(e) => setSiteSettings({ ...siteSettings, main_branch: e.target.value })}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">عنوان الفرع الثاني (كرموز):</label>
                  <input
                    type="text"
                    value={siteSettings.second_branch}
                    onChange={(e) => setSiteSettings({ ...siteSettings, second_branch: e.target.value })}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer shadow-xs"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </form>
            )}

            {/* TAB 7: EXPORT TO EXCEL */}
            {activeTab === 'export' && (
              <div className="space-y-4 max-w-2xl bg-white p-6 rounded-3xl border border-sky-100 shadow-xs">
                <div>
                  <h3 className="text-lg font-black text-slate-800">تصدير التقارير إلى Excel (.xlsx)</h3>
                  <p className="text-xs text-slate-500">تحميل ملفات إكسل حقيقية وشاملة للمبيعات والمخزون والعملاء</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-sky-50 rounded-2xl border border-sky-100">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">تقرير جميع الطلبات والمبيعات</h4>
                      <p className="text-xs text-slate-500">يتضمن أرقام الطلبات، هواتف العملاء، الإجمالي والحالة</p>
                    </div>
                    <button
                      onClick={() => downloadExcelExport('orders')}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-xs"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>تحميل Excel</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-sky-50 rounded-2xl border border-sky-100">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">تقرير المنتجات والمخزون</h4>
                      <p className="text-xs text-slate-500">يتضمن الأسعار، الأقسام، وحالة توفر كل منتج</p>
                    </div>
                    <button
                      onClick={() => downloadExcelExport('products')}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-xs"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>تحميل Excel</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-sky-50 rounded-2xl border border-sky-100">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800">تقرير عملاء كارت العسال والنقاط</h4>
                      <p className="text-xs text-slate-500">يتضمن أرقام العضوية، رصيد النقاط، وأكواد الدعوة</p>
                    </div>
                    <button
                      onClick={() => downloadExcelExport('customers')}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-xs"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>تحميل Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: SECURITY & PASSWORD CHANGE */}
            {activeTab === 'security' && (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-4 max-w-md bg-white p-6 rounded-3xl border border-sky-100 shadow-xs">
                <div>
                  <h3 className="text-lg font-black text-slate-800">أمان الحساب وتغيير كلمة المرور</h3>
                  <p className="text-xs text-slate-500">تحديث كلمة المرور المشفرة لمدير سنتر العسال</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">كلمة المرور الحالية *</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">كلمة المرور الجديدة *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">تأكيد كلمة المرور الجديدة *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer shadow-xs"
                >
                  {loading ? 'جاري التحديث...' : 'تغيير كلمة المرور الآن'}
                </button>
              </form>
            )}

          </div>

        </div>

      </div>

      {/* Product Add / Edit Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-extrabold text-base text-slate-800">
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h4>
              <button onClick={() => setProductModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">اسم المنتج *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">القسم *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2 text-xs"
                  >
                    <option value="ملايات">ملايات</option>
                    <option value="بطاطين">بطاطين</option>
                    <option value="فوط">فوط</option>
                    <option value="لحف">لحف</option>
                    <option value="مفروشات">مفروشات</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">الشارة (اختياري)</label>
                  <input
                    type="text"
                    placeholder="الأكثر مبيعاً"
                    value={productForm.badge || ''}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">السعر الحالي (ج.م) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">السعر قبل الخصم (ج.م)</label>
                  <input
                    type="number"
                    value={productForm.original_price || ''}
                    onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value ? Number(e.target.value) : null })}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">رابط صورة المنتج *</label>
                <input
                  type="url"
                  required
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2 text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">الوصف والمواصفات</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2 text-xs leading-relaxed"
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.in_stock === 1}
                    onChange={(e) => setProductForm({ ...productForm, in_stock: e.target.checked ? 1 : 0 })}
                    className="accent-cyan-600"
                  />
                  <span>متوفر في المخزون</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_featured === 1}
                    onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked ? 1 : 0 })}
                    className="accent-cyan-600"
                  />
                  <span>مميز في الصفحة الرئيسية</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow-xs"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Add / Edit Modal */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-extrabold text-base text-slate-800">
                {editingOffer ? 'تعديل العرض' : 'إنشاء عرض جديد'}
              </h4>
              <button onClick={() => setOfferModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">عنوان العرض *</label>
                <input
                  type="text"
                  required
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">نسبة الخصم % *</label>
                  <input
                    type="number"
                    required
                    value={offerForm.discount_percentage}
                    onChange={(e) => setOfferForm({ ...offerForm, discount_percentage: Number(e.target.value) })}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">كود الخصم (Coupon)</label>
                  <input
                    type="text"
                    value={offerForm.promo_code || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, promo_code: e.target.value.toUpperCase() })}
                    className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">تاريخ ووقت انتهاء العرض *</label>
                <input
                  type="datetime-local"
                  required
                  value={offerForm.end_date?.slice(0, 16)}
                  onChange={(e) => setOfferForm({ ...offerForm, end_date: e.target.value })}
                  className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">نص الشارة أو الوصف المختصر</label>
                <input
                  type="text"
                  placeholder="عرض نهاية الأسبوع"
                  value={offerForm.banner_text || ''}
                  onChange={(e) => setOfferForm({ ...offerForm, banner_text: e.target.value })}
                  className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2 text-xs"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offerForm.is_active === 1}
                    onChange={(e) => setOfferForm({ ...offerForm, is_active: e.target.checked ? 1 : 0 })}
                    className="accent-cyan-600"
                  />
                  <span>تفعيل العرض فوراً في الصفحة الرئيسية</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow-xs"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ العرض'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Points Modal */}
      {adjustPointsModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-sky-100">
            <h4 className="font-extrabold text-base text-slate-800 mb-1">
              تعديل نقاط العميل
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              {adjustPointsModal.name} (الرصيد الحالي: {adjustPointsModal.points} نقطة)
            </p>

            <form onSubmit={handleAdjustPoints} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">عدد النقاط المضافة (أو سالبة للخصم):</label>
                <input
                  type="number"
                  required
                  value={pointsChangeInput}
                  onChange={(e) => setPointsChangeInput(Number(e.target.value))}
                  className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">سبب التعديل:</label>
                <input
                  type="text"
                  required
                  value={pointsChangeReason}
                  onChange={(e) => setPointsChangeReason(e.target.value)}
                  className="w-full bg-sky-50 border border-slate-200 rounded-xl p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustPointsModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold"
                >
                  تأكيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
