import { useState } from "react";
import {
  Scale,
  Shield,
  FileText,
  MessageSquare,
  Users,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Video,
  Clock,
  Globe,
  Lock,
  Star,
  ChevronDown,
  BookOpen,
  Gavel,
  Building2,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: MessageSquare,
    title: "AI Legal Assistant",
    description: "Get instant educational legal guidance powered by GPT-4. Understand your rights, legal processes, and next steps with clear, jargon-free explanations.",
  },
  {
    icon: Users,
    title: "Verified Lawyers",
    description: "Browse our curated directory of verified legal professionals. Filter by specialty, jurisdiction, language, and availability to find your perfect match.",
  },
  {
    icon: FileText,
    title: "Document Generation",
    description: "Generate legal documents with AI drafting, then have them reviewed and finalized by qualified lawyers. NDAs, contracts, demand letters, and more.",
  },
  {
    icon: Scale,
    title: "Book Consultations",
    description: "Schedule consultations with specialized lawyers at transparent rates. Choose from 30-minute or 60-minute sessions based on your needs.",
  },
  {
    icon: Video,
    title: "Educational Videos",
    description: "Access a growing library of educational legal videos covering employment law, family law, immigration, real estate, and business law.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Your data is protected with HTTPS encryption, secure sessions, and strict access controls. All communications are encrypted and confidential.",
  },
];

const stats = [
  { value: "500+", label: "Verified Lawyers", icon: Users },
  { value: "10K+", label: "Documents Generated", icon: FileText },
  { value: "98%", label: "Client Satisfaction", icon: Star },
  { value: "24/7", label: "AI Assistance", icon: Clock },
];

const specialties = [
  { name: "Family Law", icon: Users, desc: "Divorce, custody, adoption" },
  { name: "Criminal Defense", icon: Gavel, desc: "DUI, white collar, rights" },
  { name: "Immigration", icon: Globe, desc: "Visas, asylum, citizenship" },
  { name: "Corporate Law", icon: Building2, desc: "M&A, startups, contracts" },
  { name: "Employment Law", icon: BookOpen, desc: "Discrimination, wages" },
  { name: "Real Estate", icon: MapPin, desc: "Leases, zoning, disputes" },
  { name: "IP Law", icon: Lock, desc: "Patents, trademarks, copyright" },
  { name: "Estate Planning", icon: GraduationCap, desc: "Wills, trusts, probate" },
];

const testimonials = [
  {
    name: "Jennifer M.",
    role: "Small Business Owner",
    image: "/images/testimonial-1.png",
    quote: "UniCortex helped me generate an NDA and connect with a corporate lawyer in under an hour. The AI assistant explained everything in plain English before I even booked a consultation.",
    rating: 5,
  },
  {
    name: "Raj P.",
    role: "Software Engineer",
    image: "/images/testimonial-2.png",
    quote: "I was overwhelmed with immigration paperwork. The AI assistant broke down every step, and the immigration lawyer I found through UniCortex guided me through the entire H-1B process.",
    rating: 5,
  },
  {
    name: "Angela T.",
    role: "HR Director",
    image: "/images/testimonial-3.png",
    quote: "We use UniCortex for all our employment law questions and document needs. The quality of lawyers on the platform is exceptional, and the document generation saves us hours every week.",
    rating: 5,
  },
];

