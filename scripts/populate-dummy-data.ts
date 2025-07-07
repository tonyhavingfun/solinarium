#!/usr/bin/env tsx

import { db } from "../server/db";
import { users, communities, events, communityMembers, eventAttendees } from "../shared/schema";

// Dummy family data from around the world
const dummyFamilies = [
  { firstName: "Emma", lastName: "Johnson", city: "London", numKids: 2, bio: "Love exploring parks with our twins!" },
  { firstName: "Liam", lastName: "Smith", city: "London", numKids: 1, bio: "New dad looking for playgroups" },
  { firstName: "Sofia", lastName: "Garcia", city: "Madrid", numKids: 3, bio: "Homeschooling mom seeking community" },
  { firstName: "Carlos", lastName: "Rodriguez", city: "Madrid", numKids: 2, bio: "Weekend adventure seeker with family" },
  { firstName: "Marie", lastName: "Dubois", city: "Paris", numKids: 1, bio: "Art loving family, museums enthusiast" },
  { firstName: "Pierre", lastName: "Martin", city: "Paris", numKids: 2, bio: "Chef dad teaching kids to cook" },
  { firstName: "Anna", lastName: "Mueller", city: "Berlin", numKids: 2, bio: "Outdoor activities and nature walks" },
  { firstName: "Hans", lastName: "Schmidt", city: "Berlin", numKids: 1, bio: "Tech dad building treehouse for kids" },
  { firstName: "Giulia", lastName: "Rossi", city: "Rome", numKids: 3, bio: "Historical sites explorer with children" },
  { firstName: "Marco", lastName: "Bianchi", city: "Rome", numKids: 2, bio: "Soccer coach and family man" },
  { firstName: "Yuki", lastName: "Tanaka", city: "Tokyo", numKids: 1, bio: "Traditional crafts and modern parenting" },
  { firstName: "Hiroshi", lastName: "Sato", city: "Tokyo", numKids: 2, bio: "Anime loving dad, weekend cosplay" },
  { firstName: "Sarah", lastName: "Anderson", city: "New York", numKids: 2, bio: "Broadway shows and Central Park visits" },
  { firstName: "Michael", lastName: "Brown", city: "New York", numKids: 1, bio: "Food truck explorer with toddler" },
  { firstName: "Jessica", lastName: "Davis", city: "Los Angeles", numKids: 3, bio: "Beach days and hiking adventures" },
  { firstName: "David", lastName: "Wilson", city: "Los Angeles", numKids: 2, bio: "Movie industry dad, film enthusiast" },
  { firstName: "Emily", lastName: "Taylor", city: "Toronto", numKids: 1, bio: "Winter sports and maple syrup lover" },
  { firstName: "James", lastName: "Thompson", city: "Toronto", numKids: 2, bio: "Hockey coach for kids teams" },
  { firstName: "Olivia", lastName: "Lee", city: "Sydney", numKids: 2, bio: "Surf lessons and beach picnics" },
  { firstName: "Noah", lastName: "White", city: "Sydney", numKids: 1, bio: "Wildlife photographer teaching kids nature" },
  { firstName: "Isabella", lastName: "Silva", city: "São Paulo", numKids: 3, bio: "Carnival preparations and samba dancing" },
  { firstName: "Gabriel", lastName: "Santos", city: "São Paulo", numKids: 2, bio: "Football coach and family barbecues" },
  { firstName: "Chloe", lastName: "Martin", city: "Montreal", numKids: 1, bio: "Bilingual family, love winter festivals" },
  { firstName: "Lucas", lastName: "Tremblay", city: "Montreal", numKids: 2, bio: "Ice skating and snow fort builder" },
  { firstName: "Zoe", lastName: "Clark", city: "Vancouver", numKids: 2, bio: "Mountain hiking and whale watching" },
  { firstName: "Ryan", lastName: "Campbell", city: "Vancouver", numKids: 1, bio: "Craft beer dad and playground explorer" },
  { firstName: "Amelia", lastName: "Jones", city: "Melbourne", numKids: 3, bio: "Coffee culture and street art tours" },
  { firstName: "Jack", lastName: "Robinson", city: "Melbourne", numKids: 2, bio: "Cricket coach and weekend barbecues" },
  { firstName: "Ava", lastName: "Williams", city: "Dublin", numKids: 1, bio: "Irish music and storytelling traditions" },
  { firstName: "Conor", lastName: "O'Brien", city: "Dublin", numKids: 2, bio: "Pub quiz champion and family historian" },
  { firstName: "Mia", lastName: "Jensen", city: "Copenhagen", numKids: 2, bio: "Hygge lifestyle and bicycle adventures" },
  { firstName: "Lars", lastName: "Hansen", city: "Copenhagen", numKids: 1, bio: "LEGO builder and design enthusiast" },
  { firstName: "Luna", lastName: "Andersson", city: "Stockholm", numKids: 2, bio: "Forest schools and midsummer celebrations" },
  { firstName: "Erik", lastName: "Karlsson", city: "Stockholm", numKids: 3, bio: "IKEA furniture assembly master" },
  { firstName: "Aria", lastName: "Petrov", city: "Moscow", numKids: 1, bio: "Ballet classes and winter palace visits" },
  { firstName: "Dmitri", lastName: "Volkov", city: "Moscow", numKids: 2, bio: "Chess teacher and borscht recipe keeper" },
  { firstName: "Grace", lastName: "Kim", city: "Seoul", numKids: 2, bio: "K-pop dance classes and temple visits" },
  { firstName: "Min-jun", lastName: "Park", city: "Seoul", numKids: 1, bio: "Taekwondo instructor and kimchi maker" },
  { firstName: "Lily", lastName: "Chen", city: "Shanghai", numKids: 3, bio: "Dim sum weekends and calligraphy practice" },
  { firstName: "Wei", lastName: "Zhang", city: "Shanghai", numKids: 2, bio: "Martial arts and traditional medicine" },
  { firstName: "Ruby", lastName: "Patel", city: "Mumbai", numKids: 2, bio: "Bollywood dance and street food explorer" },
  { firstName: "Arjun", lastName: "Sharma", city: "Mumbai", numKids: 1, bio: "Cricket enthusiast and spice expert" },
  { firstName: "Sage", lastName: "Ahmed", city: "Cairo", numKids: 3, bio: "Pyramid adventures and ancient history" },
  { firstName: "Omar", lastName: "Hassan", city: "Cairo", numKids: 2, bio: "Archaeology enthusiast and desert camping" },
  { firstName: "Ivy", lastName: "Van Der Berg", city: "Amsterdam", numKids: 1, bio: "Canal boat rides and tulip festivals" },
  { firstName: "Finn", lastName: "De Vries", city: "Amsterdam", numKids: 2, bio: "Cycling adventures and cheese tasting" },
  { firstName: "Rose", lastName: "Johansson", city: "Oslo", numKids: 2, bio: "Northern lights chasing and skiing" },
  { firstName: "Magnus", lastName: "Berg", city: "Oslo", numKids: 1, bio: "Fjord hiking and fish farming" },
  { firstName: "Iris", lastName: "Müller", city: "Zurich", numKids: 2, bio: "Mountain climbing and chocolate making" },
  { firstName: "Stefan", lastName: "Weber", city: "Zurich", numKids: 3, bio: "Alpine adventures and watch collecting" }
];

