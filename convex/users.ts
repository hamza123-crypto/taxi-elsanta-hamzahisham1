import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const EGYPTIAN_CITIES = [
  "السنطة",
  "كفر الشيخ",
  "دسوق",
  "فوه",
  "مطوبس",
  "بيلا",
  "الحامول",
  "قلين",
  "سيدي سالم",
  "الرياض",
  "برج البرلس",
];

const ADMIN_SECRET_CODE = "hazo123#fg";
const DRIVER_VERIFICATION_CODE = "12335";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    return {
      ...user,
      profile,
    };
  },
});

export const getCities = query({
  args: {},
  handler: async () => {
    return EGYPTIAN_CITIES;
  },
});

export const getDriverInfo = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("غير مصرح لك بالوصول");
    }

    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!driver) {
      throw new Error("لم يتم العثور على بيانات السائق");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    return {
      ...driver,
      profile,
    };
  },
});

export const createProfile = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    role: v.union(v.literal("passenger"), v.literal("driver")),
    city: v.optional(v.string()),
    carNumber: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    criminalRecordId: v.optional(v.id("_storage")),
    idCardImageId: v.optional(v.id("_storage")),
    licenseImageId: v.optional(v.id("_storage")),
    adminCode: v.optional(v.string()),
    driverCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("غير مصرح لك بالوصول");
    }

    // Check if user already has a profile
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      throw new Error("لديك ملف شخصي بالفعل");
    }

    let finalRole: "passenger" | "driver" | "admin" = args.role;

    // Check admin code
    if (args.adminCode && args.adminCode === ADMIN_SECRET_CODE) {
      finalRole = "admin";
    }

    // Validate driver code if role is driver
    if (args.role === "driver") {
      if (!args.driverCode || args.driverCode !== DRIVER_VERIFICATION_CODE) {
        throw new Error("كود السائق غير صحيح");
      }

      // Validate city for drivers
      if (!args.city || !EGYPTIAN_CITIES.includes(args.city)) {
        throw new Error("يجب اختيار مدينة صحيحة");
      }

      // Validate required driver fields
      if (!args.carNumber || !args.licenseNumber || !args.criminalRecordId || !args.idCardImageId || !args.licenseImageId) {
        throw new Error("جميع بيانات السائق والمستندات مطلوبة");
      }
    }

    // Create user profile
    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      name: args.name,
      phone: args.phone,
      role: finalRole,
      isActive: true,
      city: args.city,
    });

    // If driver, create driver record
    if (args.role === "driver") {
      const driverId = await ctx.db.insert("drivers", {
        userId,
        carNumber: args.carNumber!,
        licenseNumber: args.licenseNumber!,
        city: args.city!,
        status: "offline",
        verificationStatus: "pending_verification",
        totalRides: 0,
        rating: 5.0,
        isPremium: false,
        criminalRecordId: args.criminalRecordId,
        idCardImageId: args.idCardImageId,
        licenseImageId: args.licenseImageId,
      });

      // Create payment record for driver registration fee
      await ctx.db.insert("paymentRecords", {
        userId,
        driverId,
        amount: 200,
        type: "driver_registration",
        createdAt: Date.now(),
      });
    }

    return profileId;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateDriverStatus = mutation({
  args: {
    status: v.union(v.literal("online"), v.literal("offline")),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("غير مصرح لك بالوصول");
    }

    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!driver) {
      throw new Error("لم يتم العثور على بيانات السائق");
    }

    // Check if driver is verified
    if (driver.verificationStatus !== "verified") {
      throw new Error("يجب توثيق حسابك أولاً قبل الاتصال بالإنترنت");
    }

    await ctx.db.patch(driver._id, {
      status: args.status,
      currentLocation: args.location,
    });

    return driver._id;
  },
});
