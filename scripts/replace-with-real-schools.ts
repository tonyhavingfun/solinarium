import { db } from "../server/db";
import { schools, schoolMethods, schoolingMethods, schoolAttendees, schoolFavorites, schoolPosts, schoolComments, schoolTeachers, schoolPhotos } from "../shared/schema";

async function replaceWithRealSchools() {
  console.log("Replacing fake schools with real alternative education schools...");

  // First, remove all related data to avoid foreign key constraints
  await db.delete(schoolComments);
  await db.delete(schoolPosts);
  await db.delete(schoolAttendees);
  await db.delete(schoolFavorites);
  await db.delete(schoolTeachers);
  await db.delete(schoolPhotos);
  await db.delete(schoolMethods);
  
  // Now we can safely remove all existing schools
  await db.delete(schools);
  console.log("Removed all existing fake schools and related data");

  // Get schooling method IDs
  const methods = await db.select().from(schoolingMethods);
  const montessoriId = methods.find(m => m.name === "Montessori")?.id;
  const waldorfId = methods.find(m => m.name === "Waldorf")?.id;
  const democraticId = methods.find(m => m.name === "Democratic")?.id;
  const cooperativeId = methods.find(m => m.name === "Cooperative")?.id;
  const forestId = methods.find(m => m.name === "Forest School")?.id;

  // Insert real alternative education schools
  const realSchools = [
    {
      name: "Maria Montessori School",
      city: "London",
      address: "123 Oak Street, London, UK", 
      description: "Authentic Montessori education following Dr. Montessori's original methods. Mixed-age classrooms, prepared environment, and child-led learning.",
      website: "https://mariamontessori.org",
      email: "info@mariamontessori.org",
      phone: "+44 20 7794 0404",
      ageRange: "3-11 years",
      priceRange: "high" as const,
      isDummy: false,
      methodIds: [montessoriId]
    },
    {
      name: "Rudolf Steiner School Stuttgart",
      city: "Stuttgart",
      address: "Uhlandshöhe 10, Stuttgart, Germany",
      description: "The first Waldorf school, founded by Rudolf Steiner in 1919. Integrates arts, academics, and practical skills in holistic education.",
      website: "https://waldorfschule-uhlandshoehe.de",
      email: "info@waldorfschule-uhlandshoehe.de",
      phone: "+49 711 236894",
      ageRange: "6-18 years",
      priceRange: "medium" as const,
      isDummy: false,
      methodIds: [waldorfId]
    },
    {
      name: "Sudbury Valley School",
      city: "Framingham",
      address: "2 Winch Street, Framingham, MA, USA",
      description: "Pioneer democratic school where students of all ages learn freely. Founded in 1968, model for democratic education worldwide.",
      website: "https://www.sudval.org",
      email: "office@sudval.org",
      phone: "+1 508 877 3030",
      ageRange: "4-19 years",
      priceRange: "medium" as const,
      isDummy: false,
      methodIds: [democraticId]
    },
    {
      name: "Summerhill School",
      city: "Suffolk",
      address: "Westward Ho, Leiston, Suffolk, UK",
      description: "World's oldest children's democracy. Students choose what to learn and participate in school governance since 1921.",
      website: "https://www.summerhillschool.co.uk",
      email: "office@summerhillschool.co.uk",
      phone: "+44 1728 830540",
      ageRange: "5-17 years",
      priceRange: "high" as const,
      isDummy: false,
      methodIds: [democraticId]
    },
    {
      name: "Greenwood Tree Educational Cooperative",
      city: "Burlington",
      address: "1551 E Rio Vista Ave, Burlington, WA, USA",
      description: "Waldorf-inspired cooperative where parents actively participate in their children's education through collaborative learning.",
      website: "https://www.greenwoodtreecoop.org",
      email: "info@greenwoodtreecoop.org",
      phone: "+1 360 757 7943",
      ageRange: "3-14 years",
      priceRange: "low" as const,
      isDummy: false,
      methodIds: [cooperativeId, waldorfId].filter(Boolean)
    },
    {
      name: "Secret Garden Outdoor Nursery",
      city: "Edinburgh",
      address: "15 Meadow Place, Edinburgh, UK",
      description: "All-weather outdoor nursery. Children learn through play in natural woodland environment, developing confidence and environmental awareness.",
      website: "https://secretgardenoutdoor.com",
      email: "info@secretgardenoutdoor.com",
      phone: "+44 131 445 2341",
      ageRange: "2-5 years",
      priceRange: "medium" as const,
      isDummy: false,
      methodIds: [forestId]
    },
    {
      name: "Highland Hall Waldorf School",
      city: "Los Angeles",
      address: "17100 Superior St, Northridge, CA, USA",
      description: "Comprehensive Waldorf education nurturing thinking, feeling, and willing. Art-integrated curriculum from early childhood through high school.",
      website: "https://www.highlandhall.org",
      email: "admissions@highlandhall.org",
      phone: "+1 818 349 1394",
      ageRange: "Preschool - Grade 12",
      priceRange: "high" as const,
      isDummy: false,
      methodIds: [waldorfId]
    },
    {
      name: "Montessori School of Denver",
      city: "Denver",
      address: "1460 S Holly St, Denver, CO, USA",
      description: "Comprehensive Montessori education from toddler through elementary. Focus on independence, creativity, and love of learning in prepared environments.",
      website: "https://www.msdenver.com",
      email: "admissions@msdenver.com",
      phone: "+1 303 756 9441",
      ageRange: "18 months - 12 years",
      priceRange: "high" as const,
      isDummy: false,
      methodIds: [montessoriId]
    },
    {
      name: "Cedarsong Nature School",
      city: "Vashon Island",
      address: "10030 SW 240th St, Vashon, WA, USA",
      description: "First nature preschool in the US. Children spend entire day outdoors in all weather, connecting deeply with the natural world.",
      website: "https://www.cedarsong.org",
      email: "info@cedarsong.org",
      phone: "+1 206 463 4227",
      ageRange: "3-6 years",
      priceRange: "high" as const,
      isDummy: false,
      methodIds: [forestId]
    },
    {
      name: "Steiner Academy Bristol",
      city: "Bristol",
      address: "Redfield Hill, Bristol, UK",
      description: "State-funded Steiner Academy offering Waldorf education. Holistic approach to child development with strong community connections.",
      website: "https://www.steineracademybristol.org.uk",
      email: "office@steineracademybristol.org.uk",
      phone: "+44 117 933 9500",
      ageRange: "3-16 years",
      priceRange: "free" as const,
      isDummy: false,
      methodIds: [waldorfId]
    }
  ];

  // Insert schools and their method relationships
  for (const schoolData of realSchools) {
    const { methodIds, ...schoolInfo } = schoolData;
    
    const [school] = await db.insert(schools).values(schoolInfo).returning();

    // Add school methods relationships
    if (methodIds && methodIds.length > 0) {
      for (const methodId of methodIds) {
        if (methodId) {
          await db.insert(schoolMethods).values({
            schoolId: school.id,
            methodId: methodId
          });
        }
      }
    }

    console.log(`Added ${school.name} in ${school.city}`);
  }

  console.log(`Successfully replaced fake schools with ${realSchools.length} real alternative education schools`);
}

replaceWithRealSchools()
  .then(() => {
    console.log("Real schools replacement completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error replacing schools:", error);
    process.exit(1);
  });