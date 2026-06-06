import { useState, useEffect, useCallback } from "react";

/* ─── Types ─────────────────────────────────────────────────── */
interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  profits: string;
  subscription: string;
  fees: string;
  accountHolder: string;
  iban: string;
  phone: string;
  status: "active" | "disabled";
  loginTitle: string;
  loginSlug: string;
}

type View =
  | { page: "login" }
  | { page: "client-login"; slug: string }
  | { page: "admin" }
  | { page: "user"; userId: string; fromAdmin?: boolean };

const STORAGE_KEY = "financial_platform_users";

/* ─── API helper ────────────────────────────────────────────── */
// The API lives at the root /api path (shared proxy routes /api → api-server)
// Do NOT prepend BASE_URL here — that would produce /financial-platform/api/...
async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

type ApiUser = Omit<User, "id" | "status"> & { id: number; status: string };

function mapApiUser(u: ApiUser): User {
  return {
    id: String(u.id),
    username: u.username,
    password: u.password,
    name: u.name,
    profits: u.profits,
    subscription: u.subscription,
    fees: u.fees,
    accountHolder: u.accountHolder,
    iban: u.iban,
    phone: u.phone,
    status: (u.status === "disabled" ? "disabled" : "active") as "active" | "disabled",
    loginTitle: u.loginTitle ?? "",
    loginSlug: u.loginSlug ?? "",
  };
}

