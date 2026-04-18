import { useState, useEffect, useRef, useCallback } from "react";

// ─── THEME & CONSTANTS ────────────────────────────────────────────────────────
const COLORS = {
  primary: "#0ea5e9",
  primaryDark: "#0284c7",
  accent: "#f59e0b",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
};

const CATEGORIES = ["Mobile", "TV", "Laptop", "Refrigerator", "AC", "Washing Machine", "Camera", "Tablet", "Smartwatch", "Other"];
const BRANDS = ["Samsung", "Apple", "Sony", "LG", "Dell", "HP", "Lenovo", "OnePlus", "Xiaomi", "Panasonic", "Whirlpool", "Haier", "Other"];

const SERVICE_CENTERS = [
  { id: 1, brand: "Samsung", name: "Samsung Smart Café – Andheri", address: "Shop 12, Link Road, Andheri West, Mumbai", phone: "+91 99204 56789", rating: 4.5, lat: 19.1197, lng: 72.8464 },
  { id: 2, brand: "Apple", name: "Apple Authorised Service – Bandra", address: "Ground Floor, Hill Road, Bandra West, Mumbai", phone: "+91 98765 43210", rating: 4.8, lat: 19.0596, lng: 72.8295 },
  { id: 3, brand: "Sony", name: "Sony Service Center – Dadar", address: "45 Gokhale Road, Dadar, Mumbai", phone: "+91 91234 56780", rating: 4.2, lat: 19.0195, lng: 72.8433 },
  { id: 4, brand: "LG", name: "LG Electronics Care – Malad", address: "2nd Floor, Malad West, Mumbai", phone: "+91 80012 34567", rating: 4.0, lat: 19.1873, lng: 72.8486 },
  { id: 5, brand: "Dell", name: "Dell Service Hub – Powai", address: "Hiranandani Gardens, Powai, Mumbai", phone: "+91 70023 45678", rating: 4.6, lat: 19.1197, lng: 72.9069 },
  { id: 6, brand: "HP", name: "HP Service Point – Thane", address: "Kasarvadavali, Thane West", phone: "+91 60034 56789", rating: 4.1, lat: 19.2183, lng: 72.9781 },
  { id: 7, brand: "Lenovo", name: "Lenovo Exclusive – Vashi", address: "Sector 17, Vashi, Navi Mumbai", phone: "+91 50045 67890", rating: 4.3, lat: 19.0748, lng: 73.0007 },
  { id: 8, brand: "OnePlus", name: "OnePlus Experience – Lower Parel", address: "Phoenix Mills, Lower Parel, Mumbai", phone: "+91 40056 78901", rating: 4.7, lat: 18.9932, lng: 72.8283 },
];

const FAQS = [
  { q: "How do I add a product?", a: "Click 'Add Product' on your dashboard, fill in the product details including purchase date and warranty duration, then click Save." },
  { q: "How is the warranty expiry date calculated?", a: "Expiry date = Purchase Date + Warranty Duration (in months). The app automatically calculates this when you save a product." },
  { q: "What does 'Expiring Soon' mean?", a: "Products whose warranty expires within the next 30 days are marked as 'Expiring Soon' (yellow). Within 7 days is critical." },
  { q: "Can I upload my invoice?", a: "Yes! When adding or editing a product, you can upload an invoice image or warranty card. Supported formats: JPG, PNG, PDF." },
  { q: "How do I extend my warranty?", a: "Go to the Warranty Extension page. Products expiring soon are listed there with extension options and pricing." },
  { q: "How do I book a service?", a: "Navigate to the Service Center page, find your brand's nearest center, and click 'Book Slot' to schedule an appointment." },
  { q: "Can I set up email notifications?", a: "Yes! Go to Settings > Notifications and toggle email alerts. You'll receive reminders 30, 7, and 1 day before expiry." },
  { q: "What is the ticket system?", a: "If you face any issue, click 'Report Issue' to raise a support ticket. You'll get a ticket ID and can track its status." },
];

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────
function calcExpiry(purchaseDate, warrantyMonths) {
  if (!purchaseDate || !warrantyMonths) return null;
  const d = new Date(purchaseDate);
  d.setMonth(d.getMonth() + parseInt(warrantyMonths));
  return d.toISOString().split("T")[0];
}

function getStatus(expiryDate) {
  if (!expiryDate) return "unknown";
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "active";
}

