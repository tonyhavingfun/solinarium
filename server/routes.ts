import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertUserSchema, 
  insertCommunitySchema, 
  insertEventSchema, 
  insertMessageSchema,
  insertSchoolSchema,
  insertSchoolPostSchema,
  insertSchoolCommentSchema,
  insertSchoolTeacherSchema,
  insertSchoolPhotoSchema,
  insertNotificationSchema,
  insertFriendSchema,
  insertPushTokenSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile routes
  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertUserSchema.parse(req.body);
      const updatedUser = await storage.updateUserProfile(userId, profileData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Settings routes
  app.put('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { language, theme, privacyLevel } = req.body;
      const updatedUser = await storage.updateUserSettings(userId, { language, theme, privacyLevel });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Avatar upload route
  app.put('/api/profile/avatar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { profileImageUrl } = req.body;
      const currentUser = await storage.getUser(userId);
      const updatedUser = await storage.updateUserProfile(userId, { 
        profileImageUrl,
        numKids: currentUser?.numKids ?? 1
      });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating avatar:", error);
      res.status(500).json({ message: "Failed to update avatar" });
    }
  });

  // User's communities and events routes
  app.get('/api/user/communities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const communities = await storage.getUserCommunities(userId);
      res.json(communities);
    } catch (error) {
      console.error("Error fetching user communities:", error);
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  app.get('/api/user/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const events = await storage.getUserEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // User's created communities and events
  app.get('/api/user/created-communities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const communities = await storage.getUserCreatedCommunities(userId);
      res.json(communities);
    } catch (error) {
      console.error("Error fetching user created communities:", error);
      res.status(500).json({ message: "Failed to fetch created communities" });
    }
  });

  app.get('/api/user/created-events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const events = await storage.getUserCreatedEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user created events:", error);
      res.status(500).json({ message: "Failed to fetch created events" });
    }
  });

  // Account management routes
  app.delete('/api/account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteUser(userId);
      req.logout(() => {
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Community routes (public access for viewing)
  app.get('/api/communities', async (req, res) => {
    try {
      const { city } = req.query;
      const communities = city 
        ? await storage.getCommunitiesByCity(city as string)
        : await storage.getCommunities();
      res.json(communities);
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  app.get('/api/communities/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const community = await storage.getCommunity(id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      res.json(community);
    } catch (error) {
      console.error("Error fetching community:", error);
      res.status(500).json({ message: "Failed to fetch community" });
    }
  });

  app.post('/api/communities', isAuthenticated, async (req: any, res) => {
    try {
      const communityData = insertCommunitySchema.parse(req.body);
      const community = await storage.createCommunity(communityData);
      res.json(community);
    } catch (error) {
      console.error("Error creating community:", error);
      res.status(500).json({ message: "Failed to create community" });
    }
  });

  app.post('/api/communities/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const communityId = parseInt(req.params.id);
      await storage.joinCommunity(userId, communityId);
      res.json({ message: "Joined community successfully" });
    } catch (error) {
      console.error("Error joining community:", error);
      res.status(500).json({ message: "Failed to join community" });
    }
  });

  app.get('/api/communities/:id/membership', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const communityId = parseInt(req.params.id);
      const isMember = await storage.isMemberOfCommunity(userId, communityId);
      res.json({ isMember });
    } catch (error) {
      console.error("Error checking membership:", error);
      res.status(500).json({ message: "Failed to check membership" });
    }
  });

  // Event routes (public access for viewing)
  app.get('/api/events', async (req, res) => {
    try {
      const { city } = req.query;
      const events = city 
        ? await storage.getEventsByCity(city as string)
        : await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData, userId);
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.post('/api/events/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = parseInt(req.params.id);
      await storage.joinEvent(userId, eventId);
      res.json({ message: "Joined event successfully" });
    } catch (error) {
      console.error("Error joining event:", error);
      res.status(500).json({ message: "Failed to join event" });
    }
  });

  app.get('/api/events/:id/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = parseInt(req.params.id);
      const isAttending = await storage.isAttendingEvent(userId, eventId);
      res.json({ isAttending });
    } catch (error) {
      console.error("Error checking attendance:", error);
      res.status(500).json({ message: "Failed to check attendance" });
    }
  });

  // Message routes
  app.get('/api/communities/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const messages = await storage.getMessagesForCommunity(communityId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/communities/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const communityId = parseInt(req.params.id);
      const messageData = insertMessageSchema.parse({
        ...req.body,
        communityId,
      });
      const message = await storage.createMessage(messageData, userId);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Event message routes
  app.get('/api/events/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const messages = await storage.getMessagesForEvent(eventId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching event messages:", error);
      res.status(500).json({ message: "Failed to fetch event messages" });
    }
  });

  app.post('/api/events/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = parseInt(req.params.id);
      const messageData = insertMessageSchema.parse({
        ...req.body,
        eventId,
      });
      const message = await storage.createEventMessage(messageData, userId);
      res.json(message);
    } catch (error) {
      console.error("Error creating event message:", error);
      res.status(500).json({ message: "Failed to create event message" });
    }
  });

  // City message routes
  app.get('/api/cities/:city/messages', isAuthenticated, async (req, res) => {
    try {
      const city = req.params.city;
      const messages = await storage.getMessagesForCity(city);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching city messages:", error);
      res.status(500).json({ message: "Failed to fetch city messages" });
    }
  });

  app.post('/api/cities/:city/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const city = req.params.city;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        city,
      });
      const message = await storage.createCityMessage(messageData, userId);
      res.json(message);
    } catch (error) {
      console.error("Error creating city message:", error);
      res.status(500).json({ message: "Failed to create city message" });
    }
  });

  // Families routes (public access for viewing)
  app.get('/api/families', async (req, res) => {
    try {
      const { city } = req.query;
      const families = city 
        ? await storage.getFamiliesByCity(city as string)
        : await storage.getFamilies();
      res.json(families);
    } catch (error) {
      console.error("Error fetching families:", error);
      res.status(500).json({ message: "Failed to fetch families" });
    }
  });

  // School routes (public access for viewing)
  app.get('/api/schooling-methods', async (req, res) => {
    try {
      const methods = await storage.getSchoolingMethods();
      res.json(methods);
    } catch (error) {
      console.error("Error fetching schooling methods:", error);
      res.status(500).json({ message: "Failed to fetch schooling methods" });
    }
  });

  app.get('/api/schools', async (req, res) => {
    try {
      const { city, cities, methods } = req.query;
      let schools;
      
      if (methods) {
        const methodIds = (methods as string).split(',').map(id => parseInt(id));
        schools = await storage.getSchoolsByMethods(methodIds);
        
        // Apply city filter if provided along with methods
        if (cities) {
          const cityList = (cities as string).split(',');
          schools = schools.filter(school => 
            cityList.some(cityName => 
              school.city.toLowerCase().includes(cityName.toLowerCase())
            )
          );
        } else if (city) {
          schools = schools.filter(school => 
            school.city.toLowerCase().includes((city as string).toLowerCase())
          );
        }
      } else if (cities) {
        // Filter by multiple cities
        const cityList = (cities as string).split(',');
        const allSchools = await storage.getSchools();
        schools = allSchools.filter(school => 
          cityList.some(cityName => 
            school.city.toLowerCase().includes(cityName.toLowerCase())
          )
        );
      } else if (city) {
        schools = await storage.getSchoolsByCity(city as string);
      } else {
        schools = await storage.getSchools();
      }
      res.json(schools);
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });

  app.get('/api/schools/:id', async (req, res) => {
    try {
      const schoolId = parseInt(req.params.id);
      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      res.json(school);
    } catch (error) {
      console.error("Error fetching school:", error);
      res.status(500).json({ message: "Failed to fetch school" });
    }
  });

  app.post('/api/schools', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schoolData = insertSchoolSchema.parse(req.body);
      const school = await storage.createSchool(schoolData, userId);
      res.json(school);
    } catch (error) {
      console.error("Error creating school:", error);
      res.status(500).json({ message: "Failed to create school" });
    }
  });

  app.put('/api/schools/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schoolId = parseInt(req.params.id);
      const schoolData = insertSchoolSchema.parse(req.body);
      const school = await storage.updateSchool(schoolId, schoolData, userId);
      res.json(school);
    } catch (error) {
      console.error("Error updating school:", error);
      res.status(500).json({ message: "Failed to update school" });
    }
  });

  app.delete('/api/schools/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schoolId = parseInt(req.params.id);
      await storage.deleteSchool(schoolId, userId);
      res.json({ message: "School deleted successfully" });
    } catch (error) {
      console.error("Error deleting school:", error);
      res.status(500).json({ message: "Failed to delete school" });
    }
  });

  // School favorites
  app.post('/api/schools/:id/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schoolId = parseInt(req.params.id);
      await storage.addSchoolToFavorites(userId, schoolId);
      res.json({ message: "Added to favorites" });
    } catch (error) {
      console.error("Error adding to favorites:", error);
      res.status(500).json({ message: "Failed to add to favorites" });
    }
  });

  app.delete('/api/schools/:id/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schoolId = parseInt(req.params.id);
      await storage.removeSchoolFromFavorites(userId, schoolId);
      res.json({ message: "Removed from favorites" });
    } catch (error) {
      console.error("Error removing from favorites:", error);
      res.status(500).json({ message: "Failed to remove from favorites" });
    }
  });

  app.get('/api/schools/:id/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schoolId = parseInt(req.params.id);
      const isFavorited = await storage.isSchoolFavorited(userId, schoolId);
      res.json({ isFavorited });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  app.get('/api/user/favorite-schools', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schools = await storage.getUserFavoriteSchools(userId);
      res.json(schools);
    } catch (error) {
      console.error("Error fetching favorite schools:", error);
      res.status(500).json({ message: "Failed to fetch favorite schools" });
    }
  });

  // School attendees
  app.post('/api/schools/:id/attend', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schoolId = parseInt(req.params.id);
      const { methodId, status = 'attending' } = req.body;
      await storage.addSchoolAttendee(userId, schoolId, methodId, status);
      res.json({ message: "Added to school attendees" });
    } catch (error) {
      console.error("Error adding school attendee:", error);
      res.status(500).json({ message: "Failed to add school attendee" });
    }
  });

  app.delete('/api/schools/:id/attend', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schoolId = parseInt(req.params.id);
      await storage.removeSchoolAttendee(userId, schoolId);
      res.json({ message: "Removed from school attendees" });
    } catch (error) {
      console.error("Error removing school attendee:", error);
      res.status(500).json({ message: "Failed to remove school attendee" });
    }
  });

  app.get('/api/schools/:id/attendees', async (req, res) => {
    try {
      const schoolId = parseInt(req.params.id);
      const attendees = await storage.getSchoolAttendees(schoolId);
      res.json(attendees);
    } catch (error) {
      console.error("Error fetching school attendees:", error);
      res.status(500).json({ message: "Failed to fetch school attendees" });
    }
  });

  app.get('/api/schools/:id/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schoolId = parseInt(req.params.id);
      const isAttending = await storage.isUserAttendingSchool(userId, schoolId);
      res.json({ isAttending });
    } catch (error) {
      console.error("Error checking attendance:", error);
      res.status(500).json({ message: "Failed to check attendance" });
    }
  });

  // School posts and comments
  app.get('/api/schools/:id/posts', async (req, res) => {
    try {
      const schoolId = parseInt(req.params.id);
      const posts = await storage.getSchoolPosts(schoolId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching school posts:", error);
      res.status(500).json({ message: "Failed to fetch school posts" });
    }
  });

  app.post('/api/schools/:id/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schoolId = parseInt(req.params.id);
      const postData = insertSchoolPostSchema.parse({ ...req.body, schoolId });
      const post = await storage.createSchoolPost(postData, userId);
      res.json(post);
    } catch (error) {
      console.error("Error creating school post:", error);
      res.status(500).json({ message: "Failed to create school post" });
    }
  });

  app.post('/api/school-posts/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postId = parseInt(req.params.id);
      const commentData = insertSchoolCommentSchema.parse({ ...req.body, postId });
      const comment = await storage.createSchoolComment(commentData, userId);
      res.json(comment);
    } catch (error) {
      console.error("Error creating school comment:", error);
      res.status(500).json({ message: "Failed to create school comment" });
    }
  });

  // School teachers and photos
  app.get('/api/schools/:id/teachers', async (req, res) => {
    try {
      const schoolId = parseInt(req.params.id);
      const teachers = await storage.getSchoolTeachers(schoolId);
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching school teachers:", error);
      res.status(500).json({ message: "Failed to fetch school teachers" });
    }
  });

  app.post('/api/schools/:id/teachers', isAuthenticated, async (req: any, res) => {
    try {
      const schoolId = parseInt(req.params.id);
      const teacherData = insertSchoolTeacherSchema.parse({ ...req.body, schoolId });
      const teacher = await storage.createSchoolTeacher(teacherData);
      res.json(teacher);
    } catch (error) {
      console.error("Error creating school teacher:", error);
      res.status(500).json({ message: "Failed to create school teacher" });
    }
  });

  app.get('/api/schools/:id/photos', async (req, res) => {
    try {
      const schoolId = parseInt(req.params.id);
      const photos = await storage.getSchoolPhotos(schoolId);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching school photos:", error);
      res.status(500).json({ message: "Failed to fetch school photos" });
    }
  });

  app.post('/api/schools/:id/photos', isAuthenticated, async (req: any, res) => {
    try {
      const schoolId = parseInt(req.params.id);
      const photoData = insertSchoolPhotoSchema.parse({ ...req.body, schoolId });
      const photo = await storage.createSchoolPhoto(photoData);
      res.json(photo);
    } catch (error) {
      console.error("Error creating school photo:", error);
      res.status(500).json({ message: "Failed to create school photo" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.deleteNotification(notificationId);
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch unread notification count" });
    }
  });

  // Friend routes
  app.get('/api/friends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getUserFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get('/api/friend-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getUserFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.get('/api/friend-requests/sent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sentRequests = await storage.getSentFriendRequests(userId);
      res.json(sentRequests);
    } catch (error) {
      console.error("Error fetching sent friend requests:", error);
      res.status(500).json({ message: "Failed to fetch sent friend requests" });
    }
  });

  app.post('/api/friends/:friendId/request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friendId = req.params.friendId;
      
      // Check if they're already friends or have pending request
      const [areFriends, hasPending] = await Promise.all([
        storage.areFriends(userId, friendId),
        storage.hasPendingFriendRequest(userId, friendId)
      ]);
      
      if (areFriends) {
        return res.status(400).json({ message: "Already friends" });
      }
      
      if (hasPending) {
        return res.status(400).json({ message: "Friend request already sent" });
      }
      
      const friendRequest = await storage.sendFriendRequest(userId, friendId);
      
      // Create notification for the recipient
      await storage.createNotification({
        userId: friendId,
        type: "friend_request",
        title: "New Friend Request",
        message: "Someone sent you a friend request",
        relatedId: parseInt(userId),
        relatedType: "user"
      });
      
      res.json(friendRequest);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.put('/api/friend-requests/:id/accept', isAuthenticated, async (req: any, res) => {
    try {
      const friendRequestId = parseInt(req.params.id);
      await storage.acceptFriendRequest(friendRequestId);
      res.json({ message: "Friend request accepted" });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.put('/api/friend-requests/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const friendRequestId = parseInt(req.params.id);
      await storage.rejectFriendRequest(friendRequestId);
      res.json({ message: "Friend request rejected" });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      res.status(500).json({ message: "Failed to reject friend request" });
    }
  });

  app.delete('/api/friends/:friendId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friendId = req.params.friendId;
      await storage.removeFriend(userId, friendId);
      res.json({ message: "Friend removed" });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  app.get('/api/friend-status/:friendId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friendId = req.params.friendId;
      
      const [areFriends, hasPending] = await Promise.all([
        storage.areFriends(userId, friendId),
        storage.hasPendingFriendRequest(userId, friendId)
      ]);
      
      let status = "none";
      if (areFriends) status = "friends";
      else if (hasPending) status = "pending";
      
      res.json({ status });
    } catch (error) {
      console.error("Error checking friend status:", error);
      res.status(500).json({ message: "Failed to check friend status" });
    }
  });

  app.post('/api/friend-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { friendId } = req.body;
      
      // Check if they're already friends or have pending request
      const [areFriends, hasPending] = await Promise.all([
        storage.areFriends(userId, friendId),
        storage.hasPendingFriendRequest(userId, friendId)
      ]);
      
      if (areFriends) {
        return res.status(400).json({ message: "Already friends" });
      }
      
      if (hasPending) {
        return res.status(400).json({ message: "Friend request already sent" });
      }
      
      const friendRequest = await storage.sendFriendRequest(userId, friendId);
      
      // Create notification for the recipient
      await storage.createNotification({
        userId: friendId,
        type: "friend_request",
        title: "New Friend Request",
        message: "Someone sent you a friend request",
        relatedId: parseInt(userId),
        relatedType: "user"
      });
      
      res.json(friendRequest);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.delete('/api/friend-requests/:friendId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friendId = req.params.friendId;
      
      // Find and reject the friend request
      const sentRequests = await storage.getSentFriendRequests(userId);
      const request = sentRequests.find(r => r.friend.id === friendId);
      
      if (request) {
        await storage.rejectFriendRequest(request.id);
      }
      
      res.json({ message: "Friend request cancelled" });
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      res.status(500).json({ message: "Failed to cancel friend request" });
    }
  });

  app.get('/api/friends/:friendId/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friendId = req.params.friendId;
      
      const [areFriends, hasPending] = await Promise.all([
        storage.areFriends(userId, friendId),
        storage.hasPendingFriendRequest(userId, friendId)
      ]);
      
      res.json({ 
        areFriends, 
        hasPendingRequest: hasPending 
      });
    } catch (error) {
      console.error("Error checking friend status:", error);
      res.status(500).json({ message: "Failed to check friend status" });
    }
  });

  // Push notification routes
  app.post('/api/register-push-token', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tokenData = insertPushTokenSchema.parse(req.body);
      
      const pushToken = await storage.registerPushToken({
        ...tokenData,
        userId
      });
      
      res.json({ message: "Push token registered successfully", token: pushToken });
    } catch (error) {
      console.error("Error registering push token:", error);
      res.status(500).json({ message: "Failed to register push token" });
    }
  });

  app.get('/api/push-tokens', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tokens = await storage.getUserPushTokens(userId);
      res.json(tokens);
    } catch (error) {
      console.error("Error fetching push tokens:", error);
      res.status(500).json({ message: "Failed to fetch push tokens" });
    }
  });

  app.delete('/api/push-tokens/:token', isAuthenticated, async (req: any, res) => {
    try {
      const token = req.params.token;
      await storage.deactivatePushToken(token);
      res.json({ message: "Push token deactivated" });
    } catch (error) {
      console.error("Error deactivating push token:", error);
      res.status(500).json({ message: "Failed to deactivate push token" });
    }
  });

  app.post('/api/send-notification', isAuthenticated, async (req: any, res) => {
    try {
      const { userId, title, body, data } = req.body;
      
      // Get user's push tokens
      const pushTokens = await storage.getUserPushTokens(userId);
      
      if (pushTokens.length === 0) {
        return res.status(404).json({ message: "No push tokens found for user" });
      }

      // Here you would integrate with Firebase Admin SDK or other push service
      // For now, we'll create a notification in the database
      await storage.createNotification({
        userId,
        type: "message",
        title,
        message: body,
        relatedId: data?.relatedId || null,
        relatedType: data?.relatedType || null
      });

      res.json({ 
        message: "Notification sent successfully",
        tokensCount: pushTokens.length 
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