const faqs = [
  {
    q: "Is the AI assistant a replacement for a real lawyer?",
    a: "No. Our AI assistant provides general legal education and information to help you understand legal concepts, processes, and your rights. It is not a substitute for professional legal advice. For specific legal matters, we recommend consulting with one of our verified lawyers.",
  },
  {
    q: "How are lawyers verified on UniCortex?",
    a: "Every lawyer on our platform undergoes a thorough verification process. We verify their bar number, confirm their active license status, check their disciplinary record, and review their professional credentials before they can be listed.",
  },
  {
    q: "How much does it cost to use UniCortex?",
    a: "Creating an account and using the AI assistant is completely free. Lawyer consultations are priced transparently by each attorney, typically ranging from $75 to $175 for an initial consultation. Document generation fees vary by document type.",
  },
  {
    q: "Is my information kept confidential?",
    a: "Absolutely. All data is transmitted over encrypted HTTPS connections, stored securely, and protected with strict access controls. Your conversations with the AI and with lawyers are private and confidential.",
  },
  {
    q: "What types of legal documents can I generate?",
    a: "You can generate NDAs, demand letters, freelance service agreements, lease agreements, powers of attorney, employment offer letters, and more. Each document is AI-drafted and can be reviewed by a qualified lawyer before finalization.",
  },
  {
    q: "Can I use UniCortex from any location?",
    a: "Yes. UniCortex is accessible from anywhere with an internet connection. Our lawyers are licensed in various U.S. jurisdictions, and you can filter by jurisdiction to find attorneys licensed in your state.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-4 w-full py-5 text-left"
        data-testid={`faq-toggle-${q.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
      >
        <span className="font-medium text-sm sm:text-base">{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? "max-h-96 opacity-100 pb-5" : "max-h-0 opacity-0"}`}
        data-testid={`faq-answer-${q.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
      >
        <p className="text-sm text-muted-foreground leading-relaxed pr-8">
          {a}
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-accent" />
              <span className="font-serif text-xl font-bold" data-testid="text-logo">
                UniCortex
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground transition-colors" data-testid="link-features">Features</a>
              <a href="#specialties" className="text-sm text-muted-foreground transition-colors" data-testid="link-specialties">Practice Areas</a>
              <a href="#testimonials" className="text-sm text-muted-foreground transition-colors" data-testid="link-testimonials">Testimonials</a>
              <a href="#faq" className="text-sm text-muted-foreground transition-colors" data-testid="link-faq">FAQ</a>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a href="/login" onClick={(e) => { e.preventDefault(); window.location.href = "/login"; }}>
                <Button variant="outline" data-testid="button-login">
                  Log In
                </Button>
              </a>
              <a href="/register" className="hidden sm:block" onClick={(e) => { e.preventDefault(); window.location.href = "/register"; }}>
                <Button data-testid="button-get-started">
                  Get Started
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('/images/pattern-bg.png')", backgroundSize: "400px" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[75vh]">
            <div className="space-y-8">
              <div className="space-y-5">
                <Badge variant="outline" className="text-xs font-medium tracking-wide">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered Legal Platform
                </Badge>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight" data-testid="text-hero-title">
                  Legal Guidance,{" "}
                  <span className="text-accent">Simplified.</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed" data-testid="text-hero-subtitle">
                  Access AI-powered legal education, connect with verified lawyers, 
                  generate documents, and book consultations — all in one secure platform.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a href="/register" onClick={(e) => { e.preventDefault(); window.location.href = "/register"; }}>
                  <Button size="lg" data-testid="button-hero-cta">
                    Start Free Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <a href="#how-it-works">
                  <Button size="lg" variant="outline" data-testid="button-hero-learn">
                    See How It Works
                  </Button>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span>500+ verified lawyers</span>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative rounded-md overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                <img
                  src="/images/hero-team.png"
                  alt="Professional legal team in modern office"
                  className="w-full h-auto object-cover rounded-md"
                  data-testid="img-hero"
                />
                <div className="absolute bottom-6 left-6 right-6 z-20 space-y-2">
                  <p className="text-white text-base font-semibold">
                    Trusted by thousands of clients nationwide
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-white/80 text-xs ml-2">4.9/5 average rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 border-y bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center space-y-2">
                <stat.icon className="h-6 w-6 text-accent mx-auto" />
                <div className="font-serif text-3xl sm:text-4xl font-bold text-accent" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="text-xs">Platform Features</Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold" data-testid="text-features-title">
              Everything You Need for Legal Matters
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              From instant AI-powered guidance to verified lawyer consultations and AI-drafted documents, 
              UniCortex provides comprehensive legal support at every step.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover-elevate transition-all duration-200 h-full" data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s/g, "-")}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="h-11 w-11 rounded-md bg-accent/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="specialties" className="py-20 sm:py-24 bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="text-xs">Practice Areas</Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Lawyers Across Every Practice Area
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whatever your legal need, find a verified specialist ready to help.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {specialties.map((s) => (
              <div
                key={s.name}
                className="flex flex-col items-center text-center p-5 rounded-md border bg-background hover-elevate transition-all duration-200"
                data-testid={`specialty-${s.name.toLowerCase().replace(/\s/g, "-")}`}
              >
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                  <s.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold text-sm">{s.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="text-xs">How It Works</Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Get Started in Minutes
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to access legal guidance, connect with lawyers, and get the help you need.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Create Your Account", desc: "Sign up for free in seconds. No credit card or payment information required to get started.", icon: Users },
              { step: "02", title: "Ask the AI Assistant", desc: "Get instant answers to your legal questions. Our AI explains complex concepts in plain, easy-to-understand language.", icon: MessageSquare },
              { step: "03", title: "Find Your Lawyer", desc: "Browse verified attorneys by specialty, jurisdiction, and ratings. Book a consultation at a time that works for you.", icon: Scale },
              { step: "04", title: "Get Your Documents", desc: "Generate AI-drafted legal documents and have them reviewed by a qualified attorney for accuracy and completeness.", icon: FileText },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="h-14 w-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-serif font-bold text-lg mx-auto">
                    {item.step}
                  </div>
                </div>
                <item.icon className="h-5 w-5 text-accent mx-auto" />
                <h3 className="font-semibold text-base">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 sm:py-24 bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="text-xs">Testimonials</Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              What Our Clients Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Thousands of individuals and businesses trust UniCortex for accessible, reliable legal support.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="h-full" data-testid={`card-testimonial-${t.name.toLowerCase().replace(/\s/g, "-")}`}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={t.image} alt={t.name} />
                      <AvatarFallback className="bg-accent/10 text-accent text-xs">
                        {t.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="text-xs">Why UniCortex</Badge>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold">
                Built for People Who Deserve Better Legal Access
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Legal services have traditionally been expensive, confusing, and inaccessible. 
                UniCortex changes that by combining AI technology with verified human expertise 
                to make legal guidance available to everyone.
              </p>
              <div className="space-y-4">
                {[
                  { title: "Transparent Pricing", desc: "Every lawyer lists their rates upfront. No surprise bills, no hidden fees." },
                  { title: "AI + Human Expertise", desc: "AI handles education and drafts; licensed attorneys handle the final review." },
                  { title: "Multi-Jurisdiction Coverage", desc: "Find lawyers licensed in your state across dozens of practice areas." },
                  { title: "Secure by Design", desc: "HTTPS encryption, secure sessions, and strict role-based access controls." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="rounded-md overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10" />
                <img
                  src="/images/hero-law.png"
                  alt="Professional legal environment"
                  className="w-full h-auto object-cover rounded-md"
                  data-testid="img-why-unicortex"
                />
                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <p className="text-white text-sm font-medium">
                    Making legal expertise accessible to everyone
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 sm:py-24 bg-card border-y">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <Badge variant="outline" className="text-xs">FAQ</Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Have questions? We have answers.
            </p>
          </div>

          <div className="border rounded-md bg-background px-6">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold">
              Ready to Get Legal Clarity?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join thousands of individuals and businesses who trust UniCortex 
              for accessible, reliable, and affordable legal guidance.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="/register" onClick={(e) => { e.preventDefault(); window.location.href = "/register"; }}>
              <Button size="lg" data-testid="button-cta-bottom">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="#features">
              <Button size="lg" variant="outline" data-testid="button-cta-learn">
                Explore Features
              </Button>
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            No credit card required. Free AI assistant access included.
          </p>
        </div>
      </section>

      <footer className="border-t bg-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-accent" />
                <span className="font-serif text-lg font-bold">UniCortex</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Making legal guidance accessible, affordable, and understandable for everyone through AI and verified professionals.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Platform</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-sm text-muted-foreground" data-testid="footer-link-features">Features</a>
                <a href="#specialties" className="block text-sm text-muted-foreground" data-testid="footer-link-specialties">Practice Areas</a>
                <a href="#how-it-works" className="block text-sm text-muted-foreground" data-testid="footer-link-how-it-works">How It Works</a>
                <a href="#faq" className="block text-sm text-muted-foreground" data-testid="footer-link-faq">FAQ</a>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Legal</h4>
              <div className="space-y-2">
                <span className="block text-sm text-muted-foreground">Terms of Service</span>
                <span className="block text-sm text-muted-foreground">Privacy Policy</span>
                <span className="block text-sm text-muted-foreground">Cookie Policy</span>
                <span className="block text-sm text-muted-foreground">Disclaimer</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Contact</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span data-testid="text-contact-email">support@unicortex.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span data-testid="text-contact-phone">1-800-UNI-CRTX</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span data-testid="text-contact-location">San Francisco, CA</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              2026 UniCortex. All rights reserved. UniCortex provides educational legal information only. 
              This is not legal advice. Always consult a qualified attorney for legal matters.
            </p>
            <a
              href="/admin-login"
              className="text-xs text-muted-foreground/40"
              onClick={(e) => { e.preventDefault(); window.location.href = "/admin-login"; }}
              data-testid="link-admin-login"
            >
              Admin
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
