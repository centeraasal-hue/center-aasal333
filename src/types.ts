export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  original_price: number | null;
  image_url: string;
  description: string;
  in_stock: number;
  badge: string | null;
  is_featured: number;
  created_at?: string;
}

export interface Offer {
  id: number;
  title: string;
  description: string;
  discount_percentage: number;
  old_price: number | null;
  new_price: number | null;
  promo_code: string | null;
  end_date: string;
  banner_text: string | null;
  is_active: number;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Customer {
  id: number;
  membership_id: string;
  name: string;
  phone: string;
  points: number;
  referral_code: string;
  referred_by_code: string | null;
  created_at: string;
  total_orders?: number;
  referral_count?: number;
}

export interface Reward {
  id: number;
  title: string;
  description: string;
  points_required: number;
  reward_type: 'discount' | 'gift';
  reward_value: string;
  is_active: number;
}

export interface RewardRedemption {
  id: number;
  customer_id: number;
  reward_id: number;
  points_spent: number;
  reward_title: string;
  status: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_id: number | null;
  delivery_type: 'pickup' | 'delivery';
  branch_or_address: string;
  notes: string | null;
  subtotal: number;
  discount_amount: number;
  promo_code: string | null;
  total: number;
  status: 'new' | 'confirmed' | 'delivered' | 'cancelled';
  points_awarded: number;
  referral_code_used: string | null;
  referral_rewarded: number;
  created_at: string;
  items?: OrderItem[];
}

export interface SiteSettings {
  announcement_bar: string;
  welcome_title: string;
  welcome_subtitle: string;
  main_branch: string;
  second_branch: string;
  phone1: string;
  phone2: string;
  whatsapp: string;
  points_per_100egp: string;
  referral_reward_points: string;
  [key: string]: string;
}

export interface AdminUser {
  id: number;
  username: string;
  display_name: string;
}

export interface AdminStats {
  totalOrders: number;
  confirmedOrders: number;
  newOrders: number;
  totalSales: number;
  totalProducts: number;
  outOfStockProducts: number;
  totalCustomers: number;
  totalPointsActive: number;
  activeOffersCount: number;
  recentOrders: Order[];
}
