import React from "react";
import PassengerDashboard from "./PassengerDashboard";
import DriverDashboard from "./DriverDashboard";
import AdminDashboard from "./AdminDashboard";

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  if (!user?.profile) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { role } = user.profile;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            مرحباً، {user.profile.name}
          </h1>
          <p className="text-gray-600 mt-1">
            {role === "passenger" && "يمكنك الآن حجز رحلاتك بسهولة"}
            {role === "driver" && "إدارة رحلاتك وحالة الاتصال"}
            {role === "admin" && "لوحة تحكم المسؤول"}
          </p>
        </div>

        {role === "passenger" && <PassengerDashboard />}
        {role === "driver" && <DriverDashboard />}
        {role === "admin" && <AdminDashboard />}
      </div>
    </div>
  );
}
