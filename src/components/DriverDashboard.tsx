import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);

  const driverInfo = useQuery(api.users.getDriverInfo);
  const availableRides = useQuery(api.rides.getAvailableRides);
  const currentRide = useQuery(api.rides.getCurrentRide);
  const userRides = useQuery(api.rides.getUserRides);

  const updateDriverStatus = useMutation(api.users.updateDriverStatus);
  const acceptRide = useMutation(api.rides.acceptRide);
  const updateRideStatus = useMutation(api.rides.updateRideStatus);

  const handleToggleStatus = async () => {
    if (!driverInfo?.verificationStatus || driverInfo.verificationStatus !== "verified") {
      toast.error("يجب توثيق حسابك أولاً قبل الاتصال بالإنترنت");
      return;
    }

    try {
      const newStatus = isOnline ? "offline" : "online";
      await updateDriverStatus({
        status: newStatus,
        location: {
          lat: 31.1656, // Default coordinates for Al-Santa
          lng: 30.9441,
        },
      });
      setIsOnline(!isOnline);
      toast.success(newStatus === "online" ? "أصبحت متاحاً الآن" : "أصبحت غير متاح");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء تحديث الحالة");
    }
  };

  const handleAcceptRide = async (rideId: any) => {
    try {
      await acceptRide({ rideId });
      toast.success("تم قبول الطلب بنجاح!");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء قبول الطلب");
    }
  };

  const handleUpdateRideStatus = async (status: string) => {
    if (!currentRide) return;

    try {
      await updateRideStatus({
        rideId: currentRide._id,
        status: status as any,
      });
      
      const statusMessages = {
        driver_arriving: "تم تأكيد وصولك للراكب",
        in_progress: "تم بدء الرحلة",
        completed: "تم إنهاء الرحلة بنجاح",
      };
      
      toast.success(statusMessages[status as keyof typeof statusMessages] || "تم تحديث حالة الرحلة");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء تحديث حالة الرحلة");
    }
  };

  if (!driverInfo) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Verification Status Check
  if (driverInfo.verificationStatus === "pending_verification") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-yellow-800 mb-2">
            مستنداتك قيد المراجعة
          </h2>
          <p className="text-yellow-700 mb-4">
            تم استلام مستنداتك وهي قيد المراجعة من قبل الإدارة. سيتم إشعارك فور الانتهاء من المراجعة.
          </p>
          
          <div className="bg-white rounded-lg p-4 mt-4">
            <h3 className="font-medium text-gray-800 mb-2">بياناتك المسجلة:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>الاسم: {driverInfo.profile?.name}</div>
              <div>رقم التوك توك: {driverInfo.carNumber}</div>
              <div>رقم الرخصة: {driverInfo.licenseNumber}</div>
              <div>المدينة: {driverInfo.city}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (driverInfo.verificationStatus === "rejected") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">
            تم رفض مستنداتك
          </h2>
          <p className="text-red-700 mb-4">
            للأسف، تم رفض مستنداتك. يرجى التواصل مع الإدارة لمعرفة السبب وإعادة التقديم.
          </p>
          
          {driverInfo.rejectionReason && (
            <div className="bg-white rounded-lg p-4 mt-4">
              <h3 className="font-medium text-gray-800 mb-2">سبب الرفض:</h3>
              <p className="text-sm text-red-600">{driverInfo.rejectionReason}</p>
            </div>
          )}
          
          <div className="mt-4">
            <a
              href="https://wa.me/201234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              تواصل عبر واتساب
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Driver Status Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">حالة السائق</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isOnline ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}>
            {isOnline ? "متاح" : "غير متاح"}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">معلومات السائق</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">رقم التوك توك:</span>
                <span className="mr-2 font-medium">{driverInfo.carNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">إجمالي الرحلات:</span>
                <span className="mr-2 font-medium">{driverInfo.totalRides}</span>
              </div>
              <div>
                <span className="text-gray-600">التقييم:</span>
                <span className="mr-2 font-medium">{driverInfo.rating}/5 ⭐</span>
              </div>
              <div>
                <span className="text-gray-600">المدينة:</span>
                <span className="mr-2 font-medium">{driverInfo.city}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleToggleStatus}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isOnline
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {isOnline ? "إيقاف الاتصال" : "الاتصال بالإنترنت"}
        </button>
      </div>

      {/* Current Ride */}
      {currentRide && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <h2 className="text-xl font-bold text-gray-800 mb-4">الرحلة الحالية</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">تفاصيل الراكب</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">الاسم:</span>
                  <span className="mr-2 font-medium">{(currentRide as any).passengerName}</span>
                </div>
                <div>
                  <span className="text-gray-600">الهاتف:</span>
                  <span className="mr-2 font-medium">{currentRide.passengerPhone}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">تفاصيل الرحلة</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">من:</span>
                  <span className="mr-2 font-medium">{currentRide.pickupLocation.address}</span>
                </div>
                <div>
                  <span className="text-gray-600">إلى:</span>
                  <span className="mr-2 font-medium">{currentRide.dropoffLocation.address}</span>
                </div>
                <div>
                  <span className="text-gray-600">السعر:</span>
                  <span className="mr-2 font-medium text-green-600">{currentRide.estimatedPrice} جنيه</span>
                </div>
              </div>
            </div>
          </div>

          {currentRide.notes && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">ملاحظات الراكب</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {currentRide.notes}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {currentRide.status === "accepted" && (
              <button
                onClick={() => handleUpdateRideStatus("driver_arriving")}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                وصلت للراكب
              </button>
            )}
            {currentRide.status === "driver_arriving" && (
              <button
                onClick={() => handleUpdateRideStatus("in_progress")}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                بدء الرحلة
              </button>
            )}
            {currentRide.status === "in_progress" && (
              <button
                onClick={() => handleUpdateRideStatus("completed")}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                إنهاء الرحلة
              </button>
            )}
          </div>
        </div>
      )}

      {/* Available Rides */}
      {!currentRide && isOnline && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">الرحلات المتاحة</h2>
          
          {availableRides && availableRides.length > 0 ? (
            <div className="space-y-4">
              {availableRides.map((ride) => (
                <div key={ride._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-800">{ride.passengerName}</h3>
                      <p className="text-sm text-gray-600">{ride.passengerPhone}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{ride.estimatedPrice} جنيه</div>
                      <div className="text-xs text-gray-500">{ride.distance} كم</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">من:</span>
                      <span className="mr-2">{ride.pickupLocation.address}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">إلى:</span>
                      <span className="mr-2">{ride.dropoffLocation.address}</span>
                    </div>
                  </div>

                  {ride.notes && (
                    <div className="mb-3">
                      <span className="text-gray-600 text-sm">ملاحظات:</span>
                      <p className="text-sm text-gray-700 mt-1">{ride.notes}</p>
                    </div>
                  )}

                  <button
                    onClick={() => handleAcceptRide(ride._id)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    قبول الطلب
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-gray-600">لا توجد رحلات متاحة حالياً</p>
              <p className="text-sm text-gray-500 mt-1">سيتم إشعارك عند توفر رحلات جديدة</p>
            </div>
          )}
        </div>
      )}

      {!isOnline && (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">📴</div>
          <p className="text-gray-600">أنت غير متصل حالياً</p>
          <p className="text-sm text-gray-500 mt-1">اضغط على "الاتصال بالإنترنت" لبدء استقبال الطلبات</p>
        </div>
      )}
    </div>
  );
}
