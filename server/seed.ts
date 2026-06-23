import { db } from "./db";
import { users, userProfiles, professionals, documentTypes, videos } from "@shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const seedUsers = [
  { id: "lawyer-1", email: "sarah.chen@unicortex.law", firstName: "Sarah", lastName: "Chen", profileImageUrl: null },
  { id: "lawyer-2", email: "marcus.johnson@unicortex.law", firstName: "Marcus", lastName: "Johnson", profileImageUrl: null },
  { id: "lawyer-3", email: "elena.rodriguez@unicortex.law", firstName: "Elena", lastName: "Rodriguez", profileImageUrl: null },
  { id: "lawyer-4", email: "david.kim@unicortex.law", firstName: "David", lastName: "Kim", profileImageUrl: null },
  { id: "lawyer-5", email: "jessica.williams@unicortex.law", firstName: "Jessica", lastName: "Williams", profileImageUrl: null },
  { id: "lawyer-6", email: "robert.taylor@unicortex.law", firstName: "Robert", lastName: "Taylor", profileImageUrl: null },
  { id: "lawyer-7", email: "aisha.patel@unicortex.law", firstName: "Aisha", lastName: "Patel", profileImageUrl: null },
  { id: "lawyer-8", email: "michael.brown@unicortex.law", firstName: "Michael", lastName: "Brown", profileImageUrl: null },
];

const seedProfiles = [
  { userId: "lawyer-1", role: "professional" as const, bio: "15+ years of family law experience. Specializing in divorce, custody, and adoption cases. Known for compassionate and thorough representation.", country: "US", state: "CA" },
  { userId: "lawyer-2", role: "professional" as const, bio: "Former prosecutor turned criminal defense attorney. Aggressive defender of constitutional rights with an impressive track record.", country: "US", state: "NY" },
  { userId: "lawyer-3", role: "professional" as const, bio: "Immigration attorney fluent in Spanish and English. Helping families navigate the complex immigration system for over a decade.", country: "US", state: "TX" },
  { userId: "lawyer-4", role: "professional" as const, bio: "Corporate law specialist with experience in M&A, startup formation, and commercial contracts. Former in-house counsel at a Fortune 500.", country: "US", state: "CA" },
  { userId: "lawyer-5", role: "professional" as const, bio: "Dedicated employment law attorney. Representing employees in discrimination, wrongful termination, and wage disputes.", country: "US", state: "IL" },
  { userId: "lawyer-6", role: "professional" as const, bio: "Real estate attorney with 20 years of experience in residential and commercial transactions, zoning, and landlord-tenant disputes.", country: "US", state: "FL" },
  { userId: "lawyer-7", role: "professional" as const, bio: "Intellectual property attorney specializing in patents, trademarks, and copyright protection for tech companies and creative professionals.", country: "US", state: "WA" },
  { userId: "lawyer-8", role: "professional" as const, bio: "Estate planning and elder law attorney. Helping families protect their legacy through wills, trusts, and power of attorney documents.", country: "US", state: "MA" },
];

