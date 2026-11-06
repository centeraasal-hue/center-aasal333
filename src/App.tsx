import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Phone,
  Gift,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  Product,
  Offer,
  CartItem,
  Customer,
  Reward,
  SiteSettings,
  AdminUser
} from './types';
import {
  fetchHomeData,
  fetchProducts,
  fetchRewards,
  fetchAdminMe,
  getStoredAdminToken
} from './services/api';

import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { FeaturedOffers } from './components/FeaturedOffers';
import { ProductCatalog } from './components/ProductCatalog';
import { LoyaltyCardModal } from './components/LoyaltyCardModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { BranchesModal } from './components/BranchesModal';
import { AiAssistant } from './components/AiAssistant';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';

export default function App() {
  // Store data
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('assal_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Customer Loyalty Card
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem('assal_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Admin session
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [activeCoupon, setActiveCoupon] = useState<string | undefined>(undefined);

  // Modals
  const [cartOpen, setCartOpen] = useState(false);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [branchesOpen, setBranchesOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('assal_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save customer to localStorage
  useEffect(() => {
    if (activeCustomer) {
      localStorage.setItem('assal_customer', JSON.stringify(activeCustomer));
    } else {
      localStorage.removeItem('assal_customer');
    }
  }, [activeCustomer]);

  // Fetch initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [homeData, prodData, rewData] = await Promise.all([
        fetchHomeData(),
        fetchProducts(),
        fetchRewards(),
      ]);

      setSettings(homeData.settings);
      setOffers(homeData.activeOffers);
      setProducts(prodData);
      setRewards(rewData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check admin session on load
  useEffect(() => {
    loadData();

    const token = getStoredAdminToken();
    if (token) {
      fetchAdminMe()
        .then((res) => {
          setAdminUser(res.admin);
        })
        .catch(() => {
          setAdminUser(null);
        });
    }
  }, [loadData]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleApplyCouponToCart = (code: string) => {
    setActiveCoupon(code);
    setCartOpen(true);
  };

  const categories = ['الكل', 'ملايات', 'بطاطين', 'فوط', 'لحف', 'مفروشات'];

  const scrollToCatalog = (cat?: string) => {
    if (cat) setActiveCategory(cat);
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-sky-50/40 text-slate-800 flex flex-col font-sans selection:bg-cyan-200 selection:text-cyan-900" dir="rtl">
      
      {/* 1. Announcement Bar */}
      <AnnouncementBar
        announcement={settings?.announcement_bar || ''}
        onOpenOffers={() => {
          const el = document.getElementById('offers-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenBranches={() => setBranchesOpen(true)}
      />

      {/* 2. Main Navigation Header */}
      <Header
        cartCount={totalCartCount}
        onOpenCart={() => setCartOpen(true)}
        onOpenLoyalty={() => setLoyaltyOpen(true)}
        onOpenOffers={() => {
          const el = document.getElementById('offers-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenBranches={() => setBranchesOpen(true)}
        onOpenTrack={() => setTrackOpen(true)}
        onOpenCatalog={scrollToCatalog}
        onOpenAdmin={() => {
          if (adminUser) {
            setAdminDashboardOpen(true);
          } else {
            setAdminLoginOpen(true);
          }
        }}
        isAdminLoggedIn={!!adminUser}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />

      {/* 3. Hero Section */}
      <HeroBanner
        settings={settings}
        onOpenCatalog={() => scrollToCatalog()}
        onOpenLoyalty={() => setLoyaltyOpen(true)}
        onOpenOffers={() => {
          const el = document.getElementById('offers-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenBranches={() => setBranchesOpen(true)}
        onOpenChat={() => setAiChatOpen(true)}
      />

      {/* 4. Featured Offers Section */}
      <div id="offers-section">
        <FeaturedOffers
          offers={offers}
          onApplyCouponToCart={handleApplyCouponToCart}
          onOpenCatalog={() => scrollToCatalog()}
        />
      </div>

      {/* 5. Product Catalog & Store */}
      <ProductCatalog
        products={products}
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onAddToCart={handleAddToCart}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 6. Loyalty Banner Highlight */}
      <section className="py-12 bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-300/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-right">
              <span className="bg-amber-400 text-amber-950 text-xs font-black px-3 py-1 rounded-full inline-block shadow-xs">
                مكافآت كبار العملاء
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                احصل على كارت العسال وابدأ بجمع النقاط والهدايا
              </h3>
              <p className="text-cyan-100 text-xs sm:text-sm max-w-xl">
                كل عملية شراء مؤكدة تمنحك نقاطاً حقيقية تُضاف إلى رصيدك، يمكنك استبدالها بأطقم فوط قطنية، ملايات سرير، وقسائم خصم فورية.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setLoyaltyOpen(true)}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-amber-950/20 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
              >
                {activeCustomer ? 'عرض كارت العسال ورصيدك' : 'تفعيل كارت العسال مجاناً'}
              </button>

              <button
                onClick={() => setBranchesOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold px-5 py-3.5 rounded-2xl transition-all cursor-pointer text-sm"
              >
                زيارة معارضنا بالإسكندرية
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <Footer
        settings={settings}
        onOpenCatalog={() => scrollToCatalog()}
        onOpenLoyalty={() => setLoyaltyOpen(true)}
        onOpenOffers={() => {
          const el = document.getElementById('offers-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenBranches={() => setBranchesOpen(true)}
        onOpenTrack={() => setTrackOpen(true)}
        onOpenAdmin={() => {
          if (adminUser) {
            setAdminDashboardOpen(true);
          } else {
            setAdminLoginOpen(true);
          }
        }}
        onOpenChat={() => setAiChatOpen(true)}
      />

      {/* Floating Buttons: WhatsApp & AI Assistant */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
        {/* WhatsApp Direct Chat FAB */}
        <a
          href="https://api.whatsapp.com/send?phone=201277714100&text=السلام%20عليكم%20سنتر%20العسال%20للمفروشات"
          target="_blank"
          rel="noreferrer"
          className="w-13 h-13 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105 group"
          title="تواصل معنا عبر واتساب"
        >
          <MessageCircle className="w-7 h-7" />
        </a>

        {/* AI Assistant FAB */}
        <button
          onClick={() => setAiChatOpen(!aiChatOpen)}
          className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-500 hover:from-cyan-700 hover:to-sky-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-transform hover:scale-105 cursor-pointer relative"
          title="مساعد سنتر العسال الذكي"
        >
          <Sparkles className="w-6 h-6 text-amber-300" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-white rounded-full"></span>
        </button>
      </div>

      {/* Mobile Floating Cart Indicator if items exist */}
      {totalCartCount > 0 && !cartOpen && (
        <div className="fixed bottom-5 left-5 z-40 sm:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-cyan-600 text-white px-4 py-3 rounded-2xl shadow-xl font-black text-xs cursor-pointer border border-white/40"
          >
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            <span>السلة ({totalCartCount})</span>
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        initialCouponCode={activeCoupon}
        onOpenTrack={() => {
          setCartOpen(false);
          setTrackOpen(true);
        }}
      />

      <LoyaltyCardModal
        isOpen={loyaltyOpen}
        onClose={() => setLoyaltyOpen(false)}
        rewards={rewards}
        activeCustomer={activeCustomer}
        setActiveCustomer={setActiveCustomer}
      />

      <OrderTrackingModal
        isOpen={trackOpen}
        onClose={() => setTrackOpen(false)}
      />

      <BranchesModal
        isOpen={branchesOpen}
        onClose={() => setBranchesOpen(false)}
      />

      <AiAssistant
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        onOpenCatalog={() => scrollToCatalog()}
        onOpenLoyalty={() => setLoyaltyOpen(true)}
      />

      <AdminLoginModal
        isOpen={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
        onLoginSuccess={(user) => {
          setAdminUser(user);
          setAdminDashboardOpen(true);
        }}
      />

      {adminUser && adminDashboardOpen && (
        <AdminDashboard
          admin={adminUser}
          onLogout={() => {
            setAdminUser(null);
            setAdminDashboardOpen(false);
          }}
          onClose={() => setAdminDashboardOpen(false)}
          onRefreshPublicData={loadData}
        />
      )}

    </div>
  );
}
