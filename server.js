// server.js  (NO cookies, NO server-side cart)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());            // simple CORS for dev
app.use(express.json());
    // parse JSON bodies
const productSchema = new mongoose.Schema(
  {
    title: String,
    desc: String,
    price: Number,
    image: String,
    cat: String,
    stock: Number,
    // NEW: specs as a flexible object
    specs: { type: Object, default: {} },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, index: true, required: true },
    password: { type: String, required: true }, // plain for demo
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // <- important
    items: [{ productId: String, title: String, price: Number, qty: Number }],
    total: Number,
    status: { type: String, default: "created" },
    payment: {
      method: { type: String, enum: ["card", "paypal", "cod"], default: "cod" },
      last4: String,        // card last 4 (demo)
      paypalEmail: String,  // PayPal email (demo)
      txnId: String,        // placeholder for real gateways
    },
  },
  { timestamps: true }
);
const Order = mongoose.model("Order", orderSchema);

// ====== Routes ======

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Products list (map _id -> id for the frontend)
app.get("/api/products", async (_req, res) => {
  const products = await Product.find().lean();
  const withId = products.map((p) => ({ ...p, id: p._id.toString() }));
  res.json(withId);
});

// Product by id (id = Mongo _id string)
app.get("/api/products/:id", async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ error: "Not found" });
    p.id = p._id.toString();
    res.json(p);
  } catch {
    return res.status(400).json({ error: "Invalid id" });
  }
});

