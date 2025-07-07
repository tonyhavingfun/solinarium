#!/usr/bin/env tsx

import { db } from "../server/db";
import { users, communities, events, communityMembers, eventAttendees, messages } from "../shared/schema";
import { eq } from "drizzle-orm";

async function removeDummyData() {
  console.log("Starting to remove all dummy data...");

  try {
    // Remove community memberships for dummy users first (due to foreign key constraints)
    console.log("Removing community memberships for dummy users...");
    const dummyUsers = await db.select({ id: users.id }).from(users).where(eq(users.isDummy, true));
    const dummyUserIds = dummyUsers.map(u => u.id);
    
    if (dummyUserIds.length > 0) {
      await db.delete(communityMembers).where(
        // We'll need to check each membership individually
      );
    }

    // Remove event attendees for dummy users
    console.log("Removing event attendees for dummy users...");
    if (dummyUserIds.length > 0) {
      await db.delete(eventAttendees).where(
        // We'll need to check each attendance individually  
      );
    }

    // Remove messages from dummy users
    console.log("Removing messages from dummy users...");
    if (dummyUserIds.length > 0) {
      for (const userId of dummyUserIds) {
        await db.delete(messages).where(eq(messages.senderId, userId));
      }
    }

    // Remove dummy events
    console.log("Removing dummy events...");
    const deletedEvents = await db.delete(events).where(eq(events.isDummy, true)).returning();
    console.log(`Removed ${deletedEvents.length} dummy events`);

    // Remove dummy communities (and their related data)
    console.log("Removing dummy communities...");
    const dummyCommunities = await db.select({ id: communities.id }).from(communities).where(eq(communities.isDummy, true));
    
    for (const community of dummyCommunities) {
      // Remove community memberships
      await db.delete(communityMembers).where(eq(communityMembers.communityId, community.id));
      // Remove community messages
      await db.delete(messages).where(eq(messages.communityId, community.id));
    }
    
    const deletedCommunities = await db.delete(communities).where(eq(communities.isDummy, true)).returning();
    console.log(`Removed ${deletedCommunities.length} dummy communities`);

    // Remove dummy users
    console.log("Removing dummy users...");
    const deletedUsers = await db.delete(users).where(eq(users.isDummy, true)).returning();
    console.log(`Removed ${deletedUsers.length} dummy users`);

    console.log("✅ Successfully removed all dummy data!");

  } catch (error) {
    console.error("❌ Error removing dummy data:", error);
    process.exit(1);
  }
}

// Run the script
removeDummyData().then(() => {
  console.log("Cleanup script completed successfully!");
  process.exit(0);
});