// Dummy communities
const dummyCommunities = [
  { name: "London Family Network", city: "London", description: "Connecting families across London for playdates, activities, and support. We organize weekly meetups in various parks and kid-friendly venues." },
  { name: "Madrid Families Together", city: "Madrid", description: "A warm community for families in Madrid. We share parenting tips, organize cultural activities, and celebrate Spanish traditions together." },
  { name: "Paris Parents Circle", city: "Paris", description: "Bonjour families! Join us for museum visits, park picnics, and French language playdates. Perfect for expat and local families alike." },
  { name: "Berlin Family Hub", city: "Berlin", description: "Modern parenting meets traditional values. We organize outdoor adventures, educational workshops, and family-friendly cultural events." },
  { name: "Tokyo Family Connect", city: "Tokyo", description: "Bridging traditional Japanese culture with modern family life. Join us for festival celebrations, nature walks, and educational activities." },
  { name: "NYC Family Adventures", city: "New York", description: "The city that never sleeps has families that never stop exploring! From Central Park to Brooklyn Bridge, we discover NYC together." },
  { name: "Sydney Seaside Families", city: "Sydney", description: "Beach loving families unite! We organize surf lessons, beach cleanups, and harbour bridge walks for all ages." },
  { name: "Toronto Winter Warriors", city: "Toronto", description: "Embracing all four seasons with family fun. From ice skating to summer festivals, we make the most of Toronto's climate." },
  { name: "São Paulo Family Fiesta", city: "São Paulo", description: "Celebrating Brazilian culture with families. Carnival preparations, football matches, and amazing food adventures await!" },
  { name: "Amsterdam Canal Families", city: "Amsterdam", description: "Cycling through parenthood together! Canal boat trips, tulip garden visits, and stroopwafel making workshops for all." }
];