const PRODUCTS = [
  // Phones
  {
    title: "iPhone 14 Pro",
    desc: "A16 Bionic, 128GB",
    price: 3699,
    image: "https://th.bing.com/th/id/OIP.bLwuFUU7fWu-lEvMrxMPUQHaJI?w=137&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    cat: "phones",
    stock: 20,
    specs: {
      Chipset: "Apple A16 Bionic",
      Display: '6.1" OLED, 2556×1179, 120Hz',
      RAM: "6GB",
      Storage: "128GB",
      RearCamera: "48MP wide + 12MP tele + 12MP ultra-wide",
      FrontCamera: "12MP",
      Battery: "~3200 mAh (Apple rates ~23h video)",
      Charging: "Wired 20W; MagSafe 15W; Qi 7.5W",
      Connectivity: "5G, Wi-Fi 6, BT 5.3, NFC, Lightning",
      OS: "iOS",
      Weight: "≈206 g"
    }
  },
  {
    title: "Galaxy S23",
    desc: "Snapdragon 8 Gen 2, 256GB",
    price: 3299,
    image: "https://th.bing.com/th/id/OIP.hQVUtnziJeAuUtTx-BKDHQHaFj?w=230&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    cat: "phones",
    stock: 15,
    specs: {
      Chipset: "Snapdragon 8 Gen 2 for Galaxy",
      Display: '6.1" AMOLED, 2340×1080, 120Hz',
      RAM: "8GB",
      Storage: "256GB",
      RearCamera: "50MP + 10MP tele + 12MP ultra-wide",
      FrontCamera: "12MP",
      Battery: "3900 mAh",
      Charging: "25W wired; 15W wireless (Qi/PMA)",
      Connectivity: "5G, Wi-Fi 6E, BT 5.3, NFC, USB-C",
      OS: "Android",
      Weight: "≈168 g"
    }
  },
  {
    title: "Google Pixel 7",
    desc: "Tensor G2, 128GB",
    price: 2999,
    image: "https://www.telstra.com.au/content/dam/tcom/devices/mobile/mhdwhst-pxl7/obsidian/landscape-front.png",
    cat: "phones",
    stock: 12,
    specs: {
      Chipset: "Google Tensor G2",
      Display: '6.3" OLED, 2400×1080, 90Hz',
      RAM: "8GB",
      Storage: "128GB",
      RearCamera: "50MP wide + 12MP ultra-wide",
      FrontCamera: "10.8MP",
      Battery: "4355 mAh",
      Charging: "≈20W wired; up to 20W wireless (Pixel Stand 2)",
      Connectivity: "5G, Wi-Fi 6E, BT 5.2, NFC, USB-C",
      OS: "Android",
      Weight: "≈197 g"
    }
  },
  {
    title: "OnePlus 11",
    desc: "Snapdragon 8 Gen 2, 256GB",
    price: 2799,
    image: "https://th.bing.com/th/id/OIP.apes-UjLAD9O15z9VrnArgHaHa?w=157&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    cat: "phones",
    stock: 18,
    specs: {
      Chipset: "Snapdragon 8 Gen 2",
      Display: '6.7" AMOLED, 3216×1440, 1–120Hz (LTPO3)',
      RAM: "16GB",
      Storage: "256GB",
      RearCamera: "50MP main + 48MP ultra-wide + 32MP tele",
      FrontCamera: "16MP",
      Battery: "5000 mAh",
      Charging: "100W wired (region dependent)",
      Connectivity: "5G, Wi-Fi 7*, BT 5.3, NFC, USB-C",
      OS: "Android (OxygenOS)",
      Weight: "≈205 g"
    }
  },
  {
    title: "Xiaomi 13 Pro",
    desc: "Leica Camera, 256GB",
    price: 2599,
    image: "https://ae-pic-a1.aliexpress-media.com/kf/S27f5dbbcca9a4a219e6b597cca76b159K.jpg_960x960q75.jpg_.avif",
    cat: "phones",
    stock: 22,
    specs: {
      Chipset: "Snapdragon 8 Gen 2",
      Display: '6.73" AMOLED, 3200×1440, 120Hz',
      RAM: "12GB",
      Storage: "256GB",
      RearCamera: '50MP 1" main + 50MP tele + 50MP ultra-wide (Leica)',
      FrontCamera: "32MP",
      Battery: "4820 mAh",
      Charging: "120W wired; 50W wireless",
      Connectivity: "5G, Wi-Fi 6E, BT 5.3, NFC, USB-C",
      OS: "Android (MIUI)",
      Weight: "≈229 g"
    }
  },

  // Laptops
  {
    title: "MacBook Air M2",
    desc: '13", 256GB SSD',
    price: 4499,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
    cat: "laptops",
    stock: 10,
    specs: {
      CPU: "Apple M2 (8-core CPU)",
      GPU: "8-core GPU",
      Memory: "8GB unified",
      Storage: "256GB SSD",
      Display: '13.6" 2560×1664 (Liquid Retina)',
      Ports: "MagSafe 3, 2× TB/USB4, 3.5mm",
      Battery: "52.6Wh (~18h video)",
      Weight: "≈1.24 kg",
      OS: "macOS"
    }
  },
  {
    title: "Dell XPS 13",
    desc: "i7, 16GB RAM, 512GB SSD",
    price: 4899,
    image: "https://th.bing.com/th/id/OIP.eh7Wpfa0Up_bpVoiKyaLQAHaFj?w=231&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    cat: "laptops",
    stock: 8,
    specs: {
      CPU: "Intel Core i7 (12th Gen U-series)",
      GPU: "Intel Iris Xe",
      Memory: "16GB LPDDR5",
      Storage: "512GB NVMe SSD",
      Display: '13.4" FHD+ (1920×1200) or higher',
      Ports: "2× Thunderbolt 4 (USB-C)",
      Battery: "~51Wh",
      Weight: "≈1.17 kg",
      OS: "Windows 11"
    }
  },
  {
    title: "Lenovo ThinkPad X1",
    desc: "i7, 16GB RAM, 1TB SSD",
    price: 5199,
    image: "https://th.bing.com/th/id/OIP.lc9iGlHfBVWNH_n8queAjAHaFM?w=281&h=197&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    cat: "laptops",
    stock: 11,
    specs: {
      CPU: "Intel Core i7 (12th Gen)",
      GPU: "Intel Iris Xe",
      Memory: "16GB LPDDR5",
      Storage: "1TB NVMe SSD",
      Display: '14" 1920×1200 (IPS) / OLED options',
      Ports: "2× TB4, USB-A, HDMI, 3.5mm",
      Battery: "~57Wh",
      Weight: "≈1.12–1.2 kg",
      OS: "Windows 11"
    }
  },
  {
    title: "HP Spectre x360",
    desc: "2-in-1 Convertible, 512GB",
    price: 4099,
    image: "https://th.bing.com/th/id/OIP.5-dPn22msQqZH5CFxhobCwHaEu?w=289&h=184&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    cat: "laptops",
    stock: 14,
    specs: {
      CPU: "Intel Core i7 (12th/13th Gen)",
      GPU: "Intel Iris Xe",
      Memory: "16GB",
      Storage: "512GB NVMe SSD",
      Display: '13.5" 1920×1280 touch / OLED higher-res',
      Ports: "2× TB4 (USB-C), USB-A, microSD",
      Battery: "~66Wh",
      Weight: "≈1.3–1.4 kg",
      OS: "Windows 11"
    }
  },
  {
    title: "Asus ROG Zephyrus",
    desc: "Gaming Laptop, RTX 3070",
    price: 6699,
    image: "https://th.bing.com/th/id/OIP.1bNM6XktZ2uJh5f1ABsj-AHaGS?w=231&h=196&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    cat: "laptops",
    stock: 7,
    specs: {
      CPU: "AMD Ryzen 9 (5900HS class)",
      GPU: "NVIDIA GeForce RTX 3070",
      Memory: "16–32GB",
      Storage: "1TB NVMe SSD",
      Display: '15.6" up to 2560×1440 165Hz',
      Ports: "USB-C, USB-A, HDMI, audio",
      Battery: "≈90Wh",
      Weight: "≈1.9 kg",
      OS: "Windows 11"
    }
  },

  // Accessories
  {
    title: "Sony WH-1000XM5",
    desc: "ANC wireless headphones",
    price: 1499,
    image: "https://th.bing.com/th/id/OIP.OyDkaG1nOKJv--fWEMAriAHaEw?w=229&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    cat: "accessories",
    stock: 25,
    specs: {
      Type: "Headphones (over-ear)",
      Driver: "30mm",
      ANC: "Adaptive ANC",
      Battery: "Up to ~30h (ANC on), USB-C fast charge",
      Wireless: "Bluetooth 5.2, multipoint",
      Codecs: "SBC, AAC, LDAC",
      Charging: "USB-C",
      Weight: "≈250 g"
    }
  },
  {
    title: "Logitech MX Master 3S",
    desc: "Ergonomic wireless mouse",
    price: 449,
    image: "https://techtitanlb.com/wp-content/uploads/2023/03/103NP-1.jpg",
    cat: "accessories",
    stock: 30,
    specs: {
      Type: "Mouse",
      Sensor: "Darkfield",
      DPI: "Up to 8000",
      Wireless: "BT Low Energy / Logi Bolt (USB)",
      Battery: "USB-C recharge (~70 days)",
      Buttons: "7",
      Features: "MagSpeed wheel, Flow multi-device",
      Weight: "≈141 g"
    }
  },
  {
    title: "Apple Watch Series 8",
    desc: "Smartwatch with health features",
    price: 1799,
    image: "https://img.joomcdn.net/af32f3cc2759aa60b23ffda9cb566eebd9956412_original.jpeg",
    cat: "accessories",
    stock: 19,
    specs: {
      Type: "Smartwatch",
      CaseSizes: "41mm / 45mm",
      Chipset: "S8 SiP",
      Display: "Always-On Retina",
      Sensors: "ECG, SpO₂, Temp, Compass",
      Battery: "Up to ~18h, fast charge",
      WaterResistance: "WR50, IP6X",
      Connectivity: "BT, Wi-Fi; optional LTE",
      OS: "watchOS",
      Weight: "varies by case"
    }
  },
  {
    title: "Samsung Galaxy Buds 2 Pro",
    desc: "Wireless earbuds with ANC",
    price: 849,
    image: "https://th.bing.com/th/id/OIP.ZY_IWcBzThexv9sqdNweJAHaDt?w=343&h=174&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    cat: "accessories",
    stock: 40,
    specs: {
      Type: "Earbuds",
      Drivers: "2-way drivers",
      ANC: "Active Noise Canceling",
      Battery: "≈5h (ANC on), up to ~18–20h with case",
      Wireless: "BT 5.3",
      Codecs: "SSC, AAC, SBC",
      Charging: "USB-C + Qi wireless",
      WaterResistance: "IPX7 (buds)",
      Weight: "≈5.5 g (each)"
    }
  },
  {
    title: "Razer Gaming Keyboard",
    desc: "RGB mechanical keyboard",
    price: 599,
    image: "https://img.joomcdn.net/92a604ee91a5ba6b8781ea09ce05eeb7036a8338_1024_1024.jpeg",
    cat: "accessories",
    stock: 16,
    specs: {
      Type: "Keyboard",
      Switches: "Razer Green (clicky) / Yellow (linear)",
      Layout: "Full-size (varies by model)",
      Lighting: "Razer Chroma RGB",
      Connection: "USB",
      Features: "N-key rollover, programmable macros",
      Weight: "varies by model"
    }
  },

  // Other categories
  {
    title: "iPad Pro 12.9",
    desc: "M2 Chip, 256GB",
    price: 4099,
    image: "https://tse1.mm.bing.net/th/id/OIP.7uEIkRJb_dI3du1LwNrVkAHaG9?rs=1&pid=ImgDetMain&o=7&rm=3",
    cat: "tablets",
    stock: 13,
    specs: {
      Chipset: "Apple M2",
      Display: '12.9" Liquid Retina XDR, 2732×2048, 120Hz',
      RAM: "—",
      Storage: "256GB",
      RearCamera: "12MP wide + 10MP ultra-wide + LiDAR",
      FrontCamera: "12MP (Center Stage)",
      Battery: "Up to ~10h web/video",
      Connectivity: "Wi-Fi 6, BT 5.3, USB-C (TB)",
      OS: "iPadOS",
      Weight: "≈682 g"
    }
  },
  {
    title: "Canon EOS R7",
    desc: "Mirrorless Camera, 32MP",
    price: 5499,
    image: "https://th.bing.com/th/id/OIP.9J3LFNc4AD-Fxa_016LDmQHaEK?w=317&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    cat: "cameras",
    stock: 9,
    specs: {
      Sensor: "32.5MP APS-C",
      Stabilization: "IBIS up to 7 stops",
      Video: "4K60 (oversampled 4K30), FHD120",
      Burst: "15 fps mech / 30 fps electronic",
      Storage: "Dual UHS-II SD",
      Mount: "Canon RF",
      Ports: "Mic, headphone, micro-HDMI, USB",
      Weight: "≈612 g",
      Waterproof: "Weather-sealed body"
    }
  },
  {
    title: "GoPro Hero 11",
    desc: "Action Camera 5.3K",
    price: 1899,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80",
    cat: "cameras",
    stock: 12,
    specs: {
      Sensor: '1/1.9" (~27MP stills)',
      Stabilization: "HyperSmooth 5.0",
      Video: "5.3K60, 4K120, 2.7K240",
      Burst: "—",
      Storage: "microSD",
      Mount: "GoPro mount",
      Ports: "USB-C",
      Weight: "≈154 g",
      Waterproof: "10 m without housing"
    }
  },
  {
    title: "Bose SoundLink",
    desc: "Portable Bluetooth Speaker",
    price: 749,
    image: "https://www.androidauthority.com/wp-content/uploads/2014/02/bose-soundlink-mini-aa-1.jpg",
    cat: "accessories",
    stock: 21,
    specs: {
      Type: "Speaker",
      Output: "Portable BT speaker",
      Battery: "Up to ~12h (model dependent)",
      Wireless: "Bluetooth (multipoint varies)",
      WaterResistance: "Model dependent",
      Charging: "USB",
      Weight: "varies by model"
    }
  },
  {
    title: "Samsung 32'' 4K Monitor",
    desc: "Ultra HD display",
    price: 1299,
    image: "https://th.bing.com/th/id/OIP.Puint7-0ws-20OhCdk-ogwHaE8?w=290&h=193&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
    cat: "monitors",
    stock: 15,
    specs: {
      Panel: 'VA',
      Size: '32"',
      Resolution: "3840×2160 (4K UHD)",
      RefreshRate: "60Hz",
      Color: "sRGB-class (typical for VA)",
      HDR: "HDR10 (entry level, if supported)",
      Ports: "2× HDMI 2.0, DisplayPort 1.2",
      SyncTech: "AMD FreeSync",
      Contrast: "≈3000:1 (VA typical)"
    }
  },
];



