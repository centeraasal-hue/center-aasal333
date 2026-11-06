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
    'Accept': 'application/json',
  };
  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }
  return headers;
}

/**
 * Safely parse response body as JSON.
 * Protects against unexpected HTML or plain text (e.g. Express error pages starting with 'T' or Vite fallback)
 * preventing "Unexpected token 'T'" SyntaxErrors.
 */
async function parseJsonResponse<T = any>(res: Response, fallbackError: string = 'حدث خطأ في الخادم'): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  let data: any = null;

  try {
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        // Plain text or HTML received
        console.warn('Received non-JSON response from server (status: ' + res.status + '):', text.slice(0, 80));
        data = null;
      }
    }
  } catch (parseErr) {
    console.error('Error parsing response:', parseErr);
    data = null;
  }

  if (!res.ok) {
    let errorMsg = data?.error || data?.message;
    if (!errorMsg) {
      if (res.status === 400) errorMsg = 'بيانات غير صحيحة أو غير مكتملة';
      else if (res.status === 401) errorMsg = 'اسم المستخدم أو كلمة المرور غير صحيحة';
      else if (res.status === 403) errorMsg = 'غير مصرح لك بالدخول إلى هذه الصفحة';
      else if (res.status === 404) errorMsg = 'الخدمة المطلوبة غير متوفرة';
      else if (res.status === 500) errorMsg = 'حدث خطأ داخلي في الخادم. يرجى المحاولة لاحقاً';
      else errorMsg = fallbackError;
    }
    throw new Error(errorMsg);
  }

  return data as T;
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
  const res = await fetch('/api/home', { headers: { 'Accept': 'application/json' } });
  return parseJsonResponse(res, 'فشل جلب بيانات الصفحة الرئيسية');
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

  const res = await fetch(`/api/products?${query.toString()}`, { headers: { 'Accept': 'application/json' } });
  return parseJsonResponse(res, 'فشل جلب المنتجات');
}

export async function fetchProductById(id: number): Promise<Product> {
  const res = await fetch(`/api/products/${id}`, { headers: { 'Accept': 'application/json' } });
  return parseJsonResponse(res, 'المنتج غير موجود');
}

export async function fetchOffers(): Promise<Offer[]> {
  const res = await fetch('/api/offers', { headers: { 'Accept': 'application/json' } });
  return parseJsonResponse(res, 'فشل جلب العروض');
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
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ code, subtotal }),
  });
  return parseJsonResponse(res, 'كود الخصم غير صالح');
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
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(orderData),
  });
  return parseJsonResponse(res, 'فشل إرسال الطلب');
}

export async function trackOrder(query: string): Promise<Order[]> {
  const res = await fetch(`/api/orders/track/${encodeURIComponent(query)}`, {
    headers: { 'Accept': 'application/json' },
  });
  return parseJsonResponse(res, 'لم يتم العثور على طلبات');
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
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return parseJsonResponse(res, 'العضوية غير موجودة');
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
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(data),
  });
  return parseJsonResponse(res, 'فشل التسجيل');
}

export async function fetchRewards(): Promise<Reward[]> {
  const res = await fetch('/api/rewards', { headers: { 'Accept': 'application/json' } });
  return parseJsonResponse(res, 'فشل جلب قائمة المكافآت');
}

export async function redeemReward(customerPhone: string, rewardId: number): Promise<{
  success: boolean;
  message: string;
  updatedCustomer: Customer;
}> {
  const res = await fetch('/api/rewards/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ customerPhone, rewardId }),
  });
  return parseJsonResponse(res, 'فشل استبدال المكافأة');
}

export async function sendAiMessage(message: string): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const data = await parseJsonResponse<{ reply: string }>(res, 'فشل الاتصال بالمساعد الذكي');
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
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const data = await parseJsonResponse<{ success: boolean; token: string; admin: AdminUser }>(res, 'فشل تسجيل الدخول');
  setStoredAdminToken(data.token);
  return data;
}

export async function adminLogout(): Promise<void> {
  try {
    const res = await fetch('/api/admin/logout', { method: 'POST', headers: getAuthHeaders() });
    await parseJsonResponse(res, 'فشل تسجيل الخروج');
  } catch (err) {
    console.warn('Logout warning:', err);
  } finally {
    setStoredAdminToken(null);
  }
}

export async function fetchAdminMe(): Promise<{ admin: AdminUser }> {
  const res = await fetch('/api/admin/me', {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(res, 'جلسة غير صالحة');
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch('/api/admin/change-password', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  await parseJsonResponse(res, 'فشل تغيير كلمة المرور');
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch('/api/admin/stats', {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(res, 'فشل جلب الإحصائيات');
}

export async function fetchAdminProducts(): Promise<Product[]> {
  const res = await fetch('/api/admin/products', {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(res, 'فشل جلب المنتجات للإدارة');
}

export async function saveAdminProduct(productData: Partial<Product>, isEdit?: boolean, id?: number): Promise<Product> {
  const url = isEdit ? `/api/admin/products/${id}` : '/api/admin/products';
  const method = isEdit ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });
  const data = await parseJsonResponse<{ product: Product }>(res, 'فشل حفظ المنتج');
  return data.product;
}

export async function deleteAdminProduct(id: number): Promise<void> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await parseJsonResponse(res, 'فشل حذف المنتج');
}

export async function fetchAdminOrders(): Promise<Order[]> {
  const res = await fetch('/api/admin/orders', {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(res, 'فشل جلب الطلبات');
}

export async function updateAdminOrderStatus(orderId: number, status: string): Promise<Order> {
  const res = await fetch(`/api/admin/orders/${orderId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await parseJsonResponse<{ order: Order }>(res, 'فشل تحديث حالة الطلب');
  return data.order;
}

export async function deleteAdminOrder(orderId: number): Promise<void> {
  const res = await fetch(`/api/admin/orders/${orderId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await parseJsonResponse(res, 'فشل حذف الطلب');
}

export async function fetchAdminOffers(): Promise<Offer[]> {
  const res = await fetch('/api/admin/offers', {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(res, 'فشل جلب العروض');
}

export async function saveAdminOffer(offerData: Partial<Offer>, isEdit?: boolean, id?: number): Promise<Offer> {
  const url = isEdit ? `/api/admin/offers/${id}` : '/api/admin/offers';
  const method = isEdit ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(offerData),
  });
  const data = await parseJsonResponse<{ offer: Offer }>(res, 'فشل حفظ العرض');
  return data.offer;
}

export async function deleteAdminOffer(id: number): Promise<void> {
  const res = await fetch(`/api/admin/offers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  await parseJsonResponse(res, 'فشل حذف العرض');
}

export async function fetchAdminCustomers(): Promise<Customer[]> {
  const res = await fetch('/api/admin/customers', {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(res, 'فشل جلب العملاء');
}

export async function adjustCustomerPoints(customerId: number, pointsChange: number, reason: string): Promise<Customer> {
  const res = await fetch(`/api/admin/customers/${customerId}/adjust-points`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ pointsChange, reason }),
  });
  const data = await parseJsonResponse<{ customer: Customer }>(res, 'فشل تعديل النقاط');
  return data.customer;
}

export async function fetchAdminSettings(): Promise<SiteSettings> {
  const res = await fetch('/api/admin/settings', {
    headers: getAuthHeaders(),
  });
  return parseJsonResponse(res, 'فشل جلب الإعدادات');
}

export async function saveAdminSettings(settings: Partial<SiteSettings>): Promise<void> {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  await parseJsonResponse(res, 'فشل حفظ الإعدادات');
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
