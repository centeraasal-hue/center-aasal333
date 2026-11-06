import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from '@google/genai';
import db from '../db.js';
import { generateAdminToken, requireAdminAuth } from '../auth.js';

import dotenv from 'dotenv';
dotenv.config();

const router = Router();

// Lazy Gemini API client helper
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to generate IDs
function generateMembershipId(): string {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `ASL-${rand}`;
}

function generateReferralCode(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REF-${rand}`;
}

function generateOrderNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${new Date().getFullYear()}-${rand}`;
}

// ==========================================
// 1. PUBLIC ENDPOINTS
// ==========================================

// GET /api/home - General settings, banner, top offers, and featured products
router.get('/home', (req: Request, res: Response) => {
  try {
    const rawSettings = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    rawSettings.forEach(s => { settings[s.key] = s.value; });

    const activeOffers = db.prepare('SELECT * FROM offers WHERE is_active = 1 ORDER BY id DESC').all();
    const featuredProducts = db.prepare('SELECT * FROM products WHERE is_featured = 1 AND in_stock = 1 LIMIT 8').all();
    const bestSellers = db.prepare("SELECT * FROM products WHERE badge = 'الأكثر مبيعاً' AND in_stock = 1 LIMIT 4").all();

    res.json({
      settings,
      activeOffers,
      featuredProducts,
      bestSellers
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل تحميل بيانات الصفحة الرئيسية: ' + error.message });
  }
});

// GET /api/products - Filterable products catalog
router.get('/products', (req: Request, res: Response) => {
  try {
    const { category, search, minPrice, maxPrice, inStockOnly, sort } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'الكل') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      query += ' AND price >= ?';
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(Number(maxPrice));
    }

    if (inStockOnly === 'true') {
      query += ' AND in_stock = 1';
    }

    if (sort === 'price_asc') {
      query += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY price DESC';
    } else {
      query += ' ORDER BY is_featured DESC, id DESC';
    }

    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: 'فشل جلب المنتجات: ' + error.message });
  }
});