const seedProfessionals = [
  { userId: "lawyer-1", specialty: "Family Law", secondarySpecialties: ["Divorce", "Child Custody", "Adoption"], barNumber: "CA-123456", yearsExperience: 15, hourlyRate: "250.00", consultationRate: "100.00", verificationStatus: "verified" as const, jurisdictions: ["California", "Nevada"], languages: ["English", "Mandarin"], rating: "4.90", totalReviews: 127, totalCases: 450, availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], availableTimeStart: "09:00", availableTimeEnd: "17:00", isActive: true },
  { userId: "lawyer-2", specialty: "Criminal Defense", secondarySpecialties: ["DUI Defense", "White Collar Crime"], barNumber: "NY-789012", yearsExperience: 12, hourlyRate: "300.00", consultationRate: "125.00", verificationStatus: "verified" as const, jurisdictions: ["New York", "New Jersey"], languages: ["English"], rating: "4.85", totalReviews: 98, totalCases: 380, availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], availableTimeStart: "08:00", availableTimeEnd: "18:00", isActive: true },
  { userId: "lawyer-3", specialty: "Immigration", secondarySpecialties: ["Visa Applications", "Deportation Defense", "Asylum"], barNumber: "TX-345678", yearsExperience: 10, hourlyRate: "200.00", consultationRate: "75.00", verificationStatus: "verified" as const, jurisdictions: ["Texas", "Arizona"], languages: ["English", "Spanish"], rating: "4.95", totalReviews: 156, totalCases: 520, availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], availableTimeStart: "08:00", availableTimeEnd: "19:00", isActive: true },
  { userId: "lawyer-4", specialty: "Corporate Law", secondarySpecialties: ["M&A", "Startup Law", "Contract Negotiation"], barNumber: "CA-901234", yearsExperience: 18, hourlyRate: "400.00", consultationRate: "175.00", verificationStatus: "verified" as const, jurisdictions: ["California", "Delaware"], languages: ["English", "Korean"], rating: "4.80", totalReviews: 72, totalCases: 290, availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday"], availableTimeStart: "10:00", availableTimeEnd: "18:00", isActive: true },
  { userId: "lawyer-5", specialty: "Employment Law", secondarySpecialties: ["Discrimination", "Wrongful Termination", "Wage Disputes"], barNumber: "IL-567890", yearsExperience: 8, hourlyRate: "225.00", consultationRate: "90.00", verificationStatus: "verified" as const, jurisdictions: ["Illinois", "Indiana"], languages: ["English"], rating: "4.75", totalReviews: 64, totalCases: 210, availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], availableTimeStart: "09:00", availableTimeEnd: "17:00", isActive: true },
  { userId: "lawyer-6", specialty: "Real Estate", secondarySpecialties: ["Commercial Real Estate", "Landlord-Tenant", "Zoning"], barNumber: "FL-234567", yearsExperience: 20, hourlyRate: "275.00", consultationRate: "110.00", verificationStatus: "verified" as const, jurisdictions: ["Florida", "Georgia"], languages: ["English", "Portuguese"], rating: "4.70", totalReviews: 89, totalCases: 600, availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], availableTimeStart: "08:30", availableTimeEnd: "16:30", isActive: true },
  { userId: "lawyer-7", specialty: "Intellectual Property", secondarySpecialties: ["Patents", "Trademarks", "Copyright"], barNumber: "WA-678901", yearsExperience: 11, hourlyRate: "350.00", consultationRate: "150.00", verificationStatus: "verified" as const, jurisdictions: ["Washington", "Oregon"], languages: ["English", "Hindi"], rating: "4.88", totalReviews: 45, totalCases: 180, availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], availableTimeStart: "09:00", availableTimeEnd: "17:00", isActive: true },
  { userId: "lawyer-8", specialty: "Estate Planning", secondarySpecialties: ["Wills", "Trusts", "Probate"], barNumber: "MA-012345", yearsExperience: 14, hourlyRate: "225.00", consultationRate: "95.00", verificationStatus: "pending" as const, jurisdictions: ["Massachusetts", "Connecticut"], languages: ["English"], rating: "4.65", totalReviews: 53, totalCases: 340, availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], availableTimeStart: "09:00", availableTimeEnd: "16:00", isActive: true },
];