function getClientSlugFromUrl(): string | null {
  const path = window.location.pathname;
  const match = path.match(/\/client\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

/* ─── Mock Data ─────────────────────────────────────────────── */
const initialUsers: User[] = [
  {
    id: "u1",
    username: "abdulrahman",
    password: "Ab@123456",
    name: "عبدالرحمن سعيد يحيى ال فروان",
    profits: "17,400",
    subscription: "1,000",
    fees: "3,610",
    accountHolder: "عبدالرحمن سعيد يحيى ال فروان",
    iban: "SA15 8000 0220 6080 1030 8884",
    phone: "+966 5X XXX XXXX",
    status: "active",
    loginTitle: "",
    loginSlug: "",
  },
  {
    id: "u2",
    username: "khalid_m",
    password: "Kh@789012",
    name: "خالد محمد العمري",
    profits: "8,250",
    subscription: "1,000",
    fees: "3,610",
    accountHolder: "خالد محمد العمري",
    iban: "SA29 6000 0100 0001 2345 6789",
    phone: "+966 5X XXX XXXX",
    status: "active",
    loginTitle: "",
    loginSlug: "",
  },
  {
    id: "u3",
    username: "fatima_a",
    password: "Fa@345678",
    name: "فاطمة أحمد القحطاني",
    profits: "4,900",
    subscription: "1,000",
    fees: "3,610",
    accountHolder: "فاطمة أحمد القحطاني",
    iban: "SA36 8000 0000 6080 1031 0009",
    phone: "+966 5X XXX XXXX",
    status: "disabled",
    loginTitle: "",
    loginSlug: "",
  },
];

const ADMIN_USERNAME = "Assubaihi";
const ADMIN_PASSWORD = "admin123";

/* ─── SVG Icons ──────────────────────────────────────────────── */
const Icon = {
  TrendingUp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Dollar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  AlertCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  CreditCard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Logout: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  Ban: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  X: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

/* ─── Card Icon Button ───────────────────────────────────────── */
function CardIconBtn({ children, bg = "rgba(255,255,255,0.25)" }: { children: React.ReactNode; bg?: string }) {
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: bg }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════════════════════════════ */
function LoginPage({ onLogin, users }: { onLogin: (view: View) => void; users: User[] }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        onLogin({ page: "admin" });
        return;
      }
      const found = users.find(
        (u) => u.username === username && u.password === password
      );
      if (found) {
        if (found.status === "disabled") {
          setError("هذا الحساب معطّل. تواصل مع الإدارة");
          return;
        }
        onLogin({ page: "user", userId: found.id });
        return;
      }
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    }, 600);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{
        background: "linear-gradient(160deg,#1a1f3c 0%,#2952e3 50%,#7c3aed 100%)",
        fontFamily: "'Cairo', sans-serif",
      }}
      dir="rtl"
    >
      {/* Background circles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.3)" }} />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.2)" }} />
        <div className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full opacity-5" style={{ background: "rgba(255,255,255,0.4)" }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h1 className="text-[24px] font-extrabold text-white leading-tight">منصة الاستثمار المالية</h1>
          <p className="text-white/60 text-[13px] font-medium mt-1">سجّل دخولك للمتابعة</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <h2 className="text-[17px] font-extrabold text-[#1a1f3c] text-center mb-6">تسجيل الدخول</h2>

          {/* Error message */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-2xl text-center text-[12px] font-bold"
              style={{ background: "#fef2f2", color: "#dc2626", border: "1.5px solid #fecaca" }}>
              {error}
            </div>
          )}

          {/* Username */}
          <div className="mb-4">
            <label className="block text-[12px] font-bold text-[#5a6282] mb-2 text-right">اسم المستخدم</label>
            <div className="relative">
              <div className="absolute top-1/2 -translate-y-1/2 right-3 text-[#8892a4]">
                <Icon.User />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="أدخل اسم المستخدم"
                className="w-full pl-4 pr-11 py-3 rounded-2xl border border-[#e2e8f0] bg-[#f8f9fc] text-[#1a1f3c] text-[13px] font-semibold text-right outline-none transition-all"
                style={{ direction: "ltr", textAlign: "right" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#2952e3"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(41,82,227,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-[12px] font-bold text-[#5a6282] mb-2 text-right">كلمة المرور</label>
            <div className="relative">
              <div className="absolute top-1/2 -translate-y-1/2 right-3 text-[#8892a4]">
                <Icon.Lock />
              </div>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="أدخل كلمة المرور"
                className="w-full pl-10 pr-11 py-3 rounded-2xl border border-[#e2e8f0] bg-[#f8f9fc] text-[#1a1f3c] text-[13px] font-semibold text-right outline-none transition-all"
                style={{ direction: "ltr", textAlign: "right" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#2952e3"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(41,82,227,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute top-1/2 -translate-y-1/2 left-3 text-[#8892a4] hover:text-[#5a6282] transition-colors"
              >
                {showPass ? <Icon.EyeOff /> : <Icon.Eye />}
              </button>
            </div>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-[15px] shadow-lg transition-opacity active:opacity-90 disabled:opacity-70"
            style={{ background: "linear-gradient(135deg,#2952e3 0%,#7c3aed 100%)" }}
          >
            {loading ? "جارٍ التحقق..." : "تسجيل الدخول"}
          </button>
        </div>

        <p className="text-center text-white/40 text-[11px] font-medium mt-6">
          المنصة المالية © 2025
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CLIENT LOGIN PAGE (beneficiary-specific URL)
═══════════════════════════════════════════════════════════════ */
function ClientLoginPage({ slug, onLogin }: { slug: string; onLogin: (view: View) => void }) {
  const [beneficiary, setBeneficiary] = useState<User | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<ApiUser>(`/beneficiaries/by-slug/${encodeURIComponent(slug)}`)
      .then((u) => setBeneficiary(mapApiUser(u)))
      .catch(() => setNotFound(true));
  }, [slug]);

  function handleLogin() {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    if (!beneficiary) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (username !== beneficiary.username || password !== beneficiary.password) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
        return;
      }
      if (beneficiary.status === "disabled") {
        setError("هذا الحساب معطّل. تواصل مع الإدارة");
        return;
      }
      onLogin({ page: "user", userId: beneficiary.id });
    }, 600);
  }

  if (notFound) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-5"
        style={{
          background: "linear-gradient(160deg,#1a1f3c 0%,#2952e3 50%,#7c3aed 100%)",
          fontFamily: "'Cairo', sans-serif",
        }}
        dir="rtl"
      >
        <div className="text-center text-white">
          <p className="text-[22px] font-extrabold mb-2">الصفحة غير موجودة</p>
          <p className="text-white/60 text-[14px]">هذا الرابط غير صحيح أو تم حذفه</p>
        </div>
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(160deg,#1a1f3c 0%,#2952e3 50%,#7c3aed 100%)",
          fontFamily: "'Cairo', sans-serif",
        }}
      >
        <div style={{
          width: 40, height: 40, border: "4px solid rgba(255,255,255,0.2)",
          borderTopColor: "white", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{
        background: "linear-gradient(160deg,#1a1f3c 0%,#2952e3 50%,#7c3aed 100%)",
        fontFamily: "'Cairo', sans-serif",
      }}
      dir="rtl"
    >
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.3)" }} />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.2)" }} />
        <div className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full opacity-5" style={{ background: "rgba(255,255,255,0.4)" }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h1 className="text-[22px] font-extrabold text-white leading-tight">{beneficiary.loginTitle || beneficiary.name}</h1>
          <p className="text-white/60 text-[13px] font-medium mt-1">سجّل دخولك للمتابعة</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <h2 className="text-[17px] font-extrabold text-[#1a1f3c] text-center mb-6">تسجيل الدخول</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-2xl text-center text-[12px] font-bold"
              style={{ background: "#fef2f2", color: "#dc2626", border: "1.5px solid #fecaca" }}>
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-[12px] font-bold text-[#5a6282] mb-2 text-right">اسم المستخدم</label>
            <div className="relative">
              <div className="absolute top-1/2 -translate-y-1/2 right-3 text-[#8892a4]">
                <Icon.User />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="أدخل اسم المستخدم"
                className="w-full pl-4 pr-11 py-3 rounded-2xl border border-[#e2e8f0] bg-[#f8f9fc] text-[#1a1f3c] text-[13px] font-semibold text-right outline-none transition-all"
                style={{ direction: "ltr", textAlign: "right" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#2952e3"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(41,82,227,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[12px] font-bold text-[#5a6282] mb-2 text-right">كلمة المرور</label>
            <div className="relative">
              <div className="absolute top-1/2 -translate-y-1/2 right-3 text-[#8892a4]">
                <Icon.Lock />
              </div>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="أدخل كلمة المرور"
                className="w-full pl-10 pr-11 py-3 rounded-2xl border border-[#e2e8f0] bg-[#f8f9fc] text-[#1a1f3c] text-[13px] font-semibold text-right outline-none transition-all"
                style={{ direction: "ltr", textAlign: "right" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#2952e3"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(41,82,227,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute top-1/2 -translate-y-1/2 left-3 text-[#8892a4] hover:text-[#5a6282] transition-colors"
              >
                {showPass ? <Icon.EyeOff /> : <Icon.Eye />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-[15px] shadow-lg transition-opacity active:opacity-90 disabled:opacity-70"
            style={{ background: "linear-gradient(135deg,#2952e3 0%,#7c3aed 100%)" }}
          >
            {loading ? "جارٍ التحقق..." : "تسجيل الدخول"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   USER DASHBOARD
═══════════════════════════════════════════════════════════════ */

function WithdrawModal({ onClose, maxAmount, iban, fees, userName }: {
  onClose: () => void;
  maxAmount: string;
  iban: string;
  fees: string;
  userName: string;
}) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "result">("form");
  const [submitTime, setSubmitTime] = useState("");

  const feesNum = parseFloat(fees.replace(/,/g, ""));
  const amountNum = parseFloat(amount.replace(/,/g, "")) || 0;
  const netAmount = amountNum - feesNum;

  function formatNum(n: number) {
    return n.toLocaleString("en-US");
  }

  if (step === "confirm") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
        style={{ background: "rgba(10,15,40,0.6)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
          style={{ fontFamily: "'Cairo', sans-serif" }} dir="rtl">
          <div className="px-6 pt-7 pb-5">
            <h3 className="text-[19px] font-extrabold text-[#1a1f3c] text-right leading-snug">تأكيد السحب</h3>
            <p className="text-[12px] text-[#8892a4] font-medium mt-1 text-right">تأكد من صحة البيانات قبل المتابعة</p>
          </div>
          <div className="h-px bg-[#f0f2f7] mx-5" />
          <div className="px-6 py-5 flex flex-col gap-0">
            <div className="flex items-center justify-between py-3 border-b border-[#f3f5fa]">
              <div className="flex items-baseline gap-1" dir="ltr">
                <span className="text-[16px] font-extrabold text-[#1a1f3c]">{formatNum(amountNum)}</span>
                <span className="text-[12px] font-bold text-[#1a1f3c]">ر.س</span>
              </div>
              <span className="text-[13px] font-semibold text-[#5a6282]">مبلغ السحب :</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#f3f5fa]">
              <div className="flex items-baseline gap-1" dir="ltr">
                <span className="text-[16px] font-extrabold text-[#ef4444]">{formatNum(feesNum)}</span>
                <span className="text-[12px] font-bold text-[#ef4444]">ر.س</span>
              </div>
              <span className="text-[13px] font-semibold text-[#5a6282]">رسوم السحب :</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#f3f5fa]">
              <div className="flex items-baseline gap-1" dir="ltr">
                <span className="text-[16px] font-extrabold text-[#16a34a]">{formatNum(netAmount)}</span>
                <span className="text-[12px] font-bold text-[#16a34a]">ر.س</span>
              </div>
              <span className="text-[13px] font-semibold text-[#5a6282]">المبلغ الصافي :</span>
            </div>
            <div className="flex items-start justify-between gap-4 py-3">
              <span className="text-[13px] font-bold text-[#1a1f3c] leading-relaxed" dir="ltr" style={{ textAlign: "left", letterSpacing: "0.04em" }}>
                {iban}
              </span>
              <span className="text-[13px] font-semibold text-[#5a6282] whitespace-nowrap mt-0.5">رقم الإيبان :</span>
            </div>
          </div>
          <div className="flex gap-3 px-5 pb-6">
            <button onClick={() => setStep("form")}
              className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] transition-colors hover:bg-[#f3f5fa]"
              style={{ border: "1.5px solid #e2e8f0", color: "#5a6282", background: "white" }}>
              رجوع
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const pad = (n: number) => String(n).padStart(2, "0");
                const h = now.getHours();
                const period = h >= 12 ? "م" : "ص";
                const h12 = h % 12 || 12;
                const timeStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${h12}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${period}`;
                setSubmitTime(timeStr);
                setStep("result");
              }}
              className="flex-1 py-3.5 rounded-2xl text-white font-bold text-[14px] shadow-lg active:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#c8005a 0%,#f0196e 60%,#ff4d88 100%)" }}>
              تأكيد السحب
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "result") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
        style={{ background: "rgba(10,15,40,0.6)" }}>
        <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
          style={{ fontFamily: "'Cairo', sans-serif" }} dir="rtl">
          <div className="px-6 pt-7 pb-6 flex flex-col gap-5">
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                <h3 className="text-[18px] font-extrabold text-[#dc2626]">فشل في السحب</h3>
                <span className="text-[18px]">⚠️</span>
              </div>
              <p className="text-[12px] text-[#8892a4] font-medium">لم يتم إتمام عملية السحب</p>
            </div>
            <div className="rounded-2xl p-4 text-right" style={{ background: "#fff0f0", border: "1.5px solid #fecaca" }}>
              <p className="text-[13px] font-extrabold text-[#1a1f3c] mb-2">سبب الفشل:</p>
              <p className="text-[13px] font-medium text-[#374151] leading-relaxed">
                عزيز العميل / {userName} 🚨 تعذر تحويل أرباح المتبقي عليك مبلغ رسوم تفعيل والمطابقة{" "}
                <span className="font-extrabold text-[#dc2626]">{fees}</span> ريال بعد السداد يتم التحويل ارباحك بنجاح ✅
              </p>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-extrabold text-[#1a1f3c] mb-3">تفاصيل المحاولة:</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#374151]">
                    {amountNum > 0 ? formatNum(amountNum) : maxAmount} ر.س
                  </span>
                  <span className="text-[12px] text-[#8892a4] font-medium">المبلغ المطلوب:</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#374151]">{fees} ر.س</span>
                  <span className="text-[12px] text-[#8892a4] font-medium">الرسوم المطلوبة:</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#374151]" dir="ltr">{submitTime}</span>
                  <span className="text-[12px] text-[#8892a4] font-medium">الوقت:</span>
                </div>
              </div>
            </div>
            <button onClick={onClose}
              className="w-full py-4 rounded-2xl text-white font-bold text-[15px] mt-1 active:opacity-90 transition-opacity"
              style={{ background: "#111827" }}>
              إغلاق
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: "rgba(10,15,40,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
        style={{ fontFamily: "'Cairo', sans-serif" }} dir="rtl">
        <div className="px-6 pt-7 pb-1 flex items-center justify-end gap-2">
          <h3 className="text-[18px] font-extrabold text-[#1a1f3c]">سحب الأموال</h3>
          <span className="text-[20px] font-black text-[#c8005a] leading-none">$</span>
        </div>
        <p className="px-6 pb-5 text-[12px] text-[#8892a4] font-medium text-right">أدخل مبلغ السحب ورقم الإيبان</p>
        <div className="px-6 pb-6 flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-bold text-[#1a1f3c] mb-2 text-right">مبلغ السحب (ر.س)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="أدخل المبلغ"
              className="w-full px-4 py-3 rounded-2xl text-[13px] font-semibold text-right outline-none transition-all"
              style={{ border: "1.5px solid #e2e8f0", background: "white", color: "#1a1f3c" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#f0196e"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }} />
            <p className="text-[11px] text-[#8892a4] font-medium mt-2 text-right">الحد الأقصى : {maxAmount} ر.س</p>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#1a1f3c] mb-2 text-right">رقم الإيبان</label>
            <div className="w-full px-4 py-3.5 rounded-2xl text-[15px] font-bold text-center" dir="ltr"
              style={{ border: "1.5px solid #e2e8f0", background: "white", color: "#1a1f3c", letterSpacing: "0.05em" }}>
              {iban}
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{ background: "#fef9ec", border: "1.5px solid #f5d97a" }}>
            <span className="text-[18px] leading-none">⚠️</span>
            <span className="text-[13px] font-bold text-[#92400e]">رسوم السحب : {fees} ر.س</span>
          </div>
          <div className="flex gap-3 mt-1">
            <button onClick={() => setStep("confirm")}
              className="flex-1 py-3.5 rounded-2xl text-white font-bold text-[14px] shadow-lg active:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#c8005a 0%,#f0196e 60%,#ff4d88 100%)" }}>
              متابعة
            </button>
            <button onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] transition-colors hover:bg-[#f3f5fa]"
              style={{ border: "1.5px solid #e2e8f0", color: "#5a6282", background: "white" }}>
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserDashboard({ user, onLogout, onBack }: { user: User; onLogout: () => void; onBack?: () => void }) {
  const [showWithdraw, setShowWithdraw] = useState(false);

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="text-right">
            <h1 className="text-[19px] font-extrabold text-[#1a1f3c] leading-tight tracking-tight">المنصة المالية</h1>
            <p className="text-[11px] text-[#5a6282] mt-1 leading-snug font-medium">مرحباً، {user.name}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-[#d0d7e8] text-[11px] font-semibold shadow-sm hover:bg-gray-50 transition-colors" style={{ color: "#2952e3" }}>
                <span className="text-[9px]">الريال السعودي (ر.س)</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#d0d7e8] text-[#1a1f3c] text-[11px] font-semibold shadow-sm hover:bg-gray-50 transition-colors">
                <Icon.Logout />
                <span>تسجيل الخروج</span>
              </button>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold shadow-sm transition-colors"
                style={{ background: "linear-gradient(135deg,#2952e3,#7c3aed)", color: "white" }}>
                <Icon.ArrowLeft />
                <span>قائمة المستفيدين</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="flex flex-col gap-5 pb-8">
        {/* Financial Operations */}
        <section className="px-4">
          <h2 className="text-[15px] font-bold text-[#1a1f3c] mb-3.5 text-right">العمليات المالية</h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowWithdraw(true)}
              className="w-full flex items-center justify-center gap-3 px-6 py-[14px] rounded-2xl text-white font-bold text-[14px] shadow-md active:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#c8005a 0%,#f0196e 50%,#ff4d88 100%)" }}>
              <Icon.ArrowLeft /><span>سحب الأموال</span>
            </button>
            <button className="w-full flex items-center justify-center gap-3 px-6 py-[14px] rounded-2xl text-white font-bold text-[14px] shadow-md active:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#0f7a38 0%,#16a34a 50%,#22c55e 100%)" }}>
              <Icon.Plus /><span>إيداع الأموال</span>
            </button>
          </div>
        </section>

        {/* Account Overview */}
        <section className="px-4">
          <h2 className="text-[15px] font-bold text-[#1a1f3c] mb-4 text-right">نظرة عامة على الحساب</h2>
          <div className="flex flex-col gap-4">
            {/* Profits */}
            <div className="rounded-3xl p-5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,#0b7a44 0%,#0fa558 40%,#14c46a 70%,#2dd87e 100%)" }}>
              <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.3)" }} />
              <div className="flex items-start justify-between mb-7 relative z-10">
                <CardIconBtn><Icon.TrendingUp /></CardIconBtn>
                <span className="bg-white/25 text-white text-[10px] font-bold px-3 py-1 rounded-lg">12.5%+</span>
              </div>
              <div className="text-right relative z-10">
                <p className="text-white/80 text-[11px] font-medium mb-1">أرباح الاشتراك</p>
                <p className="text-white font-extrabold leading-none" style={{ fontSize: "1.95rem" }}>
                  {user.profits} <span className="text-[19px]">ر.س</span>
                </p>
                <p className="text-white/70 text-[11px] font-medium mt-2">متاح للسحب الفوري</p>
              </div>
            </div>

            {/* Subscription */}
            <div className="rounded-3xl p-5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,#2952e3 0%,#4f46e5 40%,#7c3aed 100%)" }}>
              <div className="absolute -bottom-10 -right-6 w-40 h-40 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.5)" }} />
              <div className="flex items-start justify-between mb-7 relative z-10">
                <CardIconBtn bg="rgba(255,255,255,0.22)"><Icon.Dollar /></CardIconBtn>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block shadow-sm shadow-emerald-300 mt-1" />
              </div>
              <div className="text-right relative z-10">
                <p className="text-white/80 text-[11px] font-medium mb-1">مبلغ الاشتراك</p>
                <p className="text-white font-extrabold leading-none" style={{ fontSize: "1.95rem" }}>
                  {user.subscription} <span className="text-[19px]">ر.س</span>
                </p>
                <p className="text-white/70 text-[11px] font-medium mt-2">اشتراك نشط</p>
              </div>
            </div>

            {/* Fees */}
            <div className="rounded-3xl p-5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,#c41e1e 0%,#e83030 30%,#f05a1a 70%,#f97316 100%)" }}>
              <div className="absolute -bottom-8 -left-6 w-36 h-36 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.4)" }} />
              <div className="flex items-start justify-between mb-7 relative z-10">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ background: "rgba(180,30,30,0.5)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <Icon.AlertCircle />
                </div>
                <span className="text-white text-[10px] font-bold px-3 py-1 rounded-lg"
                  style={{ background: "rgba(210,30,80,0.6)", border: "1px solid rgba(255,255,255,0.2)" }}>رسوم</span>
              </div>
              <div className="text-right relative z-10">
                <p className="text-white/80 text-[11px] font-medium mb-1">رسوم السحب</p>
                <p className="text-white font-extrabold leading-none" style={{ fontSize: "1.95rem" }}>
                  {user.fees} <span className="text-[19px]">ر.س</span>
                </p>
                <p className="text-white/70 text-[11px] font-medium mt-2">مطلوبة لكل عملية سحب</p>
              </div>
            </div>

            {/* Bank Card */}
            <div className="rounded-3xl p-5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,#5b21b6 0%,#7c3aed 40%,#9333ea 80%,#a855f7 100%)" }}>
              <div className="absolute -bottom-10 -right-8 w-44 h-44 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.5)" }} />
              <div className="flex items-start justify-between mb-5 relative z-10">
                <CardIconBtn bg="rgba(255,255,255,0.22)"><Icon.CreditCard /></CardIconBtn>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/80 text-[11px] font-semibold">متصل</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" />
                </div>
              </div>
              <div className="text-right relative z-10 space-y-3.5">
                <div>
                  <p className="text-white/60 text-[10px] font-medium mb-0.5">اسم صاحب الحساب</p>
                  <p className="text-white font-bold text-[17px] leading-snug">{user.accountHolder}</p>
                </div>
                <div>
                  <p className="text-white/60 text-[10px] font-medium mb-1">رقم الإيبان</p>
                  <p className="text-white font-bold text-[15px] leading-snug" dir="ltr"
                    style={{ textAlign: "right", letterSpacing: "0.07em" }}>
                    {user.iban}
                  </p>
                </div>
                <p className="text-white/60 text-[10px] font-medium">حساب بنكي مربوط</p>
              </div>
            </div>
          </div>
        </section>

        {/* Account Info */}
        <section className="px-4 pb-8">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e2e8f0]">
            <div className="text-right mb-5">
              <h2 className="text-[17px] font-bold text-[#1a1f3c]">معلومات الحساب</h2>
              <p className="text-[11px] text-[#8892a4] mt-0.5 font-medium">تفاصيل حسابك الشخصي</p>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: "اسم العميل", value: user.name },
                { label: "رقم الإيبان", value: user.iban, ltr: true },
                { label: "مبلغ الاشتراك", value: `${user.subscription} ر.س` },
                { label: "رقم الهاتف", value: user.phone, ltr: true },
              ].map((f) => (
                <div key={f.label} className="text-right">
                  <label className="block text-[10px] font-semibold text-[#8892a4] mb-1.5">{f.label}</label>
                  <div
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f3f5fa] border border-[#e2e8f0] text-[#1a1f3c] font-semibold text-[12px]"
                    dir={f.ltr ? "ltr" : "rtl"}
                    style={{ textAlign: f.ltr ? "left" : "right" }}
                  >
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {showWithdraw && (
        <WithdrawModal
          onClose={() => setShowWithdraw(false)}
          maxAmount={user.profits}
          iban={user.iban}
          fees={user.fees}
          userName={user.name}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD (BENEFICIARIES)
═══════════════════════════════════════════════════════════════ */

const emptyUser: Omit<User, "id"> = {
  username: "",
  password: "",
  name: "",
  profits: "",
  subscription: "",
  fees: "",
  accountHolder: "",
  iban: "",
  phone: "",
  status: "active",
  loginTitle: "",
  loginSlug: "",
};

function UserFormModal({
  mode,
  initial,
  onSave,
  onClose,
}: {
  mode: "create" | "edit";
  initial: Omit<User, "id">;
  onSave: (data: Omit<User, "id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [showPass, setShowPass] = useState(false);

  function set(key: keyof typeof form, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  const fields: { key: keyof Omit<User, "id" | "status">; label: string; placeholder: string; ltr?: boolean }[] = [
    { key: "username", label: "اسم المستخدم", placeholder: "username" },
    { key: "name", label: "اسم المستفيد الكامل", placeholder: "عبدالرحمن سعيد..." },
    { key: "accountHolder", label: "اسم صاحب الحساب البنكي", placeholder: "الاسم الكامل" },
    { key: "iban", label: "رقم الإيبان", placeholder: "SA15 8000...", ltr: true },
    { key: "phone", label: "رقم الهاتف", placeholder: "+966 5X XXX XXXX", ltr: true },
    { key: "subscription", label: "مبلغ الاشتراك (ر.س)", placeholder: "1,000" },
    { key: "profits", label: "أرباح الاشتراك (ر.س)", placeholder: "17,400" },
    { key: "fees", label: "رسوم السحب (ر.س)", placeholder: "3,610" },
    { key: "loginTitle", label: "عنوان صفحة تسجيل الدخول", placeholder: "شركة محمد أحمد للاستثمار" },
    { key: "loginSlug", label: "رابط تسجيل الدخول (Slug)", placeholder: "mohammed", ltr: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(15,20,50,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto"
        style={{ fontFamily: "'Cairo', sans-serif" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eef0f6] sticky top-0 bg-white z-10 rounded-t-3xl">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f3f5fa] flex items-center justify-center text-[#5a6282] hover:bg-[#e8edf5] transition-colors">
            <Icon.X />
          </button>
          <h3 className="text-[15px] font-bold text-[#1a1f3c]">
            {mode === "create" ? "إضافة مستفيد جديد" : "تعديل بيانات المستفيد"}
          </h3>
          <div className="w-8" />
        </div>

        <div className="px-5 py-5 flex flex-col gap-4" dir="rtl">
          {/* Password field */}
          <div className="text-right">
            <label className="block text-[11px] font-bold text-[#5a6282] mb-1.5">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9fc] text-[#1a1f3c] text-[12px] font-semibold text-right outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all pr-10"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute top-1/2 -translate-y-1/2 right-3 text-[#8892a4] hover:text-[#5a6282]">
                {showPass ? <Icon.EyeOff /> : <Icon.Eye />}
              </button>
            </div>
          </div>

          {fields.map((f) => (
            <div key={f.key} className="text-right">
              <label className="block text-[11px] font-bold text-[#5a6282] mb-1.5">{f.label}</label>
              <input
                type="text"
                value={form[f.key] as string}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                dir={f.ltr ? "ltr" : "rtl"}
                className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9fc] text-[#1a1f3c] text-[12px] font-semibold text-right outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all"
                style={f.ltr ? { textAlign: "left", direction: "ltr" } : {}}
              />
            </div>
          ))}

          {/* Status */}
          <div className="text-right">
            <label className="block text-[11px] font-bold text-[#5a6282] mb-2">حالة الحساب</label>
            <div className="flex gap-2 justify-end">
              {(["active", "disabled"] as const).map((s) => (
                <button key={s} onClick={() => set("status", s)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
                  style={{
                    background: form.status === s ? (s === "active" ? "#dcfce7" : "#fee2e2") : "#f3f5fa",
                    color: form.status === s ? (s === "active" ? "#16a34a" : "#dc2626") : "#8892a4",
                    border: `1.5px solid ${form.status === s ? (s === "active" ? "#86efac" : "#fca5a5") : "#e2e8f0"}`,
                  }}>
                  {s === "active" ? <><Icon.CheckCircle /><span>نشط</span></> : <><Icon.Ban /><span>معطّل</span></>}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => onSave(form)}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-[14px] mt-2 transition-opacity active:opacity-90"
            style={{ background: "linear-gradient(135deg,#2952e3,#7c3aed)" }}>
            {mode === "create" ? "إضافة المستفيد" : "حفظ التعديلات"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(15,20,50,0.55)" }} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 text-center" style={{ fontFamily: "'Cairo', sans-serif" }}>
        <p className="text-[14px] font-bold text-[#1a1f3c] mb-5">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] text-[#5a6282] font-semibold text-[12px] hover:bg-[#f3f5fa] transition-colors">
            إلغاء
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-[#ef4444] text-white font-bold text-[12px] hover:opacity-90 transition-opacity">
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; userId: string }
  | { type: "delete"; userId: string }
  | { type: "disable"; userId: string };

function AdminDashboard({
  users,
  onRefresh,
  onLogout,
  onViewUser,
}: {
  users: User[];
  onRefresh: () => Promise<void>;
  onLogout: () => void;
  onViewUser: (userId: string) => void;
}) {
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [showPassId, setShowPassId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate(data: Omit<User, "id">) {
    setSaving(true);
    try {
      await apiFetch("/beneficiaries", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await onRefresh();
      setModal({ type: "none" });
    } catch (e) {
      alert("فشل حفظ المستفيد: " + (e instanceof Error ? e.message : "خطأ غير معروف"));
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(data: Omit<User, "id">) {
    if (modal.type !== "edit") return;
    setSaving(true);
    try {
      await apiFetch(`/beneficiaries/${modal.userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      await onRefresh();
      setModal({ type: "none" });
    } catch (e) {
      alert("فشل تعديل المستفيد: " + (e instanceof Error ? e.message : "خطأ غير معروف"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (modal.type !== "delete") return;
    setSaving(true);
    try {
      await apiFetch(`/beneficiaries/${modal.userId}`, { method: "DELETE" });
      await onRefresh();
      setModal({ type: "none" });
    } catch (e) {
      alert("فشل حذف المستفيد: " + (e instanceof Error ? e.message : "خطأ غير معروف"));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleDisable() {
    if (modal.type !== "disable") return;
    const target = users.find((u) => u.id === modal.userId);
    if (!target) return;
    setSaving(true);
    try {
      await apiFetch(`/beneficiaries/${modal.userId}`, {
        method: "PUT",
        body: JSON.stringify({ status: target.status === "active" ? "disabled" : "active" }),
      });
      await onRefresh();
      setModal({ type: "none" });
    } catch (e) {
      alert("فشل تغيير حالة الحساب: " + (e instanceof Error ? e.message : "خطأ غير معروف"));
    } finally {
      setSaving(false);
    }
  }

  void saving;

  const editingUser = modal.type === "edit" ? users.find((u) => u.id === modal.userId) : null;
  const disablingUser = modal.type === "disable" ? users.find((u) => u.id === modal.userId) : null;

  return (
    <div className="max-w-md mx-auto min-h-screen pb-10" dir="rtl">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <button onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#d0d7e8] text-[#1a1f3c] text-[11px] font-semibold shadow-sm hover:bg-gray-50 transition-colors">
            <Icon.Logout />
            <span>خروج</span>
          </button>
          <div className="text-right">
            <h1 className="text-[19px] font-extrabold text-[#1a1f3c]">قائمة المستفيدين</h1>
            <p className="text-[11px] text-[#5a6282] font-medium">مرحباً، {ADMIN_USERNAME}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "إجمالي المستفيدين", value: users.length, color: "#2952e3" },
            { label: "حسابات نشطة", value: users.filter((u) => u.status === "active").length, color: "#16a34a" },
            { label: "حسابات معطّلة", value: users.filter((u) => u.status === "disabled").length, color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-3 text-center border border-[#e2e8f0] shadow-sm">
              <p className="font-extrabold text-[22px] leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] font-semibold text-[#8892a4] mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section header */}
      <div className="px-4 flex items-center justify-between mb-4">
        <button onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-[12px] font-bold shadow-md transition-opacity active:opacity-90"
          style={{ background: "linear-gradient(135deg,#0f7a38,#22c55e)" }}>
          <Icon.Plus />
          <span>إضافة مستفيد</span>
        </button>
        <h2 className="text-[15px] font-bold text-[#1a1f3c]">المستفيدون</h2>
      </div>

      {/* Beneficiary Cards */}
      <div className="px-4 flex flex-col gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-3xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="h-1.5 w-full"
              style={{ background: user.status === "active" ? "linear-gradient(90deg,#2952e3,#7c3aed)" : "#d1d5db" }} />

            <div className="p-4">
              {/* Identity row — name is clickable */}
              <div className="flex items-start justify-between mb-4">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${user.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-500 border border-red-200"}`}>
                  {user.status === "active" ? "نشط" : "معطّل"}
                </span>
                <div className="text-right">
                  <button
                    onClick={() => onViewUser(user.id)}
                    className="text-[14px] font-bold text-[#2952e3] leading-snug hover:underline text-right"
                  >
                    {user.name}
                  </button>
                  <p className="text-[11px] text-[#8892a4] font-medium mt-0.5" dir="ltr" style={{ textAlign: "right" }}>
                    @{user.username}
                  </p>
                </div>
              </div>

              {/* Password */}
              <div className="mb-4 text-right">
                <label className="block text-[10px] font-bold text-[#8892a4] mb-1">كلمة المرور</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#f8f9fc] border border-[#e8eaf0]">
                  <button onClick={() => setShowPassId(showPassId === user.id ? null : user.id)}
                    className="text-[#8892a4] hover:text-[#5a6282]">
                    {showPassId === user.id ? <Icon.EyeOff /> : <Icon.Eye />}
                  </button>
                  <span className="text-[12px] font-semibold text-[#1a1f3c]" dir="ltr">
                    {showPassId === user.id ? user.password : "••••••••"}
                  </span>
                </div>
              </div>

              {/* Financial grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "أرباح الاشتراك", value: user.profits, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
                  { label: "مبلغ الاشتراك", value: user.subscription, color: "#2952e3", bg: "#eff6ff", border: "#bfdbfe" },
                  { label: "رسوم السحب", value: user.fees, color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
                ].map((d) => (
                  <div key={d.label} className="rounded-xl p-2.5 text-center border" style={{ background: d.bg, borderColor: d.border }}>
                    <p className="font-extrabold text-[13px] leading-none" style={{ color: d.color }}>{d.value}</p>
                    <p className="text-[8px] font-semibold mt-1 text-[#8892a4] leading-snug">{d.label}</p>
                  </div>
                ))}
              </div>

              {/* Bank info */}
              <div className="rounded-2xl p-3.5 text-right mb-4"
                style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed)" }}>
                <p className="text-white/60 text-[9px] font-medium mb-0.5">اسم صاحب الحساب</p>
                <p className="text-white font-bold text-[12px] leading-snug mb-2">{user.accountHolder}</p>
                <p className="text-white/60 text-[9px] font-medium mb-0.5">رقم الإيبان</p>
                <p className="text-white font-bold text-[11px]" dir="ltr" style={{ textAlign: "right", letterSpacing: "0.05em" }}>
                  {user.iban}
                </p>
              </div>

              {/* Login URL info */}
              {user.loginSlug && (
                <div className="rounded-2xl p-3.5 text-right mb-4"
                  style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
                  <p className="text-[10px] font-bold text-[#15803d] mb-1">عنوان صفحة تسجيل الدخول</p>
                  <p className="text-[12px] font-bold text-[#1a1f3c] mb-2 leading-snug">{user.loginTitle || "—"}</p>
                  <p className="text-[10px] font-bold text-[#15803d] mb-1">رابط تسجيل الدخول</p>
                  <p
                    className="text-[11px] font-semibold text-[#2952e3] break-all"
                    dir="ltr"
                    style={{ textAlign: "left" }}
                  >
                    {`${window.location.origin}${import.meta.env.BASE_URL}client/${user.loginSlug}`}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button onClick={() => setModal({ type: "edit", userId: user.id })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold transition-colors"
                  style={{ background: "#eff6ff", color: "#2952e3", border: "1.5px solid #bfdbfe" }}>
                  <Icon.Edit /><span>تعديل</span>
                </button>
                <button onClick={() => setModal({ type: "disable", userId: user.id })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold transition-colors"
                  style={{
                    background: user.status === "active" ? "#fef3c7" : "#dcfce7",
                    color: user.status === "active" ? "#d97706" : "#16a34a",
                    border: `1.5px solid ${user.status === "active" ? "#fde68a" : "#86efac"}`,
                  }}>
                  <Icon.Ban /><span>{user.status === "active" ? "تعطيل" : "تفعيل"}</span>
                </button>
                <button onClick={() => setModal({ type: "delete", userId: user.id })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold transition-colors"
                  style={{ background: "#fef2f2", color: "#ef4444", border: "1.5px solid #fecaca" }}>
                  <Icon.Trash /><span>حذف</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="text-center py-16 text-[#8892a4]">
            <p className="text-[13px] font-semibold">لا يوجد مستفيدون حتى الآن</p>
            <p className="text-[11px] mt-1">اضغط على "إضافة مستفيد" للبدء</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal.type === "create" && (
        <UserFormModal mode="create" initial={emptyUser} onSave={handleCreate} onClose={() => setModal({ type: "none" })} />
      )}
      {modal.type === "edit" && editingUser && (
        <UserFormModal
          mode="edit"
          initial={{
            username: editingUser.username,
            password: editingUser.password,
            name: editingUser.name,
            profits: editingUser.profits,
            subscription: editingUser.subscription,
            fees: editingUser.fees,
            accountHolder: editingUser.accountHolder,
            iban: editingUser.iban,
            phone: editingUser.phone,
            status: editingUser.status,
            loginTitle: editingUser.loginTitle ?? "",
            loginSlug: editingUser.loginSlug ?? "",
          }}
          onSave={handleEdit}
          onClose={() => setModal({ type: "none" })}
        />
      )}
      {modal.type === "delete" && (
        <ConfirmModal
          message="هل تريد حذف هذا المستفيد نهائياً؟"
          onConfirm={handleDelete}
          onCancel={() => setModal({ type: "none" })}
        />
      )}
      {modal.type === "disable" && disablingUser && (
        <ConfirmModal
          message={disablingUser.status === "active" ? "هل تريد تعطيل هذا الحساب؟" : "هل تريد تفعيل هذا الحساب؟"}
          onConfirm={handleToggleDisable}
          onCancel={() => setModal({ type: "none" })}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
function loadLocalUsers(): User[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as User[];
  } catch { /* ignore */ }
  return initialUsers;
}

export default function App() {
  const initialSlug = getClientSlugFromUrl();
  const [view, setView] = useState<View>(
    initialSlug ? { page: "client-login", slug: initialSlug } : { page: "login" }
  );
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const refreshUsers = useCallback(async () => {
    try {
      const data = await apiFetch<ApiUser[]>("/beneficiaries");
      const mapped = data.map(mapApiUser);
      setUsers(mapped);
      // also keep localStorage in sync as fallback
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped)); } catch { /* ignore */ }
    } catch {
      // API unavailable → fall back to localStorage
      setUsers(loadLocalUsers());
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => { void refreshUsers(); }, [refreshUsers]);

  const activeUser = view.page === "user" ? users.find((u) => u.id === view.userId) : null;

  if (loadingUsers && view.page !== "client-login") {
    return (
      <div dir="rtl" style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#1a1f3c 0%,#2952e3 50%,#7c3aed 100%)",
        fontFamily: "'Cairo', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
      }}>
        <div style={{
          width: 48, height: 48, border: "4px solid rgba(255,255,255,0.2)",
          borderTopColor: "white", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600 }}>
          جارٍ تحميل البيانات...
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#dce4f0 0%,#e8edf7 40%,#eaeef7 100%)",
      fontFamily: "'Cairo', sans-serif",
    }}>
      {view.page === "client-login" && (
        <ClientLoginPage
          slug={view.slug}
          onLogin={(v) => { void refreshUsers(); setView(v); }}
        />
      )}
      {view.page === "login" && (
        <LoginPage
          users={users}
          onLogin={(v) => setView(v)}
        />
      )}
      {view.page === "admin" && (
        <AdminDashboard
          users={users}
          onRefresh={refreshUsers}
          onLogout={() => setView({ page: "login" })}
          onViewUser={(userId) => setView({ page: "user", userId, fromAdmin: true })}
        />
      )}
      {view.page === "user" && activeUser && (
        <UserDashboard
          user={activeUser}
          onLogout={() => setView({ page: "login" })}
          onBack={view.fromAdmin ? () => setView({ page: "admin" }) : undefined}
        />
      )}
      {view.page === "user" && !activeUser && loadingUsers && (
        <div dir="rtl" style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg,#1a1f3c 0%,#2952e3 50%,#7c3aed 100%)",
          fontFamily: "'Cairo', sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
        }}>
          <div style={{
            width: 48, height: 48, border: "4px solid rgba(255,255,255,0.2)",
            borderTopColor: "white", borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}
