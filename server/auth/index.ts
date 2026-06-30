import type { Express, RequestHandler } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import connectPgSimple from "connect-pg-simple";
import { pool, db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "../storage";

const PgStore = connectPgSimple(session);

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Unauthorized" });
};

export function setupAuth(app: Express): void {
  app.use(
    session({
      store: new PgStore({
        pool,
        tableName: "sessions",
        createTableIfMissing: false,
      }),
      secret: process.env.SESSION_SECRET || "unicortex-law-dev-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user || !user.passwordHash) {
          return done(null, false, { message: "Invalid email or password" });
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user ?? false);
    } catch (err) {
      done(err);
    }
  });
}

export function registerAuthRoutes(app: Express): void {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const profileRole: "client" | "professional" =
        role === "professional" ? "professional" : "client";
      const [existing] = await db.select().from(users).where(eq(users.email, email));
      if (existing) {
        return res.status(409).json({ message: "Email already registered" });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await storage.upsertUser({ email, firstName, lastName, passwordHash });
      await storage.upsertUserProfile({ userId: user.id, role: profileRole });

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login after registration failed" });
        return res.status(201).json({ id: user.id, email: user.email });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return res.status(500).json({ message: "Authentication error" });
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (loginErr) => {
        if (loginErr) return res.status(500).json({ message: "Login failed" });
        return res.json({ id: user.id, email: user.email });
      });
    })(req, res, next);
  });

  app.post("/api/auth/admin-login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return res.status(500).json({ message: "Authentication error" });
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });

      try {
        const profile = await storage.getUserProfile(user.id);
        if (profile?.role !== "tenant_admin") {
          return res.status(403).json({ message: "Access restricted to administrators" });
        }
      } catch {
        return res.status(500).json({ message: "Authorization check failed" });
      }

      req.login(user, (loginErr) => {
        if (loginErr) return res.status(500).json({ message: "Login failed" });
        return res.json({ id: user.id, email: user.email });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.post("/api/auth/select-role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { role, fullName, dateOfBirth, emailAddress, phone, address } = req.body;

      if (!role || !["client", "professional"].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }
      if (!fullName || !dateOfBirth || !emailAddress || !phone || !address) {
        return res.status(400).json({ message: "All personal details are required" });
      }

      await storage.upsertUserProfile({
        userId,
        role: role as "client" | "professional",
        fullName,
        dateOfBirth,
        emailAddress,
        phone,
        address,
        onboardingComplete: role === "client",
      });

      res.json({ message: "Role selected", role });
    } catch (error) {
      console.error("select-role error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const userId = user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const [profile, prof] = await Promise.all([
        storage.getUserProfile(userId),
        storage.getProfessionalByUserId(userId),
      ]);

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: profile?.role ?? "client",
        profileId: profile?.id ?? 0,
        phone: profile?.phone ?? null,
        country: profile?.country ?? null,
        state: profile?.state ?? null,
        bio: profile?.bio ?? null,
        onboardingComplete: profile?.onboardingComplete ?? false,
        tenantConfig: null,
        verificationStatus: prof?.verificationStatus ?? null,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