function getDaysRemaining(expiryDate) {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function genTicketId() {
  return "TKT-" + Math.random().toString(36).toUpperCase().slice(2, 8);
}

const StatusBadge = ({ status }) => {
  const cfg = {
    active: { bg: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Active" },
    expiring: { bg: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Expiring Soon" },
    expired: { bg: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500", label: "Expired" },
    unknown: { bg: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400", label: "Unknown" },
  }[status] || { bg: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400", label: "Unknown" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    * { box-sizing: border-box; }
    body { font-family: 'Sora', sans-serif; margin: 0; }
    :root {
      --primary: #0ea5e9;
      --primary-dark: #0284c7;
      --accent: #f59e0b;
      --bg: #f0f6ff;
      --sidebar: #0f172a;
      --card: #ffffff;
      --text: #0f172a;
      --muted: #64748b;
      --border: #e2e8f0;
    }
    .dark-mode {
      --bg: #0a0f1e;
      --card: #111827;
      --text: #f1f5f9;
      --muted: #94a3b8;
      --border: #1e293b;
      --sidebar: #060b16;
    }
    .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
    .animate-slide-up { animation: slideUp 0.4s ease forwards; }
    .animate-pulse-slow { animation: pulseSlow 2s infinite; }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
    @keyframes pulseSlow { 0%,100%{opacity:1} 50%{opacity:.6} }
    .chat-panel { transition: transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.35s ease; }
    .chat-panel.open { transform: translateY(0); opacity: 1; pointer-events: all; }
    .chat-panel.closed { transform: translateY(20px); opacity: 0; pointer-events: none; }
    .scrollbar-thin::-webkit-scrollbar { width: 4px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .sidebar-item { transition: all 0.2s; }
    .sidebar-item:hover { background: rgba(14,165,233,0.12); }
    .sidebar-item.active { background: rgba(14,165,233,0.18); border-left: 3px solid #0ea5e9; }
    input, textarea, select { font-family: 'Sora', sans-serif; }
    .card-hover { transition: transform 0.2s, box-shadow 0.2s; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(14,165,233,0.12); }
    .btn-primary { background: linear-gradient(135deg, #0ea5e9, #0284c7); transition: all 0.2s; }
    .btn-primary:hover { background: linear-gradient(135deg, #0284c7, #0369a1); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(14,165,233,0.35); }
    .notification-dot { animation: pulseSlow 1.5s infinite; }
    .grid-bg { background-image: radial-gradient(circle at 1px 1px, rgba(14,165,233,0.08) 1px, transparent 0); background-size: 32px 32px; }
  `}</style>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([
    { id: "p1", name: "Samsung Galaxy S24", brand: "Samsung", category: "Mobile", purchaseDate: "2024-01-15", warrantyMonths: 12, expiryDate: "2025-01-15", notes: "Flagship phone", imageUrl: null },
    { id: "p2", name: "LG OLED TV 55\"", brand: "LG", category: "TV", purchaseDate: "2023-06-10", warrantyMonths: 24, expiryDate: "2025-06-10", notes: "Living room TV", imageUrl: null },
    { id: "p3", name: "Dell XPS 15 Laptop", brand: "Dell", category: "Laptop", purchaseDate: "2024-03-20", warrantyMonths: 12, expiryDate: "2025-03-20", notes: "Work laptop", imageUrl: null },
    { id: "p4", name: "Sony WH-1000XM5", brand: "Sony", category: "Other", purchaseDate: "2024-09-01", warrantyMonths: 12, expiryDate: "2025-09-01", notes: "Noise cancelling headphones", imageUrl: null },
    { id: "p5", name: "Apple MacBook Pro", brand: "Apple", category: "Laptop", purchaseDate: "2024-11-10", warrantyMonths: 12, expiryDate: "2025-11-10", notes: "M3 chip, 16GB RAM", imageUrl: null },
  ]);
  const [tickets, setTickets] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: "n1", type: "warning", msg: "Samsung Galaxy S24 warranty expires in 5 days!", time: "2 min ago", read: false },
    { id: "n2", type: "info", msg: "Dell XPS 15 warranty expires in 25 days.", time: "1 hr ago", read: false },
    { id: "n3", type: "success", msg: "Support ticket TKT-AB123 has been resolved.", time: "Yesterday", read: true },
  ]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settings, setSettings] = useState({ emailNotifs: true, whatsappAlerts: false, pushNotifs: true });
  const [users, setUsers] = useState([{ name: "Demo User", email: "demo@warrantypro.in", password: "demo123" }]);

  const nav = (p, extra = {}) => {
    setPage(p);
    if (extra.product !== undefined) setSelectedProduct(extra.product);
    if (extra.edit !== undefined) setEditingProduct(extra.edit);
    window.scrollTo(0, 0);
  };

  const addProduct = (p) => {
    const expiry = calcExpiry(p.purchaseDate, p.warrantyMonths);
    setProducts(prev => [...prev, { ...p, id: genId(), expiryDate: expiry }]);
    const days = getDaysRemaining(expiry);
    if (days !== null && days <= 30) {
      setNotifications(prev => [{ id: genId(), type: "warning", msg: `${p.name} expires in ${days} days!`, time: "just now", read: false }, ...prev]);
    }
  };

  const updateProduct = (p) => {
    const expiry = calcExpiry(p.purchaseDate, p.warrantyMonths);
    setProducts(prev => prev.map(x => x.id === p.id ? { ...p, expiryDate: expiry } : x));
  };

  const deleteProduct = (id) => setProducts(prev => prev.filter(x => x.id !== id));

  const addTicket = (t) => setTickets(prev => [{ ...t, id: genId(), ticketId: genTicketId(), status: "Pending", created: new Date().toLocaleDateString() }, ...prev]);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const unreadCount = notifications.filter(n => !n.read).length;

  const login = (email, password) => {
    const u = users.find(u => u.email === email && u.password === password);
    if (u) { setUser(u); nav("dashboard"); return true; }
    return false;
  };

  const signup = (name, email, password) => {
    if (users.find(u => u.email === email)) return false;
    const u = { name, email, password };
    setUsers(prev => [...prev, u]);
    setUser(u);
    nav("dashboard");
    return true;
  };

  const logout = () => { setUser(null); nav("landing"); };

  const props = { nav, dark, setDark, user, products, tickets, notifications, unreadCount, notifOpen, setNotifOpen, markAllRead, settings, setSettings, selectedProduct, editingProduct, addProduct, updateProduct, deleteProduct, addTicket, login, signup, logout };

  return (
    <div className={dark ? "dark-mode" : ""} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", transition: "background 0.3s, color 0.3s" }}>
      <GlobalStyle />
      {page === "landing" && <LandingPage {...props} />}
      {page === "login" && <LoginPage {...props} />}
      {page === "signup" && <SignupPage {...props} />}
      {(page !== "landing" && page !== "login" && page !== "signup") && (
        <AppLayout {...props} page={page}>
          {page === "dashboard" && <DashboardPage {...props} />}
          {page === "add-product" && <AddProductPage {...props} />}
          {page === "product-detail" && <ProductDetailPage {...props} />}
          {page === "service-center" && <ServiceCenterPage {...props} />}
          {page === "warranty-extension" && <WarrantyExtensionPage {...props} />}
          {page === "settings" && <SettingsPage {...props} />}
          {page === "tickets" && <TicketsPage {...props} />}
          {page === "help" && <HelpPage {...props} />}
          {page === "notifications-page" && <NotificationsFullPage {...props} />}
        </AppLayout>
      )}
      {user && <AIChatbot {...props} />}
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ nav, dark }) {
  const features = [
    { icon: "🛡️", title: "Smart Warranty Tracking", desc: "Auto-calculate expiry dates. Get color-coded status and proactive alerts before it's too late." },
    { icon: "📍", title: "Service Center Locator", desc: "Find nearest authorized service centers by brand. Book a slot directly from the app." },
    { icon: "🔗", title: "Warranty Extension", desc: "Get notified when warranties expire and explore extension plans with one click." },
    { icon: "🤖", title: "AI Assistant", desc: "Ask anything about your warranties. Get smart suggestions and troubleshooting help 24/7." },
    { icon: "🎟️", title: "Support Ticket System", desc: "Raise and track support issues. Get a unique ticket ID and resolution status updates." },
    { icon: "📊", title: "Dashboard Analytics", desc: "Visual insights: savings, expirations, and product health at a glance." },
  ];
  const stats = [{ n: "50K+", l: "Products Tracked" }, { n: "₹2Cr+", l: "Claims Saved" }, { n: "99.9%", l: "Uptime" }, { n: "4.9★", l: "User Rating" }];
  return (
    <div style={{ fontFamily: "'Sora', sans-serif" }}>
      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(15,23,42,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" }}>WarrantyPro</span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => nav("login")} style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 500, padding: "8px 16px" }}>Login</button>
            <button onClick={() => nav("signup")} className="btn-primary" style={{ color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, padding: "10px 22px", borderRadius: 10 }}>Get Started →</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0c1445 100%)", padding: "100px 24px", position: "relative", overflow: "hidden" }} className="grid-bg">
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 400, background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 300, height: 300, background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 100, padding: "6px 16px", marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9" }} className="animate-pulse-slow" />
            <span style={{ color: "#7dd3fc", fontSize: 13, fontWeight: 600 }}>Smart Warranty Management Platform</span>
          </div>
          <h1 style={{ fontSize: "clamp(36px,6vw,72px)", fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 24, letterSpacing: "-2px" }}>
            Track All Your <span style={{ background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Warranties</span> in One Place
          </h1>
          <p style={{ fontSize: 20, color: "#94a3b8", lineHeight: 1.6, marginBottom: 40, fontWeight: 400 }}>Never miss an expiry, get AI-powered alerts, and manage your product services effortlessly. The only warranty tracker you'll ever need.</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => nav("signup")} className="btn-primary" style={{ color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 16, fontWeight: 700, padding: "16px 36px", borderRadius: 14, display: "flex", alignItems: "center", gap: 8 }}>Get Started Free →</button>
            <button onClick={() => nav("login")} style={{ background: "rgba(255,255,255,0.06)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", fontFamily: "inherit", fontSize: 16, fontWeight: 600, padding: "16px 36px", borderRadius: 14 }}>Login to Dashboard</button>
          </div>
          <p style={{ color: "#475569", fontSize: 13, marginTop: 20 }}>Free forever · No credit card required · 50K+ users</p>
        </div>

        {/* MOCK DASHBOARD PREVIEW */}
        <div style={{ maxWidth: 900, margin: "64px auto 0", background: "rgba(255,255,255,0.04)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", padding: 24, backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            {[["🛡️ Total Products", "12", "#0ea5e9"], ["⚠️ Expiring Soon", "3", "#f59e0b"], ["❌ Expired", "2", "#ef4444"]].map(([l, v, c]) => (
              <div key={l} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "16px", border: `1px solid ${c}22` }}>
                <div style={{ color: "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 6 }}>{l}</div>
                <div style={{ color: "#fff", fontSize: 28, fontWeight: 800 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, overflow: "hidden" }}>
            {[["Samsung Galaxy S24", "Samsung", "2026-01-15", "active"], ["LG OLED TV", "LG", "2025-06-10", "expiring"], ["Dell XPS 15", "Dell", "2024-03-20", "expired"]].map(([name, brand, exp, s]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 12 }}>
                <div style={{ flex: 2, color: "#f1f5f9", fontSize: 13, fontWeight: 600 }}>{name}</div>
                <div style={{ flex: 1, color: "#64748b", fontSize: 12 }}>{brand}</div>
                <div style={{ flex: 1, color: "#64748b", fontSize: 12 }}>{exp}</div>
                <StatusBadge status={s} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "#0f172a", padding: "40px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 24 }}>
          {stats.map(s => (
            <div key={s.n} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#0ea5e9", letterSpacing: "-1px" }}>{s.n}</div>
              <div style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: "#0f172a", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-1px", marginBottom: 16 }}>Everything You Need</h2>
            <p style={{ color: "#64748b", fontSize: 18 }}>A complete warranty management ecosystem in one platform.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
            {features.map(f => (
              <div key={f.title} className="card-hover" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 28, cursor: "default" }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg,#0f172a,#1e1b4b)", padding: "80px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: "#fff", marginBottom: 16, letterSpacing: "-1px" }}>Start Protecting Your Products Today</h2>
        <p style={{ color: "#94a3b8", fontSize: 18, marginBottom: 40 }}>Join 50,000+ users who trust WarrantyPro to never miss a warranty expiry.</p>
        <button onClick={() => nav("signup")} className="btn-primary" style={{ color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 18, fontWeight: 700, padding: "18px 48px", borderRadius: 14 }}>Get Started Free →</button>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#060b16", padding: "40px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛡️</div>
            <span style={{ color: "#fff", fontWeight: 700 }}>WarrantyPro</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy Policy", "Terms of Service", "Contact Us", "Help Center"].map(l => (
              <span key={l} style={{ color: "#475569", fontSize: 13, cursor: "pointer" }}>{l}</span>
            ))}
          </div>
          <span style={{ color: "#334155", fontSize: 13 }}>© 2026 WarrantyPro. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

// ─── AUTH PAGES ───────────────────────────────────────────────────────────────
function AuthCard({ children, title, subtitle }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a,#1e1b4b)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="animate-slide-up" style={{ background: "#fff", borderRadius: 20, padding: "40px", width: "100%", maxWidth: 420, boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>🛡️</div>
          <h2 style={{ fontWeight: 800, fontSize: 24, color: "#0f172a", letterSpacing: "-0.5px", marginBottom: 6 }}>{title}</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", fontFamily: "inherit", transition: "border 0.2s", boxSizing: "border-box" }}
        onFocus={e => e.target.style.borderColor = "#0ea5e9"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
    </div>
  );
}

function LoginPage({ nav, login }) {
  const [email, setEmail] = useState("demo@warrantypro.in");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const handle = () => { if (!login(email, password)) setError("Invalid credentials. Try demo@warrantypro.in / demo123"); };
  return (
    <AuthCard title="Welcome Back" subtitle="Sign in to your WarrantyPro account">
      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
      <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
      <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
      <div style={{ textAlign: "right", marginBottom: 20 }}>
        <span style={{ color: "#0ea5e9", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Forgot password?</span>
      </div>
      <button onClick={handle} className="btn-primary" style={{ width: "100%", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, padding: "14px", borderRadius: 12 }}>Sign In</button>
      <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, marginTop: 20 }}>Don't have an account? <span onClick={() => nav("signup")} style={{ color: "#0ea5e9", fontWeight: 600, cursor: "pointer" }}>Sign up free</span></p>
      <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 8 }}>Demo: demo@warrantypro.in / demo123</p>
    </AuthCard>
  );
}

function SignupPage({ nav, signup }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const handle = () => {
    if (!name || !email || !password) return setError("All fields required.");
    if (password !== confirm) return setError("Passwords don't match.");
    if (!signup(name, email, password)) setError("Email already registered.");
  };
  return (
    <AuthCard title="Create Account" subtitle="Start tracking your warranties for free">
      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
      <InputField label="Full Name" value={name} onChange={setName} placeholder="John Doe" />
      <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
      <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="Min 6 characters" />
      <InputField label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat password" />
      <button onClick={handle} className="btn-primary" style={{ width: "100%", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, padding: "14px", borderRadius: 12, marginTop: 4 }}>Create Account</button>
      <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, marginTop: 20 }}>Already have an account? <span onClick={() => nav("login")} style={{ color: "#0ea5e9", fontWeight: 600, cursor: "pointer" }}>Sign in</span></p>
    </AuthCard>
  );
}

// ─── APP LAYOUT ───────────────────────────────────────────────────────────────
function AppLayout({ children, nav, dark, setDark, user, page, unreadCount, notifOpen, setNotifOpen, notifications, markAllRead, logout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "service-center", icon: "📍", label: "Service Centers" },
    { id: "warranty-extension", icon: "🔗", label: "Extend Warranty" },
    { id: "tickets", icon: "🎟️", label: "Support Tickets" },
    { id: "help", icon: "❓", label: "Help & FAQ" },
    { id: "notifications-page", icon: "🔔", label: "Notifications" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <aside style={{ width: sidebarOpen ? 240 : 68, background: "var(--sidebar)", transition: "width 0.3s cubic-bezier(.4,0,.2,1)", flexShrink: 0, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto", overflowX: "hidden", zIndex: 40 }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🛡️</div>
          {sidebarOpen && <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: "-0.5px", whiteSpace: "nowrap" }}>WarrantyPro</span>}
        </div>
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => nav(item.id)}
              className={`sidebar-item ${page === item.id ? "active" : ""}`}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, border: "none", background: "none", cursor: "pointer", marginBottom: 2, textAlign: "left", borderLeft: page === item.id ? "3px solid #0ea5e9" : "3px solid transparent" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ color: page === item.id ? "#7dd3fc" : "#94a3b8", fontSize: 14, fontWeight: page === item.id ? 600 : 500, whiteSpace: "nowrap", fontFamily: "inherit" }}>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={logout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 10, border: "none", background: "none", cursor: "pointer", color: "#64748b", fontFamily: "inherit", fontSize: 14 }}>
            <span style={{ fontSize: 18 }}>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* TOPBAR */}
        <header style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 4 }}>☰</button>
            <div style={{ position: "relative" }}>
              <input placeholder="Search products..." style={{ padding: "8px 14px 8px 36px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 13, background: "var(--bg)", color: "var(--text)", fontFamily: "inherit", width: 220, outline: "none" }} />
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setDark(d => !d)} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>{dark ? "☀️" : "🌙"}</button>
            <div style={{ position: "relative" }}>
              <button onClick={() => setNotifOpen(o => !o)} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 16, position: "relative" }}>🔔</button>
              {unreadCount > 0 && <span className="notification-dot" style={{ position: "absolute", top: 2, right: 2, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{unreadCount}</span>}
              {notifOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 320, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", zIndex: 100 }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                    <span onClick={markAllRead} style={{ color: "#0ea5e9", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Mark all read</span>
                  </div>
                  {notifications.slice(0, 5).map(n => (
                    <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: n.read ? "transparent" : "rgba(14,165,233,0.04)" }}>
                      <p style={{ fontSize: 13, color: "var(--text)", margin: 0, marginBottom: 4 }}>{n.msg}</p>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{n.time}</span>
                    </div>
                  ))}
                  <div style={{ padding: "10px 16px", textAlign: "center" }}>
                    <span onClick={() => { nav("notifications-page"); setNotifOpen(false); }} style={{ color: "#0ea5e9", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>View all →</span>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "6px 12px" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{user?.name?.[0]?.toUpperCase()}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{user?.name?.split(" ")[0]}</span>
            </div>
          </div>
        </header>
        <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ nav, products, deleteProduct, notifications }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const total = products.length;
  const expiring = products.filter(p => getStatus(p.expiryDate) === "expiring").length;
  const expired = products.filter(p => getStatus(p.expiryDate) === "expired").length;
  const active = products.filter(p => getStatus(p.expiryDate) === "active").length;

  const filtered = products.filter(p => {
    const s = getStatus(p.expiryDate);
    const matchFilter = filter === "all" || s === filter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="animate-fade-in">
      {/* ALERT BANNER */}
      {expiring > 0 && (
        <div style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1px solid #fcd34d", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 700, color: "#92400e", margin: 0, fontSize: 14 }}>{expiring} product{expiring > 1 ? "s" : ""} expiring soon!</p>
            <p style={{ color: "#b45309", margin: 0, fontSize: 13 }}>Review and extend warranties to stay protected.</p>
          </div>
          <button onClick={() => nav("warranty-extension")} style={{ marginLeft: "auto", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>Extend Now →</button>
        </div>
      )}

      {/* STATS CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Products", value: total, icon: "🛡️", color: "#0ea5e9", bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)" },
          { label: "Active", value: active, icon: "✅", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
          { label: "Expiring Soon", value: expiring, icon: "⚠️", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
          { label: "Expired", value: expired, icon: "❌", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
        ].map(c => (
          <div key={c.label} className="card-hover" style={{ background: "var(--card)", border: `1px solid ${c.border}`, borderRadius: 14, padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</p>
                <p style={{ fontSize: 36, fontWeight: 800, color: c.color, margin: 0, letterSpacing: "-1px" }}>{c.value}</p>
              </div>
              <div style={{ background: c.bg, borderRadius: 10, padding: 10, fontSize: 22 }}>{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* PRODUCT TABLE */}
      <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, flex: 1, margin: 0 }}>My Products</h3>
          <div style={{ position: "relative" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ padding: "8px 12px 8px 32px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg)", color: "var(--text)", fontFamily: "inherit", outline: "none", width: 180 }} />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔍</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["all", "All"], ["active", "Active"], ["expiring", "Expiring"], ["expired", "Expired"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid", borderColor: filter === v ? "#0ea5e9" : "var(--border)", background: filter === v ? "#0ea5e9" : "transparent", color: filter === v ? "#fff" : "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>{l}</button>
            ))}
          </div>
          <button onClick={() => nav("add-product")} className="btn-primary" style={{ color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}>+ Add Product</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg)" }}>
                {["Product Name", "Brand", "Category", "Purchase Date", "Expiry Date", "Days Left", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>No products found. <span onClick={() => nav("add-product")} style={{ color: "#0ea5e9", cursor: "pointer", fontWeight: 600 }}>Add your first product →</span></td></tr>
              ) : filtered.map((p, i) => {
                const status = getStatus(p.expiryDate);
                const days = getDaysRemaining(p.expiryDate);
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid var(--border)", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 16px", fontWeight: 600, fontSize: 14 }}>{p.name}</td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: 13 }}>{p.brand}</td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: 13 }}>{p.category}</td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: 13 }}>{p.purchaseDate}</td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{p.expiryDate}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: days !== null && days < 0 ? "#ef4444" : days !== null && days <= 30 ? "#f59e0b" : "#10b981" }}>{days !== null ? (days < 0 ? `${Math.abs(days)}d ago` : `${days}d`) : "—"}</td>
                    <td style={{ padding: "14px 16px" }}><StatusBadge status={status} /></td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => nav("product-detail", { product: p })} style={{ background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>View</button>
                        <button onClick={() => nav("add-product", { edit: p })} style={{ background: "#f0fdf4", color: "#16a34a", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                        <button onClick={() => deleteProduct(p.id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSIGHTS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginTop: 24 }}>
        <div style={{ background: "linear-gradient(135deg,rgba(14,165,233,0.1),rgba(139,92,246,0.1))", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 28, margin: 0 }}>💡</p>
          <p style={{ fontWeight: 700, fontSize: 15, marginTop: 8, marginBottom: 4 }}>You saved ₹2,000+</p>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>By tracking warranties and claiming on time this year.</p>
        </div>
        <div style={{ background: "linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.1))", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, padding: 20 }}>
          <p style={{ fontSize: 28, margin: 0 }}>📅</p>
          <p style={{ fontWeight: 700, fontSize: 15, marginTop: 8, marginBottom: 4 }}>{active} products protected</p>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Your active warranties are keeping you covered.</p>
        </div>
      </div>
    </div>
  );
}

// ─── ADD / EDIT PRODUCT ───────────────────────────────────────────────────────
function AddProductPage({ nav, addProduct, updateProduct, editingProduct }) {
  const isEdit = !!editingProduct;
  const [form, setForm] = useState(editingProduct || { name: "", brand: "", category: "", purchaseDate: "", warrantyMonths: "", notes: "", invoiceFile: null, warrantyFile: null });
  const [saved, setSaved] = useState(false);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handle = () => {
    if (!form.name || !form.purchaseDate || !form.warrantyMonths) return alert("Please fill required fields: Name, Purchase Date, Warranty Duration.");
    if (isEdit) { updateProduct(form); } else { addProduct(form); }
    setSaved(true);
    setTimeout(() => nav("dashboard"), 1200);
  };

  if (saved) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Product {isEdit ? "Updated" : "Added"} Successfully!</h3>
      <p style={{ color: "var(--muted)" }}>Redirecting to dashboard...</p>
    </div>
  );

  const expiryPreview = form.purchaseDate && form.warrantyMonths ? calcExpiry(form.purchaseDate, form.warrantyMonths) : null;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.5px", marginBottom: 4 }}>{isEdit ? "Edit Product" : "Add New Product"}</h2>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>{isEdit ? "Update your product details" : "Fill in the details to start tracking your warranty"}</p>
      </div>
      <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: 28, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Product Name *</label>
            <input value={form.name} onChange={e => upd("name", e.target.value)} placeholder="e.g. Samsung Galaxy S24" style={inp} />
          </div>
          <div>
            <label style={lbl}>Brand</label>
            <select value={form.brand} onChange={e => upd("brand", e.target.value)} style={inp}>
              <option value="">Select brand</option>
              {BRANDS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Category</label>
            <select value={form.category} onChange={e => upd("category", e.target.value)} style={inp}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Purchase Date *</label>
            <input type="date" value={form.purchaseDate} onChange={e => upd("purchaseDate", e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Warranty Duration (months) *</label>
            <input type="number" value={form.warrantyMonths} onChange={e => upd("warrantyMonths", e.target.value)} placeholder="e.g. 12" min={1} style={inp} />
          </div>
        </div>

        {expiryPreview && (
          <div style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 10, padding: "12px 16px", margin: "16px 0", display: "flex", alignItems: "center", gap: 10 }}>
            <span>📅</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#0284c7" }}>Calculated Expiry Date: <strong>{expiryPreview}</strong></span>
            <StatusBadge status={getStatus(expiryPreview)} />
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <label style={lbl}>Upload Invoice (optional)</label>
          <div style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer", background: "var(--bg)" }} onClick={() => document.getElementById("inv-input").click()}>
            <input id="inv-input" type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => upd("invoiceFile", e.target.files[0]?.name || null)} />
            <p style={{ margin: 0, fontSize: 24 }}>📎</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)" }}>{form.invoiceFile ? `✅ ${form.invoiceFile}` : "Click to upload invoice (JPG, PNG, PDF)"}</p>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={lbl}>Upload Warranty Card (optional)</label>
          <div style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer", background: "var(--bg)" }} onClick={() => document.getElementById("war-input").click()}>
            <input id="war-input" type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => upd("warrantyFile", e.target.files[0]?.name || null)} />
            <p style={{ margin: 0, fontSize: 24 }}>🛡️</p>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--muted)" }}>{form.warrantyFile ? `✅ ${form.warrantyFile}` : "Click to upload warranty card"}</p>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={lbl}>Notes</label>
          <textarea value={form.notes} onChange={e => upd("notes", e.target.value)} placeholder="Any additional notes about the product..." rows={3} style={{ ...inp, resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={handle} className="btn-primary" style={{ color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "12px 28px", borderRadius: 10 }}>
            {isEdit ? "💾 Update Product" : "✅ Save Product"}
          </button>
          <button onClick={() => nav("dashboard")} style={{ background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, padding: "12px 24px", borderRadius: 10 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
const lbl = { display: "block", fontWeight: 600, fontSize: 12, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" };
const inp = { width: "100%", padding: "11px 13px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 14, background: "var(--bg)", color: "var(--text)", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

// ─── PRODUCT DETAIL ───────────────────────────────────────────────────────────
function ProductDetailPage({ nav, selectedProduct, deleteProduct }) {
  const p = selectedProduct;
  if (!p) return <div>No product selected. <span onClick={() => nav("dashboard")} style={{ color: "#0ea5e9", cursor: "pointer" }}>Go to Dashboard</span></div>;
  const status = getStatus(p.expiryDate);
  const days = getDaysRemaining(p.expiryDate);
  const [serviceHistory] = useState([
    { date: "2024-06-15", type: "Screen Replacement", center: "Samsung Smart Café", cost: "₹4,500", status: "Completed" },
    { date: "2024-09-01", type: "Battery Replacement", center: "Samsung Smart Café", cost: "₹2,200", status: "Completed" },
  ]);
  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => nav("dashboard")} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>← Back</button>
        <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0, letterSpacing: "-0.5px" }}>Product Details</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
        <div>
          <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 16 }}>
            <div style={{ width: "100%", height: 160, background: "linear-gradient(135deg,rgba(14,165,233,0.1),rgba(139,92,246,0.1))", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, marginBottom: 20 }}>
              {p.category === "Mobile" ? "📱" : p.category === "TV" ? "📺" : p.category === "Laptop" ? "💻" : p.category === "AC" ? "❄️" : p.category === "Refrigerator" ? "🧊" : "📦"}
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{p.name}</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>{p.brand} · {p.category}</p>
            <StatusBadge status={status} />
            {days !== null && (
              <div style={{ marginTop: 16, padding: "12px", borderRadius: 10, background: status === "expired" ? "rgba(239,68,68,0.08)" : status === "expiring" ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)", textAlign: "center" }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: status === "expired" ? "#ef4444" : status === "expiring" ? "#f59e0b" : "#10b981", margin: 0 }}>{Math.abs(days)}</p>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>{days < 0 ? "days since expired" : "days remaining"}</p>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => nav("add-product", { edit: p })} style={{ flex: 1, background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: 10, padding: "10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>✏️ Edit</button>
            <button onClick={() => { deleteProduct(p.id); nav("dashboard"); }} style={{ flex: 1, background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 10, padding: "10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>🗑️ Delete</button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <h4 style={{ fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>🛡️ Warranty Info</h4>
            {[["Purchase Date", p.purchaseDate], ["Warranty Duration", `${p.warrantyMonths} months`], ["Expiry Date", p.expiryDate], ["Status", <StatusBadge status={status} />]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--muted)", fontSize: 14 }}>{k}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{v}</span>
              </div>
            ))}
            {p.notes && <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 12, fontStyle: "italic" }}>📝 {p.notes}</p>}
          </div>
          <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <h4 style={{ fontWeight: 700, marginBottom: 16 }}>📎 Uploaded Documents</h4>
            {p.invoiceFile ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg)", borderRadius: 8, marginBottom: 8 }}>
                <span>📄</span><span style={{ fontSize: 13 }}>{p.invoiceFile}</span>
              </div>
            ) : <p style={{ color: "var(--muted)", fontSize: 13 }}>No invoice uploaded. <span onClick={() => nav("add-product", { edit: p })} style={{ color: "#0ea5e9", cursor: "pointer" }}>Upload now →</span></p>}
            {p.warrantyFile && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg)", borderRadius: 8 }}>
                <span>🛡️</span><span style={{ fontSize: 13 }}>{p.warrantyFile}</span>
              </div>
            )}
          </div>
          <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <h4 style={{ fontWeight: 700, marginBottom: 16 }}>🔧 Service History</h4>
            {serviceHistory.map((s, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: i < serviceHistory.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{s.type}</span>
                  <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{s.status}</span>
                </div>
                <p style={{ color: "var(--muted)", fontSize: 12, margin: "4px 0 0" }}>{s.center} · {s.date} · {s.cost}</p>
              </div>
            ))}
            <button onClick={() => nav("service-center")} style={{ marginTop: 12, background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>+ Book New Service</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SERVICE CENTER ───────────────────────────────────────────────────────────
function ServiceCenterPage({ nav }) {
  const [brandFilter, setBrandFilter] = useState("All");
  const [booking, setBooking] = useState(null);
  const [booked, setBooked] = useState(null);
  const uniqueBrands = ["All", ...new Set(SERVICE_CENTERS.map(s => s.brand))];
  const filtered = brandFilter === "All" ? SERVICE_CENTERS : SERVICE_CENTERS.filter(s => s.brand === brandFilter);
  return (
    <div className="animate-fade-in">
      <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.5px", marginBottom: 6 }}>Service Center Locator</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>Find authorized service centers near you. Book a slot directly.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {uniqueBrands.map(b => (
          <button key={b} onClick={() => setBrandFilter(b)} style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid", borderColor: brandFilter === b ? "#0ea5e9" : "var(--border)", background: brandFilter === b ? "#0ea5e9" : "var(--card)", color: brandFilter === b ? "#fff" : "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{b}</button>
        ))}
      </div>
      {booked && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}><span>✅</span><span style={{ fontWeight: 600, color: "#166534", fontSize: 14 }}>Slot booked at {booked}! You'll receive a confirmation shortly.</span></div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {filtered.map(s => (
          <div key={s.id} className="card-hover" style={{ background: "var(--card)", borderRadius: 14, border: "1px solid var(--border)", padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.name}</h4>
                <span style={{ background: "#eff6ff", color: "#2563eb", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{s.brand}</span>
              </div>
              <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 14 }}>★ {s.rating}</span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><span>📍</span>{s.address}</p>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}><span>📞</span>{s.phone}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <a href={`tel:${s.phone}`} style={{ flex: 1, background: "#f0fdf4", color: "#16a34a", border: "none", borderRadius: 8, padding: "8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12, textAlign: "center", textDecoration: "none" }}>📞 Call</a>
              <button onClick={() => setBooked(s.name)} style={{ flex: 1, background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: 8, padding: "8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12 }}>📅 Book Slot</button>
              <a href={`https://maps.google.com?q=${s.lat},${s.lng}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12, textAlign: "center", textDecoration: "none" }}>🗺️ Map</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WARRANTY EXTENSION ───────────────────────────────────────────────────────
function WarrantyExtensionPage({ products }) {
  const expiring = products.filter(p => ["expiring", "expired"].includes(getStatus(p.expiryDate)));
  const plans = [
    { label: "1 Year Extension", price: "₹999", benefits: ["Full coverage", "1 service visit", "24/7 support"] },
    { label: "2 Year Extension", price: "₹1,799", benefits: ["Full coverage", "3 service visits", "Priority support", "Free pickup"] },
    { label: "3 Year Extension", price: "₹2,499", benefits: ["Full coverage", "Unlimited visits", "VIP support", "Free pickup", "Cashback offers"] },
  ];
  const [selected, setSelected] = useState(null);
  const [purchased, setPurchased] = useState(null);
  return (
    <div className="animate-fade-in">
      <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.5px", marginBottom: 6 }}>Warranty Extension</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>Extend protection for your products before it's too late.</p>
      {expiring.length === 0 ? (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 14, padding: "40px", textAlign: "center" }}>
          <p style={{ fontSize: 40, margin: 0 }}>🎉</p>
          <p style={{ fontWeight: 700, color: "#166534", fontSize: 18, marginTop: 12 }}>All warranties are active!</p>
          <p style={{ color: "#16a34a", fontSize: 14 }}>No products need extension right now.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Products Needing Attention</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
              {expiring.map(p => {
                const days = getDaysRemaining(p.expiryDate);
                return (
                  <div key={p.id} onClick={() => setSelected(p)} style={{ background: "var(--card)", borderRadius: 14, border: selected?.id === p.id ? "2px solid #0ea5e9" : "1px solid var(--border)", padding: 18, cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.name}</p>
                        <p style={{ color: "var(--muted)", fontSize: 13 }}>{p.brand}</p>
                      </div>
                      <StatusBadge status={getStatus(p.expiryDate)} />
                    </div>
                    <p style={{ color: days !== null && days < 0 ? "#ef4444" : "#f59e0b", fontWeight: 700, fontSize: 13, marginTop: 8 }}>
                      {days !== null && days < 0 ? `Expired ${Math.abs(days)} days ago` : `Expires in ${days} days`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          {selected && (
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Extension Plans for: <span style={{ color: "#0ea5e9" }}>{selected.name}</span></h3>
              {purchased && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 10 }}><span>✅</span><span style={{ fontWeight: 600, color: "#166534" }}>Extension purchased! Your warranty is now extended.</span></div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
                {plans.map((plan, i) => (
                  <div key={plan.label} className="card-hover" style={{ background: "var(--card)", borderRadius: 14, border: i === 1 ? "2px solid #0ea5e9" : "1px solid var(--border)", padding: 22, position: "relative", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    {i === 1 && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "#0ea5e9", color: "#fff", borderRadius: 20, padding: "2px 14px", fontSize: 11, fontWeight: 700 }}>POPULAR</div>}
                    <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{plan.label}</p>
                    <p style={{ fontSize: 30, fontWeight: 800, color: "#0ea5e9", marginBottom: 16, letterSpacing: "-1px" }}>{plan.price}</p>
                    <ul style={{ padding: "0 0 0 16px", color: "var(--muted)", fontSize: 13, lineHeight: 2 }}>
                      {plan.benefits.map(b => <li key={b}>{b}</li>)}
                    </ul>
                    <button onClick={() => setPurchased(plan.label)} className="btn-primary" style={{ width: "100%", marginTop: 16, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "11px", borderRadius: 10 }}>Extend Now →</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── TICKETS ──────────────────────────────────────────────────────────────────
function TicketsPage({ products, tickets, addTicket }) {
  const [form, setForm] = useState({ product: "", description: "", imageFile: null });
  const [submitted, setSubmitted] = useState(null);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = () => {
    if (!form.description) return alert("Please describe your issue.");
    const t = { ...form };
    addTicket(t);
    setSubmitted(genTicketId());
    setForm({ product: "", description: "", imageFile: null });
  };
  const statusColor = { Pending: "#f59e0b", "In Progress": "#0ea5e9", Resolved: "#10b981" };
  return (
    <div className="animate-fade-in">
      <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.5px", marginBottom: 6 }}>Support Tickets</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>Report issues and track your support requests.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>🎟️ Raise New Ticket</h3>
            {submitted && <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
              <p style={{ fontWeight: 700, color: "#1e40af", margin: 0, fontSize: 14 }}>✅ Ticket submitted!</p>
              <p style={{ color: "#3b82f6", margin: "4px 0 0", fontSize: 13 }}>Your ticket ID: <strong style={{ fontFamily: "JetBrains Mono, monospace" }}>{submitted}</strong></p>
            </div>}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Select Product</label>
              <select value={form.product} onChange={e => upd("product", e.target.value)} style={inp}>
                <option value="">Select a product</option>
                {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Problem Description *</label>
              <textarea value={form.description} onChange={e => upd("description", e.target.value)} placeholder="Describe your issue in detail..." rows={4} style={{ ...inp, resize: "vertical" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Upload Screenshot (optional)</label>
              <div style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: "16px", textAlign: "center", cursor: "pointer", background: "var(--bg)" }} onClick={() => document.getElementById("ticket-img").click()}>
                <input id="ticket-img" type="file" accept="image/*" style={{ display: "none" }} onChange={e => upd("imageFile", e.target.files[0]?.name || null)} />
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{form.imageFile ? `✅ ${form.imageFile}` : "📸 Click to upload"}</p>
              </div>
            </div>
            <button onClick={handleSubmit} className="btn-primary" style={{ width: "100%", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "12px", borderRadius: 10 }}>Submit Ticket</button>
          </div>
        </div>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>My Tickets</h3>
          {[...tickets, { id: "demo1", ticketId: "TKT-AB123", product: "Samsung Galaxy S24", description: "Screen flickering issue", status: "Resolved", created: "2026-04-01" }, { id: "demo2", ticketId: "TKT-XY456", product: "LG OLED TV", description: "Remote not working", status: "In Progress", created: "2026-04-10" }].map(t => (
            <div key={t.id} style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 700, color: "#0ea5e9" }}>{t.ticketId}</span>
                <span style={{ background: statusColor[t.status] + "22", color: statusColor[t.status], borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{t.status}</span>
              </div>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t.product || "General Issue"}</p>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 6 }}>{t.description?.slice(0, 60)}{t.description?.length > 60 ? "..." : ""}</p>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>📅 {t.created}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── HELP PAGE ────────────────────────────────────────────────────────────────
function HelpPage() {
  const [open, setOpen] = useState(null);
  const guides = [
    { icon: "🛡️", title: "Getting Started", desc: "How to set up your account and add your first product" },
    { icon: "📅", title: "Managing Warranties", desc: "Track, update, and extend your product warranties" },
    { icon: "📍", title: "Service Center Booking", desc: "Find and book authorized service centers near you" },
    { icon: "🎟️", title: "Support Tickets", desc: "How to raise and track support requests effectively" },
    { icon: "🔔", title: "Setting Up Alerts", desc: "Configure email and push notification preferences" },
    { icon: "🤖", title: "Using the AI Assistant", desc: "Get the most out of the built-in AI chatbot" },
  ];
  return (
    <div className="animate-fade-in">
      <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.5px", marginBottom: 6 }}>Help Center</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28 }}>Everything you need to know about WarrantyPro.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginBottom: 36 }}>
        {guides.map(g => (
          <div key={g.title} className="card-hover" style={{ background: "var(--card)", borderRadius: 14, border: "1px solid var(--border)", padding: 20, cursor: "pointer" }}>
            <p style={{ fontSize: 28, margin: "0 0 12px" }}>{g.icon}</p>
            <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{g.title}</h4>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>{g.desc}</p>
          </div>
        ))}
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Frequently Asked Questions</h3>
      <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? "1px solid var(--border)" : "none" }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{faq.q}</span>
              <span style={{ color: "var(--muted)", fontSize: 18, transition: "transform 0.2s", transform: open === i ? "rotate(180deg)" : "none" }}>▾</span>
            </button>
            {open === i && <div style={{ padding: "0 22px 18px", color: "var(--muted)", fontSize: 14, lineHeight: 1.7 }}>{faq.a}</div>}
          </div>
        ))}
      </div>
      <div style={{ background: "linear-gradient(135deg,rgba(14,165,233,0.08),rgba(139,92,246,0.08))", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 16, padding: 24, marginTop: 24, textAlign: "center" }}>
        <p style={{ fontSize: 24, margin: "0 0 10px" }}>✉️</p>
        <h4 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Still need help?</h4>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>Our support team is available 24/7 to assist you.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="btn-primary" style={{ color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "10px 22px", borderRadius: 10 }}>📧 Email Support</button>
          <button style={{ background: "#25D366", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "10px 22px", borderRadius: 10 }}>💬 WhatsApp</button>
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS FULL PAGE ──────────────────────────────────────────────────
function NotificationsFullPage({ notifications, markAllRead }) {
  const icons = { warning: "⚠️", info: "ℹ️", success: "✅" };
  const colors = { warning: "#f59e0b", info: "#0ea5e9", success: "#10b981" };
  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.5px", marginBottom: 4 }}>Notifications</h2>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Your warranty alerts and system updates.</p>
        </div>
        <button onClick={markAllRead} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#0ea5e9" }}>Mark all as read</button>
      </div>
      <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--muted)" }}>
            <p style={{ fontSize: 40, margin: "0 0 12px" }}>🔔</p>
            <p>No notifications yet.</p>
          </div>
        ) : notifications.map((n, i) => (
          <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 22px", borderBottom: i < notifications.length - 1 ? "1px solid var(--border)" : "none", background: n.read ? "transparent" : `${colors[n.type]}08` }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${colors[n.type]}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{icons[n.type]}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: n.read ? 400 : 600, fontSize: 14, margin: 0, color: "var(--text)" }}>{n.msg}</p>
              <p style={{ color: "var(--muted)", fontSize: 12, margin: "4px 0 0" }}>{n.time}</p>
            </div>
            {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[n.type], flexShrink: 0 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function SettingsPage({ user, dark, setDark, settings, setSettings }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saved, setSaved] = useState(false);
  const Toggle = ({ on, toggle }) => (
    <button onClick={toggle} style={{ width: 44, height: 24, borderRadius: 12, background: on ? "#0ea5e9" : "var(--border)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
      <span style={{ position: "absolute", top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </button>
  );
  return (
    <div className="animate-fade-in" style={{ maxWidth: 640 }}>
      <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.5px", marginBottom: 6 }}>Settings</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>Manage your account and preferences.</p>

      {saved && <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontWeight: 600, color: "#166534", fontSize: 14 }}>✅ Settings saved!</div>}

      <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>👤 Profile</h3>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={inp} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
        </div>
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="btn-primary" style={{ color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "10px 22px", borderRadius: 10 }}>Save Changes</button>
      </div>

      <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>🔔 Notifications</h3>
        {[["emailNotifs", "📧 Email Notifications", "Get warranty alerts via email"], ["whatsappAlerts", "💬 WhatsApp Alerts", "Receive alerts on WhatsApp"], ["pushNotifs", "🔔 Push Notifications", "Browser popup notifications"]].map(([k, label, desc]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{label}</p>
              <p style={{ color: "var(--muted)", fontSize: 12, margin: "3px 0 0" }}>{desc}</p>
            </div>
            <Toggle on={settings[k]} toggle={() => setSettings(s => ({ ...s, [k]: !s[k] }))} />
          </div>
        ))}
      </div>

      <div style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>🎨 Appearance</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>Dark Mode</p>
            <p style={{ color: "var(--muted)", fontSize: 12, margin: "3px 0 0" }}>Switch between light and dark themes</p>
          </div>
          <Toggle on={dark} toggle={() => setDark(d => !d)} />
        </div>
      </div>
    </div>
  );
}

// ─── AI CHATBOT ───────────────────────────────────────────────────────────────
function AIChatbot({ products, chatOpen, setChatOpen }) {
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "Hi! 👋 I'm your WarrantyPro AI assistant. Ask me anything about your warranties, products, or how to use the app!" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMsgs(m => [...m, { role: "user", content: userMsg }]);
    setLoading(true);

    const productSummary = products.map(p => `${p.name} (${p.brand}, expires: ${p.expiryDate}, status: ${getStatus(p.expiryDate)}, days: ${getDaysRemaining(p.expiryDate)})`).join("\n");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are WarrantyPro's helpful AI assistant. You help users manage warranties, track products, and navigate the app. 
Be concise, friendly, and helpful. Use emojis occasionally.

The user's current products:
${productSummary || "No products added yet."}

You can help with:
- Warranty expiry dates and status
- How to add/edit/delete products
- Service center information
- Warranty extension advice
- App navigation
- Troubleshooting tips
- General warranty questions

Keep responses concise (2-4 sentences max unless detailed explanation needed).`,
          messages: [...msgs, { role: "user", content: userMsg }].map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't process that. Please try again.";
      setMsgs(m => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMsgs(m => [...m, { role: "assistant", content: "⚠️ I'm having trouble connecting right now. Please try again in a moment." }]);
    }
    setLoading(false);
  }, [input, loading, msgs, products]);

  const quickQs = ["When does my warranty expire?", "Which products are expiring soon?", "How do I extend my warranty?", "What should I do if my product breaks?"];

  return (
    <>
      {/* FLOATING BUTTON */}
      <button onClick={() => setChatOpen(o => !o)} style={{ position: "fixed", bottom: 28, right: 28, width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", border: "none", cursor: "pointer", boxShadow: "0 8px 32px rgba(14,165,233,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, transition: "transform 0.2s" }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
        {chatOpen ? "✕" : "💬"}
      </button>

      {/* CHAT PANEL */}
      <div className={`chat-panel ${chatOpen ? "open" : "closed"}`} style={{ position: "fixed", bottom: 96, right: 28, width: 360, height: 520, background: "var(--card)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.2)", zIndex: 999, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* HEADER */}
        <div style={{ background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", padding: "16px 18px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
          <div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>WarrantyPro AI</p>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} className="animate-pulse-slow" />
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>Online · Always available</span>
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "82%", padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? "linear-gradient(135deg,#0ea5e9,#0284c7)" : "var(--bg)", color: m.role === "user" ? "#fff" : "var(--text)", fontSize: 13, lineHeight: 1.5, border: m.role === "assistant" ? "1px solid var(--border)" : "none" }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "var(--bg)", border: "1px solid var(--border)", display: "flex", gap: 4 }}>
                {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", animation: `pulseSlow 1.2s ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* QUICK QUESTIONS */}
        {msgs.length <= 1 && (
          <div style={{ padding: "0 10px 8px", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {quickQs.map(q => (
              <button key={q} onClick={() => { setInput(q); }} style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", color: "#0284c7", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{q}</button>
            ))}
          </div>
        )}

        {/* INPUT */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask anything..." style={{ flex: 1, padding: "10px 13px", border: "1.5px solid var(--border)", borderRadius: 12, fontSize: 13, background: "var(--bg)", color: "var(--text)", fontFamily: "inherit", outline: "none" }} />
          <button onClick={send} disabled={loading || !input.trim()} className="btn-primary" style={{ color: "#fff", border: "none", cursor: "pointer", borderRadius: 12, padding: "0 16px", fontSize: 16, opacity: loading || !input.trim() ? 0.5 : 1 }}>→</button>
        </div>
      </div>
    </>
  );
}