const seedDocumentTypes = [
  { name: "Non-Disclosure Agreement (NDA)", description: "Protect confidential information shared between parties", category: "Business", price: "49.99", intakeFields: [{ name: "disclosing_party", label: "Disclosing Party (Full Name/Company)", type: "text", required: true }, { name: "receiving_party", label: "Receiving Party (Full Name/Company)", type: "text", required: true }, { name: "purpose", label: "Purpose of Disclosure", type: "textarea", required: true }, { name: "duration", label: "Duration (e.g., 2 years)", type: "text", required: true }, { name: "jurisdiction", label: "Governing Jurisdiction", type: "text", required: true }], isActive: true },
  { name: "Demand Letter", description: "Formal letter demanding action or payment from another party", category: "Dispute", price: "39.99", intakeFields: [{ name: "sender_name", label: "Your Full Name", type: "text", required: true }, { name: "recipient_name", label: "Recipient Name/Company", type: "text", required: true }, { name: "dispute_description", label: "Describe the Dispute", type: "textarea", required: true }, { name: "amount_demanded", label: "Amount Demanded (if applicable)", type: "text", required: false }, { name: "deadline", label: "Response Deadline", type: "text", required: true }], isActive: true },
  { name: "Freelance Service Agreement", description: "Contract for freelance or consulting services", category: "Business", price: "59.99", intakeFields: [{ name: "freelancer_name", label: "Freelancer/Consultant Name", type: "text", required: true }, { name: "client_name", label: "Client Name/Company", type: "text", required: true }, { name: "services", label: "Description of Services", type: "textarea", required: true }, { name: "compensation", label: "Compensation Terms", type: "textarea", required: true }, { name: "start_date", label: "Start Date", type: "text", required: true }, { name: "end_date", label: "End Date", type: "text", required: false }], isActive: true },
  { name: "Lease Agreement", description: "Residential or commercial property lease agreement", category: "Real Estate", price: "69.99", intakeFields: [{ name: "landlord_name", label: "Landlord Name", type: "text", required: true }, { name: "tenant_name", label: "Tenant Name", type: "text", required: true }, { name: "property_address", label: "Property Address", type: "textarea", required: true }, { name: "monthly_rent", label: "Monthly Rent Amount", type: "text", required: true }, { name: "lease_term", label: "Lease Term (e.g., 12 months)", type: "text", required: true }, { name: "security_deposit", label: "Security Deposit Amount", type: "text", required: true }], isActive: true },
  { name: "Power of Attorney", description: "Authorize someone to act on your behalf in legal matters", category: "Personal", price: "54.99", intakeFields: [{ name: "principal_name", label: "Principal (Your Full Name)", type: "text", required: true }, { name: "agent_name", label: "Agent (Person Authorized)", type: "text", required: true }, { name: "scope", label: "Scope of Authority", type: "textarea", required: true }, { name: "effective_date", label: "Effective Date", type: "text", required: true }, { name: "expiration", label: "Expiration (if applicable)", type: "text", required: false }], isActive: true },
  { name: "Employment Offer Letter", description: "Formal employment offer with terms and conditions", category: "Employment", price: "44.99", intakeFields: [{ name: "company_name", label: "Company Name", type: "text", required: true }, { name: "employee_name", label: "Employee Name", type: "text", required: true }, { name: "position", label: "Job Title/Position", type: "text", required: true }, { name: "salary", label: "Annual Salary", type: "text", required: true }, { name: "start_date", label: "Start Date", type: "text", required: true }, { name: "benefits", label: "Benefits Summary", type: "textarea", required: false }], isActive: true },
];

const seedVideos = [
  { title: "Understanding Your Tenant Rights", description: "A comprehensive guide to your rights as a tenant, including rent increases, security deposits, and eviction protections.", videoUrl: "https://example.com/videos/tenant-rights", thumbnailUrl: null, category: "Real Estate", duration: 720, jurisdiction: "US", language: "en", isPublished: true },
  { title: "How to Form an LLC", description: "Step-by-step guide to forming a Limited Liability Company, from choosing a name to filing articles of organization.", videoUrl: "https://example.com/videos/form-llc", thumbnailUrl: null, category: "Business", duration: 540, jurisdiction: "US", language: "en", isPublished: true },
  { title: "Employment Discrimination: Know Your Rights", description: "Learn about federal and state protections against workplace discrimination based on race, gender, age, disability, and more.", videoUrl: "https://example.com/videos/discrimination", thumbnailUrl: null, category: "Employment", duration: 900, jurisdiction: "US", language: "en", isPublished: true },
  { title: "Family Law Basics: Divorce Process", description: "An overview of the divorce process, including filing, asset division, child custody, and mediation options.", videoUrl: "https://example.com/videos/divorce-process", thumbnailUrl: null, category: "Family Law", duration: 840, jurisdiction: "US", language: "en", isPublished: true },
  { title: "Immigration: Visa Categories Explained", description: "Understanding different visa categories including H-1B, L-1, O-1, and green card options.", videoUrl: "https://example.com/videos/visa-categories", thumbnailUrl: null, category: "Immigration", duration: 660, jurisdiction: "US", language: "en", isPublished: true },
  { title: "Small Claims Court: A Complete Guide", description: "How to file a small claims case, prepare evidence, and present your case in court effectively.", videoUrl: "https://example.com/videos/small-claims", thumbnailUrl: null, category: "Contracts", duration: 780, jurisdiction: "US", language: "en", isPublished: true },
  { title: "Protecting Your Intellectual Property", description: "Learn about patents, trademarks, copyrights, and trade secrets to protect your creative work and inventions.", videoUrl: "https://example.com/videos/ip-protection", thumbnailUrl: null, category: "Business", duration: 600, jurisdiction: "US", language: "en", isPublished: true },
  { title: "Estate Planning Fundamentals", description: "Why everyone needs an estate plan and the key documents: wills, trusts, powers of attorney, and healthcare directives.", videoUrl: "https://example.com/videos/estate-planning", thumbnailUrl: null, category: "Real Estate", duration: 810, jurisdiction: "US", language: "en", isPublished: true },
  { title: "Criminal Defense: Your Rights During Arrest", description: "What to do and not do during an arrest. Understanding Miranda rights, searches, and your right to an attorney.", videoUrl: "https://example.com/videos/arrest-rights", thumbnailUrl: null, category: "Criminal", duration: 480, jurisdiction: "US", language: "en", isPublished: true },
];

