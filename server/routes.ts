import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";
import { streamLegalAssistant, generateDocumentDraft, embedText, embedTexts } from "./ai-service";

function chunkText(text: string, chunkSize = 1500, overlap = 200): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const chunk = normalized.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);
    if (end === normalized.length) break;
    start = end - overlap;
  }
  return chunks;
}

function getUserId(req: any): string {
  return req.user?.id;
}

function requireRole(...roles: string[]): RequestHandler {
  return async (req: any, res, next) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const profile = await storage.getUserProfile(userId);
      if (!profile) return res.status(403).json({ message: "No profile found" });
      if (roles.includes(profile.role)) return next();
      return res.status(403).json({ message: "Insufficient permissions" });
    } catch (error) {
      return res.status(500).json({ message: "Authorization check failed" });
    }
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- File uploads (local dev: saves to uploads/ directory) ---
  app.post("/api/uploads/request-url", isAuthenticated, (req, res) => {
    try {
      const { name, size, contentType } = req.body;
      if (!name) return res.status(400).json({ message: "name is required" });
      const uuid = randomUUID();
      const safeName = path.basename(name as string);
      const objectPath = `/objects/${uuid}/${safeName}`;
      const uploadURL = `/api/uploads/store/${uuid}/${encodeURIComponent(safeName)}`;
      res.json({ uploadURL, objectPath, metadata: { name: safeName, size: size || 0, contentType: contentType || "application/octet-stream" } });
    } catch {
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.put("/api/uploads/store/:uuid/:filename", async (req: any, res) => {
    try {
      const uuid = req.params.uuid;
      const filename = path.basename(decodeURIComponent(req.params.filename));
      const uploadDir = path.join(process.cwd(), "uploads", uuid);
      await fs.promises.mkdir(uploadDir, { recursive: true });
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", resolve);
        req.on("error", reject);
      });
      await fs.promises.writeFile(path.join(uploadDir, filename), Buffer.concat(chunks));
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Upload store error:", error);
      res.status(500).json({ message: "Failed to store file" });
    }
  });

  app.get("/objects/:uuid/:filename", (req: any, res) => {
    const uuid = req.params.uuid;
    const filename = path.basename(decodeURIComponent(req.params.filename));
    const filePath = path.join(process.cwd(), "uploads", uuid, filename);
    res.sendFile(filePath, { root: "/" }, (err) => {
      if (err) res.status(404).json({ message: "File not found" });
    });
  });

  app.patch("/api/auth/profile-picture", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { profileImageUrl } = req.body;
      if (!profileImageUrl || typeof profileImageUrl !== "string") {
        return res.status(400).json({ message: "profileImageUrl is required" });
      }
      if (!profileImageUrl.startsWith("/objects/")) {
        return res.status(400).json({ message: "Invalid profile image path" });
      }
      await storage.updateUserProfileImage(userId, profileImageUrl);
      res.json({ message: "Profile picture updated", profileImageUrl });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ message: "Failed to update profile picture" });
    }
  });

  // --- Lawyers ---
  app.get("/api/lawyers", async (req: any, res) => {
    try {
      const lawyers = await storage.getProfessionals();
      const sanitized = lawyers.map(({ licenseDocUrl, govIdDocUrl, ...rest }: any) => rest);
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching lawyers:", error);
      res.status(500).json({ message: "Failed to fetch lawyers" });
    }
  });

  app.get("/api/lawyers/:id", async (req, res) => {
    try {
      const lawyer = await storage.getProfessional(parseInt(req.params.id));
      if (!lawyer) return res.status(404).json({ message: "Lawyer not found" });
      const { licenseDocUrl, govIdDocUrl, ...sanitized } = lawyer as any;
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching lawyer:", error);
      res.status(500).json({ message: "Failed to fetch lawyer" });
    }
  });

  // --- Appointments ---
  app.get("/api/appointments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const appts = await storage.getAppointmentsByClient(userId);
      res.json(appts);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { professionalId, serviceType, scheduledDate, durationMinutes, notes } = req.body;

      const lawyer = await storage.getProfessional(professionalId);
      if (!lawyer) return res.status(404).json({ message: "Lawyer not found" });

      const amount =
        durationMinutes === 60
          ? lawyer.hourlyRate
          : lawyer.consultationRate;

      const appt = await storage.createAppointment({
        clientId: userId,
        professionalId,
        serviceType: serviceType || "consultation",
        status: "confirmed",
        scheduledDate: new Date(scheduledDate),
        durationMinutes: durationMinutes || 30,
        notes,
        amount,
      });

      res.status(201).json(appt);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.post("/api/appointments/:id/cancel", isAuthenticated, async (req: any, res) => {
    try {
      await storage.updateAppointmentStatus(parseInt(req.params.id), "cancelled");
      res.json({ message: "Appointment cancelled" });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      res.status(500).json({ message: "Failed to cancel appointment" });
    }
  });

  // --- Lawyer Appointments ---
  app.get("/api/lawyer/appointments", isAuthenticated, requireRole("professional"), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const prof = await storage.getProfessionalByUserId(userId);
      if (!prof) return res.status(404).json({ message: "Professional profile not found" });
      const appts = await storage.getAppointmentsByProfessional(prof.id);
      res.json(appts);
    } catch (error) {
      console.error("Error fetching lawyer appointments:", error);
      res.status(500).json({ message: "Failed to fetch lawyer appointments" });
    }
  });

  app.post("/api/lawyer/appointments/:id/status", isAuthenticated, requireRole("professional"), async (req: any, res) => {
    try {
      const { status } = req.body;
      if (!status || !["confirmed", "completed", "cancelled", "no_show"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const userId = getUserId(req);
      const prof = await storage.getProfessionalByUserId(userId);
      if (!prof) return res.status(404).json({ message: "Professional profile not found" });

      const appts = await storage.getAppointmentsByProfessional(prof.id);
      const apptId = parseInt(req.params.id);
      const ownsAppointment = appts.some((a: any) => a.id === apptId);
      if (!ownsAppointment) {
        return res.status(403).json({ message: "You can only update your own appointments" });
      }

      await storage.updateAppointmentStatus(apptId, status);
      res.json({ message: "Appointment status updated" });
    } catch (error) {
      console.error("Error updating appointment status:", error);
      res.status(500).json({ message: "Failed to update appointment status" });
    }
  });

  // --- Documents ---
  app.get("/api/document-types", async (req: any, res) => {
    try {
      const types = await storage.getDocumentTypes();
      res.json(types);
    } catch (error) {
      console.error("Error fetching document types:", error);
      res.status(500).json({ message: "Failed to fetch document types" });
    }
  });

  app.get("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const docs = await storage.getDocumentsByClient(userId);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { documentTypeId, intakeAnswers } = req.body;

      const docTypes = await storage.getDocumentTypes();
      const docType = docTypes.find((dt) => dt.id === documentTypeId);
      if (!docType) return res.status(404).json({ message: "Document type not found" });

      const doc = await storage.createDocument({
        clientId: userId,
        documentTypeId,
        intakeAnswers,
        status: "drafting",
        amount: docType.price,
      });

      generateDocumentDraft(docType.name, intakeAnswers || {})
        .then(async (draft) => {
          await storage.updateDocument(doc.id, {
            currentDraft: draft,
            status: "in_review",
          });
        })
        .catch((err) => {
          console.error("Error generating draft:", err);
        });

      res.status(201).json(doc);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // --- Document Review Workflow ---

  app.get("/api/admin/documents", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      const docs = await storage.getAllDocuments();
      res.json(docs);
    } catch (error) {
      console.error("Error fetching all documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/admin/documents/:id/assign", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      const docId = parseInt(req.params.id);
      const { lawyerId } = req.body;
      if (!lawyerId) return res.status(400).json({ message: "Lawyer ID is required" });
      await storage.updateDocument(docId, {
        assignedLawyerId: lawyerId,
        status: "in_review",
      });
      await storage.createAuditLog({
        actorId: getUserId(req),
        action: "document.assign_lawyer",
        resource: "document",
        resourceId: String(docId),
        metadata: { lawyerId },
      });
      res.json({ message: "Lawyer assigned successfully" });
    } catch (error) {
      console.error("Error assigning lawyer:", error);
      res.status(500).json({ message: "Failed to assign lawyer" });
    }
  });

  app.get("/api/lawyer/documents", isAuthenticated, requireRole("professional"), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const prof = await storage.getProfessionalByUserId(userId);
      if (!prof) return res.status(403).json({ message: "Not a registered lawyer" });
      const docs = await storage.getDocumentsByLawyer(prof.id);
      res.json(docs);
    } catch (error) {
      console.error("Error fetching lawyer documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/lawyer/documents/:id/approve", isAuthenticated, requireRole("professional"), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const prof = await storage.getProfessionalByUserId(userId);
      if (!prof) return res.status(403).json({ message: "Not a registered lawyer" });
      const docId = parseInt(req.params.id);
      const doc = await storage.getDocument(docId);
      if (!doc || doc.assignedLawyerId !== prof.id) {
        return res.status(403).json({ message: "Not authorized to review this document" });
      }
      await storage.updateDocument(docId, {
        status: "finalized",
        finalContent: doc.currentDraft,
        reviewNotes: null,
      });
      await storage.createAuditLog({
        actorId: userId,
        action: "document.approve",
        resource: "document",
        resourceId: String(docId),
      });
      res.json({ message: "Document approved and finalized" });
    } catch (error) {
      console.error("Error approving document:", error);
      res.status(500).json({ message: "Failed to approve document" });
    }
  });

  app.post("/api/lawyer/documents/:id/request-changes", isAuthenticated, requireRole("professional"), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const prof = await storage.getProfessionalByUserId(userId);
      if (!prof) return res.status(403).json({ message: "Not a registered lawyer" });
      const docId = parseInt(req.params.id);
      const doc = await storage.getDocument(docId);
      if (!doc || doc.assignedLawyerId !== prof.id) {
        return res.status(403).json({ message: "Not authorized to review this document" });
      }
      const { notes } = req.body;
      if (!notes) return res.status(400).json({ message: "Please provide change notes" });
      await storage.updateDocument(docId, {
        status: "needs_client_input",
        reviewNotes: notes,
      });
      res.json({ message: "Changes requested from client" });
    } catch (error) {
      console.error("Error requesting changes:", error);
      res.status(500).json({ message: "Failed to request changes" });
    }
  });

  app.post("/api/documents/:id/resubmit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const docId = parseInt(req.params.id);
      const doc = await storage.getDocument(docId);
      if (!doc || doc.clientId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      if (doc.status !== "needs_client_input") {
        return res.status(400).json({ message: "Document is not awaiting your input" });
      }
      const { updatedDraft } = req.body;
      if (!updatedDraft) return res.status(400).json({ message: "Updated draft is required" });
      await storage.updateDocument(docId, {
        currentDraft: updatedDraft,
        status: "in_review",
        reviewNotes: null,
      });
      res.json({ message: "Document resubmitted for review" });
    } catch (error) {
      console.error("Error resubmitting document:", error);
      res.status(500).json({ message: "Failed to resubmit document" });
    }
  });

  app.get("/api/documents/:id/download", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const docId = parseInt(req.params.id);
      const doc = await storage.getDocument(docId);
      if (!doc || doc.clientId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const content = doc.finalContent || doc.currentDraft;
      if (!content) {
        return res.status(404).json({ message: "No document content available" });
      }
      const filename = `legal-document-${docId}.txt`;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // --- AI Chat ---
  app.get("/api/ai/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const convs = await storage.getConversationsByUser(userId);
      res.json(convs);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/ai/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const conv = await storage.createConversation({
        userId,
        title: req.body.title || "New Conversation",
      });
      res.status(201).json(conv);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.delete("/api/ai/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteConversation(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  app.get("/api/ai/conversations/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const messages = await storage.getMessagesByConversation(parseInt(req.params.id));
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/ai/conversations/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      await storage.createMessage({
        conversationId,
        role: "user",
        content,
      });

      const messages = await storage.getMessagesByConversation(conversationId);
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let ragContext: string | undefined;
      try {
        const queryEmbedding = await embedText(content);
        const chunks = await storage.searchSimilarChunks(queryEmbedding, 5);
        const relevant = chunks.filter((c) => c.similarity > 0.4);
        if (relevant.length > 0) {
          ragContext = relevant.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n---\n\n");
        }
      } catch (ragErr) {
        console.error("RAG retrieval failed (non-fatal):", ragErr);
      }

      let fullResponse = "";
      let escalation: string | undefined;

      await streamLegalAssistant(chatHistory, (data) => {
        if (data.content) {
          fullResponse += data.content;
        }
        if (data.escalation) {
          escalation = data.escalation;
        }
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }, ragContext);

      await storage.createMessage({
        conversationId,
        role: "assistant",
        content: fullResponse,
        escalationType: escalation || null,
        refusalFlag: false,
      });

      res.end();
    } catch (error) {
      console.error("Error in AI chat:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "AI chat failed" });
      } else {
        res.write(`data: ${JSON.stringify({ content: "\n\nAn error occurred. Please try again.", done: true })}\n\n`);
        res.end();
      }
    }
  });

  // --- Videos ---
  app.get("/api/videos", async (req: any, res) => {
    try {
      const vids = await storage.getVideos();
      res.json(vids);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // --- Admin endpoints ---
  app.get("/api/admin/analytics", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/stats", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/lawyers/pending", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      const pending = await storage.getProfessionalsByStatus("pending");
      res.json(pending);
    } catch (error) {
      console.error("Error fetching pending lawyers:", error);
      res.status(500).json({ message: "Failed to fetch pending lawyers" });
    }
  });

  app.get("/api/admin/lawyers", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      const verified = await storage.getProfessionalsByStatus("verified");
      const pending = await storage.getProfessionalsByStatus("pending");
      const rejected = await storage.getProfessionalsByStatus("rejected");
      res.json([...verified, ...pending, ...rejected]);
    } catch (error) {
      console.error("Error fetching all lawyers:", error);
      res.status(500).json({ message: "Failed to fetch lawyers" });
    }
  });

  app.post("/api/admin/lawyers/:id/approve", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      await storage.updateProfessionalStatus(parseInt(req.params.id), "verified");
      await storage.createAuditLog({
        actorId: getUserId(req),
        action: "lawyer.approve",
        resource: "professional",
        resourceId: req.params.id,
      });
      res.json({ message: "Lawyer approved" });
    } catch (error) {
      console.error("Error approving lawyer:", error);
      res.status(500).json({ message: "Failed to approve lawyer" });
    }
  });

  app.post("/api/admin/lawyers/:id/reject", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      await storage.updateProfessionalStatus(parseInt(req.params.id), "rejected");
      await storage.createAuditLog({
        actorId: getUserId(req),
        action: "lawyer.reject",
        resource: "professional",
        resourceId: req.params.id,
      });
      res.json({ message: "Lawyer rejected" });
    } catch (error) {
      console.error("Error rejecting lawyer:", error);
      res.status(500).json({ message: "Failed to reject lawyer" });
    }
  });

  app.get("/api/admin/videos", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      const vids = await storage.getAllVideos();
      res.json(vids);
    } catch (error) {
      console.error("Error fetching all videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.post("/api/admin/videos", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      const { title, description, videoUrl, thumbnailUrl, category, duration, jurisdiction, language } = req.body;
      if (!title || !videoUrl || !category) {
        return res.status(400).json({ message: "Title, video URL, and category are required" });
      }
      const video = await storage.createVideo({
        title,
        description: description || null,
        videoUrl,
        thumbnailUrl: thumbnailUrl || null,
        category,
        duration: duration ? parseInt(duration) : null,
        jurisdiction: jurisdiction || null,
        language: language || "en",
        isPublished: true,
      });
      res.json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ message: "Failed to create video" });
    }
  });

  app.delete("/api/admin/videos/:id", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      await storage.deleteVideo(parseInt(req.params.id as string));
      res.json({ message: "Video deleted" });
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ message: "Failed to delete video" });
    }
  });

  app.post("/api/admin/videos/:id/approve", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      await storage.updateVideoPublished(parseInt(req.params.id), true);
      res.json({ message: "Video approved and published" });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve video" });
    }
  });

  app.post("/api/admin/videos/:id/reject", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      await storage.deleteVideo(parseInt(req.params.id));
      res.json({ message: "Video submission rejected and removed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject video" });
    }
  });

  // --- Lawyer Video Submissions ---
  app.get("/api/lawyer/videos", isAuthenticated, requireRole("professional"), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const vids = await storage.getVideosByUser(userId);
      res.json(vids);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.post("/api/lawyer/videos", isAuthenticated, requireRole("professional"), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { title, description, videoUrl, category, duration, jurisdiction, language } = req.body;
      if (!title || !videoUrl || !category) {
        return res.status(400).json({ message: "Title, video URL, and category are required" });
      }
      const video = await storage.createVideo({
        title,
        description: description || null,
        videoUrl,
        thumbnailUrl: null,
        category,
        duration: duration ? parseInt(duration) : null,
        jurisdiction: jurisdiction || null,
        language: language || "en",
        isPublished: false,
        submittedByUserId: userId,
      });
      res.status(201).json(video);
    } catch (error) {
      console.error("Error submitting video:", error);
      res.status(500).json({ message: "Failed to submit video" });
    }
  });

  // --- Lawyer Earnings ---
  app.get("/api/lawyer/earnings", isAuthenticated, requireRole("professional"), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const prof = await storage.getProfessionalByUserId(userId);
      if (!prof) return res.status(404).json({ message: "Professional profile not found" });
      const earnings = await storage.getLawyerEarnings(prof.id);
      res.json(earnings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });

  // --- Lawyer Registration ---
  app.post("/api/register/lawyer", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getUserProfile(userId);
      if (profile && profile.role !== "client" && profile.role !== "professional") {
        return res.status(400).json({ message: "You already have a non-client role" });
      }

      const existingProf = await storage.getProfessionalByUserId(userId);
      if (existingProf) {
        return res.status(400).json({ message: "You already have a pending or active lawyer profile" });
      }

      const { specialty, secondarySpecialties, barNumber, yearsExperience, bio, jurisdictions, languages, licenseDocUrl, govIdDocUrl } = req.body;
      if (!specialty || !barNumber) {
        return res.status(400).json({ message: "Specialty and bar number are required" });
      }
      if (!licenseDocUrl || !licenseDocUrl.startsWith("/objects/")) {
        return res.status(400).json({ message: "A valid lawyer's license document is required" });
      }
      if (!govIdDocUrl || !govIdDocUrl.startsWith("/objects/")) {
        return res.status(400).json({ message: "A valid government-issued photo ID is required" });
      }

      const prof = await storage.createProfessional({
        userId,
        specialty,
        secondarySpecialties: secondarySpecialties || [],
        barNumber,
        yearsExperience: yearsExperience || 0,
        verificationStatus: "pending",
        licenseDocUrl,
        govIdDocUrl,
        jurisdictions: jurisdictions || [],
        languages: languages || ["English"],
        isActive: false,
      });

      await storage.updateUserRole(userId, "professional");

      await storage.upsertUserProfile({
        userId,
        role: "professional",
        ...(bio ? { bio } : {}),
        onboardingComplete: true,
      });

      res.status(201).json({ message: "Lawyer registration submitted for verification", professional: prof });
    } catch (error) {
      console.error("Error registering lawyer:", error);
      res.status(500).json({ message: "Failed to register as lawyer" });
    }
  });

  // --- User Management ---
  app.get("/api/admin/users", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsersWithProfiles();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/:id/role", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      const targetUserId = req.params.id;
      const { role } = req.body;
      const validRoles = ["client", "professional", "tenant_admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      await storage.updateUserRole(targetUserId, role);
      await storage.createAuditLog({
        actorId: getUserId(req),
        action: "user.role_change",
        resource: "user",
        resourceId: targetUserId,
        metadata: { newRole: role },
      });
      res.json({ message: `User role updated to ${role}` });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.get("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getUserProfile(userId);
      const prof = await storage.getProfessionalByUserId(userId);
      res.json({ profile, professional: prof || null });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // --- Self-delete account ---
  app.delete("/api/auth/delete-account", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const profile = await storage.getUserProfile(userId);
      if (profile && profile.role === "tenant_admin") {
        return res.status(403).json({ message: "Admin accounts cannot be self-deleted. Contact another administrator." });
      }
      await storage.deleteUser(userId);
      await storage.createAuditLog({
        actorId: userId,
        action: "user.self_delete",
        resource: "user",
        resourceId: userId,
      });
      req.session?.destroy?.(() => {});
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // --- Admin delete user ---
  app.delete("/api/admin/users/:id", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      const targetUserId = req.params.id;
      const actorId = getUserId(req);
      if (targetUserId === actorId) {
        return res.status(400).json({ message: "You cannot delete your own account from admin panel" });
      }
      await storage.deleteUser(targetUserId);
      await storage.createAuditLog({
        actorId,
        action: "user.admin_delete",
        resource: "user",
        resourceId: targetUserId,
      });
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // --- Admin delete professional (lawyer profile only, keeps user account) ---
  app.delete("/api/admin/lawyers/:id", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      const profId = parseInt(req.params.id);
      const prof = await storage.getProfessional(profId);
      if (!prof) return res.status(404).json({ message: "Professional not found" });
      await storage.deleteProfessional(profId);
      await storage.updateUserRole(prof.userId, "client");
      await storage.createAuditLog({
        actorId: getUserId(req),
        action: "lawyer.delete",
        resource: "professional",
        resourceId: String(profId),
      });
      res.json({ message: "Professional profile deleted and user demoted to client" });
    } catch (error) {
      console.error("Error deleting professional:", error);
      res.status(500).json({ message: "Failed to delete professional" });
    }
  });

  // === Law Documents (RAG) ===
  app.get("/api/admin/law-documents", isAuthenticated, requireRole("tenant_admin"), async (_req, res) => {
    try {
      const docs = await storage.getLawDocuments();
      res.json(docs);
    } catch (error) {
      console.error("Error fetching law documents:", error);
      res.status(500).json({ message: "Failed to fetch law documents" });
    }
  });

  app.post("/api/admin/law-documents", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      const { title, filename, content: base64Content, mimeType } = req.body;
      if (!title || !filename || !base64Content) {
        return res.status(400).json({ message: "title, filename, and content are required" });
      }

      const buffer = Buffer.from(base64Content, "base64");

      let text = "";
      if (mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf")) {
        const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
        const parsed = await pdfParse(buffer);
        text = parsed.text;
      } else {
        text = buffer.toString("utf-8");
      }

      if (!text.trim()) {
        return res.status(400).json({ message: "No text could be extracted from the document" });
      }

      const chunks = chunkText(text);
      const doc = await storage.createLawDocument({ title, filename, fileSize: buffer.length });

      const embeddings = await embedTexts(chunks);
      for (let i = 0; i < chunks.length; i++) {
        await storage.createLawDocumentChunk({
          documentId: doc.id,
          chunkIndex: i,
          content: chunks[i],
          embedding: embeddings[i],
        });
      }

      await storage.updateLawDocumentChunkCount(doc.id, chunks.length);
      res.status(201).json({ ...doc, chunkCount: chunks.length });
    } catch (error) {
      console.error("Error processing law document:", error);
      res.status(500).json({ message: "Failed to process document" });
    }
  });

  app.delete("/api/admin/law-documents/:id", isAuthenticated, requireRole("tenant_admin"), async (req: any, res) => {
    try {
      await storage.deleteLawDocument(parseInt(req.params.id));
      res.json({ message: "Law document deleted" });
    } catch (error) {
      console.error("Error deleting law document:", error);
      res.status(500).json({ message: "Failed to delete law document" });
    }
  });

  // === Audit Logs ===
  app.get("/api/admin/audit-logs", isAuthenticated, requireRole("tenant_admin"), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  return httpServer;
}