// Dummy events
const dummyEvents = [
  { title: "Hyde Park Picnic", description: "Family picnic with games and activities for children of all ages. Bring your own food or join our potluck!", date: "2025-07-15 11:00:00", time: "11:00 AM", location: "Hyde Park, Speaker's Corner", city: "London" },
  { title: "Children's Museum Visit", description: "Guided tour of the Children's Museum with interactive exhibits and learning activities.", date: "2025-07-20 10:00:00", time: "10:00 AM", location: "London Children's Museum", city: "London" },
  { title: "Retiro Park Nature Walk", description: "Exploring the beautiful Retiro Park with a nature guide. Kids will learn about local flora and fauna.", date: "2025-07-18 09:30:00", time: "9:30 AM", location: "Retiro Park Main Entrance", city: "Madrid" },
  { title: "Flamenco Workshop for Families", description: "Learn basic flamenco steps in a fun, family-friendly environment. All skill levels welcome!", date: "2025-07-25 16:00:00", time: "4:00 PM", location: "Casa de Flamenco", city: "Madrid" },
  { title: "Louvre Family Tour", description: "Special family-friendly tour of the Louvre with activities designed to engage children with art and history.", date: "2025-07-22 14:00:00", time: "2:00 PM", location: "Louvre Museum", city: "Paris" },
  { title: "Seine River Boat Ride", description: "Relaxing boat ride along the Seine with snacks and storytelling for children.", date: "2025-07-28 15:30:00", time: "3:30 PM", location: "Pont Neuf Dock", city: "Paris" },
  { title: "Tiergarten Adventure Hunt", description: "Treasure hunt adventure through Berlin's largest park with clues and prizes for families.", date: "2025-07-16 10:00:00", time: "10:00 AM", location: "Tiergarten Victory Column", city: "Berlin" },
  { title: "Science Center Workshop", description: "Hands-on science experiments and demonstrations perfect for curious young minds.", date: "2025-07-30 13:00:00", time: "1:00 PM", location: "Berlin Science Center", city: "Berlin" },
  { title: "Ueno Zoo Family Day", description: "Special family day at Ueno Zoo with feeding demonstrations and educational talks.", date: "2025-07-19 10:30:00", time: "10:30 AM", location: "Ueno Zoo", city: "Tokyo" },
  { title: "Traditional Tea Ceremony", description: "Family-friendly introduction to Japanese tea ceremony with kid-appropriate activities.", date: "2025-07-26 14:30:00", time: "2:30 PM", location: "Urasenke Foundation", city: "Tokyo" },
  { title: "Central Park Playground Tour", description: "Exploring the best playgrounds in Central Park with organized activities and new friends.", date: "2025-07-17 11:00:00", time: "11:00 AM", location: "Central Park Sheep Meadow", city: "New York" },
  { title: "Brooklyn Bridge Family Walk", description: "Guided walk across the iconic Brooklyn Bridge with historical stories and photo opportunities.", date: "2025-07-24 09:00:00", time: "9:00 AM", location: "Brooklyn Bridge Entrance", city: "New York" },
  { title: "Bondi Beach Surf Lessons", description: "Beginner-friendly surf lessons for families with certified instructors and safety equipment provided.", date: "2025-07-21 08:00:00", time: "8:00 AM", location: "Bondi Beach Surf School", city: "Sydney" },
  { title: "Harbour Bridge Climb for Families", description: "Special family climbing experience with safety gear and breathtaking views of Sydney.", date: "2025-07-27 10:00:00", time: "10:00 AM", location: "BridgeClimb Sydney", city: "Sydney" },
  { title: "CN Tower Family Visit", description: "Explore Toronto's iconic CN Tower with kid-friendly exhibits and the EdgeWalk experience for older children.", date: "2025-07-23 12:00:00", time: "12:00 PM", location: "CN Tower", city: "Toronto" },
  { title: "Ice Skating Lessons", description: "Learn to ice skate as a family with professional instructors and equipment rental included.", date: "2025-07-29 16:00:00", time: "4:00 PM", location: "Nathan Phillips Square Rink", city: "Toronto" },
  { title: "Ibirapuera Park Festival", description: "Family festival with live music, food vendors, and children's activities in São Paulo's largest park.", date: "2025-07-20 14:00:00", time: "2:00 PM", location: "Ibirapuera Park", city: "São Paulo" },
  { title: "Football Skills Workshop", description: "Learn football basics with former professional players. Equipment provided, all skill levels welcome.", date: "2025-07-25 10:00:00", time: "10:00 AM", location: "Vila Madalena Sports Center", city: "São Paulo" },
  { title: "Canal Boat Family Tour", description: "Discover Amsterdam from the water with a family-friendly canal boat tour including snacks and activities.", date: "2025-07-22 11:30:00", time: "11:30 AM", location: "Central Station Dock", city: "Amsterdam" },
  { title: "Keukenhof Tulip Gardens", description: "Visit the world-famous tulip gardens with special children's activities and photo opportunities.", date: "2025-07-26 09:00:00", time: "9:00 AM", location: "Keukenhof Gardens", city: "Amsterdam" }
];

