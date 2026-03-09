import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function PassengerDashboard() {
  const [showBooking, setShowBooking] = useState(false);
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [distance, setDistance] = useState(5);
  const [notes, setNotes] = useState("");

  const currentRide = useQuery(api.rides.getCurrentRide);
  const userRides = useQuery(api.rides.getUserRides);
  const createRide = useMutation(api.rides.createRide);
  const updateRideStatus = useMutation(api.rides.updateRideStatus);

  const handleCreateRide = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      toast.error("يجب إدخال عنوان الانطلاق والوصول");
      return;
    }

    try {
      await createRide({
        pickupLocation: {
          lat: 31.1656, // Default coordinates for Al-Santa
          lng: 30.9441,
          address: pickupAddress,
        },
        dropoffLocation: {
          lat: 31.1656,
          lng: 30.9441,
          address: dropoffAddress,
        },
        distance,
        notes: notes || undefined,
      });

      toast.success("تم طلب الرحلة بنجاح! جاري البحث عن سائق...");
      setShowBooking(false);
      setPickupAddress("");
      setDropoffAddress("");
      setDistance(5);
      setNotes("");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء طلب الرحلة");
    }
  };

  const handleCancelRide = async () => {
    if (!currentRide) return;

    try {
      await updateRideStatus({
        rideId: currentRide._id,
        status: "cancelled",
      });
      toast.success("تم إلغاء الطلب بنجاح");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء إلغاء الطلب");
    }
  };

  const basePrice = 5;
  const pricePerKm = 3;
  const estimatedPrice = basePrice + (distance * pricePerKm);

  const getStatusText = (status: string) => {
    switch (status) {
      case "searching": return "جاري البحث عن سائق";
      case "accepted": return "تم قبول الطلب";
      case "driver_arriving": return "السائق في الطريق إليك";
      case "in_progress": return "الرحلة جارية";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "searching": return "🔍";
      case "accepted": return "✅";
      case "driver_arriving": return "🚗";
      case "in_progress": return "🛣️";
      default: return "📍";
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Ride */}
      {currentRide && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">الرحلة الحالية</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-2xl">{getStatusIcon(currentRide.status)}</span>
              <span className="text-sm font-medium text-blue-600">
                {getStatusText(currentRide.status)}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
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
                  <span className="text-gray-600">السعر المتوقع:</span>
                  <span className="mr-2 font-medium text-green-600">{currentRide.estimatedPrice} جنيه</span>
                </div>
              </div>
            </div>

            {currentRide.status !== "searching" && (currentRide as any).driverName && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">بيانات السائق</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">الاسم:</span>
                    <span className="mr-2 font-medium">{(currentRide as any).driverName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">رقم التوك توك:</span>
                    <span className="mr-2 font-medium">{(currentRide as any).driverCarNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">الهاتف:</span>
                    <span className="mr-2 font-medium">{(currentRide as any).driverPhone}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {currentRide.status === "searching" && (
            <button
              onClick={handleCancelRide}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              إلغاء الطلب
            </button>
          )}
        </div>
      )}

      {/* Book New Ride */}
      {!currentRide && !showBooking && (
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-xl p-8 text-white">
          <div className="text-center">
            <div className="text-6xl mb-4">🛺</div>
            <h2 className="text-3xl font-bold mb-2">توك توك السنطة</h2>
            <p className="text-blue-100 mb-6">
              خدمة نقل سريعة وآمنة في مدينة السنطة
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div>
                <div className="text-2xl font-bold">5 جنيه</div>
                <div className="text-sm text-blue-100">سعر البداية</div>
              </div>
              <div>
                <div className="text-2xl font-bold">3 جنيه</div>
                <div className="text-sm text-blue-100">للكيلومتر</div>
              </div>
              <div>
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-sm text-blue-100">خدمة مستمرة</div>
              </div>
            </div>
            <button
              onClick={() => setShowBooking(true)}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-lg"
            >
              احجز الآن
            </button>
          </div>
        </div>
      )}

      {/* Booking Form */}
      {!currentRide && showBooking && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">تفاصيل الرحلة</h2>
            <button
              onClick={() => setShowBooking(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreateRide} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان الانطلاق *
              </label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل عنوان الانطلاق"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان الوصول *
              </label>
              <input
                type="text"
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل عنوان الوصول"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المسافة التقديرية: {distance} كم
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 كم</span>
                <span>20 كم</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات (اختياري)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="أي ملاحظات إضافية للسائق"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">السعر المتوقع:</span>
                <span className="text-2xl font-bold text-green-600">{estimatedPrice} جنيه</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {basePrice} جنيه (سعر البداية) + {distance} × {pricePerKm} جنيه (للكيلومتر)
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              تأكيد الطلب
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
