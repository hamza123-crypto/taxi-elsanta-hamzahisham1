import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function isAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("غير مصرح لك بالوصول");
  }

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
    .unique();

  if (!profile || profile.role !== "admin") {
    throw new Error("يتطلب صلاحيات المسؤول");
  }

  return userId;
}

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await isAdmin(ctx);

    const profiles = await ctx.db.query("userProfiles").collect();
    
    const usersWithDetails = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        let driverInfo = null;
        
        if (profile.role === "driver") {
          driverInfo = await ctx.db
            .query("drivers")
            .withIndex("by_user_id", (q) => q.eq("userId", profile.userId))
            .unique();
        }

        return {
          ...profile,
          email: user?.email,
          driverInfo,
        };
      })
    );

    return usersWithDetails;
  },
});

export const getAllDrivers = query({
  args: {},
  handler: async (ctx) => {
    await isAdmin(ctx);

    const driverProfiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_role", (q) => q.eq("role", "driver"))
      .collect();

    const driversWithDetails = await Promise.all(
      driverProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        const driverInfo = await ctx.db
          .query("drivers")
          .withIndex("by_user_id", (q) => q.eq("userId", profile.userId))
          .unique();

        let documentUrls: any = {};
        if (driverInfo) {
          if (driverInfo.criminalRecordId) {
            documentUrls.criminalRecordUrl = await ctx.storage.getUrl(driverInfo.criminalRecordId);
          }
          if (driverInfo.idCardImageId) {
            documentUrls.idCardUrl = await ctx.storage.getUrl(driverInfo.idCardImageId);
          }
          if (driverInfo.licenseImageId) {
            documentUrls.licenseUrl = await ctx.storage.getUrl(driverInfo.licenseImageId);
          }
        }

        // Get payment records
        const paymentRecords = await ctx.db
          .query("paymentRecords")
          .withIndex("by_user_id", (q) => q.eq("userId", profile.userId))
          .collect();

        const totalPayments = paymentRecords.reduce((sum, record) => sum + record.amount, 0);

        return {
          ...profile,
          email: user?.email,
          driverInfo,
          documentUrls,
          totalPayments,
        };
      })
    );

    return driversWithDetails;
  },
});

export const getPendingVerifications = query({
  args: {},
  handler: async (ctx) => {
    await isAdmin(ctx);

    const pendingDrivers = await ctx.db
      .query("drivers")
      .withIndex("by_verification_status", (q) => q.eq("verificationStatus", "pending_verification"))
      .collect();

    const driversWithDetails = await Promise.all(
      pendingDrivers.map(async (driver) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", driver.userId))
          .unique();

        const user = await ctx.db.get(driver.userId);

        let documentUrls: any = {};
        if (driver.criminalRecordId) {
          documentUrls.criminalRecordUrl = await ctx.storage.getUrl(driver.criminalRecordId);
        }
        if (driver.idCardImageId) {
          documentUrls.idCardUrl = await ctx.storage.getUrl(driver.idCardImageId);
        }
        if (driver.licenseImageId) {
          documentUrls.licenseUrl = await ctx.storage.getUrl(driver.licenseImageId);
        }

        return {
          ...driver,
          profile,
          email: user?.email,
          documentUrls,
        };
      })
    );

    return driversWithDetails;
  },
});