// GET /api/products/:id
router.get('/products/:id', (req: Request, res: Response) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'المنتج غير موجود' });
      return;
    }
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/offers - Active promotions
router.get('/offers', (req: Request, res: Response) => {
  try {
    const offers = db.prepare('SELECT * FROM offers WHERE is_active = 1 ORDER BY id DESC').all();
    res.json(offers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/offers/validate-coupon
router.post('/offers/validate-coupon', (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      res.status(400).json({ error: 'يرجى إدخال كود الخصم' });
      return;
    }

    const offer = db.prepare('SELECT * FROM offers WHERE UPPER(promo_code) = UPPER(?) AND is_active = 1').get(code.trim()) as any;
    if (!offer) {
      res.status(404).json({ error: 'كود الخصم غير صحيح أو غير مفعل حالياً' });
      return;
    }

    // Check expiry date
    if (new Date(offer.end_date).getTime() < Date.now()) {
      res.status(400).json({ error: 'عذراً، هذا العرض انتهت مدته' });
      return;
    }

    // Calculate discount
    const discount = Math.round((subtotal * offer.discount_percentage) / 100);
    res.json({
      valid: true,
      code: offer.promo_code,
      title: offer.title,
      discountPercentage: offer.discount_percentage,
      discountAmount: discount,
      message: `تم تطبيق خصم ${offer.discount_percentage}% بنجاح!`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/orders - Submit customer order
router.post('/orders', (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerPhone,
      deliveryType,
      branchOrAddress,
      notes,
      items,
      promoCode,
      referralCode
    } = req.body;

    if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'يرجى استكمال جميع بيانات الطلب والمنتجات المطلوبة' });
      return;
    }

    // Clean phone number
    const cleanPhone = customerPhone.replace(/\s+/g, '');

    // Calculate totals securely from database prices
    let subtotal = 0;
    const validatedItems: Array<{
      productId: number;
      name: string;
      price: number;
      quantity: number;
      total: number;
    }> = [];

    for (const item of items) {
      const product = db.prepare('SELECT id, name, price, in_stock FROM products WHERE id = ?').get(item.id) as any;
      if (!product) {
        res.status(400).json({ error: `المنتج رقم ${item.id} غير متوفر` });
        return;
      }
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const lineTotal = product.price * qty;
      subtotal += lineTotal;
      validatedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: qty,
        total: lineTotal
      });
    }

    // Check promo code if any
    let discountAmount = 0;
    if (promoCode) {
      const offer = db.prepare('SELECT * FROM offers WHERE UPPER(promo_code) = UPPER(?) AND is_active = 1').get(promoCode.trim()) as any;
      if (offer && new Date(offer.end_date).getTime() >= Date.now()) {
        discountAmount = Math.round((subtotal * offer.discount_percentage) / 100);
      }
    }

    const total = Math.max(0, subtotal - discountAmount);

    // Check if customer exists in loyalty DB
    let customer = db.prepare('SELECT id FROM customers WHERE phone = ?').get(cleanPhone) as any;
    let customerId = customer ? customer.id : null;

    // Generate unique order number
    let orderNumber = generateOrderNumber();
    while (db.prepare('SELECT id FROM orders WHERE order_number = ?').get(orderNumber)) {
      orderNumber = generateOrderNumber();
    }

    // Save order
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_number, customer_name, customer_phone, customer_id,
        delivery_type, branch_or_address, notes, subtotal,
        discount_amount, promo_code, total, status, points_awarded,
        referral_code_used, referral_rewarded
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', 0, ?, 0)
    `);

    const result = insertOrder.run(
      orderNumber,
      customerName.trim(),
      cleanPhone,
      customerId,
      deliveryType || 'pickup',
      branchOrAddress || 'استلام من المعرض الرئيسي',
      notes || '',
      subtotal,
      discountAmount,
      promoCode || null,
      total,
      referralCode ? referralCode.trim() : null
    );

    const orderId = result.lastInsertRowid;

    // Save order items
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of validatedItems) {
      insertItem.run(orderId, item.productId, item.name, item.price, item.quantity, item.total);
    }

    res.json({
      success: true,
      orderNumber,
      total,
      customerName,
      customerPhone: cleanPhone,
      message: 'تم إرسال طلبك بنجاح! رقم المتابعة الخاص بك هو: ' + orderNumber
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل حفظ الطلب: ' + error.message });
  }
});

// GET /api/orders/track/:query - Track order by phone or order number
router.get('/orders/track/:query', (req: Request, res: Response) => {
  try {
    const rawQuery = req.params.query.trim();
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE order_number = ? OR customer_phone = ?
      ORDER BY id DESC LIMIT 5
    `).all(rawQuery, rawQuery) as any[];

    if (!orders || orders.length === 0) {
      res.status(404).json({ error: 'لم يتم العثور على أي طلبات برقم المتابعة أو رقم الهاتف المدخل' });
      return;
    }

    // Attach items for each order
    const detailedOrders = orders.map(ord => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(ord.id);
      return { ...ord, items };
    });

    res.json(detailedOrders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customers/lookup - Look up loyalty card by phone
router.post('/customers/lookup', (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'يرجى إدخال رقم الهاتف' });
      return;
    }
    const cleanPhone = phone.replace(/\s+/g, '');
    const customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(cleanPhone) as any;

    if (!customer) {
      res.status(404).json({ error: 'لم يتم العثور على عضوية مسجلة بهذا الرقم. يمكنك الاشتراك مجاناً الآن!' });
      return;
    }

    // Get redemptions and points history
    const redemptions = db.prepare('SELECT * FROM rewards_redemptions WHERE customer_id = ? ORDER BY id DESC').all(customer.id);
    const history = db.prepare('SELECT * FROM points_history WHERE customer_id = ? ORDER BY id DESC').all(customer.id);
    const confirmedOrdersCount = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE customer_phone = ? AND status IN ('confirmed', 'delivered')").get(cleanPhone) as any).count;
    const referralsCount = (db.prepare('SELECT COUNT(*) as count FROM customers WHERE referred_by_code = ?').get(customer.referral_code) as any).count;

    res.json({
      customer,
      redemptions,
      history,
      confirmedOrdersCount,
      referralsCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/customers/register - Register new loyalty card
router.post('/customers/register', (req: Request, res: Response) => {
  try {
    const { name, phone, referralCode } = req.body;
    if (!name || !phone) {
      res.status(400).json({ error: 'يرجى إدخال الاسم ورقم الهاتف' });
      return;
    }
    const cleanPhone = phone.replace(/\s+/g, '');

    // Check if phone already registered
    const existing = db.prepare('SELECT * FROM customers WHERE phone = ?').get(cleanPhone);
    if (existing) {
      res.status(400).json({ error: 'رقم الهاتف مسجل بالفعل في نظام كارت العسال' });
      return;
    }

    // Check if referral code is valid
    let validReferralCode: string | null = null;
    if (referralCode && referralCode.trim()) {
      const referrer = db.prepare('SELECT id FROM customers WHERE referral_code = ?').get(referralCode.trim().toUpperCase());
      if (referrer) {
        validReferralCode = referralCode.trim().toUpperCase();
      }
    }

    // Generate membership ID & referral code
    let membershipId = generateMembershipId();
    while (db.prepare('SELECT id FROM customers WHERE membership_id = ?').get(membershipId)) {
      membershipId = generateMembershipId();
    }

    let myReferralCode = generateReferralCode();
    while (db.prepare('SELECT id FROM customers WHERE referral_code = ?').get(myReferralCode)) {
      myReferralCode = generateReferralCode();
    }

    // Create customer with 0 initial points (Strict requirement: لا تمنح نقاطًا أو جوائز تلقائيًا لمجرد التسجيل)
    const result = db.prepare(`
      INSERT INTO customers (membership_id, name, phone, points, referral_code, referred_by_code)
      VALUES (?, ?, ?, 0, ?, ?)
    `).run(membershipId, name.trim(), cleanPhone, myReferralCode, validReferralCode);

    const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      customer: newCustomer,
      message: 'تم تفعيل كارت العسال الخاص بك بنجاح! رصيدك سيزداد تلقائياً مع كل عملية شراء مؤكدة.'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'فشل التسجيل: ' + error.message });
  }
});

// GET /api/rewards - Rewards catalog
router.get('/rewards', (req: Request, res: Response) => {
  try {
    const rewards = db.prepare('SELECT * FROM rewards_catalog WHERE is_active = 1 ORDER BY points_required ASC').all();
    res.json(rewards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/rewards/redeem - Redeem points
router.post('/rewards/redeem', (req: Request, res: Response) => {
  try {
    const { customerPhone, rewardId } = req.body;
    if (!customerPhone || !rewardId) {
      res.status(400).json({ error: 'البيانات غير مكتملة' });
      return;
    }
    const cleanPhone = customerPhone.replace(/\s+/g, '');
    const customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(cleanPhone) as any;
    if (!customer) {
      res.status(404).json({ error: 'العضوية غير موجودة' });
      return;
    }

    const reward = db.prepare('SELECT * FROM rewards_catalog WHERE id = ? AND is_active = 1').get(rewardId) as any;
    if (!reward) {
      res.status(404).json({ error: 'المكافأة غير متوفرة' });
      return;
    }

    if (customer.points < reward.points_required) {
      res.status(400).json({
        error: `رصيد نقاطك (${customer.points} نقطة) غير كافٍ لاستبدال هذه المكافأة (${reward.points_required} نقطة)`
      });
      return;
    }

    // Deduct points in transaction
    const updateCustomer = db.prepare('UPDATE customers SET points = points - ? WHERE id = ?');
    const insertRedemption = db.prepare(`
      INSERT INTO rewards_redemptions (customer_id, reward_id, points_spent, reward_title, status)
      VALUES (?, ?, ?, ?, 'confirmed')
    `);
    const insertHistory = db.prepare(`
      INSERT INTO points_history (customer_id, points_change, reason)
      VALUES (?, ?, ?)
    `);

    const runTransaction = db.transaction(() => {
      updateCustomer.run(reward.points_required, customer.id);
      insertRedemption.run(customer.id, reward.id, reward.points_required, reward.title);
      insertHistory.run(customer.id, -reward.points_required, `استبدال مكافأة: ${reward.title}`);
    });

    runTransaction();

    const updatedCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer.id);
    res.json({
      success: true,
      message: `ألف مبروك! تم استبدال مكافأة "${reward.title}" بنجاح. أظهر هذا التأكيد عند الاستلام من فروعنا.`,
      updatedCustomer
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/chat - AI Assistant in friendly Egyptian Arabic
router.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'يرجى كتابة رسالتك' });
      return;
    }

    // Retrieve live catalog & offers context from DB
    const inStockProducts = db.prepare(`
      SELECT name, category, price, original_price, description, badge
      FROM products WHERE in_stock = 1 LIMIT 25
    `).all() as any[];

    const activeOffers = db.prepare(`
      SELECT title, discount_percentage, promo_code, end_date, banner_text
      FROM offers WHERE is_active = 1
    `).all() as any[];

    const productsContext = inStockProducts.map(p =>
      `- ${p.name} (قسم: ${p.category}) - السعر: ${p.price} جنيه ${p.original_price ? `(قبل الخصم: ${p.original_price} ج)` : ''} - الوصف: ${p.description}`
    ).join('\n');

    const offersContext = activeOffers.map(o =>
      `- ${o.title} | كود الخصم: ${o.promo_code} | نسبة الخصم: ${o.discount_percentage}% | ينتهي في: ${new Date(o.end_date).toLocaleDateString('ar-EG')}`
    ).join('\n');

    const systemInstruction = `
أنت "مساعد سنتر العسال الذكي" - المتخصص الرقمي في سنتر العسال لتجارة المفروشات بالإسكندرية.
تتحدث باللغة العربية المصرية الودودة، الراقية، المهذبة، والواضحة (زي: "يا هلا بيك يا فندم في سنتر العسال"، "عيوني ليك"، "كل مفروشات وتجهيز العرايس عندنا بأعلى جودة"، "تحت أمرك في أي وقت").

بيانات سنتر العسال الحقيقية التي يجب الالتزام بها بدقة:
- الفروع بالإسكندرية:
  1. المعرض الرئيسي: 8 شارع أنور السادات – الإسكندرية.
  2. الفرع الثاني: 95 عمود السواري – كرموز – الإسكندرية.
- أرقام التواصل والواتساب: 01277714100 و 01279207793.
- مواعيد العمل: يومياً من 11 صباحاً حتى 11 مساءً.
- التوصيل: متاح لجميع مناطق الإسكندرية مع إمكانية المعاينة والاستلام من المعارض.

قائمة المنتجات المتاحة حالياً وأسعارها الحقيقية من قاعدة البيانات:
${productsContext}

العروض وأكواد الخصم المفعلة حالياً:
${offersContext}

كارت العسال ونقاط الولاء:
- كارت رقمي مجاني يسجل فيه العميل بالاسم ورقم الهاتف.
- تضاف النقاط فقط بعد تأكيد وشراء الطلب الفعلي من المعرض أو الموقع (10 نقاط لكل 100 جنيه).
- يمكن استبدال النقاط بهدايا مجانية وقسائم خصم.
- نظام ادعُ صديقك: يشارك العميل كود دعوته ويحصل على 50 نقطة مكافأة عند إتمام صديقه أول عملية شراء مؤكدة.

تعليمات هامة جداً:
1. لا تخترع منتجات أو أسعار أو عروض غير موجودة في القائمة أعلاه! إذا سأل العميل عن منتج غير مدرج، قل بلطف إن سنتر العسال يقدر يوفره بالطلب، وانصحه بالتواصل مع المعرض أو زيارة أقرب فرع.
2. كن مساعداً شاطراً في اقتراح تنسيقات العرائس (ملايات + بطاطين + أطقم بشاكير ولحف).
3. ساعد العميل في إتمام الطلب من سلة المشتريات وتطبيق كود الخصم المناسب.
4. اذكر دائماً أرقام الهواتف أو إمكانية التواصل عبر واتساب لخدمة سريعة.
`;

    const ai = getAiClient();
    if (!ai) {
      // Friendly intelligent response with database context
      res.json({
        reply: `أهلاً بحضرتك في سنتر العسال لتجارة المفروشات بالإسكندرية! 🌸\n` +
          `يسعدنا دائماً خدمتك. فروعنا بالإسكندرية:\n` +
          `📍 المعرض الرئيسي: 8 شارع أنور السادات.\n` +
          `📍 الفرع الثاني: 95 عمود السواري – كرموز.\n` +
          `أطقم الملايات القطن والبطاطين ولحف العرائس متاحة بخصومات رائعة اليوم. وتقدر تتواصل مباشرة معنا عبر الهاتف أو واتساب على 01277714100 أو 01279207793.`
      });
      return;
    }

    // Call @google/genai with gemini-3.8-flash model with a 10s timeout
    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI Request Timeout')), 10000)
    );

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
    const reply = response.text || 'أهلاً بحضرتك في سنتر العسال! تحت أمرك في أي استفسار.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Gemini AI Chat Error:', error);
    res.json({
      reply: 'أهلاً بحضرتك في سنتر العسال بالإسكندرية! فروعنا في 8 شارع أنور السادات و95 عمود السواري بكرموز. يسعدنا تواصلك المباشر مع فريق المبيعات على 01277714100 لأي تفاصيل عن الأسعار وتجهيزات العرائس.'
    });
  }
});

// ==========================================
// 2. ADMIN AUTHENTICATION
// ==========================================

// POST /api/admin/login and /api/login
router.post(['/admin/login', '/login'], (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const body = req.body || {};
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !password) {
      res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
      return;
    }

    let admin: any;
    try {
      admin = db.prepare('SELECT id, username, password_hash, display_name FROM admin_users WHERE username = ?').get(username);
    } catch (dbErr: any) {
      console.error('Database query error in admin login:', dbErr);
      res.status(500).json({ error: 'خطأ في الاتصال بقاعدة البيانات أثناء التحقق من الحساب' });
      return;
    }

    if (!admin) {
      res.status(401).json({ error: 'بيانات الدخول غير صحيحة: اسم المستخدم غير مسجل' });
      return;
    }

    let isMatch = false;
    try {
      isMatch = bcrypt.compareSync(password, admin.password_hash);
    } catch (bcryptErr: any) {
      console.error('Bcrypt compare error:', bcryptErr);
      isMatch = false;
    }

    if (!isMatch) {
      res.status(401).json({ error: 'بيانات الدخول غير صحيحة: كلمة المرور غير صحيحة' });
      return;
    }

    // Update last login timestamp safely
    try {
      db.prepare('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(admin.id);
    } catch (updateErr) {
      console.error('Failed to update last_login timestamp:', updateErr);
    }

    const token = generateAdminToken({
      id: admin.id,
      username: admin.username,
      display_name: admin.display_name
    });

    // Set secure cookie
    try {
      res.cookie('assal_admin_jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    } catch (cookieErr) {
      console.error('Failed to set cookie:', cookieErr);
    }

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        display_name: admin.display_name
      }
    });
  } catch (error: any) {
    console.error('Unexpected admin login error:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم أثناء تسجيل الدخول: ' + (error?.message || 'يرجى المحاولة لاحقاً') });
  }
});