async function populateDummyData() {
  console.log("Starting to populate dummy data...");

  try {
    // Insert dummy users
    console.log("Inserting dummy families...");
    const insertedUsers = [];
    for (let i = 0; i < dummyFamilies.length; i++) {
      const family = dummyFamilies[i];
      const [user] = await db.insert(users).values({
        id: `dummy_user_${i + 1}`,
        email: `${family.firstName.toLowerCase()}.${family.lastName.toLowerCase()}@example.com`,
        firstName: family.firstName,
        lastName: family.lastName,
        city: family.city,
        numKids: family.numKids,
        bio: family.bio,
        isDummy: true,
        profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${family.firstName}`
      }).returning();
      insertedUsers.push(user);
    }
    console.log(`Inserted ${insertedUsers.length} dummy families`);

    // Insert dummy communities
    console.log("Inserting dummy communities...");
    const insertedCommunities = [];
    for (const community of dummyCommunities) {
      const [comm] = await db.insert(communities).values({
        name: community.name,
        city: community.city,
        description: community.description,
        isDummy: true,
        memberCount: Math.floor(Math.random() * 15) + 5 // 5-20 members
      }).returning();
      insertedCommunities.push(comm);
    }
    console.log(`Inserted ${insertedCommunities.length} dummy communities`);

    // Insert dummy events
    console.log("Inserting dummy events...");
    for (const event of dummyEvents) {
      // Find a random user from the same city to be the creator
      const cityUsers = insertedUsers.filter(u => u.city === event.city);
      const creator = cityUsers[Math.floor(Math.random() * cityUsers.length)];
      
      await db.insert(events).values({
        title: event.title,
        description: event.description,
        date: new Date(event.date),
        time: event.time,
        location: event.location,
        city: event.city,
        createdBy: creator.id,
        isDummy: true,
        attendeeCount: Math.floor(Math.random() * 10) + 3 // 3-12 attendees
      });
    }
    console.log(`Inserted ${dummyEvents.length} dummy events`);

    // Add some community memberships
    console.log("Adding community memberships...");
    for (const community of insertedCommunities) {
      const cityUsers = insertedUsers.filter(u => u.city === community.city);
      const memberCount = Math.min(community.memberCount, cityUsers.length);
      const shuffledUsers = cityUsers.sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < memberCount; i++) {
        await db.insert(communityMembers).values({
          userId: shuffledUsers[i].id,
          communityId: community.id
        });
      }
    }
    console.log("Added community memberships");

    console.log("✅ Successfully populated database with dummy data!");
    console.log(`- ${insertedUsers.length} families`);
    console.log(`- ${insertedCommunities.length} communities`);
    console.log(`- ${dummyEvents.length} events`);
    console.log("\nAll dummy data is marked with isDummy: true for easy removal later.");

  } catch (error) {
    console.error("❌ Error populating dummy data:", error);
    process.exit(1);
  }
}

// Run the script
populateDummyData().then(() => {
  console.log("Script completed successfully!");
  process.exit(0);
});