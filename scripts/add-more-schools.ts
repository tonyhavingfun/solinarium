import { db } from "../server/db";
import { schools, schoolMethods, schoolingMethods } from "../shared/schema";

async function addMoreSchools() {
  try {
    console.log("Adding more test schools...");

    // Get existing schooling methods
    const methods = await db.select().from(schoolingMethods);
    console.log("Found schooling methods:", methods.map(m => m.name));

    const newSchools = [
      // European Schools
      {
        name: "Amsterdam Creative Learning Hub",
        city: "Amsterdam",
        description: "A vibrant community-based school focusing on creative arts, project-based learning, and multilingual education in the heart of Amsterdam.",
        website: "https://example.com/amsterdam-creative",
        phone: "+31 20 123 4567",
        email: "info@amsterdam-creative.nl",
        address: "Vondelpark 15, Amsterdam",
        whatsapp: "+31612345678",
        telegram: "@amsterdam_creative",
        ageRange: "6-16",
        capacity: 120,
        fees: "€450/month",
        latitude: 52.3676,
        longitude: 4.9041,
        logoUrl: null,
        bannerUrl: null,
        photoUrls: [],
        isDummy: true,
        createdBy: "system"
      },
      {
        name: "Barcelona Montessori International",
        city: "Barcelona", 
        description: "Authentic Montessori education with Spanish, Catalan and English instruction. Beautiful Mediterranean campus with outdoor learning spaces.",
        website: "https://example.com/barcelona-montessori",
        phone: "+34 93 456 7890",
        email: "admissions@bcn-montessori.es",
        address: "Carrer de Balmes 123, Barcelona",
        whatsapp: "+34612345678",
        telegram: "@bcn_montessori",
        ageRange: "3-12",
        capacity: 80,
        fees: "€380/month",
        latitude: 41.3874,
        longitude: 2.1686,
        logoUrl: null,
        bannerUrl: null,
        photoUrls: [],
        isDummy: true,
        createdBy: "system"
      },
      {
        name: "Copenhagen Democratic School",
        city: "Copenhagen",
        description: "Student-led democratic education where children choose their own learning path. Emphasis on self-directed learning and community decision-making.",
        website: "https://example.com/copenhagen-democratic",
        phone: "+45 12 34 56 78",
        email: "info@cph-democratic.dk",
        address: "Østerbrogade 67, Copenhagen",
        whatsapp: "+4512345678",
        telegram: "@cph_democratic",
        ageRange: "5-18",
        capacity: 100,
        fees: "3200 DKK/month",
        latitude: 55.6761,
        longitude: 12.5683,
        logoUrl: null,
        bannerUrl: null,
        photoUrls: [],
        isDummy: true,
        createdBy: "system"
      },
      
      // North American Schools
      {
        name: "Toronto Waldorf Academy",
        city: "Toronto",
        description: "Steiner-Waldorf education emphasizing imagination, creativity, and hands-on learning. Arts-integrated curriculum from kindergarten through high school.",
        website: "https://example.com/toronto-waldorf",
        phone: "+1 416 555 0123",
        email: "info@toronto-waldorf.ca",
        address: "456 Queen St W, Toronto, ON",
        whatsapp: "+14165550123",
        telegram: "@toronto_waldorf",
        ageRange: "4-18",
        capacity: 200,
        fees: "CAD $850/month",
        latitude: 43.6532,
        longitude: -79.3832,
        logoUrl: null,
        bannerUrl: null,
        photoUrls: [],
        isDummy: true,
        createdBy: "system"
      },
      {
        name: "NYC Unschooling Collective",
        city: "New York",
        description: "Radical unschooling approach with no mandatory curriculum. Children pursue their interests with guidance from facilitators and peer learning.",
        website: "https://example.com/nyc-unschooling",
        phone: "+1 212 555 0789",
        email: "connect@nyc-unschooling.org",
        address: "123 Park Ave, New York, NY",
        whatsapp: "+12125550789",
        telegram: "@nyc_unschooling",
        ageRange: "5-17",
        capacity: 60,
        fees: "$1200/month",
        latitude: 40.7128,
        longitude: -74.0060,
        logoUrl: null,
        bannerUrl: null,
        photoUrls: [],
        isDummy: true,
        createdBy: "system"
      },
      {
        name: "San Francisco Tech Academy",
        city: "San Francisco",
        description: "STEM-focused education with coding, robotics, and innovation labs. Project-based learning preparing students for the digital future.",
        website: "https://example.com/sf-tech-academy",
        phone: "+1 415 555 0456",
        email: "admissions@sf-tech.edu",
        address: "789 Mission St, San Francisco, CA",
        whatsapp: "+14155550456",
        telegram: "@sf_tech_academy",
        ageRange: "8-18",
        capacity: 150,
        fees: "$1500/month",
        latitude: 37.7749,
        longitude: -122.4194,
        logoUrl: null,
        bannerUrl: null,
        photoUrls: [],
        isDummy: true,
        createdBy: "system"
      },
      
      // Asia-Pacific Schools
      {
        name: "Tokyo International Homeschool",
        city: "Tokyo",
        description: "Bilingual Japanese-English education with cultural exchange programs. Flexible schedule accommodating traditional Japanese values and modern learning.",
        website: "https://example.com/tokyo-international",
        phone: "+81 3 1234 5678",
        email: "info@tokyo-international.jp",
        address: "1-2-3 Shibuya, Tokyo",
        whatsapp: "+819012345678",
        telegram: "@tokyo_international",
        ageRange: "6-15",
        capacity: 90,
        fees: "¥80,000/month",
        latitude: 35.6762,
        longitude: 139.6503,
        logoUrl: null,
        bannerUrl: null,
        photoUrls: [],
        isDummy: true,
        createdBy: "system"
      },
      {
        name: "Sydney Nature School",
        city: "Sydney",
        description: "Outdoor education with weekly bushwalks, beach studies, and environmental science. Learning through connection with Australian nature.",
        website: "https://example.com/sydney-nature",
        phone: "+61 2 9876 5432",
        email: "info@sydney-nature.edu.au",
        address: "45 Harbour Bridge Rd, Sydney NSW",
        whatsapp: "+61987654321",
        telegram: "@sydney_nature",
        ageRange: "5-12",
        capacity: 70,
        fees: "AUD $600/month",
        latitude: -33.8688,
        longitude: 151.2093,
        logoUrl: null,
        bannerUrl: null,
        photoUrls: [],
        isDummy: true,
        createdBy: "system"
      },
      
      // South American Schools
      {
        name: "São Paulo Alternative Learning",
        city: "São Paulo", 
        description: "Progressive education with Portuguese-English bilingual instruction. Focus on social justice, community engagement, and Brazilian cultural heritage.",
        website: "https://example.com/sp-alternative",
        phone: "+55 11 9876 5432",
        email: "contato@sp-alternative.com.br",
        address: "Rua Augusta 1234, São Paulo",
        whatsapp: "+5511987654321",
        telegram: "@sp_alternative",
        ageRange: "4-16",
        capacity: 110,
        fees: "R$ 800/month",
        latitude: -23.5505,
        longitude: -46.6333,
        logoUrl: null,
        bannerUrl: null,
        photoUrls: [],
        isDummy: true,
        createdBy: "system"
      },
      
      // African Schools
      {
        name: "Cape Town Ubuntu Academy",
        city: "Cape Town",
        description: "Ubuntu philosophy-based education emphasizing community, empathy, and African wisdom traditions alongside modern academics.",
        website: "https://example.com/capetown-ubuntu",
        phone: "+27 21 456 7890",
        email: "info@ubuntu-academy.co.za",
        address: "15 Table Mountain Dr, Cape Town",
        whatsapp: "+27821234567",
        telegram: "@ubuntu_academy",
        ageRange: "6-18",
        capacity: 85,
        fees: "ZAR 2500/month",
        latitude: -33.9249,
        longitude: 18.4241,
        logoUrl: null,
        bannerUrl: null,
        photoUrls: [],
        isDummy: true,
        createdBy: "system"
      },
      
      // Additional Specialty Schools
      {
        name: "Oslo Forest Kindergarten",
        city: "Oslo",
        description: "Traditional Norwegian forest kindergarten where children spend most of their day outdoors in all weather conditions, building resilience and nature connection.",
        website: "https://example.com/oslo-forest",
        phone: "+47 12 34 56 78",
        email: "info@oslo-forest.no",
        address: "Frognerveien 89, Oslo",
        whatsapp: "+4712345678",
        telegram: "@oslo_forest",
        ageRange: "3-6",
        capacity: 40,
        fees: "4500 NOK/month",
        latitude: 59.9139,
        longitude: 10.7522,
        logoUrl: null,
        bannerUrl: null,
        photoUrls: [],
        isDummy: true,
        createdBy: "system"
      },
      {
        name: "Dublin Gaelic Heritage School",
        city: "Dublin",
        description: "Immersive Irish Gaelic education preserving Celtic traditions while providing modern academic excellence. Music, dance, and storytelling integrated.",
        website: "https://example.com/dublin-gaelic",
        phone: "+353 1 234 5678",
        email: "eolas@dublin-gaelic.ie",
        address: "O'Connell Street 45, Dublin",
        whatsapp: "+353871234567",
        telegram: "@dublin_gaelic",
        ageRange: "4-15",
        capacity: 95,
        fees: "€420/month",
        latitude: 53.3498,
        longitude: -6.2603,
        logoUrl: null,
        bannerUrl: null,
        photoUrls: [],
        isDummy: true,
        createdBy: "system"
      }
    ];

    // Insert schools
    const insertedSchools = await db.insert(schools).values(newSchools).returning();
    console.log(`Added ${insertedSchools.length} new schools`);

    // Add school methods associations
    for (const school of insertedSchools) {
      // Randomly assign 1-3 methods to each school
      const numMethods = Math.floor(Math.random() * 3) + 1;
      const shuffledMethods = methods.sort(() => Math.random() - 0.5);
      const assignedMethods = shuffledMethods.slice(0, numMethods);
      
      for (const method of assignedMethods) {
        await db.insert(schoolMethods).values({
          schoolId: school.id,
          methodId: method.id
        });
      }
    }

    console.log("Successfully added all new schools with method associations!");
    console.log("Schools added in cities:", newSchools.map(s => s.city).join(", "));

  } catch (error) {
    console.error("Error adding schools:", error);
  }
}

// Run the script
addMoreSchools().then(() => {
  console.log("Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});