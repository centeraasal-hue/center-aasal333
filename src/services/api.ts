import { Product, Offer, Customer, Reward, Order, SiteSettings, AdminUser, AdminStats } from '../types';

let adminToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('assal_admin_token') : null;

export function setStoredAdminToken(token: string | null) {
  adminToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('assal_admin_token', token);
    } else {
      localStorage.removeItem('assal_admin_token');
    }
  }
}

export function getStoredAdminToken(): string | null {
  return adminToken;
}

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }
  return headers;
}

// ==========================================
// PUBLIC API CALLS
// ==========================================

export async function fetchHomeData(): Promise<{
  settings: SiteSettings;
  activeOffers: Offer[];
  featuredProducts: Product[];
  bestSellers: Product[];
}> {
  const res = await fetch('/api/home');
  if (!res.ok) throw new Error('فشل جلب بيانات الصفحة الرئيسية');
  return res.json();
}

export async function fetchProducts(params?: {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: string;
}): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.search) query.append('search', params.search);
  if (params?.minPrice !== undefined) query.append('minPrice', params.minPrice.toString());
  if (params?.maxPrice !== undefined) query.append('maxPrice', params.maxPrice.toString());
  if (params?.inStockOnly) query.append('inStockOnly', 'true');
  if (params?.sort) query.append('sort', params.sort);

  const res = await fetch(`/api/products?${query.toString()}`);
  if (!res.ok) throw new Error('فشل جلب المنتجات');
  return res.json();
}

export async function fetchProductById(id: number): Promise<Product> {
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) throw new Error('المنتج غير موجود');
  return res.json();
}

export async function fetchOffers(): Promise<Offer[]> {
  const res = await fetch('/api/offers');
  if (!res.ok) throw new Error('فشل جلب العروض');
  return res.json();
}

export async function validateCoupon(code: string, subtotal: number): Promise<{
  valid: boolean;
  code: string;
  title: string;
  discountPercentage: number;
  discountAmount: number;
  message: string;
}> {
  const res = await fetch('/api/offers/validate-coupon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, subtotal }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'كود غير صالح');
  return data;
}

export async function submitOrder(orderData: {
  customerName: string;
  customerPhone: string;
  deliveryType: 'pickup' | 'delivery';
  branchOrAddress: string;
  notes?: string;
  items: { id: number; quantity: number }[];
  promoCode?: string;
  referralCode?: string;
}): Promise<{
  success: boolean;
  orderNumber: string;
  total: number;
  customerName: string;
  customerPhone: string;
  message: string;
}> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل إرسال الطلب');
  return data;
}

export async function trackOrder(query: string): Promise<Order[]> {
  const res = await fetch(`/api/orders/track/${encodeURIComponent(query)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'لم يتم العثور على طلبات');
  return data;
}

export async function lookupCustomer(phone: string): Promise<{
  customer: Customer;
  redemptions: any[];
  history: any[];
  confirmedOrdersCount: number;
  referralsCount: number;
}> {
  const res = await fetch('/api/customers/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'العضوية غير موجودة');
  return data;
}

export async function registerCustomer(data: {
  name: string;
  phone: string;
  referralCode?: string;
}): Promise<{
  success: boolean;
  customer: Customer;
  message: string;
}> {
  const res = await fetch('/api/customers/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const resp = await res.json();
  if (!res.ok) throw new Error(resp.error || 'فشل التسجيل');
  return resp;
}

export async function fetchRewards(): Promise<Reward[]> {
  const res = await fetch('/api/rewards');
  if (!res.ok) throw new Error('فشل جلب قائمة المكافآت');
  return res.json();
}

export async function redeemReward(customerPhone: string, rewardId: number): Promise<{
  success: boolean;
  message: string;
  updatedCustomer: Customer;
}> {
  const res = await fetch('/api/rewards/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerPhone, rewardId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل استبدال المكافأة');
  return data;
}

export async function sendAiMessage(message: string): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل الاتصال بالمساعد الذكي');
  return data.reply;
}

// ==========================================
// ADMIN API CALLS
// ==========================================

export async function adminLogin(credentials: { username: string; password: string }): Promise<{
  success: boolean;
  token: string;
  admin: AdminUser;
}> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل تسجيل الدخول');
  setStoredAdminToken(data.token);
  return data;
}

export async function adminLogout(): Promise<void> {
  await fetch('/api/admin/logout', { method: 'POST' });
  setStoredAdminToken(null);
}

export async function fetchAdminMe(): Promise<{ admin: AdminUser }> {
  const res = await fetch('/api/admin/me', {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'جلسة غير صالحة');
  return data;
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/admin/change-password', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل تغيير كلمة المرور');
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch('/api/admin/stats', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('فشل جلب الإحصائيات');
  return res.json();
}

export async function fetchAdminProducts(): Promise<Product[]> {
  const res = await fetch('/api/admin/products', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('فشل جلب المنتجات للإدارة');
  return res.json();
}

export async function saveAdminProduct(productData: Partial<Product>, isEdit?: boolean, id?: number): Promise<Product> {
  const url = isEdit ? `/api/admin/products/${id}` : '/api/admin/products';
  const method = isEdit ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل حفظ المنتج');
  return data.product;
}

export async function deleteAdminProduct(id: number): Promise<void> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('فشل حذف المنتج');
}

export async function fetchAdminOrders(): Promise<Order[]> {
  const res = await fetch('/api/admin/orders', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('فشل جلب الطلبات');
  return res.json();
}

export async function updateAdminOrderStatus(orderId: number, status: string): Promise<Order> {
  const res = await fetch(`/api/admin/orders/${orderId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل تحديث حالة الطلب');
  return data.order;
}

export async function deleteAdminOrder(orderId: number): Promise<void> {
  const res = await fetch(`/api/admin/orders/${orderId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('فشل حذف الطلب');
}

export async function fetchAdminOffers(): Promise<Offer[]> {
  const res = await fetch('/api/admin/offers', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('فشل جلب العروض');
  return res.json();
}

export async function saveAdminOffer(offerData: Partial<Offer>, isEdit?: boolean, id?: number): Promise<Offer> {
  const url = isEdit ? `/api/admin/offers/${id}` : '/api/admin/offers';
  const method = isEdit ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(offerData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل حفظ العرض');
  return data.offer;
}

export async function deleteAdminOffer(id: number): Promise<void> {
  const res = await fetch(`/api/admin/offers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('فشل حذف العرض');
}

export async function fetchAdminCustomers(): Promise<Customer[]> {
  const res = await fetch('/api/admin/customers', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('فشل جلب العملاء');
  return res.json();
}

export async function adjustCustomerPoints(customerId: number, pointsChange: number, reason: string): Promise<Customer> {
  const res = await fetch(`/api/admin/customers/${customerId}/adjust-points`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ pointsChange, reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل تعديل النقاط');
  return data.customer;
}

export async function fetchAdminSettings(): Promise<SiteSettings> {
  const res = await fetch('/api/admin/settings', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('فشل جلب الإعدادات');
  return res.json();
}

export async function saveAdminSettings(settings: Partial<SiteSettings>): Promise<void> {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل حفظ الإعدادات');
}

export async function downloadExcelExport(type: 'orders' | 'products' | 'customers'): Promise<void> {
  const res = await fetch(`/api/admin/export/${type}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('فشل تنزيل ملف الإكسل');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `alassal-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