// POST /api/admin/logout and /api/logout
router.post(['/admin/logout', '/logout'], (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    res.clearCookie('assal_admin_jwt');
  } catch (err) {
    console.error('Clear cookie error:', err);
  }
  res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

// GET /api/admin/me and /api/me
router.get(['/admin/me', '/me'], requireAdminAuth, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({
    admin: (req as any).admin
  });
});

// POST /api/admin/change-password and /api/change-password
router.post(['/admin/change-password', '/change-password'], requireAdminAuth, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const body = req.body || {};
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
    const adminUser = (req as any).admin;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف' });
      return;
    }

    const currentRecord = db.prepare('SELECT password_hash FROM admin_users WHERE id = ?').get(adminUser.id) as any;
    if (!currentRecord) {
      res.status(404).json({ error: 'المستخدم غير موجود' });
      return;
    }

    let isCurrentMatch = false;
    try {
      isCurrentMatch = bcrypt.compareSync(currentPassword, currentRecord.password_hash);
    } catch {
      isCurrentMatch = false;
    }

    if (!isCurrentMatch) {
      res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(newHash, adminUser.id);

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'فشل تغيير كلمة المرور: ' + error?.message });
  }
});


// ==========================================
// 3. ADMIN DASHBOARD OPERATIONS (PROTECTED)
// ==========================================

