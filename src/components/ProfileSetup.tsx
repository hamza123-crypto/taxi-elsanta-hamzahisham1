import React, { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function ProfileSetup() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"passenger" | "driver">("passenger");
  const [city, setCity] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [driverCode, setDriverCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // File upload states
  const [criminalRecord, setCriminalRecord] = useState<File | null>(null);
  const [idCard, setIdCard] = useState<File | null>(null);
  const [license, setLicense] = useState<File | null>(null);

  const criminalRecordRef = useRef<HTMLInputElement>(null);
  const idCardRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);

  const cities = useQuery(api.users.getCities);
  const createProfile = useMutation(api.users.createProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);

  const uploadFile = async (file: File) => {
    const uploadUrl = await generateUploadUrl();
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();
    return storageId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      toast.error("الاسم ورقم الهاتف مطلوبان");
      return;
    }

    if (role === "driver") {
      if (!carNumber.trim() || !licenseNumber.trim() || !city || !driverCode.trim()) {
        toast.error("جميع بيانات السائق مطلوبة");
        return;
      }

      if (!criminalRecord || !idCard || !license) {
        toast.error("جميع المستندات مطلوبة للسائقين");
        return;
      }
    }

    setIsLoading(true);

    try {
      let criminalRecordId, idCardImageId, licenseImageId;

      if (role === "driver") {
        toast.info("جاري رفع المستندات...");
        criminalRecordId = await uploadFile(criminalRecord!);
        idCardImageId = await uploadFile(idCard!);
        licenseImageId = await uploadFile(license!);
      }

      await createProfile({
        name,
        phone,
        role,
        city: role === "driver" ? city : undefined,
        carNumber: role === "driver" ? carNumber : undefined,
        licenseNumber: role === "driver" ? licenseNumber : undefined,
        criminalRecordId,
        idCardImageId,
        licenseImageId,
        adminCode: adminCode || undefined,
        driverCode: role === "driver" ? driverCode : undefined,
      });

      toast.success(
        role === "driver" 
          ? "تم إنشاء الملف الشخصي بنجاح! سيتم مراجعة مستنداتك قريباً"
          : "تم إنشاء الملف الشخصي بنجاح!"
      );
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء إنشاء الملف الشخصي");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        إعداد الملف الشخصي
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الاسم الكامل *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل اسمك الكامل"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رقم الهاتف *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="01xxxxxxxxx"
              required
            />
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            اختر دورك في المنصة *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole("passenger")}
              className={`p-4 rounded-lg border-2 transition-all ${
                role === "passenger"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🚶‍♂️</div>
                <div className="font-medium">راكب</div>
                <div className="text-sm text-gray-600">أريد حجز رحلات</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("driver")}
              className={`p-4 rounded-lg border-2 transition-all ${
                role === "driver"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🛺</div>
                <div className="font-medium">سائق</div>
                <div className="text-sm text-gray-600">أريد تقديم خدمة النقل</div>
              </div>
            </button>
          </div>
        </div>

        {/* Admin Code (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            كود المدير (اختياري)
          </label>
          <input
            type="password"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="أدخل كود المدير إذا كان لديك"
          />
          <p className="text-xs text-gray-500 mt-1">
            إذا كان لديك كود مدير، ستحصل على صلاحيات إدارية
          </p>
        </div>

        {/* Driver-specific fields */}
        {role === "driver" && (
          <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-3">بيانات السائق</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كود السائق *
              </label>
              <input
                type="text"
                value={driverCode}
                onChange={(e) => setDriverCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="أدخل كود السائق"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                يجب الحصول على هذا الكود من إدارة المنصة
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المدينة *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">اختر المدينة</option>
                {cities?.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم التوك توك *
              </label>
              <input
                type="text"
                value={carNumber}
                onChange={(e) => setCarNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="أدخل رقم التوك توك"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم رخصة القيادة *
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="أدخل رقم رخصة القيادة"
                required
              />
            </div>

            {/* Document uploads */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">المستندات المطلوبة *</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  فيش وتشبيه
                </label>
                <input
                  type="file"
                  ref={criminalRecordRef}
                  onChange={(e) => setCriminalRecord(e.target.files?.[0] || null)}
                  accept="image/*,.pdf"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  صورة البطاقة الشخصية
                </label>
                <input
                  type="file"
                  ref={idCardRef}
                  onChange={(e) => setIdCard(e.target.files?.[0] || null)}
                  accept="image/*"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  صورة رخصة القيادة
                </label>
                <input
                  type="file"
                  ref={licenseRef}
                  onChange={(e) => setLicense(e.target.files?.[0] || null)}
                  accept="image/*"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? "جاري الإنشاء..." : "إنشاء الملف الشخصي"}
        </button>
      </form>
    </div>
  );
}