export const getAllRides = query({
  args: {},
  handler: async (ctx) => {
    await isAdmin(ctx);

    const rides = await ctx.db.query("rides").order("desc").take(100);

    const ridesWithDetails = await Promise.all(
      rides.map(async (ride) => {
        const passengerProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", ride.passengerId))
          .unique();

        let driverProfile = null;
        if (ride.driverId) {
          driverProfile = await ctx.db
            .query("userProfiles")
            .withIndex("by_user_id", (q: any) => q.eq("userId", ride.driverId))
            .unique();
        }

        return {
          ...ride,
          passengerName: passengerProfile?.name || "غير معروف",
          driverName: driverProfile?.name || "لم يتم التعيين",
        };
      })
    );

    return ridesWithDetails;
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await isAdmin(ctx);

    const allProfiles = await ctx.db.query("userProfiles").collect();
    const allDrivers = await ctx.db.query("drivers").collect();
    const allRides = await ctx.db.query("rides").collect();
    const paymentRecords = await ctx.db.query("paymentRecords").collect();

    const totalUsers = allProfiles.length;
    const totalDrivers = allProfiles.filter(p => p.role === "driver").length;
    const totalPassengers = allProfiles.filter(p => p.role === "passenger").length;
    const verifiedDrivers = allDrivers.filter(d => d.verificationStatus === "verified").length;
    const pendingVerifications = allDrivers.filter(d => d.verificationStatus === "pending_verification").length;
    const onlineDrivers = allDrivers.filter(d => d.status === "online").length;
    const totalRides = allRides.length;
    const completedRides = allRides.filter(r => r.status === "completed").length;
    const activeRides = allRides.filter(r => ["searching", "accepted", "driver_arriving", "in_progress"].includes(r.status)).length;
    const totalRevenue = paymentRecords.reduce((sum, record) => sum + record.amount, 0);

    return {
      totalUsers,
      totalDrivers,
      totalPassengers,
      verifiedDrivers,
      pendingVerifications,
      onlineDrivers,
      totalRides,
      completedRides,
      activeRides,
      totalRevenue,
    };
  },
});

export const toggleUserStatus = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("المستخدم غير موجود");
    }

    await ctx.db.patch(profile._id, {
      isActive: !profile.isActive,
    });

    return profile._id;
  },
});

export const initializeSettings = mutation({
  args: {},
  handler: async (ctx) => {
    await isAdmin(ctx);

    const defaultSettings = [
      { key: "base_price", value: 5, description: "السعر الأساسي للرحلة" },
      { key: "price_per_km", value: 3, description: "سعر الكيلومتر الواحد" },
      { key: "commission_rate", value: 0.1, description: "نسبة العمولة" },
      { key: "driver_registration_fee", value: 200, description: "رسوم تسجيل السائق" },
    ];

    for (const setting of defaultSettings) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .unique();

      if (!existing) {
        await ctx.db.insert("settings", setting);
      }
    }

    return "تم تهيئة الإعدادات بنجاح";
  },
});

export const verifyDriver = mutation({
  args: {
    driverId: v.id("drivers"),
    action: v.union(v.literal("approve"), v.literal("reject")),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const adminUserId = await isAdmin(ctx);

    const driver = await ctx.db.get(args.driverId);
    if (!driver) {
      throw new Error("السائق غير موجود");
    }

    if (args.action === "approve") {
      await ctx.db.patch(args.driverId, {
        verificationStatus: "verified",
        verifiedAt: Date.now(),
        verifiedBy: adminUserId,
        rejectionReason: undefined,
      });
    } else {
      await ctx.db.patch(args.driverId, {
        verificationStatus: "rejected",
        rejectionReason: args.rejectionReason || "لم يتم تحديد السبب",
      });
    }

    return args.driverId;
  },
});

export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await isAdmin(ctx);

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("المستخدم غير موجود");
    }

    // If user is a driver, delete driver-related data
    if (profile.role === "driver") {
      const driver = await ctx.db
        .query("drivers")
        .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
        .unique();

      if (driver) {
        // Delete uploaded documents
        if (driver.criminalRecordId) {
          await ctx.storage.delete(driver.criminalRecordId);
        }
        if (driver.idCardImageId) {
          await ctx.storage.delete(driver.idCardImageId);
        }
        if (driver.licenseImageId) {
          await ctx.storage.delete(driver.licenseImageId);
        }

        // Delete payment records
        const paymentRecords = await ctx.db
          .query("paymentRecords")
          .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
          .collect();

        for (const record of paymentRecords) {
          await ctx.db.delete(record._id);
        }

        // Delete driver record
        await ctx.db.delete(driver._id);
      }
    }

    // Delete user profile
    await ctx.db.delete(profile._id);

    return args.userId;
  },
});
