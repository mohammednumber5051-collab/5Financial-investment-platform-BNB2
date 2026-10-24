import { useState, useEffect } from "react";

export interface StaffUser {
  id: number;
  username: string;
  name: string;
  status: "active" | "suspended" | "disabled";
  maxBeneficiariesQuota: number;
  canEditBeneficiaries: boolean;
  canManagePhases: boolean;
  canAddBeneficiaries: boolean;
  plainPassword?: string;
  assignedCount?: number;
  assignedBeneficiaryIds?: number[];
  createdAt?: string;
  updatedAt?: string;
}

interface BeneficiaryOption {
  id: string;
  name: string;
  username: string;
  assignedStaffId?: number | null;
}

export function StaffManagement({
  beneficiaries,
  onRefreshBeneficiaries,
}: {
  beneficiaries: BeneficiaryOption[];
  onRefreshBeneficiaries: () => Promise<void>;
}) {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPassMap, setShowPassMap] = useState<Record<number, boolean>>({});
  const [modalMode, setModalMode] = useState<"none" | "create" | "edit">("none");
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    maxBeneficiariesQuota: 5,
    canEditBeneficiaries: true,
    canManagePhases: false,
    canAddBeneficiaries: true,
    assignedBeneficiaryIds: [] as number[],
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function loadStaff() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff");
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStaff();
  }, []);

  function togglePass(id: number) {
    setShowPassMap((p) => ({ ...p, [id]: !p[id] }));
  }

  function openCreate() {
    setErrorMsg("");
    setFormData({
      username: "",
      password: "",
      name: "",
      maxBeneficiariesQuota: 5,
      canEditBeneficiaries: true,
      canManagePhases: false,
      canAddBeneficiaries: true,
      assignedBeneficiaryIds: [],
    });
    setModalMode("create");
  }

  function openEdit(staff: StaffUser) {
    setErrorMsg("");
    setSelectedStaff(staff);
    const currentlyAssigned = beneficiaries
      .filter((b) => Number(b.assignedStaffId) === staff.id)
      .map((b) => Number(b.id));

    setFormData({
      username: staff.username,
      password: staff.plainPassword || "",
      name: staff.name,
      maxBeneficiariesQuota: staff.maxBeneficiariesQuota,
      canEditBeneficiaries: staff.canEditBeneficiaries,
      canManagePhases: staff.canManagePhases,
      canAddBeneficiaries: staff.canAddBeneficiaries,
      assignedBeneficiaryIds: currentlyAssigned,
    });
    setModalMode("edit");
  }

  async function handleSave() {
    setErrorMsg("");
    if (!formData.name.trim() || !formData.username.trim()) {
      setErrorMsg("يرجى إدخال الاسم واسم المستخدم");
      return;
    }
    if (modalMode === "create" && !formData.password.trim()) {
      setErrorMsg("يرجى إدخال كلمة المرور للمشرف");
      return;
    }

    setSaving(true);
    try {
      if (modalMode === "create") {
        const res = await fetch("/api/admin/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "فشل إنشاء المشرف");
        }
      } else if (modalMode === "edit" && selectedStaff) {
        const res = await fetch(`/api/admin/staff/${selectedStaff.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "فشل تحديث بيانات المشرف");
        }
      }

      await loadStaff();
      await onRefreshBeneficiaries();
      setModalMode("none");
    } catch (e: any) {
      setErrorMsg(e.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(staff: StaffUser) {
    const nextStatus = staff.status === "active" ? "suspended" : "active";
    const confirmMsg =
      nextStatus === "suspended"
        ? `هل أنت متأكد من تجميد حساب المشرف (${staff.name})؟ لن يتمكن من تسجيل الدخول.`
        : `هل أنت متأكد من إعادة تفعيل حساب المشرف (${staff.name})؟`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/staff/${staff.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await loadStaff();
      }
    } catch (e) {
      alert("فشل تغيير الحالة");
    }
  }

  async function handleDelete(staff: StaffUser) {
    if (!window.confirm(`هل أنت متأكد من حذف المشرف (${staff.name})؟ سيتم إلغاء ارتباط المستفيدين التابعين له.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/staff/${staff.id}`, { method: "DELETE" });
      if (res.ok) {
        await loadStaff();
        await onRefreshBeneficiaries();
      }
    } catch (e) {
      alert("فشل حذف المشرف");
    }
  }

  function toggleBeneficiaryAssignment(bId: number) {
    setFormData((prev) => {
      const exists = prev.assignedBeneficiaryIds.includes(bId);
      return {
        ...prev,
        assignedBeneficiaryIds: exists
          ? prev.assignedBeneficiaryIds.filter((id) => id !== bId)
          : [...prev.assignedBeneficiaryIds, bId],
      };
    });
  }

  const activeStaffCount = staffList.filter((s) => s.status === "active").length;
  const totalAssigned = staffList.reduce((acc, s) => acc + (s.assignedCount || 0), 0);

  return (
    <div className="flex flex-col gap-5 px-4 mb-8" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl p-3 text-center border border-[#e2e8f0] shadow-sm">
          <p className="font-extrabold text-[20px] text-[#2952e3] leading-none tabular-nums">{staffList.length}</p>
          <p className="text-[10px] font-semibold text-[#8892a4] mt-1">إجمالي المشرفين</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center border border-[#e2e8f0] shadow-sm">
          <p className="font-extrabold text-[20px] text-[#16a34a] leading-none tabular-nums">{activeStaffCount}</p>
          <p className="text-[10px] font-semibold text-[#8892a4] mt-1">مشرفون نشطون</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center border border-[#e2e8f0] shadow-sm">
          <p className="font-extrabold text-[20px] text-[#7c3aed] leading-none tabular-nums">{totalAssigned}</p>
          <p className="text-[10px] font-semibold text-[#8892a4] mt-1">مستفيدون مسندون</p>
        </div>
      </div>

      {/* Header action */}
      <div className="flex items-center justify-between">
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-[12px] font-bold shadow-md transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg,#2952e3,#7c3aed)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>إضافة مشرف جديد</span>
        </button>
        <div className="text-right">
          <h2 className="text-[16px] font-bold text-[#1a1f3c]">فريق المشرفين</h2>
          <p className="text-[11px] text-[#8892a4]">إدارة الموظفين وتعيين الصلاحيات والكوتة</p>
        </div>
      </div>

      {/* Staff Cards List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-[#8892a4] border border-[#e2e8f0]">
          <p className="text-[13px] font-semibold">جارٍ تحميل المشرفين...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-[#8892a4] border border-[#e2e8f0]">
          <div className="text-[32px] mb-2">👥</div>
          <p className="text-[14px] font-bold text-[#1a1f3c] mb-1">لا يوجد مشرفون حتى الآن</p>
          <p className="text-[12px] text-[#8892a4] mb-4">أضف مشرفك الأول وحدد حصته وصلاحيات إدارته للمستفيدين</p>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-[#2952e3] text-white rounded-xl text-[12px] font-bold"
          >
            إضافة مشرف
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {staffList.map((staff) => {
            const isSuspended = staff.status === "suspended" || staff.status === "disabled";
            const assignedCount = staff.assignedCount || 0;
            const quota = staff.maxBeneficiariesQuota;
            const quotaPct = Math.min(100, Math.round((assignedCount / (quota || 1)) * 100));
            const isPassVisible = Boolean(showPassMap[staff.id]);

            return (
              <div
                key={staff.id}
                className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-sm transition-all"
                style={{ opacity: isSuspended ? 0.75 : 1 }}
              >
                {/* Top: Name & Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                        !isSuspended
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {!isSuspended ? "نشط" : "مجمّد"}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(staff)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                        !isSuspended
                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                      title={!isSuspended ? "تجميد الحساب" : "تفعيل الحساب"}
                    >
                      {!isSuspended ? "تجميد" : "تفعيل"}
                    </button>
                  </div>
                  <div className="text-right">
                    <h3 className="text-[14px] font-bold text-[#1a1f3c] leading-snug">{staff.name}</h3>
                    <p className="text-[11px] text-[#8892a4] font-medium" dir="ltr" style={{ textAlign: "right" }}>
                      @{staff.username}
                    </p>
                  </div>
                </div>

                {/* Password inspection row (Admin requirement #7) */}
                <div className="mb-3 bg-[#f8f9fc] rounded-xl px-3 py-2 border border-[#e8eaf0] flex items-center justify-between text-right">
                  <button
                    onClick={() => togglePass(staff.id)}
                    className="text-[#8892a4] hover:text-[#5a6282] flex items-center gap-1 text-[11px]"
                  >
                    <span>{isPassVisible ? "إخفاء" : "إظهار"}</span>
                    {isPassVisible ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#8892a4]">كلمة المرور:</span>
                    <span className="text-[12px] font-mono font-semibold text-[#1a1f3c]" dir="ltr">
                      {isPassVisible ? staff.plainPassword || "—" : "••••••••"}
                    </span>
                  </div>
                </div>

                {/* Quota Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#5a6282] mb-1">
                    <span>
                      الحصة: <strong className="text-[#1a1f3c]">{assignedCount}</strong> من{" "}
                      <strong className="text-[#1a1f3c]">{quota}</strong> مستفيد
                    </span>
                    <span className="text-[#8892a4] tabular-nums">{quotaPct}%</span>
                  </div>
                  <div className="w-full bg-[#f1f5f9] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        quotaPct >= 100 ? "bg-amber-500" : "bg-[#2952e3]"
                      }`}
                      style={{ width: `${quotaPct}%` }}
                    />
                  </div>
                </div>

                {/* Permissions Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      staff.canEditBeneficiaries ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500 line-through"
                    }`}
                  >
                    ✏️ تعديل المستفيد
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      staff.canManagePhases ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-500 line-through"
                    }`}
                  >
                    🔄 إدارة المراحل
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      staff.canAddBeneficiaries ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500 line-through"
                    }`}
                  >
                    ➕ إضافة مستفيدين
                  </span>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#f1f5f9]">
                  <button
                    onClick={() => openEdit(staff)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-[#f8f9fc] border border-[#e2e8f0] text-[#1a1f3c] text-[11px] font-bold hover:bg-[#eef2f9] transition-colors"
                  >
                    تعديل الصلاحيات والمستفيدين
                  </button>
                  <button
                    onClick={() => handleDelete(staff)}
                    className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                    title="حذف المشرف"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {modalMode !== "none" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(10,15,40,0.6)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && setModalMode("none")}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            dir="rtl"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#eef0f6] bg-[#f8f9fc]">
              <button
                onClick={() => setModalMode("none")}
                className="w-8 h-8 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#5a6282]"
              >
                ✕
              </button>
              <h3 className="text-[15px] font-bold text-[#1a1f3c]">
                {modalMode === "create" ? "إضافة مشرف جديد" : `تعديل بيانات: ${selectedStaff?.name}`}
              </h3>
              <div className="w-8" />
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-3.5">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-3.5 py-2 text-[12px] font-bold text-right">
                  {errorMsg}
                </div>
              )}

              {/* Name */}
              <div className="text-right">
                <label className="block text-[11px] font-bold text-[#5a6282] mb-1">اسم المشرف الكامل</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: عبدالله السبيعي"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9fc] text-[12px] font-semibold text-[#1a1f3c] outline-none focus:border-[#2952e3]"
                />
              </div>

              {/* Username */}
              <div className="text-right">
                <label className="block text-[11px] font-bold text-[#5a6282] mb-1">اسم المستخدم (لتسجيل الدخول)</label>
                <input
                  type="text"
                  dir="ltr"
                  value={formData.username}
                  disabled={modalMode === "edit"}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="agent1"
                  className={`w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-[12px] font-semibold text-[#1a1f3c] outline-none ${
                    modalMode === "edit" ? "bg-[#eef2f7] cursor-not-allowed" : "bg-[#f8f9fc] focus:border-[#2952e3]"
                  }`}
                  style={{ textAlign: "left" }}
                />
              </div>

              {/* Password */}
              <div className="text-right">
                <label className="block text-[11px] font-bold text-[#5a6282] mb-1">
                  كلمة المرور {modalMode === "edit" && "(اتركها فارغة إذا لم ترغب بتغييرها)"}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="أدخل كلمة مرور قوية"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9fc] text-[12px] font-semibold text-[#1a1f3c] outline-none focus:border-[#2952e3]"
                  style={{ textAlign: "left" }}
                />
              </div>

              {/* Quota */}
              <div className="text-right">
                <label className="block text-[11px] font-bold text-[#5a6282] mb-1">
                  كوتة المستفيدين (الحد الأقصى للإضافة)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.maxBeneficiariesQuota}
                  onChange={(e) => setFormData({ ...formData, maxBeneficiariesQuota: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9fc] text-[12px] font-semibold text-[#1a1f3c] outline-none focus:border-[#2952e3]"
                />
                <p className="text-[10px] text-[#8892a4] mt-0.5">
                  العدد الأقصى من المستفيدين الجدد الذين يمكن لهذا المشرف إضافتهم
                </p>
              </div>

              {/* Permissions Checkboxes */}
              <div className="bg-[#f8f9fc] border border-[#e2e8f0] rounded-2xl p-3.5 flex flex-col gap-2.5 text-right">
                <p className="text-[11px] font-bold text-[#1a1f3c] mb-1">صلاحيات المشرف:</p>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canEditBeneficiaries}
                    onChange={(e) => setFormData({ ...formData, canEditBeneficiaries: e.target.checked })}
                    className="w-4 h-4 text-[#2952e3] rounded"
                  />
                  <div>
                    <span className="text-[12px] font-bold text-[#1a1f3c]">تعديل بيانات المستفيد</span>
                    <p className="text-[10px] text-[#8892a4]">
                      (الحقول الحساسة: الاسم، اسم صاحب الحساب، اليوزرنيم، الآيبان، والرابط تبقى مقفلة دائماً)
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canManagePhases}
                    onChange={(e) => setFormData({ ...formData, canManagePhases: e.target.checked })}
                    className="w-4 h-4 text-[#2952e3] rounded"
                  />
                  <div>
                    <span className="text-[12px] font-bold text-[#1a1f3c]">إدارة وتحكم في البطاقات والمراحل</span>
                    <p className="text-[10px] text-[#8892a4]">تفعيل وإخفاء المراحل وسداد الرسوم لمستفيديه</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canAddBeneficiaries}
                    onChange={(e) => setFormData({ ...formData, canAddBeneficiaries: e.target.checked })}
                    className="w-4 h-4 text-[#2952e3] rounded"
                  />
                  <div>
                    <span className="text-[12px] font-bold text-[#1a1f3c]">إضافة مستفيدين جدد</span>
                    <p className="text-[10px] text-[#8892a4]">وفق الكوتة المحددة أعلاه</p>
                  </div>
                </label>
              </div>

              {/* Assign Beneficiaries Multi-select */}
              <div className="text-right">
                <label className="block text-[11px] font-bold text-[#5a6282] mb-1.5">
                  ربط مستفيدين حاليين بالمشرف ({formData.assignedBeneficiaryIds.length} مستفيد محدد):
                </label>
                <div className="max-h-40 overflow-y-auto border border-[#e2e8f0] rounded-xl p-2 bg-[#f8f9fc] flex flex-col gap-1.5">
                  {beneficiaries.map((b) => {
                    const isChecked = formData.assignedBeneficiaryIds.includes(Number(b.id));
                    const isAssignedOther =
                      b.assignedStaffId &&
                      selectedStaff &&
                      Number(b.assignedStaffId) !== selectedStaff.id;

                    return (
                      <label
                        key={b.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-[11px] transition-colors ${
                          isChecked ? "bg-blue-50 border border-blue-200" : "bg-white hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleBeneficiaryAssignment(Number(b.id))}
                          className="w-4 h-4 text-[#2952e3] rounded"
                        />
                        <div className="text-right">
                          <span className="font-bold text-[#1a1f3c]">{b.name}</span>
                          <span className="text-[#8892a4] mr-2">(@{b.username})</span>
                          {isAssignedOther && (
                            <span className="text-[9px] text-amber-600 mr-2">(مسند لمشرف آخر)</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-2.5 p-4 border-t border-[#eef0f6] bg-[#f8f9fc]">
              <button
                onClick={() => setModalMode("none")}
                className="flex-1 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-[#5a6282] text-[12px] font-bold hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#2952e3] text-white text-[12px] font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "جارٍ الحفظ..." : modalMode === "create" ? "إنشاء المشرف" : "حفظ التعديلات"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
