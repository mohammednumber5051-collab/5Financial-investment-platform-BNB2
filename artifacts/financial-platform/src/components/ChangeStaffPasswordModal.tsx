import { useState } from "react";

export function ChangeStaffPasswordModal({
  staffId,
  onClose,
  onSuccess,
}: {
  staffId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("جميع الحقول مطلوبة");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("كلمة المرور الجديدة غير متطابقة");
      return;
    }
    if (newPassword.length < 4) {
      setError("كلمة المرور يجب أن تكون 4 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/staff/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل تغيير كلمة المرور");
      }
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(10,15,40,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
        dir="rtl"
        style={{ fontFamily: "'Cairo', sans-serif" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eef0f6] bg-[#f8f9fc]">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#5a6282]"
          >
            ✕
          </button>
          <h3 className="text-[15px] font-bold text-[#1a1f3c]">تغيير كلمة المرور الخاصة بك</h3>
          <div className="w-8" />
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5 text-right">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-3.5 py-2 text-[12px] font-bold">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3.5 py-2 text-[12px] font-bold">
              تم تحديث كلمة المرور بنجاح!
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#5a6282] mb-1">كلمة المرور الحالية</label>
            <input
              type="password"
              dir="ltr"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9fc] text-[12px] font-semibold text-[#1a1f3c] outline-none focus:border-[#2952e3]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#5a6282] mb-1">كلمة المرور الجديدة</label>
            <input
              type="password"
              dir="ltr"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9fc] text-[12px] font-semibold text-[#1a1f3c] outline-none focus:border-[#2952e3]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#5a6282] mb-1">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              dir="ltr"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9fc] text-[12px] font-semibold text-[#1a1f3c] outline-none focus:border-[#2952e3]"
            />
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-[#5a6282] text-[12px] font-bold hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 py-2.5 rounded-xl bg-[#2952e3] text-white text-[12px] font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "جارٍ الحفظ..." : "حفظ التغيير"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