// GET /api/admin/stats
router.get('/admin/stats', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count;
    const confirmedOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('confirmed', 'delivered')").get() as any).count;
    const newOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'new'").get() as any).count;
    const totalSales = (db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status IN ('confirmed', 'delivered')").get() as any).total;

    const totalProducts = (db.prepare('SELECT COUNT(*) as count FROM products').get() as any).count;
    const outOfStockProducts = (db.prepare('SELECT COUNT(*) as count FROM products WHERE in_stock = 0').get() as any).count;
    const totalCustomers = (db.prepare('SELECT COUNT(*) as count FROM customers').get() as any).count;
    const totalPointsActive = (db.prepare('SELECT COALESCE(SUM(points), 0) as total FROM customers').get() as any).total;
    const activeOffersCount = (db.prepare('SELECT COUNT(*) as count FROM offers WHERE is_active = 1').get() as any).count;

    const recentOrders = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 5').all();

    res.json({
      totalOrders,
      confirmedOrders,
      newOrders,
      totalSales,
      totalProducts,
      outOfStockProducts,
      totalCustomers,
      totalPointsActive,
      activeOffersCount,
      recentOrders
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Product CRUD
router.get('/admin/products', requireAdminAuth, (req: Request, res: Response) => {
  const products = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
  res.json(products);
});

router.post('/admin/products', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { name, category, price, original_price, image_url, description, in_stock, badge, is_featured } = req.body;
    if (!name || !category || !price || !image_url) {
      res.status(400).json({ error: 'الاسم، القسم، السعر ورابط الصورة مطلوبة' });
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO products (name, category, price, original_price, image_url, description, in_stock, badge, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      category.trim(),
      Number(price),
      original_price ? Number(original_price) : null,
      image_url.trim(),
      description || '',
      in_stock ? 1 : 0,
      badge ? badge.trim() : null,
      is_featured ? 1 : 0
    );

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, product: created });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { name, category, price, original_price, image_url, description, in_stock, badge, is_featured } = req.body;
    const stmt = db.prepare(`
      UPDATE products SET
        name = ?, category = ?, price = ?, original_price = ?,
        image_url = ?, description = ?, in_stock = ?, badge = ?, is_featured = ?
      WHERE id = ?
    `);

    stmt.run(
      name.trim(),
      category.trim(),
      Number(price),
      original_price ? Number(original_price) : null,
      image_url.trim(),
      description || '',
      in_stock ? 1 : 0,
      badge ? badge.trim() : null,
      is_featured ? 1 : 0,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ success: true, product: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Order Management
router.get('/admin/orders', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC').all() as any[];
    const detailed = orders.map(ord => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(ord.id);
      return { ...ord, items };
    });
    res.json(detailed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Order Status with strict loyalty rules
router.put('/admin/orders/:id/status', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) {
      res.status(404).json({ error: 'الطلب غير موجود' });
      return;
    }

    const runTx = db.transaction(() => {
      // Update order status
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);

      // Rule: Add points ONLY upon confirmed/delivered purchase, preventing duplicates
      if ((status === 'confirmed' || status === 'delivered') && order.points_awarded === 0) {
        // Find or create customer
        let customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(order.customer_phone) as any;
        if (!customer) {
          // Auto-generate membership for verified confirmed purchase if not present
          const membershipId = generateMembershipId();
          const refCode = generateReferralCode();
          const resIns = db.prepare(`
            INSERT INTO customers (membership_id, name, phone, points, referral_code)
            VALUES (?, ?, ?, 0, ?)
          `).run(membershipId, order.customer_name, order.customer_phone, refCode);
          customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(resIns.lastInsertRowid) as any;
        }

        // Calculate points (10 points per 100 EGP = 10%)
        const earnedPoints = Math.max(1, Math.floor((order.total * 10) / 100));

        // Add points to customer
        db.prepare('UPDATE customers SET points = points + ? WHERE id = ?').run(earnedPoints, customer.id);
        db.prepare(`
          INSERT INTO points_history (customer_id, order_id, points_change, reason)
          VALUES (?, ?, ?, ?)
        `).run(customer.id, order.id, earnedPoints, `مكافأة مشتريات مؤكدة للطلب ${order.order_number}`);

        // Mark points awarded on order
        db.prepare('UPDATE orders SET points_awarded = 1, customer_id = ? WHERE id = ?').run(customer.id, orderId);

        // Check referral reward
        if (order.referral_code_used && order.referral_rewarded === 0) {
          const referrer = db.prepare('SELECT * FROM customers WHERE referral_code = ?').get(order.referral_code_used.trim().toUpperCase()) as any;
          if (referrer && referrer.id !== customer.id) {
            const referralBonus = 50; // 50 points bonus
            db.prepare('UPDATE customers SET points = points + ? WHERE id = ?').run(referralBonus, referrer.id);
            db.prepare(`
              INSERT INTO points_history (customer_id, order_id, points_change, reason)
              VALUES (?, ?, ?, ?)
            `).run(referrer.id, order.id, referralBonus, `مكافأة دعوة صديق (العميل: ${order.customer_name})`);
            db.prepare('UPDATE orders SET referral_rewarded = 1 WHERE id = ?').run(orderId);
          }
        }
      }
    });

    runTx();

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
    res.json({ success: true, order: { ...updated, items } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/admin/orders/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(req.params.id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'تم حذف الطلب' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Offers CRUD
router.get('/admin/offers', requireAdminAuth, (req: Request, res: Response) => {
  const offers = db.prepare('SELECT * FROM offers ORDER BY id DESC').all();
  res.json(offers);
});

router.post('/admin/offers', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { title, description, discount_percentage, old_price, new_price, promo_code, end_date, banner_text, is_active } = req.body;
    if (!title || !discount_percentage || !end_date) {
      res.status(400).json({ error: 'عنوان العرض، نسبة الخصم وتاريخ الانتهاء مطلوبة' });
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO offers (title, description, discount_percentage, old_price, new_price, promo_code, end_date, banner_text, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title.trim(),
      description || '',
      Number(discount_percentage),
      old_price ? Number(old_price) : null,
      new_price ? Number(new_price) : null,
      promo_code ? promo_code.trim().toUpperCase() : null,
      end_date,
      banner_text || '',
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    );

    const created = db.prepare('SELECT * FROM offers WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, offer: created });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/admin/offers/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { title, description, discount_percentage, old_price, new_price, promo_code, end_date, banner_text, is_active } = req.body;
    const stmt = db.prepare(`
      UPDATE offers SET
        title = ?, description = ?, discount_percentage = ?, old_price = ?,
        new_price = ?, promo_code = ?, end_date = ?, banner_text = ?, is_active = ?
      WHERE id = ?
    `);

    stmt.run(
      title.trim(),
      description || '',
      Number(discount_percentage),
      old_price ? Number(old_price) : null,
      new_price ? Number(new_price) : null,
      promo_code ? promo_code.trim().toUpperCase() : null,
      end_date,
      banner_text || '',
      is_active ? 1 : 0,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
    res.json({ success: true, offer: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/admin/offers/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM offers WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'تم حذف العرض' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Customers & Loyalty Management
router.get('/admin/customers', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const customers = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM orders o WHERE o.customer_phone = c.phone) as total_orders,
        (SELECT COUNT(*) FROM customers ref WHERE ref.referred_by_code = c.referral_code) as referral_count
      FROM customers c
      ORDER BY c.id DESC
    `).all();
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/admin/customers/:id/adjust-points', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { pointsChange, reason } = req.body;
    const customerId = req.params.id;

    if (!pointsChange || isNaN(Number(pointsChange))) {
      res.status(400).json({ error: 'يرجى إدخال عدد نقاط صالح' });
      return;
    }

    const delta = Number(pointsChange);
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId) as any;
    if (!customer) {
      res.status(404).json({ error: 'العميل غير موجود' });
      return;
    }

    const newPoints = Math.max(0, customer.points + delta);

    const runTx = db.transaction(() => {
      db.prepare('UPDATE customers SET points = ? WHERE id = ?').run(newPoints, customerId);
      db.prepare(`
        INSERT INTO points_history (customer_id, points_change, reason)
        VALUES (?, ?, ?)
      `).run(customerId, delta, reason || 'تعديل إداري للنقاط');
    });

    runTx();

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    res.json({ success: true, customer: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Settings CRUD
router.get('/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
  const raw = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  raw.forEach(r => { settings[r.key] = r.value; });
  res.json(settings);
});

router.put('/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const newSettings = req.body;
    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    const runTx = db.transaction(() => {
      for (const [k, v] of Object.entries(newSettings)) {
        if (typeof v === 'string') {
          upsert.run(k, v);
        }
      }
    });

    runTx();
    res.json({ success: true, message: 'تم حفظ الإعدادات بنجاح' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. EXPORT TO EXCEL (.XLSX)
// ==========================================
router.get('/admin/export/:type', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const type = req.params.type;
    const workbook = XLSX.utils.book_new();

    if (type === 'orders') {
      const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC').all() as any[];
      const exportRows = orders.map(o => ({
        'رقم الطلب': o.order_number,
        'اسم العميل': o.customer_name,
        'رقم الهاتف': o.customer_phone,
        'طريقة الاستلام': o.delivery_type === 'pickup' ? 'استلام من المعرض' : 'توصيل',
        'العنوان / الفرع': o.branch_or_address,
        'المبلغ الإجمالي (ج.م)': o.total,
        'الخصم (ج.م)': o.discount_amount,
        'كود الخصم': o.promo_code || 'بدون',
        'حالة الطلب': o.status === 'confirmed' ? 'مؤكد' : o.status === 'delivered' ? 'تم التسليم' : o.status === 'cancelled' ? 'ملغي' : 'جديد',
        'تم منح النقاط': o.points_awarded ? 'نعم' : 'لا',
        'تاريخ الطلب': o.created_at
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلبات');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="alassal-orders.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
      return;
    }

    if (type === 'products') {
      const products = db.prepare('SELECT * FROM products ORDER BY id DESC').all() as any[];
      const exportRows = products.map(p => ({
        'الكود': p.id,
        'اسم المنتج': p.name,
        'القسم': p.category,
        'السعر الحالي (ج.م)': p.price,
        'السعر الأصلي (ج.م)': p.original_price || '-',
        'حالة المخزون': p.in_stock ? 'متوفر' : 'غير متوفر',
        'الشارة': p.badge || '-',
        'مميز في الرئيسية': p.is_featured ? 'نعم' : 'لا',
        'الوصف': p.description
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'المنتجات');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="alassal-products.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
      return;
    }

    if (type === 'customers') {
      const customers = db.prepare('SELECT * FROM customers ORDER BY id DESC').all() as any[];
      const exportRows = customers.map(c => ({
        'رقم العضوية': c.membership_id,
        'اسم العميل': c.name,
        'رقم الهاتف': c.phone,
        'رصيد النقاط الحالي': c.points,
        'كود الدعوة الخاص به': c.referral_code,
        'انضم عبر كود': c.referred_by_code || '-',
        'تاريخ الانضمام': c.created_at
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'عملاء كارت العسال');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="alassal-customers.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
      return;
    }

    res.status(400).json({ error: 'نوع التصدير غير صالح' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
