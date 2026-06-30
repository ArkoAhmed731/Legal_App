import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./auth";

export const userRoleEnum = pgEnum("user_role", [
  "client",
  "professional",
  "tenant_admin",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "verified",
  "rejected",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "hold",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
  "expired",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "drafting",
  "awaiting_payment",
  "in_review",
  "needs_client_input",
  "finalized",
  "delivered",
]);

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  role: userRoleEnum("role").notNull().default("client"),
  fullName: varchar("full_name"),
  dateOfBirth: varchar("date_of_birth"),
  emailAddress: varchar("email_address"),
  address: text("address"),
  phone: varchar("phone"),
  country: varchar("country"),
  state: varchar("state"),
  language: varchar("language").default("en"),
  bio: text("bio"),
  customFields: jsonb("custom_fields").$type<Record<string, string>>(),
  onboardingComplete: boolean("onboarding_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const professionals = pgTable("professionals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  specialty: text("specialty").notNull(),
  secondarySpecialties: text("secondary_specialties").array(),
  barNumber: varchar("bar_number"),
  yearsExperience: integer("years_experience").default(0),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).default("150.00"),
  consultationRate: decimal("consultation_rate", { precision: 10, scale: 2 }).default("75.00"),
  verificationStatus: verificationStatusEnum("verification_status")
    .notNull()
    .default("pending"),
  verificationDocs: text("verification_docs"),
  licenseDocUrl: text("license_doc_url"),
  govIdDocUrl: text("gov_id_doc_url"),
  jurisdictions: text("jurisdictions").array(),
  languages: text("languages").array().default(sql`ARRAY['English']`),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").default(0),
  totalCases: integer("total_cases").default(0),
  availableDays: text("available_days").array().default(sql`ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday']`),
  availableTimeStart: varchar("available_time_start").default("09:00"),
  availableTimeEnd: varchar("available_time_end").default("17:00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id")
    .notNull()
    .references(() => users.id),
  professionalId: integer("professional_id")
    .notNull()
    .references(() => professionals.id),
  serviceType: varchar("service_type").notNull().default("consultation"),
  status: appointmentStatusEnum("status").notNull().default("hold"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  durationMinutes: integer("duration_minutes").default(30),
  notes: text("notes"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  lockExpiresAt: timestamp("lock_expires_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id")
    .notNull()
    .references(() => appointments.id),
  clientId: varchar("client_id")
    .notNull()
    .references(() => users.id),
  professionalId: integer("professional_id")
    .notNull()
    .references(() => professionals.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documentTypes = pgTable("document_types", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).default("49.99"),
  intakeFields: jsonb("intake_fields").$type<
    Array<{ name: string; label: string; type: string; required: boolean }>
  >(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id")
    .notNull()
    .references(() => users.id),
  documentTypeId: integer("document_type_id")
    .notNull()
    .references(() => documentTypes.id),
  assignedLawyerId: integer("assigned_lawyer_id").references(
    () => professionals.id
  ),
  status: documentStatusEnum("status").notNull().default("drafting"),
  intakeAnswers: jsonb("intake_answers").$type<Record<string, string>>(),
  currentDraft: text("current_draft"),
  finalContent: text("final_content"),
  reviewNotes: text("review_notes"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  paidAt: timestamp("paid_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .notNull()
    .references(() => documents.id),
  versionNumber: integer("version_number").notNull().default(1),
  content: text("content").notNull(),
  editedBy: varchar("edited_by").references(() => users.id),
  changeNotes: text("change_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title").default("New Conversation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => aiConversations.id, { onDelete: "cascade" }),
  role: varchar("role").notNull(),
  content: text("content").notNull(),
  refusalFlag: boolean("refusal_flag").default(false),
  escalationType: varchar("escalation_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  category: varchar("category").notNull(),
  duration: integer("duration"),
  jurisdiction: varchar("jurisdiction"),
  language: varchar("language").default("en"),
  isPublished: boolean("is_published").default(true),
  submittedByUserId: varchar("submitted_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videoProgress = pgTable("video_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  videoId: integer("video_id")
    .notNull()
    .references(() => videos.id),
  watchedSeconds: integer("watched_seconds").default(0),
  completed: boolean("completed").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
});

export const insertProfessionalSchema = createInsertSchema(professionals).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentTypeSchema = createInsertSchema(documentTypes).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiMessageSchema = createInsertSchema(aiMessages).omit({
  id: true,
  createdAt: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Professional = typeof professionals.$inferSelect;
export type InsertProfessional = z.infer<typeof insertProfessionalSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type DocumentType = typeof documentTypes.$inferSelect;
export type InsertDocumentType = z.infer<typeof insertDocumentTypeSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = z.infer<typeof insertAiMessageSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type VideoProgress = typeof videoProgress.$inferSelect;

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorId: varchar("actor_id"),
  action: varchar("action").notNull(),
  resource: varchar("resource"),
  resourceId: varchar("resource_id"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
