import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  users,
  type User,
  type UpsertUser,
  userProfiles,
  professionals,
  appointments,
  reviews,
  documentTypes,
  documents,
  documentVersions,
  aiConversations,
  aiMessages,
  videos,
  videoProgress,
  auditLogs,
  type UserProfile,
  type InsertUserProfile,
  type Professional,
  type InsertProfessional,
  type Appointment,
  type InsertAppointment,
  type Review,
  type InsertReview,
  type DocumentType,
  type InsertDocumentType,
  type Document,
  type InsertDocument,
  type AiConversation,
  type InsertAiConversation,
  type AiMessage,
  type InsertAiMessage,
  type Video,
  type InsertVideo,
  type VideoProgress,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  getAllUsersWithProfiles(): Promise<any[]>;
  updateUserRole(userId: string, role: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;

  getProfessionals(): Promise<any[]>;
  getProfessionalByUserId(userId: string): Promise<any | undefined>;
  getProfessional(id: number): Promise<any>;
  getProfessionalsByStatus(status: string): Promise<any[]>;
  createProfessional(prof: InsertProfessional): Promise<Professional>;
  updateProfessionalStatus(id: number, status: string): Promise<void>;
  deleteProfessional(id: number): Promise<void>;

  getAppointmentsByClient(clientId: string): Promise<Appointment[]>;
  getAppointmentsByProfessional(profId: number): Promise<Appointment[]>;
  createAppointment(appt: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: number, status: string): Promise<void>;

  createReview(review: InsertReview): Promise<Review>;
  getReviewsByProfessional(profId: number): Promise<Review[]>;

  getDocumentTypes(): Promise<DocumentType[]>;
  createDocumentType(dt: InsertDocumentType): Promise<DocumentType>;

  getDocumentsByClient(clientId: string): Promise<Document[]>;
  getAllDocuments(): Promise<any[]>;
  getDocumentsByLawyer(lawyerId: number): Promise<any[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<void>;

  getConversationsByUser(userId: string): Promise<AiConversation[]>;
  getConversation(id: number): Promise<AiConversation | undefined>;
  createConversation(conv: InsertAiConversation): Promise<AiConversation>;
  deleteConversation(id: number): Promise<void>;

  getMessagesByConversation(convId: number): Promise<AiMessage[]>;
  createMessage(msg: InsertAiMessage): Promise<AiMessage>;

  getVideos(): Promise<Video[]>;
  getAllVideos(): Promise<Video[]>;
  getVideosByUser(userId: string): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  deleteVideo(id: number): Promise<void>;
  updateVideoPublished(id: number, isPublished: boolean): Promise<void>;
  getLawyerEarnings(profId: number): Promise<{ total: string; completed: number; pending: number; appointments: any[] }>;

  getAdminStats(): Promise<{
    totalLawyers: number;
    pendingVerifications: number;
    totalAppointments: number;
    totalDocuments: number;
    totalRevenue: string;
  }>;

  getAnalytics(): Promise<{
    overview: {
      totalUsers: number;
      totalLawyers: number;
      totalClients: number;
      totalDocuments: number;
      totalAppointments: number;
      pendingVerifications: number;
    };
    documentsByStatus: { status: string; count: number }[];
    documentsByCategory: { category: string; count: number }[];
    appointmentsByStatus: { status: string; count: number }[];
    lawyersBySpecialty: { specialty: string; count: number }[];
    recentDocuments: any[];
    recentAppointments: any[];
    topLawyers: any[];
  }>;

  updateUserProfileImage(userId: string, profileImageUrl: string): Promise<void>;

  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
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
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const existing = await this.getUserProfile(profile.userId);
    if (existing) {
      const [updated] = await db
        .update(userProfiles)
        .set(profile)
        .where(eq(userProfiles.userId, profile.userId))
        .returning();
      return updated;
    }
    const [created] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return created;
  }

  async getAllUsersWithProfiles(): Promise<any[]> {
    return db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        role: userProfiles.role,
        phone: userProfiles.phone,
        country: userProfiles.country,
        state: userProfiles.state,
        onboardingComplete: userProfiles.onboardingComplete,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    const existing = await this.getUserProfile(userId);
    if (existing) {
      await db
        .update(userProfiles)
        .set({ role: role as any })
        .where(eq(userProfiles.userId, userId));
    } else {
      await db
        .insert(userProfiles)
        .values({ userId, role: role as any });
    }
  }

  async getProfessionalByUserId(userId: string): Promise<any | undefined> {
    const [prof] = await db
      .select({
        id: professionals.id,
        userId: professionals.userId,
        specialty: professionals.specialty,
        verificationStatus: professionals.verificationStatus,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(professionals)
      .innerJoin(users, eq(professionals.userId, users.id))
      .where(eq(professionals.userId, userId));
    return prof;
  }

  async getProfessionals(): Promise<any[]> {
    const result = await db
      .select({
        id: professionals.id,
        userId: professionals.userId,
        specialty: professionals.specialty,
        secondarySpecialties: professionals.secondarySpecialties,
        barNumber: professionals.barNumber,
        yearsExperience: professionals.yearsExperience,
        hourlyRate: professionals.hourlyRate,
        consultationRate: professionals.consultationRate,
        verificationStatus: professionals.verificationStatus,
        jurisdictions: professionals.jurisdictions,
        languages: professionals.languages,
        rating: professionals.rating,
        totalReviews: professionals.totalReviews,
        totalCases: professionals.totalCases,
        availableDays: professionals.availableDays,
        availableTimeStart: professionals.availableTimeStart,
        availableTimeEnd: professionals.availableTimeEnd,
        isActive: professionals.isActive,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
      })
      .from(professionals)
      .innerJoin(users, eq(professionals.userId, users.id))
      .where(
        and(
          eq(professionals.verificationStatus, "verified"),
          eq(professionals.isActive, true)
        )
      )
      .orderBy(desc(professionals.rating));

    const profilesArr = await db.select().from(userProfiles);
    const profileMap = new Map(profilesArr.map((p) => [p.userId, p]));
    return result.map((r) => ({
      ...r,
      bio: profileMap.get(r.userId)?.bio || null,
    }));
  }

  async getProfessional(id: number): Promise<any> {
    const [result] = await db
      .select({
        id: professionals.id,
        userId: professionals.userId,
        specialty: professionals.specialty,
        secondarySpecialties: professionals.secondarySpecialties,
        barNumber: professionals.barNumber,
        yearsExperience: professionals.yearsExperience,
        hourlyRate: professionals.hourlyRate,
        consultationRate: professionals.consultationRate,
        verificationStatus: professionals.verificationStatus,
        jurisdictions: professionals.jurisdictions,
        languages: professionals.languages,
        rating: professionals.rating,
        totalReviews: professionals.totalReviews,
        totalCases: professionals.totalCases,
        availableDays: professionals.availableDays,
        availableTimeStart: professionals.availableTimeStart,
        availableTimeEnd: professionals.availableTimeEnd,
        isActive: professionals.isActive,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
      })
      .from(professionals)
      .innerJoin(users, eq(professionals.userId, users.id))
      .where(eq(professionals.id, id));

    if (!result) return null;

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, result.userId));

    return { ...result, bio: profile?.bio || null };
  }

  async getProfessionalsByStatus(status: string): Promise<any[]> {
    return db
      .select({
        id: professionals.id,
        userId: professionals.userId,
        specialty: professionals.specialty,
        secondarySpecialties: professionals.secondarySpecialties,
        barNumber: professionals.barNumber,
        yearsExperience: professionals.yearsExperience,
        hourlyRate: professionals.hourlyRate,
        consultationRate: professionals.consultationRate,
        verificationStatus: professionals.verificationStatus,
        jurisdictions: professionals.jurisdictions,
        languages: professionals.languages,
        rating: professionals.rating,
        totalReviews: professionals.totalReviews,
        totalCases: professionals.totalCases,
        isActive: professionals.isActive,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
      })
      .from(professionals)
      .innerJoin(users, eq(professionals.userId, users.id))
      .where(eq(professionals.verificationStatus, status as any));
  }

  async createProfessional(prof: InsertProfessional): Promise<Professional> {
    const [created] = await db
      .insert(professionals)
      .values(prof)
      .returning();
    return created;
  }

  async updateProfessionalStatus(id: number, status: string): Promise<void> {
    await db
      .update(professionals)
      .set({ verificationStatus: status as any })
      .where(eq(professionals.id, id));
  }

  async deleteProfessional(id: number): Promise<void> {
    const prof = await this.getProfessional(id);
    if (!prof) return;

    await db.delete(reviews).where(eq(reviews.professionalId, id));
    await db.delete(appointments).where(eq(appointments.professionalId, id));

    const assignedDocs = await db.select().from(documents).where(eq(documents.assignedLawyerId, id));
    for (const doc of assignedDocs) {
      await db.delete(documentVersions).where(eq(documentVersions.documentId, doc.id));
    }
    await db.update(documents).set({ assignedLawyerId: null }).where(eq(documents.assignedLawyerId, id));

    await db.delete(professionals).where(eq(professionals.id, id));
  }

  async deleteUser(userId: string): Promise<void> {
    const profs = await db.select().from(professionals).where(eq(professionals.userId, userId));
    for (const prof of profs) {
      await this.deleteProfessional(prof.id);
    }

    const convos = await db.select().from(aiConversations).where(eq(aiConversations.userId, userId));
    for (const c of convos) {
      await db.delete(aiMessages).where(eq(aiMessages.conversationId, c.id));
    }
    await db.delete(aiConversations).where(eq(aiConversations.userId, userId));

    await db.delete(videoProgress).where(eq(videoProgress.userId, userId));

    await db.update(documentVersions).set({ editedBy: null }).where(eq(documentVersions.editedBy, userId));

    const docs = await db.select().from(documents).where(eq(documents.clientId, userId));
    for (const doc of docs) {
      await db.delete(documentVersions).where(eq(documentVersions.documentId, doc.id));
    }
    await db.delete(documents).where(eq(documents.clientId, userId));

    await db.delete(reviews).where(eq(reviews.clientId, userId));
    await db.delete(appointments).where(eq(appointments.clientId, userId));
    await db.delete(userProfiles).where(eq(userProfiles.userId, userId));

    await db.execute(sql`DELETE FROM sessions WHERE sess::jsonb -> 'passport' -> 'user' -> 'claims' ->> 'sub' = ${userId} OR sess::jsonb -> 'adminUser' ->> 'id' = ${userId}`);

    await db.delete(users).where(eq(users.id, userId));
  }

  async getAppointmentsByClient(clientId: string): Promise<Appointment[]> {
    return db
      .select()
      .from(appointments)
      .where(eq(appointments.clientId, clientId))
      .orderBy(desc(appointments.scheduledDate));
  }

  async getAppointmentsByProfessional(profId: number): Promise<Appointment[]> {
    return db
      .select()
      .from(appointments)
      .where(eq(appointments.professionalId, profId))
      .orderBy(desc(appointments.scheduledDate));
  }

  async createAppointment(appt: InsertAppointment): Promise<Appointment> {
    const [created] = await db
      .insert(appointments)
      .values(appt)
      .returning();
    return created;
  }

  async updateAppointmentStatus(id: number, status: string): Promise<void> {
    const updates: Partial<Appointment> = { status: status as any };
    if (status === "cancelled") updates.cancelledAt = new Date();
    if (status === "completed") updates.completedAt = new Date();
    await db
      .update(appointments)
      .set(updates)
      .where(eq(appointments.id, id));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db
      .insert(reviews)
      .values(review)
      .returning();
    return created;
  }

  async getReviewsByProfessional(profId: number): Promise<Review[]> {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.professionalId, profId))
      .orderBy(desc(reviews.createdAt));
  }

  async getDocumentTypes(): Promise<DocumentType[]> {
    return db
      .select()
      .from(documentTypes)
      .where(eq(documentTypes.isActive, true));
  }

  async createDocumentType(dt: InsertDocumentType): Promise<DocumentType> {
    const [created] = await db
      .insert(documentTypes)
      .values(dt)
      .returning();
    return created;
  }

  async getDocumentsByClient(clientId: string): Promise<Document[]> {
    return db
      .select()
      .from(documents)
      .where(eq(documents.clientId, clientId))
      .orderBy(desc(documents.createdAt));
  }

  async getAllDocuments(): Promise<any[]> {
    const docs = await db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt));
    const types = await db.select().from(documentTypes);
    const profs = await db
      .select({
        id: professionals.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(professionals)
      .leftJoin(users, eq(professionals.userId, users.id));
    const clients = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users);
    return docs.map((doc) => ({
      ...doc,
      documentType: types.find((t) => t.id === doc.documentTypeId),
      assignedLawyer: doc.assignedLawyerId ? profs.find((p) => p.id === doc.assignedLawyerId) : null,
      client: clients.find((c) => c.id === doc.clientId),
    }));
  }

  async getDocumentsByLawyer(lawyerId: number): Promise<any[]> {
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.assignedLawyerId, lawyerId))
      .orderBy(desc(documents.createdAt));
    const types = await db.select().from(documentTypes);
    const clients = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users);
    return docs.map((doc) => ({
      ...doc,
      documentType: types.find((t) => t.id === doc.documentTypeId),
      client: clients.find((c) => c.id === doc.clientId),
    }));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return doc;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [created] = await db
      .insert(documents)
      .values(doc)
      .returning();
    return created;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<void> {
    await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id));
  }

  async getConversationsByUser(userId: string): Promise<AiConversation[]> {
    return db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.updatedAt));
  }

  async getConversation(id: number): Promise<AiConversation | undefined> {
    const [conv] = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.id, id));
    return conv;
  }

  async createConversation(conv: InsertAiConversation): Promise<AiConversation> {
    const [created] = await db
      .insert(aiConversations)
      .values(conv)
      .returning();
    return created;
  }

  async deleteConversation(id: number): Promise<void> {
    await db.delete(aiConversations).where(eq(aiConversations.id, id));
  }

  async getMessagesByConversation(convId: number): Promise<AiMessage[]> {
    return db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, convId))
      .orderBy(aiMessages.createdAt);
  }

  async createMessage(msg: InsertAiMessage): Promise<AiMessage> {
    const [created] = await db
      .insert(aiMessages)
      .values(msg)
      .returning();
    return created;
  }

  async getVideos(): Promise<Video[]> {
    return db
      .select()
      .from(videos)
      .where(eq(videos.isPublished, true))
      .orderBy(desc(videos.createdAt));
  }

  async getAllVideos(): Promise<Video[]> {
    return db
      .select()
      .from(videos)
      .orderBy(desc(videos.createdAt));
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [created] = await db
      .insert(videos)
      .values(video)
      .returning();
    return created;
  }

  async deleteVideo(id: number): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }

  async getVideosByUser(userId: string): Promise<Video[]> {
    return db.select().from(videos).where(eq(videos.submittedByUserId, userId)).orderBy(desc(videos.createdAt));
  }

  async updateVideoPublished(id: number, isPublished: boolean): Promise<void> {
    await db.update(videos).set({ isPublished }).where(eq(videos.id, id));
  }

  async getLawyerEarnings(profId: number) {
    const appts = await db
      .select({
        id: appointments.id,
        serviceType: appointments.serviceType,
        status: appointments.status,
        scheduledDate: appointments.scheduledDate,
        amount: appointments.amount,
        clientId: appointments.clientId,
      })
      .from(appointments)
      .where(eq(appointments.professionalId, profId))
      .orderBy(desc(appointments.scheduledDate));

    const completed = appts.filter(a => a.status === "completed");
    const pending = appts.filter(a => ["hold", "confirmed"].includes(a.status));
    const total = completed.reduce((sum, a) => sum + parseFloat(a.amount || "0"), 0);

    return {
      total: total.toFixed(2),
      completed: completed.length,
      pending: pending.length,
      appointments: appts.slice(0, 20),
    };
  }

  async getAdminStats() {
    const [lawyerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(professionals);
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(professionals)
      .where(eq(professionals.verificationStatus, "pending"));
    const [apptCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments);
    const [docCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents);

    return {
      totalLawyers: Number(lawyerCount?.count || 0),
      pendingVerifications: Number(pendingCount?.count || 0),
      totalAppointments: Number(apptCount?.count || 0),
      totalDocuments: Number(docCount?.count || 0),
      totalRevenue: "0.00",
    };
  }

  async getAnalytics() {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [lawyerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(professionals);
    const [clientCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userProfiles)
      .where(eq(userProfiles.role, "client"));
    const [docCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents);
    const [apptCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments);
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(professionals)
      .where(eq(professionals.verificationStatus, "pending"));

    const docsByStatus = await db
      .select({ status: documents.status, count: sql<number>`count(*)` })
      .from(documents)
      .groupBy(documents.status);

    const docsByCategory = await db
      .select({ category: documentTypes.category, count: sql<number>`count(*)` })
      .from(documents)
      .innerJoin(documentTypes, eq(documents.documentTypeId, documentTypes.id))
      .groupBy(documentTypes.category);

    const apptsByStatus = await db
      .select({ status: appointments.status, count: sql<number>`count(*)` })
      .from(appointments)
      .groupBy(appointments.status);

    const lawyersBySpecialty = await db
      .select({ specialty: professionals.specialty, count: sql<number>`count(*)` })
      .from(professionals)
      .where(eq(professionals.verificationStatus, "verified"))
      .groupBy(professionals.specialty);

    const recentDocs = await db
      .select({
        id: documents.id,
        status: documents.status,
        amount: documents.amount,
        createdAt: documents.createdAt,
        documentTypeName: documentTypes.name,
        documentTypeCategory: documentTypes.category,
      })
      .from(documents)
      .leftJoin(documentTypes, eq(documents.documentTypeId, documentTypes.id))
      .orderBy(desc(documents.createdAt))
      .limit(10);

    const recentAppts = await db
      .select({
        id: appointments.id,
        status: appointments.status,
        serviceType: appointments.serviceType,
        scheduledDate: appointments.scheduledDate,
        amount: appointments.amount,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .orderBy(desc(appointments.createdAt))
      .limit(10);

    const topLawyers = await db
      .select({
        id: professionals.id,
        specialty: professionals.specialty,
        rating: professionals.rating,
        totalReviews: professionals.totalReviews,
        totalCases: professionals.totalCases,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(professionals)
      .innerJoin(users, eq(professionals.userId, users.id))
      .where(eq(professionals.verificationStatus, "verified"))
      .orderBy(desc(professionals.rating))
      .limit(5);

    return {
      overview: {
        totalUsers: Number(userCount?.count || 0),
        totalLawyers: Number(lawyerCount?.count || 0),
        totalClients: Number(clientCount?.count || 0),
        totalDocuments: Number(docCount?.count || 0),
        totalAppointments: Number(apptCount?.count || 0),
        pendingVerifications: Number(pendingCount?.count || 0),
      },
      documentsByStatus: docsByStatus.map((d) => ({ status: d.status, count: Number(d.count) })),
      documentsByCategory: docsByCategory.map((d) => ({ category: d.category, count: Number(d.count) })),
      appointmentsByStatus: apptsByStatus.map((d) => ({ status: d.status, count: Number(d.count) })),
      lawyersBySpecialty: lawyersBySpecialty.map((d) => ({ specialty: d.specialty, count: Number(d.count) })),
      recentDocuments: recentDocs,
      recentAppointments: recentAppts,
      topLawyers,
    };
  }

  async updateUserProfileImage(userId: string, profileImageUrl: string): Promise<void> {
    await db.update(users).set({ profileImageUrl, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }
}

export const storage = new DatabaseStorage();
