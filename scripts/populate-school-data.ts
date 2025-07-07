import { db } from "../server/db";
import { schoolingMethods, schools, schoolMethods, schoolTeachers, schoolPhotos } from "@shared/schema";

async function populateSchoolData() {
  console.log("Starting to populate school data...");

  try {
    // Insert schooling methods
    console.log("Inserting schooling methods...");
    const methods = await db.insert(schoolingMethods).values([
      {
        name: "Montessori",
        description: "Child-led approach focused on hands-on learning and self-directed activities",
        shortDescription: "Child-led hands-on learning",
        color: "#E53E3E",
        icon: "Sparkles"
      },
      {
        name: "Waldorf",
        description: "Education that nurtures imagination, creativity, and practical skills through artistic and academic learning",
        shortDescription: "Arts-integrated holistic education",
        color: "#38A169",
        icon: "Palette"
      },
      {
        name: "Nature-Based",
        description: "Outdoor education emphasizing connection with nature and environmental learning",
        shortDescription: "Outdoor environmental learning",
        color: "#22C55E",
        icon: "Trees"
      },
      {
        name: "Traditional",
        description: "Structured curriculum-based education with formal academic instruction",
        shortDescription: "Structured curriculum-based",
        color: "#3B82F6",
        icon: "Book"
      },
      {
        name: "Democratic",
        description: "Student-directed learning with shared decision-making and self-governance",
        shortDescription: "Student-directed learning",
        color: "#8B5CF6",
        icon: "Users"
      },
      {
        name: "Reggio Emilia",
        description: "Project-based learning emphasizing creativity, exploration, and community involvement",
        shortDescription: "Project-based creative learning",
        color: "#F59E0B",
        icon: "Lightbulb"
      },
      {
        name: "Homeschool Cooperative",
        description: "Parent-led education with shared resources and collaborative learning",
        shortDescription: "Parent-led collaborative",
        color: "#EC4899",
        icon: "Home"
      },
      {
        name: "Unschooling",
        description: "Child-led learning without formal curriculum, following natural interests",
        shortDescription: "Child-led natural learning",
        color: "#06B6D4",
        icon: "Compass"
      }
    ]).returning();

    console.log(`Inserted ${methods.length} schooling methods`);

    // Insert schools
    console.log("Inserting schools...");
    const schoolsData = await db.insert(schools).values([
      {
        name: "Forest Grove Montessori",
        city: "London",
        address: "123 Oak Street, London, UK",
        description: "A nurturing Montessori environment where children develop independence, creativity, and love for learning through hands-on experiences in a prepared environment.",
        shortDescription: "Authentic Montessori education for ages 3-12 in central London",
        website: "https://forestgrovemontessori.co.uk",
        email: "info@forestgrovemontessori.co.uk",
        phone: "+44 20 7123 4567",
        whatsapp: "+44 7890 123456",
        ageRange: "3-12 years",
        capacity: 60,
        yearEstablished: 2018,
        priceRange: "medium",
        isActive: true,
        isDummy: true
      },
      {
        name: "Berlin Nature School",
        city: "Berlin",
        address: "Unter den Linden 456, Berlin, Germany",
        description: "An innovative nature-based school where children learn through direct contact with the natural world, developing environmental consciousness and practical life skills.",
        shortDescription: "Nature-based education in the heart of Berlin",
        website: "https://berlin-nature-school.de",
        email: "hello@berlin-nature-school.de",
        phone: "+49 30 1234 5678",
        telegram: "@berlin_nature_school",
        ageRange: "6-14 years",
        capacity: 45,
        yearEstablished: 2020,
        priceRange: "low",
        isActive: true,
        isDummy: true
      },
      {
        name: "Madrid Waldorf Community",
        city: "Madrid",
        address: "Calle de la Paz 789, Madrid, Spain",
        description: "A Waldorf-inspired community school emphasizing artistic education, imagination, and age-appropriate learning through the developmental stages of childhood.",
        shortDescription: "Waldorf education honoring childhood development",
        website: "https://madrid-waldorf.es",
        email: "contacto@madrid-waldorf.es",
        phone: "+34 91 234 5678",
        whatsapp: "+34 678 901 234",
        ageRange: "3-18 years",
        capacity: 120,
        yearEstablished: 2015,
        priceRange: "medium",
        isActive: true,
        isDummy: true
      },
      {
        name: "Tokyo Democratic Learning",
        city: "Tokyo",
        address: "1-2-3 Shibuya, Tokyo, Japan",
        description: "A democratic school where students of all ages learn together, making their own choices about what, when, how, and where they learn.",
        shortDescription: "Democratic education empowering student choice",
        website: "https://tokyo-democratic.jp",
        email: "info@tokyo-democratic.jp",
        phone: "+81 3 1234 5678",
        ageRange: "5-18 years",
        capacity: 80,
        yearEstablished: 2019,
        priceRange: "high",
        isActive: true,
        isDummy: true
      },
      {
        name: "Sydney Homeschool Hub",
        city: "Sydney",
        address: "456 Harbour Bridge Road, Sydney, Australia",
        description: "A supportive homeschool cooperative providing shared resources, group classes, and community connections for homeschooling families.",
        shortDescription: "Homeschool cooperative with shared resources",
        website: "https://sydneyhomeschoolhub.com.au",
        email: "support@sydneyhomeschoolhub.com.au",
        phone: "+61 2 9876 5432",
        ageRange: "5-16 years",
        capacity: 200,
        yearEstablished: 2017,
        priceRange: "low",
        isActive: true,
        isDummy: true
      },
      {
        name: "Toronto Reggio Center",
        city: "Toronto",
        address: "789 Queen Street West, Toronto, Canada",
        description: "Inspired by the Reggio Emilia approach, we foster children's natural curiosity through project-based learning and community partnerships.",
        shortDescription: "Reggio Emilia approach with community focus",
        website: "https://torontoreggio.ca",
        email: "info@torontoreggio.ca",
        phone: "+1 416 123 4567",
        whatsapp: "+1 647 890 1234",
        ageRange: "2-6 years",
        capacity: 50,
        yearEstablished: 2021,
        priceRange: "medium",
        isActive: true,
        isDummy: true
      },
      {
        name: "Amsterdam Free Learning",
        city: "Amsterdam",
        address: "Prinsengracht 123, Amsterdam, Netherlands",
        description: "An unschooling community where children pursue their interests freely with support from experienced facilitators and a rich learning environment.",
        shortDescription: "Unschooling community supporting natural learning",
        website: "https://amsterdam-freelearning.nl",
        email: "hello@amsterdam-freelearning.nl",
        phone: "+31 20 123 4567",
        ageRange: "4-16 years",
        capacity: 35,
        yearEstablished: 2022,
        priceRange: "medium",
        isActive: true,
        isDummy: true
      },
      {
        name: "São Paulo Escola Democrática",
        city: "São Paulo",
        address: "Rua da Liberdade 456, São Paulo, Brazil",
        description: "Uma escola democrática onde estudantes participam ativamente das decisões educacionais, desenvolvendo autonomia e responsabilidade social.",
        shortDescription: "Democratic school fostering autonomy and social responsibility",
        website: "https://escolademocratica-sp.com.br",
        email: "contato@escolademocratica-sp.com.br",
        phone: "+55 11 9876 5432",
        whatsapp: "+55 11 98765 4321",
        ageRange: "6-17 years",
        capacity: 100,
        yearEstablished: 2016,
        priceRange: "low",
        isActive: true,
        isDummy: true
      }
    ]).returning();

    console.log(`Inserted ${schoolsData.length} schools`);

    // Associate schools with methods
    console.log("Associating schools with methods...");
    const associations = [
      { schoolId: schoolsData[0].id, methodId: methods[0].id }, // Forest Grove Montessori
      { schoolId: schoolsData[1].id, methodId: methods[2].id }, // Berlin Nature School
      { schoolId: schoolsData[2].id, methodId: methods[1].id }, // Madrid Waldorf
      { schoolId: schoolsData[3].id, methodId: methods[4].id }, // Tokyo Democratic
      { schoolId: schoolsData[4].id, methodId: methods[6].id }, // Sydney Homeschool Hub
      { schoolId: schoolsData[5].id, methodId: methods[5].id }, // Toronto Reggio
      { schoolId: schoolsData[6].id, methodId: methods[7].id }, // Amsterdam Free Learning
      { schoolId: schoolsData[7].id, methodId: methods[4].id }, // São Paulo Democratic
    ];

    await db.insert(schoolMethods).values(associations);
    console.log(`Created ${associations.length} school-method associations`);

    // Add some sample teachers
    console.log("Adding sample teachers...");
    await db.insert(schoolTeachers).values([
      {
        schoolId: schoolsData[0].id,
        name: "Sarah Thompson",
        bio: "Certified Montessori educator with 15 years of experience in early childhood development.",
        qualifications: "AMI Montessori Diploma, Early Childhood Education Degree",
        specializations: "Practical Life, Mathematics, Language",
        yearsExperience: 15,
        isActive: true
      },
      {
        schoolId: schoolsData[1].id,
        name: "Hans Mueller",
        bio: "Nature educator passionate about connecting children with the natural world.",
        qualifications: "Forest School Level 3, Environmental Science Degree",
        specializations: "Outdoor Education, Environmental Science, Sustainability",
        yearsExperience: 8,
        isActive: true
      },
      {
        schoolId: schoolsData[2].id,
        name: "Carmen Rodriguez",
        bio: "Waldorf-trained teacher specializing in artistic and creative education.",
        qualifications: "Waldorf Teacher Training, Fine Arts Degree",
        specializations: "Arts Integration, Creative Expression, Eurythmy",
        yearsExperience: 12,
        isActive: true
      }
    ]);

    console.log("School data population completed successfully!");

  } catch (error) {
    console.error("Error populating school data:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateSchoolData()
    .then(() => {
      console.log("✅ School data populated successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Failed to populate school data:", error);
      process.exit(1);
    });
}

export { populateSchoolData };