// --- Put PRODUCTS above this route (as you already have) ---

// DELETE ALL then SEED fresh
app.post("/api/seed", async (_req, res) => {
  try {
    // wipe the collection
    const before = await Product.countDocuments();
    if (before > 0) {
      await Product.deleteMany({});
    }

    // insert new
    await Product.insertMany(PRODUCTS);
    const after = await Product.countDocuments();

    return res.json({
      message: "Re-seeded",
      deleted: before,
      inserted: after,
    });
  } catch (err) {
    console.error("Seed error:", err);
    return res.status(500).json({ error: "Seed failed" });
  }
});


// Auth: Signup
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password, phone, address } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, password are required" });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: "Email already exists" });

  const user = await User.create({ name, email, password, phone, address });
  res.status(201).json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
  });
});

// Auth: Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing email or password" });

  const user = await User.findOne({ email });
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
  });
});

// POST /api/orders
app.post("/api/orders", async (req, res) => {
  try {
    const { items, total, userId, payment = {} } = req.body || {};
    if (!userId) return res.status(401).json({ error: "Login required" });
    if (!Array.isArray(items) || typeof total !== "number") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    let user;
    try { user = await User.findById(userId).lean(); } catch { return res.status(400).json({ error: "Invalid userId" }); }
    if (!user) return res.status(400).json({ error: "User not found" });

    const order = await Order.create({
      userId,
      items,
      total,
      status: "created", // ✅ always start here
      payment: {
        method: payment.method || "cod",
        last4: payment.last4 || undefined,
        paypalEmail: payment.paypalEmail || undefined,
        txnId: payment.txnId || undefined,
      },
    });

    return res.status(201).json({ orderId: order._id.toString(), status: order.status });
  } catch (err) {
    console.error("Create order error:", err);
    return res.status(500).json({ error: "Could not place the order" });
  }
});


