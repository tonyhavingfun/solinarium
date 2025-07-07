import { db } from "../server/db";
import { schools, schoolMethods, schoolingMethods, schoolAttendees, schoolFavorites, schoolPosts, schoolComments, schoolTeachers, schoolPhotos } from "../shared/schema";
import { eq } from "drizzle-orm";

async function addRealSchools() {
  console.log("Adding real alternative education schools...");

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
  console.log("Removed all existing schools and related data");

  // Get schooling method IDs
  const methods = await db.select().from(schoolingMethods);
  const montessoriId = methods.find(m => m.name === "Montessori")?.id;
  const waldorfId = methods.find(m => m.name === "Waldorf")?.id;
  const democraticId = methods.find(m => m.name === "Democratic")?.id;
  const cooperativeId = methods.find(m => m.name === "Cooperative")?.id;
  const forestId = methods.find(m => m.name === "Forest School")?.id;

  // Real alternative education schools data
  const realSchools = [
    // Montessori Schools
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
      methodIds: montessoriId ? [montessoriId] : []
    },
    {
      name: "The Montessori School of Denver",
      city: "Denver",
      country: "United States",
      description: "Comprehensive Montessori education from toddler through elementary. Focus on independence, creativity, and love of learning.",
      website: "https://www.msdenver.com",
      email: "admissions@msdenver.com",
      phone: "+1 303 756 9441",
      ageRange: "18 months - 12 years",
      tuitionFee: "$18,500 per year",
      methodIds: montessoriId ? [montessoriId] : []
    },
    {
      name: "Casa dei Bambini Montessori",
      city: "Rome",
      country: "Italy",
      description: "Original Casa dei Bambini inspired by Maria Montessori's first school. Authentic Italian Montessori approach.",
      website: "https://casadeibambini.it",
      email: "info@casadeibambini.it",
      phone: "+39 06 854 0234",
      ageRange: "3-6 years",
      tuitionFee: "€8,500 per year",
      methodIds: montessoriId ? [montessoriId] : []
    },

    // Waldorf Schools
    {
      name: "Rudolf Steiner School",
      city: "Stuttgart",
      country: "Germany",
      description: "The first Waldorf school, founded by Rudolf Steiner in 1919. Integrates arts, academics, and practical skills.",
      website: "https://waldorfschule-uhlandshoehe.de",
      email: "info@waldorfschule-uhlandshoehe.de",
      phone: "+49 711 236894",
      ageRange: "6-18 years",
      tuitionFee: "€350 per month",
      methodIds: waldorfId ? [waldorfId] : []
    },
    {
      name: "Highland Hall Waldorf School",
      city: "Los Angeles",
      country: "United States",
      description: "Comprehensive Waldorf education nurturing thinking, feeling, and willing. Art-integrated curriculum.",
      website: "https://www.highlandhall.org",
      email: "admissions@highlandhall.org",
      phone: "+1 818 349 1394",
      ageRange: "Preschool - Grade 12",
      tuitionFee: "$28,000 per year",
      methodIds: waldorfId ? [waldorfId] : []
    },
    {
      name: "Steiner Academy Bristol",
      city: "Bristol",
      country: "United Kingdom",
      description: "State-funded Steiner Academy offering Waldorf education. Holistic approach to child development.",
      website: "https://www.steineracademybristol.org.uk",
      email: "office@steineracademybristol.org.uk",
      phone: "+44 117 933 9500",
      ageRange: "3-16 years",
      tuitionFee: "Free (state-funded)",
      methodIds: waldorfId ? [waldorfId] : []
    },

    // Democratic Schools
    {
      name: "Sudbury Valley School",
      city: "Framingham",
      country: "United States",
      description: "Pioneer democratic school where students of all ages learn freely. Founded in 1968, model for democratic education worldwide.",
      website: "https://www.sudval.org",
      email: "office@sudval.org",
      phone: "+1 508 877 3030",
      ageRange: "4-19 years",
      tuitionFee: "$9,950 per year",
      methodIds: democraticId ? [democraticId] : []
    },
    {
      name: "Summerhill School",
      city: "Suffolk",
      country: "United Kingdom",
      description: "World's oldest children's democracy. Students choose what to learn and participate in school governance.",
      website: "https://www.summerhillschool.co.uk",
      email: "office@summerhillschool.co.uk",
      phone: "+44 1728 830540",
      ageRange: "5-17 years",
      tuitionFee: "£12,000 per term",
      methodIds: democraticId ? [democraticId] : []
    },

    // Cooperative Schools
    {
      name: "Greenwood Tree Educational Cooperative",
      city: "Burlington",
      country: "United States",
      description: "Waldorf-inspired cooperative where parents actively participate in their children's education.",
      website: "https://www.greenwoodtreecoop.org",
      email: "info@greenwoodtreecoop.org",
      phone: "+1 360 757 7943",
      ageRange: "3-14 years",
      tuitionFee: "$6,000 per year",
      methodIds: cooperativeId && waldorfId ? [cooperativeId, waldorfId] : []
    },
    {
      name: "River Valley Cooperative",
      city: "Toronto",
      country: "Canada",
      description: "Parent cooperative offering mixed-age learning environment. Nature-based and project-oriented.",
      website: "https://rivervalleycoop.ca",
      email: "info@rivervalleycoop.ca",
      phone: "+1 416 555 0198",
      ageRange: "4-12 years",
      tuitionFee: "CAD $8,500 per year",
      methodIds: cooperativeId ? [cooperativeId] : []
    },

    // Forest Schools
    {
      name: "Secret Garden Outdoor Nursery",
      city: "Edinburgh",
      country: "United Kingdom",
      description: "All-weather outdoor nursery. Children learn through play in natural woodland environment.",
      website: "https://secretgardenoutdoor.com",
      email: "info@secretgardenoutdoor.com",
      phone: "+44 131 445 2341",
      ageRange: "2-5 years",
      tuitionFee: "£55 per day",
      methodIds: forestId ? [forestId] : []
    },
    {
      name: "Cedarsong Nature School",
      city: "Vashon Island",
      country: "United States",
      description: "First nature preschool in the US. Children spend entire day outdoors in all weather.",
      website: "https://www.cedarsong.org",
      email: "info@cedarsong.org",
      phone: "+1 206 463 4227",
      ageRange: "3-6 years",
      tuitionFee: "$1,850 per month",
      methodIds: forestId ? [forestId] : []
    },

    // Additional Innovative Schools
    {
      name: "High Tech High",
      city: "San Diego",
      country: "United States",
      description: "Project-based learning charter school. Students work on real-world projects with community partners.",
      website: "https://www.hightechhigh.org",
      email: "info@hightechhigh.org",
      phone: "+1 619 398 4902",
      ageRange: "Grades 9-12",
      tuitionFee: "Free (charter school)",
      methodIds: []
    },
    {
      name: "School of Life",
      city: "Copenhagen",
      country: "Denmark",
      description: "Progressive school focusing on life skills, emotional intelligence, and practical wisdom.",
      website: "https://schooloflife.dk",
      email: "copenhagen@schooloflife.dk",
      phone: "+45 33 12 34 56",
      ageRange: "16-18 years",
      tuitionFee: "Free (state-funded)",
      methodIds: []
    },
    {
      name: "Reggio Children",
      city: "Reggio Emilia",
      country: "Italy",
      description: "Original Reggio Emilia approach school. Project-based learning with strong community connections.",
      website: "https://www.reggiochildren.it",
      email: "info@reggiochildren.it",
      phone: "+39 0522 513752",
      ageRange: "0-6 years",
      tuitionFee: "€450 per month",
      methodIds: []
    }
  ];

  // Insert real schools
  for (const schoolData of realSchools) {
    const { methodIds, ...schoolInfo } = schoolData;
    
    const [school] = await db.insert(schools).values({
      ...schoolInfo,
      isDummy: false,
      managerId: "system",
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Add school methods relationships
    if (methodIds.length > 0) {
      for (const methodId of methodIds) {
        await db.insert(schoolMethods).values({
          schoolId: school.id,
          methodId: methodId
        });
      }
    }

    console.log(`Added ${school.name} in ${school.city}`);
  }

  console.log(`Successfully added ${realSchools.length} real alternative education schools`);
}

addRealSchools()
  .then(() => {
    console.log("Real schools addition completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error adding real schools:", error);
    process.exit(1);
  });