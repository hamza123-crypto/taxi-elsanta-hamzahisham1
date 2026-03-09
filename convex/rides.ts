import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Price calculation function
function calculatePrice(distance: number): number {
  const basePrice = 5; // 5 EGP base fare
  const pricePerKm = 3; // 3 EGP per km
  return basePrice + (distance * pricePerKm);
}

export const getCurrentRide = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      return null;
    }

    let ride;
    if (profile.role === "passenger") {
      ride = await ctx.db
        .query("rides")
        .withIndex("by_passenger", (q) => q.eq("passengerId", userId))
        .filter((q) => 
          q.or(
            q.eq(q.field("status"), "searching"),
            q.eq(q.field("status"), "accepted"),
            q.eq(q.field("status"), "driver_arriving"),
            q.eq(q.field("status"), "in_progress")
          )
        )
        .first();
    } else if (profile.role === "driver") {
      ride = await ctx.db
        .query("rides")
        .withIndex("by_driver", (q) => q.eq("driverId", userId))
        .filter((q) => 
          q.or(
            q.eq(q.field("status"), "accepted"),
            q.eq(q.field("status"), "driver_arriving"),
            q.eq(q.field("status"), "in_progress")
          )
        )
        .first();
    }

    if (!ride) {
      return null;
    }

    // Add additional info based on role
    let additionalInfo = {};
    if (profile.role === "passenger" && ride.driverId) {
      const driverProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user_id", (q) => q.eq("userId", ride.driverId!))
        .unique();
      
      const driverInfo = await ctx.db
        .query("drivers")
        .withIndex("by_user_id", (q) => q.eq("userId", ride.driverId!))
        .unique();

      if (driverProfile && driverInfo) {
        additionalInfo = {
          driverName: driverProfile.name,
          driverCarNumber: driverInfo.carNumber,
          driverPhone: driverProfile.phone,
        };
      }
    } else if (profile.role === "driver") {
      const passengerProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user_id", (q) => q.eq("userId", ride.passengerId))
        .unique();

      if (passengerProfile) {
        additionalInfo = {
          passengerName: passengerProfile.name,
          passengerPhone: passengerProfile.phone,
        };
      }
    }

    return {
      ...ride,
      ...additionalInfo,
    };
  },
});

export const getAvailableRides = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!driver || driver.status !== "online") {
      return [];
    }

    const rides = await ctx.db
      .query("rides")
      .withIndex("by_status", (q) => q.eq("status", "searching"))
      .order("desc")
      .take(10);

    const ridesWithPassengerInfo = await Promise.all(
      rides.map(async (ride) => {
        const passengerProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", ride.passengerId))
          .unique();

        return {
          ...ride,
          passengerName: passengerProfile?.name || "غير معروف",
        };
      })
    );

    return ridesWithPassengerInfo;
  },
});

export const getUserRides = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      return [];
    }

    let rides;
    if (profile.role === "passenger") {
      rides = await ctx.db
        .query("rides")
        .withIndex("by_passenger", (q) => q.eq("passengerId", userId))
        .order("desc")
        .take(20);
    } else if (profile.role === "driver") {
      rides = await ctx.db
        .query("rides")
        .withIndex("by_driver", (q) => q.eq("driverId", userId))
        .order("desc")
        .take(20);
    } else {
      return [];
    }

    return rides;
  },
});

export const createRide = mutation({
  args: {
    pickupLocation: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    dropoffLocation: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),
    distance: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("غير مصرح لك بالوصول");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "passenger") {
      throw new Error("يمكن للركاب فقط طلب الرحلات");
    }

    // Check if user already has an active ride
    const existingRide = await ctx.db
      .query("rides")
      .withIndex("by_passenger", (q) => q.eq("passengerId", userId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "searching"),
          q.eq(q.field("status"), "accepted"),
          q.eq(q.field("status"), "driver_arriving"),
          q.eq(q.field("status"), "in_progress")
        )
      )
      .first();

    if (existingRide) {
      throw new Error("لديك رحلة نشطة بالفعل");
    }

    const estimatedPrice = calculatePrice(args.distance);

    const rideId = await ctx.db.insert("rides", {
      passengerId: userId,
      pickupLocation: args.pickupLocation,
      dropoffLocation: args.dropoffLocation,
      estimatedPrice,
      distance: args.distance,
      status: "searching",
      passengerPhone: profile.phone,
      notes: args.notes,
    });

    return rideId;
  },
});

export const acceptRide = mutation({
  args: {
    rideId: v.id("rides"),
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

    if (!driver || driver.status !== "online") {
      throw new Error("يجب أن تكون متاحاً لقبول الرحلات");
    }

    const ride = await ctx.db.get(args.rideId);
    if (!ride || ride.status !== "searching") {
      throw new Error("الرحلة غير متاحة");
    }

    const driverProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    await ctx.db.patch(args.rideId, {
      driverId: userId,
      status: "accepted",
      driverPhone: driverProfile?.phone,
    });

    await ctx.db.patch(driver._id, {
      status: "busy",
    });

    return args.rideId;
  },
});

export const updateRideStatus = mutation({
  args: {
    rideId: v.id("rides"),
    status: v.union(
      v.literal("driver_arriving"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    finalPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("غير مصرح لك بالوصول");
    }

    const ride = await ctx.db.get(args.rideId);
    if (!ride) {
      throw new Error("الرحلة غير موجودة");
    }

    // Check if user is authorized to update this ride
    if (ride.passengerId !== userId && ride.driverId !== userId) {
      throw new Error("غير مصرح لك بتحديث هذه الرحلة");
    }

    const updateData: any = {
      status: args.status,
    };

    if (args.finalPrice !== undefined) {
      updateData.finalPrice = args.finalPrice;
    }

    await ctx.db.patch(args.rideId, updateData);

    // If ride is completed or cancelled, update driver status
    if ((args.status === "completed" || args.status === "cancelled") && ride.driverId) {
      const driver = await ctx.db
        .query("drivers")
        .withIndex("by_user_id", (q) => q.eq("userId", ride.driverId!))
        .unique();

      if (driver) {
        const updateDriverData: any = {
          status: "online",
        };

        if (args.status === "completed") {
          updateDriverData.totalRides = driver.totalRides + 1;
        }

        await ctx.db.patch(driver._id, updateDriverData);
      }
    }

    return args.rideId;
  },
});

export const deleteRide = mutation({
  args: {
    rideId: v.id("rides"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("غير مصرح لك بالوصول");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "admin") {
      throw new Error("غير مصرح لك بحذف الرحلات");
    }

    const ride = await ctx.db.get(args.rideId);
    if (!ride) {
      throw new Error("الرحلة غير موجودة");
    }

    await ctx.db.delete(args.rideId);

    // If ride had a driver and was active, update driver status
    if (ride.driverId && ["accepted", "driver_arriving", "in_progress"].includes(ride.status)) {
      const driver = await ctx.db
        .query("drivers")
        .withIndex("by_user_id", (q) => q.eq("userId", ride.driverId!))
        .unique();

      if (driver) {
        await ctx.db.patch(driver._id, {
          status: "online",
        });
      }
    }

    return args.rideId;
  },
});
