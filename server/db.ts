import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Database file path in root directory for persistence
const dbPath = path.resolve(process.cwd(), 'alassal.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency and performance
db.pragma('journal_mode = WAL');

export function initDatabase() {
  // 1. Admin users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );
  `);

  // Ensure master admin exists. Default credentials can be changed in the dashboard.
  const checkAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  if (!checkAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Assal@Admin2026', salt);
    db.prepare(`
      INSERT INTO admin_users (username, password_hash, display_name)
      VALUES (?, ?, ?)
    `).run('admin', hash, 'مدير سنتر العسال');
  }

  // 2. Settings table for announcements, contact, points configuration
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const defaultSettings: Record<string, string> = {
    announcement_bar: '🎉 عروض مهرجان المفروشات بسنتر العسال مستمرة! خصومات تصل إلى 40% على جميع أطقم السرير والبطاطين + توصيل متاح لجميع مناطق الإسكندرية',
    welcome_title: 'العسال معاك.. كل يوم عرض ومكافأة جديدة',
    welcome_subtitle: 'سنتر العسال لتجارة المفروشات بالإسكندرية – وجهتك الأولى لأرقى المفروشات، الملايات القطنية، البطاطين الإسبانية والتركية وتجهيز العرائس بأفضل الأسعار وأعلى جودة.',
    main_branch: '8 شارع أنور السادات – الإسكندرية',
    second_branch: '95 عمود السواري – كرموز – الإسكندرية',
    phone1: '01277714100',
    phone2: '01279207793',
    whatsapp: '01277714100',
    points_per_100egp: '10', // 10 points per 100 EGP
    referral_reward_points: '50' // 50 points to referrer upon friend's first confirmed order
  };

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(defaultSettings)) {
    insertSetting.run(k, v);
  }

  // 3. Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL,
      image_url TEXT NOT NULL,
      description TEXT NOT NULL,
      in_stock INTEGER DEFAULT 1,
      badge TEXT,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed realistic products if empty
  const countProducts = (db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }).count;
  if (countProducts === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (name, category, price, original_price, image_url, description, in_stock, badge, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedProducts = [
      {
        name: 'طقم ملاية قطن مصري 100% مطرز 6 قطع',
        category: 'ملايات',
        price: 490,
        original_price: 650,
        image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
        description: 'طقم ملاية سرير كبير فاخر خامة قطن عامرية ممتاز، نعومة فائقة وثبات ألوان مضمون. يشمل: ملاية فلات + 2 كيس مخدة + 2 خدادية + خدادية إضافية صغيرة مطرزة.',
        in_stock: 1,
        badge: 'الأكثر مبيعاً',
        is_featured: 1
      },
      {
        name: 'بطانية مورا إسباني حفر ليزر طبقتين 7 كجم',
        category: 'بطاطين',
        price: 1350,
        original_price: 1650,
        image_url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
        description: 'بطانية شتوية فاخرة طبقتين فائقة الدفء وزن 7 كيلو، ملمس حريري ومقاومة للوبر، ألوان ورسومات حفر ليزر غاية في الروعة تناسب غرف النوم الراقية.',
        in_stock: 1,
        badge: 'عرض الموسم',
        is_featured: 1
      },
      {
        name: 'طقم فوط وبشاكير حمام قطن قطيفة 8 قطع',
        category: 'فوط',
        price: 580,
        original_price: 720,
        image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
        description: 'طقم فوط حمام تركي فاخر قطن خالص 100%، قدرة امتصاص عالية ونعومة لا تضاهى. يشمل 2 بشكير كبير 90*160 سم + 4 فوط وجه + 2 فوط يد بألوان باستيل راقية.',
        in_stock: 1,
        badge: 'جودة ممتازة',
        is_featured: 1
      },
      {
        name: 'لحاف فيبر رويال عرائس 5 قطع وجهين',
        category: 'لحف',
        price: 1100,
        original_price: 1400,
        image_url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4570?auto=format&fit=crop&w=800&q=80',
        description: 'لحاف عرائس فخم محشو بأجود أنواع الفيبر السوفت غير القابل للهبوط، تصميم مودرن بوجهين وألوان تركواز وسماوي مريحة للأعصاب.',
        in_stock: 1,
        badge: 'وصل حديثاً',
        is_featured: 1
      },
      {
        name: 'طقم ملاية أطفال 3D ديزني 4 قطع',
        category: 'ملايات',
        price: 360,
        original_price: 450,
        image_url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
        description: 'ملايات قطن للأطفال برسومات ثلاثية الأبعاد مبهجة ومحببة للأطفال، ألوان ثابتة عند الغسيل وملمس ناعم جداً على بشرة الأطفال.',
        in_stock: 1,
        badge: 'مفضل للأمهات',
        is_featured: 0
      },
      {
        name: 'بطانية تركي خفيفة مفرد للمصايف والشتاء 4 كجم',
        category: 'بطاطين',
        price: 750,
        original_price: 900,
        image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
        description: 'بطانية خفيفة وعملية خامة أكريليك تركي ناعم، ممتازة للسرير المفرد أو كوفيرتة شتوية على الكنب وغرف المعيشة.',
        in_stock: 1,
        badge: null,
        is_featured: 0
      },
      {
        name: 'مفرش سرير تركي جوبير دانتيل راقي 7 قطع',
        category: 'مفروشات',
        price: 1450,
        original_price: 1850,
        image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
        description: 'مفرش عرائس ملكي بتطريز دانتيل وجوبير ناعم ومتقن، يمنح غرفة النوم فخامة استثنائية مع وسائد الديكور الأنيقة.',
        in_stock: 1,
        badge: 'تجهيز عرائس',
        is_featured: 1
      },
      {
        name: 'طقم كوفيرتة بيكيه صيفي قطن 100% 4 قطع',
        category: 'مفروشات',
        price: 680,
        original_price: 850,
        image_url: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=800&q=80',
        description: 'كوفيرتة بيكيه قطن خفيفة ومثالية للأجواء الصيفية والربيعية بالإسكندرية، بنقشات هندسية رقيقة وألوان سماوية مبهجة.',
        in_stock: 1,
        badge: 'صيف 2026',
        is_featured: 0
      },
      {
        name: 'طقم مناشف مطبخ قطن تركي عالي الامتصاص 6 قطع',
        category: 'فوط',
        price: 190,
        original_price: 260,
        image_url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80',
        description: 'فوط مطبخ قطنية عملية وسريعة الجفاف، مقاس 40*60 سم، ألوان زاهية ونسيج وافل فائق الامتصاص للزيوت والماء.',
        in_stock: 1,
        badge: 'عرض اقتصادي',
        is_featured: 0
      },
      {
        name: 'لحاف فيبر أطفال وجهين رسومات كرتون',
        category: 'لحف',
        price: 520,
        original_price: 650,
        image_url: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=800&q=80',
        description: 'لحاف مفرد دافئ للأطفال حشو فيبر حراري، خفيف الوزن ولا يسبب أي حساسية، سهل الغسيل في الغسالة الأوتوماتيك.',
        in_stock: 1,
        badge: null,
        is_featured: 0
      }
    ];

    for (const p of seedProducts) {
      insertProduct.run(
        p.name,
        p.category,
        p.price,
        p.original_price,
        p.image_url,
        p.description,
        p.in_stock,
        p.badge,
        p.is_featured
      );
    }
  }

  // 4. Offers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      discount_percentage INTEGER NOT NULL,
      old_price REAL,
      new_price REAL,
      promo_code TEXT UNIQUE,
      end_date DATETIME NOT NULL,
      banner_text TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const countOffers = (db.prepare('SELECT COUNT(*) as count FROM offers').get() as { count: number }).count;
  if (countOffers === 0) {
    const insertOffer = db.prepare(`
      INSERT INTO offers (title, description, discount_percentage, old_price, new_price, promo_code, end_date, banner_text, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Create 3 real offers with countdown dates
    const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    insertOffer.run(
      'عرض نهاية الأسبوع: خصم 25% على جميع البطاطين الإسبانية',
      'احصل على خصم فوري 25% على أي بطانية مورا أو تركي طبقتين عند الطلب الآن أو الاستلام من معارضنا.',
      25,
      1650,
      1237,
      'ASSAL25',
      in3Days,
      'عرض لفترة محدودة ينتهي قريباً!',
      1
    );

    insertOffer.run(
      'بكج عروسة العسال الذهبي (طقم لحاف + 2 طقم ملاية + بشاكير حمام)',
      'وفر 700 جنيه على بكج العروسة المتكامل من سنتر العسال مع كارت هدايا ومكافأة 200 نقطة.',
      30,
      3500,
      2800,
      'AROSA2026',
      in7Days,
      'العرض الأقوى للعرائس بالإسكندرية',
      1
    );

    insertOffer.run(
      'كوبون ترحيبي لجميع العملاء الجدد',
      'استخدم كود الخصم في سلة المشتريات واحصل على خصم فوري 50 جنيه على أي طلب بقيمة 500 جنيه فأكثر.',
      10,
      500,
      450,
      'WELCOME50',
      in14Days,
      'كوبون ترحيبي صالح لجميع الأقسام',
      1
    );
  }

  // 5. Customers & Loyalty Cards table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      membership_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      points INTEGER DEFAULT 0,
      referral_code TEXT UNIQUE NOT NULL,
      referred_by_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Rewards Catalog table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rewards_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      points_required INTEGER NOT NULL,
      reward_type TEXT NOT NULL, -- 'discount' or 'gift'
      reward_value TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );
  `);

  const countRewards = (db.prepare('SELECT COUNT(*) as count FROM rewards_catalog').get() as { count: number }).count;
  if (countRewards === 0) {
    const insertReward = db.prepare(`
      INSERT INTO rewards_catalog (title, description, points_required, reward_type, reward_value, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertReward.run('قسيمة خصم بقيمة 50 جنيه', 'تخصم فورياً من إجمالي فاتورة مشترياتك القادمة', 100, 'discount', '50 EGP', 1);
    insertReward.run('طقم فوط مطبخ قطنية فاخرة (3 قطع)', 'هدية مجانية تستلمها مع أي طلب أو من المعرض', 200, 'gift', 'طقم فوط مطبخ', 1);
    insertReward.run('قسيمة خصم بقيمة 120 جنيه', 'تخصم فورياً عند مشتريات بقيمة 600 جنيه فأكثر', 250, 'discount', '120 EGP', 1);
    insertReward.run('ملاية سرير فردي قطن هدية', 'ملاية قطن قطيفة برسومات عصرية راقية مجاناً', 400, 'gift', 'ملاية سرير فردي', 1);
    insertReward.run('خصم ذهبي 250 جنيه على أطقم العرائس والبطاطين', 'هدية كبار عملاء سنتر العسال', 600, 'discount', '250 EGP', 1);
  }

  // 7. Rewards Redemptions
  db.exec(`
    CREATE TABLE IF NOT EXISTS rewards_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      reward_id INTEGER NOT NULL,
      points_spent INTEGER NOT NULL,
      reward_title TEXT NOT NULL,
      status TEXT DEFAULT 'confirmed', -- 'confirmed' or 'used'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES customers(id),
      FOREIGN KEY(reward_id) REFERENCES rewards_catalog(id)
    );
  `);

  // 8. Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_id INTEGER,
      delivery_type TEXT NOT NULL, -- 'pickup' or 'delivery'
      branch_or_address TEXT NOT NULL,
      notes TEXT,
      subtotal REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      promo_code TEXT,
      total REAL NOT NULL,
      status TEXT DEFAULT 'new', -- 'new', 'confirmed', 'delivered', 'cancelled'
      points_awarded INTEGER DEFAULT 0,
      referral_code_used TEXT,
      referral_rewarded INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 9. Order items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // 10. Audit log for points to prevent duplicates and maintain full transaction history
  db.exec(`
    CREATE TABLE IF NOT EXISTS points_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      order_id INTEGER,
      points_change INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    );
  `);

  console.log('✅ Al-Assal SQLite database initialized successfully at:', dbPath);
}

export default db;