export async function seedDatabase() {
  try {
    console.log("Starting database seed...");

    const adminPassword = await bcrypt.hash("Shakalaka69", 12);
    const adminAccounts = [
      {
        id: "admin-superadmin",
        email: "admin@simplisolve.us",
        firstName: "Super",
        lastName: "Admin",
        profileImageUrl: null,
        passwordHash: adminPassword,
      },
      {
        id: "admin-tenantadmin",
        email: "arafat@simplisolve.us",
        firstName: "Arafat",
        lastName: "Admin",
        profileImageUrl: null,
        passwordHash: adminPassword,
      },
    ];

    for (const admin of adminAccounts) {
      const existing = await db
        .select()
        .from(users)
        .where(sql`${users.email} = ${admin.email}`);
      if (existing.length === 0) {
        await db.insert(users).values(admin);
      } else {
        await db
          .update(users)
          .set({ passwordHash: admin.passwordHash })
          .where(sql`${users.email} = ${admin.email}`);
      }
    }

    for (const adminEmail of ["admin@simplisolve.us", "arafat@simplisolve.us"]) {
      const [adminUser] = await db
        .select()
        .from(users)
        .where(sql`${users.email} = ${adminEmail}`);
      if (adminUser) {
        const existing = await db
          .select()
          .from(userProfiles)
          .where(sql`${userProfiles.userId} = ${adminUser.id}`);
        if (existing.length === 0) {
          await db.insert(userProfiles).values({
            userId: adminUser.id,
            role: "tenant_admin",
            onboardingComplete: true,
          });
        }
      }
    }

    console.log("Admin accounts seeded.");

    for (const u of seedUsers) {
      await db
        .insert(users)
        .values(u)
        .onConflictDoNothing({ target: users.id });
    }

    for (const p of seedProfiles) {
      const existingProfile = await db
        .select()
        .from(userProfiles)
        .where(sql`${userProfiles.userId} = ${p.userId}`);
      if (existingProfile.length === 0) {
        await db.insert(userProfiles).values(p);
      }
    }

    for (const prof of seedProfessionals) {
      const existing = await db
        .select()
        .from(professionals)
        .where(sql`${professionals.userId} = ${prof.userId}`);
      if (existing.length === 0) {
        await db.insert(professionals).values(prof);
      }
    }

    for (const dt of seedDocumentTypes) {
      const existing = await db
        .select()
        .from(documentTypes)
        .where(sql`${documentTypes.name} = ${dt.name}`);
      if (existing.length === 0) {
        await db.insert(documentTypes).values(dt);
      }
    }

    for (const v of seedVideos) {
      const existing = await db
        .select()
        .from(videos)
        .where(sql`${videos.title} = ${v.title}`);
      if (existing.length === 0) {
        await db.insert(videos).values(v);
      }
    }

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Seed error:", error);
    throw error;
  }
}
