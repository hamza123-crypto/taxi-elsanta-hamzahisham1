import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const stats = useQuery(api.admin.getDashboardStats);
  const allUsers = useQuery(api.admin.getAllUsers);
  const allRides = useQuery(api.admin.getAllRides);
  const pendingVerifications = useQuery(api.admin.getPendingVerifications);
  const allDrivers = useQuery(api.admin.getAllDrivers);

  const toggleUserStatus = useMutation(api.admin.toggleUserStatus);
  const initializeSettings = useMutation(api.admin.initializeSettings);
  const verifyDriver = useMutation(api.admin.verifyDriver);
  const deleteUser = useMutation(api.admin.deleteUser);
  const deleteRide = useMutation(api.rides.deleteRide);

  const handleToggleUser = async (userId: any) => {
    try {
      await toggleUserStatus({ userId });
      toast.success("تم تحديث حالة المستخدم");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    }
  };

  const handleDeleteUser = async (userId: any) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.")) {
      return;
    }

    try {
      await deleteUser({ userId });
      toast.success("تم حذف المستخدم بنجاح");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الحذف");
    }
  };

  const handleDeleteRide = async (rideId: any) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرحلة؟")) {
      return;
    }

    try {
      await deleteRide({ rideId });
      toast.success("تم حذف الرحلة بنجاح");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الحذف");
    }
  };

  const handleInitializeSettings = async () => {
    try {
      await initializeSettings();
      toast.success("تم تهيئة الإعدادات بنجاح");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    }
  };

  const handleVerifyDriver = async (driverId: any, action: "approve" | "reject") => {
    let rejectionReason = "";
    if (action === "reject") {
      rejectionReason = prompt("أدخل سبب الرفض:") || "";
      if (!rejectionReason) return;
    }

    try {
      await verifyDriver({
        driverId,
        action,
        rejectionReason: rejectionReason || undefined,
      });
      toast.success(action === "approve" ? "تم قبول السائق" : "تم رفض السائق");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      searching: { color: "bg-yellow-100 text-yellow-800", text: "جاري البحث" },
      accepted: { color: "bg-blue-100 text-blue-800", text: "مقبولة" },
      driver_arriving: { color: "bg-purple-100 text-purple-800", text: "السائق قادم" },
      in_progress: { color: "bg-green-100 text-green-800", text: "جارية" },
      completed: { color: "bg-gray-100 text-gray-800", text: "مكتملة" },
      cancelled: { color: "bg-red-100 text-red-800", text: "ملغية" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: "bg-gray-100 text-gray-800", text: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-1">
        <div className="flex space-x-1 space-x-reverse">
          {[
            { id: "overview", label: "نظرة عامة", icon: "📊" },
            { id: "verifications", label: "طلبات التوثيق", icon: "⏳" },
            { id: "users", label: "المستخدمين", icon: "👥" },
            { id: "rides", label: "الرحلات", icon: "🛺" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && stats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">إجمالي المستخدمين</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="text-4xl opacity-80">👥</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">السائقين الموثقين</p>
                  <p className="text-3xl font-bold">{stats.verifiedDrivers}</p>
                </div>
                <div className="text-4xl opacity-80">✅</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">طلبات التوثيق</p>
                  <p className="text-3xl font-bold">{stats.pendingVerifications}</p>
                </div>
                <div className="text-4xl opacity-80">⏳</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">إجمالي الإيرادات</p>
                  <p className="text-3xl font-bold">{stats.totalRevenue} ج</p>
                </div>
                <div className="text-4xl opacity-80">💰</div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">إحصائيات الرحلات</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">إجمالي الرحلات</span>
                  <span className="font-medium">{stats.totalRides}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الرحلات المكتملة</span>
                  <span className="font-medium text-green-600">{stats.completedRides}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الرحلات النشطة</span>
                  <span className="font-medium text-blue-600">{stats.activeRides}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">إحصائيات السائقين</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">إجمالي السائقين</span>
                  <span className="font-medium">{stats.totalDrivers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">السائقين المتصلين</span>
                  <span className="font-medium text-green-600">{stats.onlineDrivers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الركاب</span>
                  <span className="font-medium">{stats.totalPassengers}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">إجراءات سريعة</h3>
              <div className="space-y-3">
                <button
                  onClick={handleInitializeSettings}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  تهيئة إعدادات النظام
                </button>
                <button
                  onClick={() => setActiveTab("verifications")}
                  className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                >
                  مراجعة طلبات التوثيق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verifications Tab */}
      {activeTab === "verifications" && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">طلبات التوثيق المعلقة</h2>
          
          {pendingVerifications && pendingVerifications.length > 0 ? (
            <div className="space-y-6">
              {pendingVerifications.map((driver) => (
                <div key={driver._id} className="border border-gray-200 rounded-lg p-6">
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-3">{driver.profile?.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex">
                          <span className="text-gray-600 w-20">الهاتف:</span>
                          <span className="font-medium">{driver.profile?.phone}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-600 w-20">التوك توك:</span>
                          <span className="font-medium">{driver.carNumber}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-600 w-20">الرخصة:</span>
                          <span className="font-medium">{driver.licenseNumber}</span>
                        </div>
                        <div className="flex">
                          <span className="text-gray-600 w-20">المدينة:</span>
                          <span className="font-medium">{driver.city}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">المستندات المرفقة:</h4>
                      <div className="space-y-2">
                        {driver.documentUrls.criminalRecordUrl && (
                          <a
                            href={driver.documentUrls.criminalRecordUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 space-x-reverse text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <span>📄</span>
                            <span>فيش وتشبيه</span>
                          </a>
                        )}
                        {driver.documentUrls.idCardUrl && (
                          <a
                            href={driver.documentUrls.idCardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 space-x-reverse text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <span>🆔</span>
                            <span>صورة البطاقة الشخصية</span>
                          </a>
                        )}
                        {driver.documentUrls.licenseUrl && (
                          <a
                            href={driver.documentUrls.licenseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 space-x-reverse text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <span>🚗</span>
                            <span>صورة رخصة القيادة</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVerifyDriver(driver._id, "approve")}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      ✅ قبول وتوثيق
                    </button>
                    <button
                      onClick={() => handleVerifyDriver(driver._id, "reject")}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      ❌ رفض الطلب
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">لا توجد طلبات توثيق معلقة</h3>
              <p className="text-gray-600">جميع طلبات التوثيق تم مراجعتها</p>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && allUsers && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">إدارة المستخدمين</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الدور
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.phone}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "admin" ? "bg-purple-100 text-purple-800" :
                        user.role === "driver" ? "bg-green-100 text-green-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {user.role === "admin" ? "مدير" : user.role === "driver" ? "سائق" : "راكب"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {user.isActive ? "نشط" : "معطل"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleToggleUser(user.userId)}
                        className={`px-3 py-1 rounded text-xs ${
                          user.isActive 
                            ? "bg-red-100 text-red-800 hover:bg-red-200" 
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        }`}
                      >
                        {user.isActive ? "تعطيل" : "تفعيل"}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.userId)}
                        className="px-3 py-1 rounded text-xs bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rides Tab */}
      {activeTab === "rides" && allRides && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">إدارة الرحلات</h2>
          
          <div className="space-y-4">
            {allRides.map((ride) => (
              <div key={ride._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-2 space-x-reverse mb-2">
                      <span className="font-medium">{ride.passengerName}</span>
                      <span className="text-gray-500">→</span>
                      <span className="font-medium">{ride.driverName}</span>
                      {getStatusBadge(ride.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>من: {ride.pickupLocation.address}</div>
                      <div>إلى: {ride.dropoffLocation.address}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {ride.finalPrice || ride.estimatedPrice} جنيه
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(ride._creationTime).toLocaleDateString("ar-EG")}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDeleteRide(ride._id)}
                    className="px-3 py-1 rounded text-xs bg-red-100 text-red-800 hover:bg-red-200"
                  >
                    حذف الرحلة
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
