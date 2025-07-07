import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  city: varchar("city"),
  numKids: integer("num_kids").default(1),
  bio: text("bio"),
  maritalStatus: varchar("marital_status", { enum: ["single", "married", "divorced", "widowed", "partnered"] }).default("married"),
  language: varchar("language", { enum: ["en", "lt", "ru", "es"] }).default("en"),
  theme: varchar("theme", { enum: ["light", "dark", "system"] }).default("system"),
  privacyLevel: varchar("privacy_level", { enum: ["public", "friends", "private"] }).default("public"),
  isDummy: boolean("is_dummy").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  city: varchar("city").notNull(),
  description: text("description"),
  logo: varchar("logo"),
  createdBy: varchar("created_by").references(() => users.id),
  memberCount: integer("member_count").default(0),
  isDummy: boolean("is_dummy").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  time: varchar("time").notNull(),
  location: varchar("location"),
  city: varchar("city").notNull(),
  photo: varchar("photo"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  attendeeCount: integer("attendee_count").default(0),
  isDummy: boolean("is_dummy").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  communityId: integer("community_id").references(() => communities.id),
  eventId: integer("event_id").references(() => events.id),
  city: varchar("city"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityMembers = pgTable("community_members", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  communityId: integer("community_id").notNull().references(() => communities.id),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const eventAttendees = pgTable("event_attendees", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventId: integer("event_id").notNull().references(() => events.id),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// School system tables
export const schoolingMethods = pgTable("schooling_methods", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  color: varchar("color").default("#4F46E5"),
  icon: varchar("icon").default("GraduationCap"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  city: varchar("city").notNull(),
  address: text("address"),
  latitude: varchar("latitude"),
  longitude: varchar("longitude"),
  description: text("description"),
  shortDescription: text("short_description"),
  website: varchar("website"),
  email: varchar("email"),
  phone: varchar("phone"),
  whatsapp: varchar("whatsapp"),
  telegram: varchar("telegram"),
  ageRange: varchar("age_range"),
  capacity: integer("capacity"),
  yearEstablished: integer("year_established"),
  priceRange: varchar("price_range", { enum: ["free", "low", "medium", "high"] }),
  coverPhoto: varchar("cover_photo"),
  isActive: boolean("is_active").default(true),
  isDummy: boolean("is_dummy").default(false),
  managerId: varchar("manager_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schoolMethods = pgTable("school_methods", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  methodId: integer("method_id").notNull().references(() => schoolingMethods.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schoolTeachers = pgTable("school_teachers", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  name: varchar("name").notNull(),
  bio: text("bio"),
  photo: varchar("photo"),
  qualifications: text("qualifications"),
  specializations: text("specializations"),
  yearsExperience: integer("years_experience"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schoolPhotos = pgTable("school_photos", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  url: varchar("url").notNull(),
  caption: text("caption"),
  category: varchar("category", { enum: ["classroom", "outdoor", "activity", "facility", "other"] }).default("other"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schoolPosts = pgTable("school_posts", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  authorId: varchar("author_id").notNull().references(() => users.id),
  content: text("content"),
  photos: text("photos").array(),
  type: varchar("type", { enum: ["text", "photo", "announcement", "event"] }).default("text"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schoolComments = pgTable("school_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => schoolPosts.id),
  authorId: varchar("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schoolFavorites = pgTable("school_favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schoolAttendees = pgTable("school_attendees", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  methodId: integer("method_id").references(() => schoolingMethods.id),
  status: varchar("status", { enum: ["attending", "interested", "alumni"] }).default("attending"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type", { 
    enum: ["community_join", "event_join", "friend_request", "friend_accept", "message", "school_favorite"] 
  }).notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  relatedId: integer("related_id"), // ID of community, event, user, etc.
  relatedType: varchar("related_type", { 
    enum: ["community", "event", "user", "school", "message"] 
  }),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Friends table
export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  friendId: varchar("friend_id").notNull().references(() => users.id),
  status: varchar("status", { enum: ["pending", "accepted", "blocked"] }).default("pending"),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Push tokens table for mobile/web push notifications
export const pushTokens = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull(),
  platform: varchar("platform", { enum: ["web", "ios", "android"] }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdEvents: many(events),
  messages: many(messages),
  communityMemberships: many(communityMembers),
  eventAttendances: many(eventAttendees),
  schoolPosts: many(schoolPosts),
  schoolComments: many(schoolComments),
  schoolFavorites: many(schoolFavorites),
  schoolAttendances: many(schoolAttendees),
  managedSchools: many(schools),
  notifications: many(notifications),
  sentFriendRequests: many(friends, { relationName: "sentFriendRequests" }),
  receivedFriendRequests: many(friends, { relationName: "receivedFriendRequests" }),
  pushTokens: many(pushTokens),
}));

export const communitiesRelations = relations(communities, ({ many }) => ({
  messages: many(messages),
  members: many(communityMembers),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  attendees: many(eventAttendees),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [messages.communityId],
    references: [communities.id],
  }),
}));

export const communityMembersRelations = relations(communityMembers, ({ one }) => ({
  user: one(users, {
    fields: [communityMembers.userId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [communityMembers.communityId],
    references: [communities.id],
  }),
}));

export const eventAttendeesRelations = relations(eventAttendees, ({ one }) => ({
  user: one(users, {
    fields: [eventAttendees.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventAttendees.eventId],
    references: [events.id],
  }),
}));

// School relations
export const schoolingMethodsRelations = relations(schoolingMethods, ({ many }) => ({
  schools: many(schoolMethods),
  attendees: many(schoolAttendees),
}));

export const schoolsRelations = relations(schools, ({ one, many }) => ({
  manager: one(users, {
    fields: [schools.managerId],
    references: [users.id],
  }),
  methods: many(schoolMethods),
  teachers: many(schoolTeachers),
  photos: many(schoolPhotos),
  posts: many(schoolPosts),
  favorites: many(schoolFavorites),
  attendees: many(schoolAttendees),
}));

export const schoolMethodsRelations = relations(schoolMethods, ({ one }) => ({
  school: one(schools, {
    fields: [schoolMethods.schoolId],
    references: [schools.id],
  }),
  method: one(schoolingMethods, {
    fields: [schoolMethods.methodId],
    references: [schoolingMethods.id],
  }),
}));

export const schoolTeachersRelations = relations(schoolTeachers, ({ one }) => ({
  school: one(schools, {
    fields: [schoolTeachers.schoolId],
    references: [schools.id],
  }),
}));

export const schoolPhotosRelations = relations(schoolPhotos, ({ one }) => ({
  school: one(schools, {
    fields: [schoolPhotos.schoolId],
    references: [schools.id],
  }),
}));

export const schoolPostsRelations = relations(schoolPosts, ({ one, many }) => ({
  school: one(schools, {
    fields: [schoolPosts.schoolId],
    references: [schools.id],
  }),
  author: one(users, {
    fields: [schoolPosts.authorId],
    references: [users.id],
  }),
  comments: many(schoolComments),
}));

export const schoolCommentsRelations = relations(schoolComments, ({ one }) => ({
  post: one(schoolPosts, {
    fields: [schoolComments.postId],
    references: [schoolPosts.id],
  }),
  author: one(users, {
    fields: [schoolComments.authorId],
    references: [users.id],
  }),
}));

export const schoolFavoritesRelations = relations(schoolFavorites, ({ one }) => ({
  user: one(users, {
    fields: [schoolFavorites.userId],
    references: [users.id],
  }),
  school: one(schools, {
    fields: [schoolFavorites.schoolId],
    references: [schools.id],
  }),
}));

export const schoolAttendeesRelations = relations(schoolAttendees, ({ one }) => ({
  user: one(users, {
    fields: [schoolAttendees.userId],
    references: [users.id],
  }),
  school: one(schools, {
    fields: [schoolAttendees.schoolId],
    references: [schools.id],
  }),
  method: one(schoolingMethods, {
    fields: [schoolAttendees.methodId],
    references: [schoolingMethods.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const friendsRelations = relations(friends, ({ one }) => ({
  user: one(users, {
    fields: [friends.userId],
    references: [users.id],
  }),
  friend: one(users, {
    fields: [friends.friendId],
    references: [users.id],
  }),
  requester: one(users, {
    fields: [friends.requestedBy],
    references: [users.id],
  }),
}));

export const pushTokensRelations = relations(pushTokens, ({ one }) => ({
  user: one(users, {
    fields: [pushTokens.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  city: true,
  numKids: true,
  bio: true,
  maritalStatus: true,
  language: true,
  theme: true,
  privacyLevel: true,
}).extend({
  numKids: z.coerce.number().min(0).default(1),
});

export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
  memberCount: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdBy: true,
  attendeeCount: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  senderId: true,
  createdAt: true,
});

// School schemas
export const insertSchoolingMethodSchema = createInsertSchema(schoolingMethods).omit({
  id: true,
  createdAt: true,
});

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  managerId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSchoolPostSchema = createInsertSchema(schoolPosts).omit({
  id: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSchoolCommentSchema = createInsertSchema(schoolComments).omit({
  id: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSchoolTeacherSchema = createInsertSchema(schoolTeachers).omit({
  id: true,
  createdAt: true,
});

export const insertSchoolPhotoSchema = createInsertSchema(schoolPhotos).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertFriendSchema = createInsertSchema(friends).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPushTokenSchema = createInsertSchema(pushTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Community = typeof communities.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// School types
export type SchoolingMethod = typeof schoolingMethods.$inferSelect;
export type School = typeof schools.$inferSelect;
export type SchoolPost = typeof schoolPosts.$inferSelect;
export type SchoolComment = typeof schoolComments.$inferSelect;
export type SchoolTeacher = typeof schoolTeachers.$inferSelect;
export type SchoolPhoto = typeof schoolPhotos.$inferSelect;
export type SchoolFavorite = typeof schoolFavorites.$inferSelect;
export type SchoolAttendee = typeof schoolAttendees.$inferSelect;
export type InsertSchoolingMethod = z.infer<typeof insertSchoolingMethodSchema>;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type InsertSchoolPost = z.infer<typeof insertSchoolPostSchema>;
export type InsertSchoolComment = z.infer<typeof insertSchoolCommentSchema>;
export type InsertSchoolTeacher = z.infer<typeof insertSchoolTeacherSchema>;
export type InsertSchoolPhoto = z.infer<typeof insertSchoolPhotoSchema>;

// Notification, Friend, and Push Token types
export type Notification = typeof notifications.$inferSelect;
export type Friend = typeof friends.$inferSelect;
export type PushToken = typeof pushTokens.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type InsertPushToken = z.infer<typeof insertPushTokenSchema>;
