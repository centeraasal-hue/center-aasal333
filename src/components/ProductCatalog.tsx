import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  Check,
  ShoppingBag,
  Eye,
  X,
  Sparkles,
  ShieldCheck,
  Truck,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { Product } from '../types';

interface Props {
  products: Product[];
  categories: string[];
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const ProductCatalog: React.FC<Props> = ({
  products,
  categories,
  activeCategory,
  onSelectCategory,
  onAddToCart,
  searchQuery,
  onSearchChange,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [addedNotice, setAddedNotice] = useState<number | null>(null);

  // Filters state
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc'>('featured');
  const [priceRange, setPriceRange] = useState<number>(3000);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (activeCategory !== 'الكل' && p.category !== activeCategory) {
          return false;
        }
        // In-stock filter
        if (inStockOnly && p.in_stock === 0) {
          return false;
        }
        // Price filter
        if (p.price > priceRange) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchCat = p.category.toLowerCase().includes(q);
          return matchName || matchDesc || matchCat;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      });
  }, [products, activeCategory, inStockOnly, priceRange, searchQuery, sortBy]);

  const handleQuickAdd = (p: Product) => {
    onAddToCart(p, 1);
    setAddedNotice(p.id);
    setTimeout(() => {
      setAddedNotice(null);
    }, 1500);
  };

  const handleOpenDetail = (p: Product) => {
    setSelectedProduct(p);
    setModalQty(1);
  };

  return (
    <section id="catalog-section" className="py-12 bg-white min-h-[600px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>أفخم المفروشات العصرية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              متجر مفروشات سنتر العسال
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              أطقم سراير قطن عامري، بطاطين شتوية إسباني وتركي، لحف فايبر وبشاكير حمام راقية
            </p>
          </div>

          <div className="text-xs font-bold text-slate-500 bg-sky-50 px-3 py-2 rounded-xl border border-sky-100">
            عدد المنتجات المعروضة: <span className="text-cyan-700 font-black">{filteredProducts.length}</span> منتج
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none text-sm font-bold">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all cursor-pointer shadow-2xs ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-md shadow-cyan-200'
                    : 'bg-sky-50/70 hover:bg-sky-100 text-slate-700 border border-sky-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search bar inside catalog */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="ابحث بالاسم أو الوصف..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white border border-sky-200 rounded-xl py-2 pr-9 pl-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 w-full md:w-auto text-xs sm:text-sm font-semibold">
            {/* Price Slider */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-sky-100">
              <span className="text-slate-500">الحد الأقصى للسعر:</span>
              <span className="font-bold text-cyan-700">{priceRange} ج</span>
              <input
                type="range"
                min="100"
                max="3000"
                step="50"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-24 accent-cyan-600 cursor-pointer"
              />
            </div>

            {/* In-Stock Toggle */}
            <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-sky-100 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-cyan-600 rounded"
              />
              <span className="text-slate-700">المتاح فقط</span>
            </label>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-xl border border-sky-100">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-700 text-xs sm:text-sm font-bold focus:outline-none cursor-pointer"
              >
                <option value="featured">المميز والأحدث</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-sky-50/50 rounded-3xl border-2 border-dashed border-sky-200">
            <ShoppingBag className="w-12 h-12 text-sky-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">لا توجد منتجات تطابق البحث أو الفلتر المختار</h3>
            <p className="text-sm text-slate-500 mt-1">جرّب تغيير التصنيف أو مسح شروط الفلترة</p>
            <button
              onClick={() => {
                onSelectCategory('الكل');
                onSearchChange('');
                setInStockOnly(false);
                setPriceRange(3000);
              }}
              className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold hover:bg-cyan-700 cursor-pointer"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const isOut = product.in_stock === 0;
              const hasDiscount = product.original_price && product.original_price > product.price;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-sky-100 hover:border-cyan-300 shadow-sm hover:shadow-xl hover:shadow-sky-100/70 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  {/* Image Container */}
                  <div className="relative h-56 w-full bg-sky-50 overflow-hidden cursor-pointer" onClick={() => handleOpenDetail(product)}>
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Badge */}
                    {product.badge && (
                      <span className="absolute top-3 right-3 bg-gradient-to-r from-cyan-600 to-sky-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs">
                        {product.badge}
                      </span>
                    )}

                    {/* Stock status overlay */}
                    {isOut && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4">
                        <span className="bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          غير متوفر حالياً
                        </span>
                      </div>
                    )}

                    {/* Discount percentage tag */}
                    {hasDiscount && (
                      <span className="absolute bottom-3 right-3 bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                        وفر {Math.round(((product.original_price! - product.price) / product.original_price!) * 100)}%
                      </span>
                    )}

                    {/* Quick view button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(product);
                      }}
                      className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="معاينة التفاصيل"
                    >
                      <Eye className="w-4 h-4 text-cyan-700" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                        <span className="bg-sky-50 text-cyan-800 font-bold px-2 py-0.5 rounded-md text-[11px]">
                          {product.category}
                        </span>
                        <span>{product.in_stock ? 'متوفر بالمعارض' : 'نفد المخزون'}</span>
                      </div>

                      <h3
                        onClick={() => handleOpenDetail(product)}
                        className="font-bold text-slate-800 text-base group-hover:text-cyan-700 transition-colors line-clamp-2 leading-snug cursor-pointer"
                      >
                        {product.name}
                      </h3>

                      <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Price and Add button */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-slate-900">{product.price}</span>
                          <span className="text-xs font-bold text-slate-500">ج.م</span>
                        </div>
                        {product.original_price && (
                          <div className="text-xs text-slate-400 line-through">
                            {product.original_price} ج.م
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleQuickAdd(product)}
                        disabled={isOut}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          isOut
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : addedNotice === product.id
                            ? 'bg-emerald-500 text-white'
                            : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs shadow-cyan-200'
                        }`}
                      >
                        {addedNotice === product.id ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>أضيف للسلة</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>أضف للسلة</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-sky-100 max-h-[90vh] overflow-y-auto relative">
            
            {/* Close button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 left-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-2">
              {/* Product Image */}
              <div className="rounded-2xl overflow-hidden bg-sky-50 border border-sky-100 h-64 md:h-72">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <span className="bg-cyan-50 text-cyan-800 text-xs font-bold px-2.5 py-1 rounded-md border border-cyan-100">
                    قسم {selectedProduct.category}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-2 leading-snug">
                    {selectedProduct.name}
                  </h3>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-cyan-700">{selectedProduct.price}</span>
                  <span className="text-sm font-bold text-slate-600">جنيه مصري</span>
                  {selectedProduct.original_price && (
                    <span className="text-sm text-slate-400 line-through mr-2">
                      {selectedProduct.original_price} ج.م
                    </span>
                  )}
                </div>

                <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-100 text-xs text-slate-700 leading-relaxed">
                  <p className="font-bold text-slate-900 mb-1">المواصفات والخامة:</p>
                  <p>{selectedProduct.description}</p>
                </div>

                {/* Assurance details */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>خامات أصلية 100%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-cyan-600" />
                    <span>توصيل لجميع مناطق الإسكندرية</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>متاح للمعاينة والاستلام من فرع أنور السادات وفرع كرموز</span>
                  </div>
                </div>

                {/* Quantity and Add to Cart */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <button
                      onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                      className="w-8 h-8 flex items-center justify-center font-bold text-slate-700 hover:bg-white rounded-lg cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-black text-sm text-slate-800">{modalQty}</span>
                    <button
                      onClick={() => setModalQty(modalQty + 1)}
                      className="w-8 h-8 flex items-center justify-center font-bold text-slate-700 hover:bg-white rounded-lg cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      onAddToCart(selectedProduct, modalQty);
                      setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.in_stock === 0}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                      selectedProduct.in_stock === 0
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-200'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{selectedProduct.in_stock ? `إضافة ${modalQty} للسلة (${selectedProduct.price * modalQty} ج)` : 'غير متوفر حالياً'}</span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