// Orders: list mine
app.get("/api/my/orders", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(401).json({ error: "Login required" });

  const user = await User.findById(userId).lean();
  if (!user) return res.status(400).json({ error: "User not found" });

  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  res.json(orders);
});

///gmail//
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
// Limit contact submissions: max 5 / minute per IP
const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
});

// Contact form → email
app.post("/api/contact", contactLimiter, async (req, res) => {
  try {
    const { name, email, phone = "", message = "", company = "" } = req.body || {};

    // Honeypot: if 'company' is filled, it's likely a bot
    if (company) return res.status(200).json({ ok: true });

    if (!name || !email || !message) {
      return res.status(400).json({ error: "name, email, message are required" });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.CONTACT_SMTP_HOST,
      port: Number(process.env.CONTACT_SMTP_PORT) || 465,
      secure: String(process.env.CONTACT_SMTP_SECURE) !== "false",
      auth: {
        user: process.env.CONTACT_USER,
        pass: process.env.CONTACT_PASS,
      },
    });

    const to = process.env.CONTACT_TO || process.env.CONTACT_USER;
    const from = process.env.CONTACT_FROM || process.env.CONTACT_USER;

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5">
        <h2>New contact from NovaStore</h2>
        <p><b>Name:</b> ${escapeHtml(name)}</p>
        <p><b>Email:</b> ${escapeHtml(email)}</p>
        ${phone ? `<p><b>Phone:</b> ${escapeHtml(phone)}</p>` : ""}
        <p><b>Message:</b></p>
        <pre style="white-space:pre-wrap;background:#f7fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0">${escapeHtml(message)}</pre>
      </div>
    `;

    await transporter.sendMail({
      from,
      to,
      replyTo: email, // so you can just hit "Reply" in Gmail
      subject: `NovaStore contact — ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`,
      html,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("contact error:", err);
    return res.status(500).json({ error: "Could not send message" });
  }
});

// tiny HTML escape to avoid injection
function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}



//profile
app.patch("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, address, currentPassword, newPassword, email } = req.body || {};

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (typeof name === "string") user.name = name.trim();
  if (typeof phone === "string") user.phone = phone.trim();
  if (typeof address === "string") user.address = address.trim();

  // ✅ New: update email
  if (typeof email === "string" && email.trim() && email !== user.email) {
    const exists = await User.findOne({ email });
    if (exists && exists._id.toString() !== id) {
      return res.status(409).json({ error: "Email already in use" });
    }
    user.email = email.trim();
  }

  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: "Current password required" });
    if (user.password !== currentPassword)
      return res.status(401).json({ error: "Current password is incorrect" });
    if (String(newPassword).length < 6)
      return res.status(400).json({ error: "New password must be at least 6 chars" });
    user.password = newPassword;
  }

  await user.save();

  res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
  });
});



// ====== Start ======
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT,"0.0.0.0", () => console.log(`🚀 API running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Mongo error:", err);
  });
