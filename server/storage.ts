import {
  users,
  communities,
  events,
  messages,
  communityMembers,
  eventAttendees,
  schools,
  schoolingMethods,
  schoolMethods,
  schoolPosts,
  schoolComments,
  schoolFavorites,
  schoolAttendees,
  schoolTeachers,
  schoolPhotos,
  notifications,
  friends,
  pushTokens,
  type User,
  type UpsertUser,
  type Community,
  type Event,
  type Message,
  type InsertCommunity,
  type InsertEvent,
  type InsertMessage,
  type InsertUser,
  type School,
  type SchoolingMethod,
  type SchoolPost,
  type SchoolComment,
  type SchoolFavorite,
  type SchoolAttendee,
  type SchoolTeacher,
  type SchoolPhoto,
  type InsertSchool,
  type InsertSchoolPost,
  type InsertSchoolComment,
  type InsertSchoolTeacher,
  type InsertSchoolPhoto,
  type Notification,
  type Friend,
  type PushToken,
  type InsertNotification,
  type InsertFriend,
  type InsertPushToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(userId: string, profile: InsertUser): Promise<User>;
  updateUserSettings(userId: string, settings: { language?: string; theme?: string; privacyLevel?: string }): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  
  // Community operations
  getCommunities(): Promise<Community[]>;
  getCommunitiesByCity(city: string): Promise<Community[]>;
  getCommunity(id: number): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  joinCommunity(userId: string, communityId: number): Promise<void>;
  isMemberOfCommunity(userId: string, communityId: number): Promise<boolean>;
  
  // Event operations
  getEvents(): Promise<Event[]>;
  getEventsByCity(city: string): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent, userId: string): Promise<Event>;
  joinEvent(userId: string, eventId: number): Promise<void>;
  isAttendingEvent(userId: string, eventId: number): Promise<boolean>;
  
  // Message operations
  getMessagesForCommunity(communityId: number): Promise<(Message & { sender: User })[]>;
  createMessage(message: InsertMessage, userId: string): Promise<Message>;

  
  // Family operations
  getFamilies(): Promise<User[]>;
  getFamiliesByCity(city: string): Promise<User[]>;
  
  // User's joined communities and events
  getUserCommunities(userId: string): Promise<Community[]>;
  getUserEvents(userId: string): Promise<Event[]>;
  
  // User's created communities and events
  getUserCreatedCommunities(userId: string): Promise<Community[]>;
  getUserCreatedEvents(userId: string): Promise<Event[]>;

  // School operations
  getSchoolingMethods(): Promise<SchoolingMethod[]>;
  getSchools(): Promise<School[]>;
  getSchoolsByCity(city: string): Promise<School[]>;
  getSchoolsByMethods(methodIds: number[]): Promise<School[]>;
  getSchool(id: number): Promise<School | undefined>;
  createSchool(school: InsertSchool, userId: string): Promise<School>;
  updateSchool(id: number, school: Partial<InsertSchool>, userId: string): Promise<School>;
  deleteSchool(id: number, userId: string): Promise<void>;
  
  // School favorites
  addSchoolToFavorites(userId: string, schoolId: number): Promise<void>;
  removeSchoolFromFavorites(userId: string, schoolId: number): Promise<void>;
  isSchoolFavorited(userId: string, schoolId: number): Promise<boolean>;
  getUserFavoriteSchools(userId: string): Promise<School[]>;
  
  // School attendees
  addSchoolAttendee(userId: string, schoolId: number, methodId: number, status: string): Promise<void>;
  removeSchoolAttendee(userId: string, schoolId: number): Promise<void>;
  getSchoolAttendees(schoolId: number): Promise<(SchoolAttendee & { user: User })[]>;
  isUserAttendingSchool(userId: string, schoolId: number): Promise<boolean>;
  
  // School posts and comments
  getSchoolPosts(schoolId: number): Promise<(SchoolPost & { author: User; comments: (SchoolComment & { author: User })[] })[]>;
  createSchoolPost(post: InsertSchoolPost, userId: string): Promise<SchoolPost>;
  createSchoolComment(comment: InsertSchoolComment, userId: string): Promise<SchoolComment>;
  
  // School teachers and photos
  getSchoolTeachers(schoolId: number): Promise<SchoolTeacher[]>;
  createSchoolTeacher(teacher: InsertSchoolTeacher): Promise<SchoolTeacher>;
  getSchoolPhotos(schoolId: number): Promise<SchoolPhoto[]>;
  createSchoolPhoto(photo: InsertSchoolPhoto): Promise<SchoolPhoto>;

  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: number): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Friend operations
  getUserFriends(userId: string): Promise<(Friend & { friend: User })[]>;
  getUserFriendRequests(userId: string): Promise<(Friend & { requester: User })[]>;
  getSentFriendRequests(userId: string): Promise<(Friend & { friend: User })[]>;
  sendFriendRequest(userId: string, friendId: string): Promise<Friend>;
  acceptFriendRequest(friendRequestId: number): Promise<void>;
  rejectFriendRequest(friendRequestId: number): Promise<void>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  areFriends(userId: string, friendId: string): Promise<boolean>;
  hasPendingFriendRequest(userId: string, friendId: string): Promise<boolean>;

  // Push token operations
  registerPushToken(token: InsertPushToken): Promise<PushToken>;
  getUserPushTokens(userId: string): Promise<PushToken[]>;
  deactivatePushToken(token: string): Promise<void>;
  cleanupInactivePushTokens(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, profile: InsertUser): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserSettings(userId: string, settings: { language?: string; theme?: string; privacyLevel?: string }): Promise<User> {
    const updateData: any = { updatedAt: new Date() };
    if (settings.language) updateData.language = settings.language;
    if (settings.theme) updateData.theme = settings.theme;
    if (settings.privacyLevel) updateData.privacyLevel = settings.privacyLevel;
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete user data in order to respect foreign key constraints
    await db.delete(communityMembers).where(eq(communityMembers.userId, userId));
    await db.delete(eventAttendees).where(eq(eventAttendees.userId, userId));
    await db.delete(messages).where(eq(messages.senderId, userId));
    await db.delete(events).where(eq(events.createdBy, userId));
    await db.delete(users).where(eq(users.id, userId));
  }

  async getCommunities(): Promise<Community[]> {
    return await db.select().from(communities).orderBy(desc(communities.memberCount));
  }

  async getCommunitiesByCity(city: string): Promise<Community[]> {
    return await db
      .select()
      .from(communities)
      .where(eq(communities.city, city))
      .orderBy(desc(communities.memberCount));
  }

  async getCommunity(id: number): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    const [newCommunity] = await db
      .insert(communities)
      .values(community)
      .returning();
    return newCommunity;
  }

  async joinCommunity(userId: string, communityId: number): Promise<void> {
    // Insert only if not already a member
    await db.insert(communityMembers).values({
      userId,
      communityId,
    }).onConflictDoNothing();
    
    // Update member count
    await db
      .update(communities)
      .set({
        memberCount: sql`${communities.memberCount} + 1`,
      })
      .where(eq(communities.id, communityId));
  }

  async isMemberOfCommunity(userId: string, communityId: number): Promise<boolean> {
    const [membership] = await db
      .select()
      .from(communityMembers)
      .where(and(
        eq(communityMembers.userId, userId),
        eq(communityMembers.communityId, communityId)
      ));
    return !!membership;
  }

  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(events.date);
  }

  async getEventsByCity(city: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.city, city))
      .orderBy(events.date);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent, userId: string): Promise<Event> {
    const [newEvent] = await db
      .insert(events)
      .values({ ...event, createdBy: userId })
      .returning();
    return newEvent;
  }

  async joinEvent(userId: string, eventId: number): Promise<void> {
    await db.insert(eventAttendees).values({
      userId,
      eventId,
    }).onConflictDoNothing();
    
    // Update attendee count
    await db
      .update(events)
      .set({
        attendeeCount: sql`${events.attendeeCount} + 1`,
      })
      .where(eq(events.id, eventId));
  }

  async isAttendingEvent(userId: string, eventId: number): Promise<boolean> {
    const [attendance] = await db
      .select()
      .from(eventAttendees)
      .where(and(
        eq(eventAttendees.userId, userId),
        eq(eventAttendees.eventId, eventId)
      ));
    return !!attendance;
  }

  async getMessagesForCommunity(communityId: number): Promise<(Message & { sender: User })[]> {
    return await db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        communityId: messages.communityId,
        eventId: messages.eventId,
        city: messages.city,
        createdAt: messages.createdAt,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.communityId, communityId))
      .orderBy(desc(messages.createdAt))
      .limit(50);
  }

  async createMessage(message: InsertMessage, userId: string): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({ ...message, senderId: userId })
      .returning();
    return newMessage;
  }

  async getMessagesForEvent(eventId: number): Promise<(Message & { sender: User })[]> {
    return await db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        communityId: messages.communityId,
        eventId: messages.eventId,
        city: messages.city,
        createdAt: messages.createdAt,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.eventId, eventId))
      .orderBy(messages.createdAt);
  }

  async createEventMessage(messageData: InsertMessage, userId: string): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...messageData,
        senderId: userId,
        createdAt: new Date(),
      })
      .returning();
    return message;
  }

  async getMessagesForCity(city: string): Promise<(Message & { sender: User })[]> {
    return await db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        communityId: messages.communityId,
        eventId: messages.eventId,
        city: messages.city,
        createdAt: messages.createdAt,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.city, city))
      .orderBy(messages.createdAt);
  }

  async createCityMessage(messageData: InsertMessage, userId: string): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...messageData,
        senderId: userId,
        createdAt: new Date(),
      })
      .returning();
    return message;
  }

  async getFamilies(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(20);
  }

  async getFamiliesByCity(city: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.city, city))
      .orderBy(desc(users.createdAt))
      .limit(20);
  }

  // User's joined communities and events
  async getUserCommunities(userId: string): Promise<Community[]> {
    return await db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        city: communities.city,
        logo: communities.logo,
        createdBy: communities.createdBy,
        memberCount: communities.memberCount,
        isDummy: communities.isDummy,
        createdAt: communities.createdAt,
      })
      .from(communities)
      .innerJoin(communityMembers, eq(communities.id, communityMembers.communityId))
      .where(eq(communityMembers.userId, userId));
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    return await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        date: events.date,
        time: events.time,
        location: events.location,
        city: events.city,
        photo: events.photo,
        createdBy: events.createdBy,
        attendeeCount: events.attendeeCount,
        isDummy: events.isDummy,
        createdAt: events.createdAt,
      })
      .from(events)
      .innerJoin(eventAttendees, eq(events.id, eventAttendees.eventId))
      .where(eq(eventAttendees.userId, userId));
  }

  // User's created communities and events
  async getUserCreatedCommunities(userId: string): Promise<Community[]> {
    return await db
      .select()
      .from(communities)
      .where(eq(communities.createdBy, userId));
  }

  async getUserCreatedEvents(userId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.createdBy, userId));
  }

  // School operations
  async getSchoolingMethods(): Promise<SchoolingMethod[]> {
    return await db.select().from(schoolingMethods);
  }

  async getSchools(): Promise<School[]> {
    return await db.select().from(schools).where(eq(schools.isActive, true));
  }

  async getSchoolsByCity(city: string): Promise<School[]> {
    return await db.select().from(schools)
      .where(and(eq(schools.city, city), eq(schools.isActive, true)));
  }

  async getSchoolsByMethods(methodIds: number[]): Promise<School[]> {
    return await db.select({
      id: schools.id,
      name: schools.name,
      city: schools.city,
      address: schools.address,
      latitude: schools.latitude,
      longitude: schools.longitude,
      description: schools.description,
      shortDescription: schools.shortDescription,
      website: schools.website,
      email: schools.email,
      phone: schools.phone,
      whatsapp: schools.whatsapp,
      telegram: schools.telegram,
      ageRange: schools.ageRange,
      capacity: schools.capacity,
      yearEstablished: schools.yearEstablished,
      priceRange: schools.priceRange,
      coverPhoto: schools.coverPhoto,
      isActive: schools.isActive,
      isDummy: schools.isDummy,
      managerId: schools.managerId,
      createdAt: schools.createdAt,
      updatedAt: schools.updatedAt,
    })
      .from(schools)
      .innerJoin(schoolMethods, eq(schools.id, schoolMethods.schoolId))
      .where(and(
        inArray(schoolMethods.methodId, methodIds),
        eq(schools.isActive, true)
      ));
  }

  async getSchool(id: number): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.id, id));
    return school;
  }

  async createSchool(schoolData: InsertSchool, userId: string): Promise<School> {
    const [school] = await db
      .insert(schools)
      .values({ ...schoolData, managerId: userId })
      .returning();
    return school;
  }

  async updateSchool(id: number, schoolData: Partial<InsertSchool>, userId: string): Promise<School> {
    const [school] = await db
      .update(schools)
      .set({ ...schoolData, updatedAt: new Date() })
      .where(and(eq(schools.id, id), eq(schools.managerId, userId)))
      .returning();
    return school;
  }

  async deleteSchool(id: number, userId: string): Promise<void> {
    await db
      .update(schools)
      .set({ isActive: false })
      .where(and(eq(schools.id, id), eq(schools.managerId, userId)));
  }

  // School favorites
  async addSchoolToFavorites(userId: string, schoolId: number): Promise<void> {
    await db.insert(schoolFavorites).values({ userId, schoolId });
  }

  async removeSchoolFromFavorites(userId: string, schoolId: number): Promise<void> {
    await db.delete(schoolFavorites)
      .where(and(eq(schoolFavorites.userId, userId), eq(schoolFavorites.schoolId, schoolId)));
  }

  async isSchoolFavorited(userId: string, schoolId: number): Promise<boolean> {
    const [favorite] = await db.select()
      .from(schoolFavorites)
      .where(and(eq(schoolFavorites.userId, userId), eq(schoolFavorites.schoolId, schoolId)));
    return !!favorite;
  }

  async getUserFavoriteSchools(userId: string): Promise<School[]> {
    return await db.select({
      id: schools.id,
      name: schools.name,
      city: schools.city,
      address: schools.address,
      latitude: schools.latitude,
      longitude: schools.longitude,
      description: schools.description,
      shortDescription: schools.shortDescription,
      website: schools.website,
      email: schools.email,
      phone: schools.phone,
      whatsapp: schools.whatsapp,
      telegram: schools.telegram,
      ageRange: schools.ageRange,
      capacity: schools.capacity,
      yearEstablished: schools.yearEstablished,
      priceRange: schools.priceRange,
      coverPhoto: schools.coverPhoto,
      isActive: schools.isActive,
      isDummy: schools.isDummy,
      managerId: schools.managerId,
      createdAt: schools.createdAt,
      updatedAt: schools.updatedAt,
    })
      .from(schools)
      .innerJoin(schoolFavorites, eq(schools.id, schoolFavorites.schoolId))
      .where(eq(schoolFavorites.userId, userId));
  }

  // School attendees
  async addSchoolAttendee(userId: string, schoolId: number, methodId: number, status: string): Promise<void> {
    await db.insert(schoolAttendees).values({ userId, schoolId, methodId, status: status as any });
  }

  async removeSchoolAttendee(userId: string, schoolId: number): Promise<void> {
    await db.delete(schoolAttendees)
      .where(and(eq(schoolAttendees.userId, userId), eq(schoolAttendees.schoolId, schoolId)));
  }

  async getSchoolAttendees(schoolId: number): Promise<(SchoolAttendee & { user: User })[]> {
    return await db.select({
      id: schoolAttendees.id,
      userId: schoolAttendees.userId,
      schoolId: schoolAttendees.schoolId,
      methodId: schoolAttendees.methodId,
      status: schoolAttendees.status,
      startDate: schoolAttendees.startDate,
      endDate: schoolAttendees.endDate,
      createdAt: schoolAttendees.createdAt,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        city: users.city,
        numKids: users.numKids,
        bio: users.bio,
        maritalStatus: users.maritalStatus,
        language: users.language,
        theme: users.theme,
        privacyLevel: users.privacyLevel,
        isDummy: users.isDummy,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      },
    })
      .from(schoolAttendees)
      .innerJoin(users, eq(schoolAttendees.userId, users.id))
      .where(eq(schoolAttendees.schoolId, schoolId));
  }

  async isUserAttendingSchool(userId: string, schoolId: number): Promise<boolean> {
    const [attendee] = await db.select()
      .from(schoolAttendees)
      .where(and(eq(schoolAttendees.userId, userId), eq(schoolAttendees.schoolId, schoolId)));
    return !!attendee;
  }

  // School posts and comments
  async getSchoolPosts(schoolId: number): Promise<(SchoolPost & { author: User; comments: (SchoolComment & { author: User })[] })[]> {
    const posts = await db.select({
      id: schoolPosts.id,
      schoolId: schoolPosts.schoolId,
      authorId: schoolPosts.authorId,
      content: schoolPosts.content,
      photos: schoolPosts.photos,
      type: schoolPosts.type,
      isPublic: schoolPosts.isPublic,
      createdAt: schoolPosts.createdAt,
      updatedAt: schoolPosts.updatedAt,
      author: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        city: users.city,
        numKids: users.numKids,
        bio: users.bio,
        maritalStatus: users.maritalStatus,
        language: users.language,
        theme: users.theme,
        privacyLevel: users.privacyLevel,
        isDummy: users.isDummy,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      },
    })
      .from(schoolPosts)
      .innerJoin(users, eq(schoolPosts.authorId, users.id))
      .where(and(eq(schoolPosts.schoolId, schoolId), eq(schoolPosts.isPublic, true)))
      .orderBy(desc(schoolPosts.createdAt));

    // Get comments for each post
    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const comments = await db.select({
          id: schoolComments.id,
          postId: schoolComments.postId,
          authorId: schoolComments.authorId,
          content: schoolComments.content,
          createdAt: schoolComments.createdAt,
          updatedAt: schoolComments.updatedAt,
          author: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            city: users.city,
            numKids: users.numKids,
            bio: users.bio,
            maritalStatus: users.maritalStatus,
            language: users.language,
            theme: users.theme,
            privacyLevel: users.privacyLevel,
            isDummy: users.isDummy,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          },
        })
          .from(schoolComments)
          .innerJoin(users, eq(schoolComments.authorId, users.id))
          .where(eq(schoolComments.postId, post.id))
          .orderBy(schoolComments.createdAt);

        return { ...post, comments };
      })
    );

    return postsWithComments;
  }

  async createSchoolPost(postData: InsertSchoolPost, userId: string): Promise<SchoolPost> {
    const [post] = await db
      .insert(schoolPosts)
      .values({ ...postData, authorId: userId })
      .returning();
    return post;
  }

  async createSchoolComment(commentData: InsertSchoolComment, userId: string): Promise<SchoolComment> {
    const [comment] = await db
      .insert(schoolComments)
      .values({ ...commentData, authorId: userId })
      .returning();
    return comment;
  }

  // School teachers and photos
  async getSchoolTeachers(schoolId: number): Promise<SchoolTeacher[]> {
    return await db.select()
      .from(schoolTeachers)
      .where(and(eq(schoolTeachers.schoolId, schoolId), eq(schoolTeachers.isActive, true)));
  }

  async createSchoolTeacher(teacherData: InsertSchoolTeacher): Promise<SchoolTeacher> {
    const [teacher] = await db
      .insert(schoolTeachers)
      .values(teacherData)
      .returning();
    return teacher;
  }

  async getSchoolPhotos(schoolId: number): Promise<SchoolPhoto[]> {
    return await db.select()
      .from(schoolPhotos)
      .where(eq(schoolPhotos.schoolId, schoolId))
      .orderBy(desc(schoolPhotos.createdAt));
  }

  async createSchoolPhoto(photoData: InsertSchoolPhoto): Promise<SchoolPhoto> {
    const [photo] = await db
      .insert(schoolPhotos)
      .values(photoData)
      .returning();
    return photo;
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async deleteNotification(notificationId: number): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result[0]?.count || 0;
  }

  // Friend operations
  async getUserFriends(userId: string): Promise<(Friend & { friend: User })[]> {
    return await db.select({
      id: friends.id,
      userId: friends.userId,
      friendId: friends.friendId,
      status: friends.status,
      requestedBy: friends.requestedBy,
      createdAt: friends.createdAt,
      updatedAt: friends.updatedAt,
      friend: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        city: users.city,
        numKids: users.numKids,
        bio: users.bio,
        maritalStatus: users.maritalStatus,
        language: users.language,
        theme: users.theme,
        privacyLevel: users.privacyLevel,
        isDummy: users.isDummy,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }
    })
    .from(friends)
    .innerJoin(users, eq(friends.friendId, users.id))
    .where(and(eq(friends.userId, userId), eq(friends.status, "accepted")));
  }

  async getUserFriendRequests(userId: string): Promise<(Friend & { requester: User })[]> {
    return await db.select({
      id: friends.id,
      userId: friends.userId,
      friendId: friends.friendId,
      status: friends.status,
      requestedBy: friends.requestedBy,
      createdAt: friends.createdAt,
      updatedAt: friends.updatedAt,
      requester: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        city: users.city,
        numKids: users.numKids,
        bio: users.bio,
        maritalStatus: users.maritalStatus,
        language: users.language,
        theme: users.theme,
        privacyLevel: users.privacyLevel,
        isDummy: users.isDummy,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }
    })
    .from(friends)
    .innerJoin(users, eq(friends.requestedBy, users.id))
    .where(and(eq(friends.friendId, userId), eq(friends.status, "pending")));
  }

  async getSentFriendRequests(userId: string): Promise<(Friend & { friend: User })[]> {
    return await db.select({
      id: friends.id,
      userId: friends.userId,
      friendId: friends.friendId,
      status: friends.status,
      requestedBy: friends.requestedBy,
      createdAt: friends.createdAt,
      updatedAt: friends.updatedAt,
      friend: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        city: users.city,
        numKids: users.numKids,
        bio: users.bio,
        maritalStatus: users.maritalStatus,
        language: users.language,
        theme: users.theme,
        privacyLevel: users.privacyLevel,
        isDummy: users.isDummy,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }
    })
    .from(friends)
    .innerJoin(users, eq(friends.friendId, users.id))
    .where(and(eq(friends.requestedBy, userId), eq(friends.status, "pending")));
  }

  async sendFriendRequest(userId: string, friendId: string): Promise<Friend> {
    const [friendRequest] = await db
      .insert(friends)
      .values({
        userId: friendId,
        friendId,
        requestedBy: userId,
        status: "pending"
      })
      .returning();
    return friendRequest;
  }

  async acceptFriendRequest(friendRequestId: number): Promise<void> {
    await db
      .update(friends)
      .set({ 
        status: "accepted",
        updatedAt: new Date()
      })
      .where(eq(friends.id, friendRequestId));
  }

  async rejectFriendRequest(friendRequestId: number): Promise<void> {
    await db
      .delete(friends)
      .where(eq(friends.id, friendRequestId));
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await db
      .delete(friends)
      .where(
        and(
          eq(friends.status, "accepted"),
          sql`(${friends.userId} = ${userId} AND ${friends.friendId} = ${friendId}) OR (${friends.userId} = ${friendId} AND ${friends.friendId} = ${userId})`
        )
      );
  }

  async areFriends(userId: string, friendId: string): Promise<boolean> {
    const result = await db.select()
      .from(friends)
      .where(
        and(
          eq(friends.status, "accepted"),
          sql`(${friends.userId} = ${userId} AND ${friends.friendId} = ${friendId}) OR (${friends.userId} = ${friendId} AND ${friends.friendId} = ${userId})`
        )
      )
      .limit(1);
    return result.length > 0;
  }

  async hasPendingFriendRequest(userId: string, friendId: string): Promise<boolean> {
    const result = await db.select()
      .from(friends)
      .where(
        and(
          eq(friends.status, "pending"),
          sql`(${friends.requestedBy} = ${userId} AND ${friends.friendId} = ${friendId}) OR (${friends.requestedBy} = ${friendId} AND ${friends.friendId} = ${userId})`
        )
      )
      .limit(1);
    return result.length > 0;
  }

  // Push token operations
  async registerPushToken(tokenData: InsertPushToken): Promise<PushToken> {
    // First, deactivate any existing tokens with the same token value
    await db
      .update(pushTokens)
      .set({ isActive: false })
      .where(eq(pushTokens.token, tokenData.token));

    // Insert the new token
    const [token] = await db
      .insert(pushTokens)
      .values(tokenData)
      .returning();
    
    return token;
  }

  async getUserPushTokens(userId: string): Promise<PushToken[]> {
    return await db
      .select()
      .from(pushTokens)
      .where(and(
        eq(pushTokens.userId, userId),
        eq(pushTokens.isActive, true)
      ));
  }

  async deactivatePushToken(token: string): Promise<void> {
    await db
      .update(pushTokens)
      .set({ isActive: false })
      .where(eq(pushTokens.token, token));
  }

  async cleanupInactivePushTokens(): Promise<void> {
    // Remove inactive tokens older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await db
      .delete(pushTokens)
      .where(and(
        eq(pushTokens.isActive, false),
        sql`${pushTokens.updatedAt} < ${thirtyDaysAgo}`
      ));
  }
}

export const storage = new DatabaseStorage();
