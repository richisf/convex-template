import { mutation } from "../../../../_generated/server";
import { v } from "convex/values";

export const remove = mutation({
  args: {
    machineId: v.id("machine"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.machineId);
    if (!existing) {
      throw new Error(`Machine not found: ${args.machineId}`);
    }

    await ctx.db.delete(args.machineId);
    return null;
  },
});
