/* eslint-disable react-hooks/static-components */
/* eslint-disable no-unused-vars */
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Brain,
  BarChart3,
  Lock,
  Zap,
  Users,
  BookOpen,
  CheckCircle2,
  MenuIcon,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ThemeToggleButtonLandingPage from "../components/ThemeToggleButtonLandingPage";
import { toast } from "sonner";

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    setMenuOpen(false);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  function AnimatedMenuIcon({ open }) {
    return (
      <span
        className={[
          "relative block w-5 h-4 text-current",
          "transition-transform duration-300 ease-in-out",
          open ? "rotate-90" : "rotate-0",
        ].join(" ")}
      >
        {/* Top line */}
        <span
          className={[
            "absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current",
            "transition-all duration-300 ease-in-out",
            open ? "translate-y-1.5 rotate-45" : "",
          ].join(" ")}
        />

        {/* Middle line */}
        <span
          className={[
            "absolute left-0 top-1.5 h-0.5 w-5 rounded-full bg-current",
            "transition-all duration-200 ease-in-out",
            open ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100",
          ].join(" ")}
        />

        {/* Bottom line */}
        <span
          className={[
            "absolute left-0 top-3 h-0.5 w-5 rounded-full bg-current",
            "transition-all duration-300 ease-in-out",
            open ? "-translate-y-1.5 -rotate-45" : "",
          ].join(" ")}
        />
      </span>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-linear-to-br from-landing-primary to-landing-accent flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-landing-primary-foreground" />
            </div>
            <span className="text-base sm:text-lg font-bold bg-linear-to-r from-landing-primary to-landing-accent bg-clip-text text-transparent truncate">
              BISU-DRS
            </span>
          </div>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-4">
            <button
              className="text-foreground hover:text-landing-primary transition cursor-pointer"
              onClick={() => scrollToSection("how-it-works")}
              type="button"
            >
              How It Works
            </button>
            <button
              className="text-foreground hover:text-landing-primary transition cursor-pointer"
              onClick={() => scrollToSection("privacy")}
              type="button"
            >
              Privacy
            </button>

            <Link to="/login">
              <button className="text-foreground hover:text-landing-primary transition cursor-pointer">
                Sign In
              </button>
            </Link>

            <Link to="/signup">
              <Button className="rounded-full bg-landing-primary hover:bg-landing-primary/90 text-landing-primary-foreground cursor-pointer">
                Get Started
              </Button>
            </Link>

            <ThemeToggleButtonLandingPage />
          </div>

          {/* Mobile actions */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggleButtonLandingPage />
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center justify-center p-2 text-foreground transition-transform active:scale-90"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <AnimatedMenuIcon open={menuOpen} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen ? (
          <div
            className={[
              "sm:hidden border-t border-border bg-background/95 backdrop-blur-xl",
              "origin-top transition-all duration-300 ease-out",
              menuOpen
                ? "opacity-100 translate-y-0 scale-y-100 pointer-events-auto"
                : "opacity-0 -translate-y-2 scale-y-95 pointer-events-none",
            ].join(" ")}
          >
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
              <button
                className="w-full text-left rounded-lg px-3 py-2 text-foreground hover:bg-muted"
                onClick={() => scrollToSection("how-it-works")}
                type="button"
              >
                How It Works
              </button>
              <button
                className="w-full text-left rounded-lg px-3 py-2 text-foreground hover:bg-muted"
                onClick={() => scrollToSection("privacy")}
                type="button"
              >
                Privacy
              </button>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-lg">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full rounded-lg bg-landing-primary hover:bg-landing-primary/90 text-landing-primary-foreground">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-landing-primary/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 right-6 sm:right-10 w-56 h-56 sm:w-72 sm:h-72 bg-landing-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-20 left-6 sm:left-10 w-56 h-56 sm:w-72 sm:h-72 bg-landing-accent/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-5  px-3 sm:px-4 py-2 rounded-full bg-landing-primary/10 border border-landing-primary/20 backdrop-blur-sm hover:bg-landing-primary/15 transition-all duration-300">
            <Sparkles className="w-4 h-4 text-landing-primary" />
            <span className="text-landing-primary font-semibold text-[13px] sm:text-sm">
              BISU–Candijay Campus Student Mental Health Support
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-5 sm:mb-8 leading-tight text-balance">
            Depression Risk Prediction{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-landing-primary via-landing-accent to-landing-primary animate-pulse">
              with Explainable AI
            </span>
          </h1>

          <p className="text-md sm:text-lg lg:text-xl text-landing-muted-foreground mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto text-balance font-light">
            BISU-DRS is a web-based expert system that assesses{" "}
            <span className="font-semibold text-foreground">
              depression risk in students
            </span>{" "}
            using personal, academic, and psychosocial factors together with the{" "}
            <span className="font-semibold text-foreground">6-Item KADS</span>.
            It supports early detection and helps counselors prioritize timely
            interventions through transparent, data-driven explanations.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-16">
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full bg-linear-to-r from-landing-primary to-landing-accent hover:shadow-lg hover:shadow-landing-primary/20 text-landing-primary-foreground font-semibold px-7 sm:px-8 transition-all duration-300 transform hover:scale-102"
              >
                Take Assessment <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto rounded-full border-2 border-landing-primary/30 hover:border-landing-primary/60 hover:bg-landing-primary/5 font-semibold px-7 sm:px-8 transition-all duration-300"
              onClick={() => scrollToSection("how-it-works")}
            >
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-8 justify-center text-sm sm:text-sm text-landing-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-landing-accent" />
              <span>6-KADS Based Screening</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-landing-accent" />
              <span>SHAP Explainability</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-landing-accent" />
              <span>Data Privacy Act (RA 10173)</span>
            </div>
          </div>
        </div>

        {/* Hero Visual - Dashboard Preview */}
        <div className="max-w-5xl mx-auto mt-10 sm:mt-20 relative group">
          <div className="absolute -inset-0.5 bg-linear-to-r from-landing-primary/30 to-landing-accent/30 rounded-3xl blur-lg group-hover:blur-2xl transition-all duration-500 opacity-75 group-hover:opacity-100" />
          <div className="relative bg-linear-to-br from-card via-card to-background rounded-3xl border border-landing-primary/20 p-4 sm:p-6 lg:p-8 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-t from-landing-primary/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                {[
                  {
                    label: "Risk Classification",
                    value: "At Risk / Not At Risk",
                    icon: BarChart3,
                    color: "text-landing-primary",
                  },
                  {
                    label: "Explainability",
                    value: "SHAP Insights",
                    icon: CheckCircle2,
                    color: "text-landing-accent",
                  },
                  {
                    label: "Counselor Action",
                    value: "Prioritized Support",
                    icon: Users,
                    color: "text-landing-primary",
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="text-center p-4 sm:p-6 rounded-2xl bg-background/50 border border-landing-primary/10 hover:border-landing-primary/30 hover:bg-background/80 transition-all duration-300 group-hover:shadow-lg"
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-3 ${item.color}`} />
                      <p className="text-[10px] sm:text-xs text-landing-muted-foreground mb-2 uppercase tracking-wider">
                        {item.label}
                      </p>
                      <p className="text-sm sm:text-base font-bold text-foreground">
                        {item.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-landing-primary/10">
                <div className="flex items-start sm:items-center gap-2 text-xs sm:text-sm text-landing-muted-foreground">
                  <div className="w-2 h-2 mt-1 sm:mt-0 rounded-full bg-landing-accent animate-pulse shrink-0" />
                  <span>
                    Built for BISU–Candijay Campus to support early detection,
                    proactive counseling, and intervention prioritization
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="how-it-works"
        className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border relative scroll-mt-28"
      >
        <div className="absolute inset-0 bg-linear-to-b from-landing-primary/3 to-landing-accent/3 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 text-balance">
              How BISU-DRS Works
            </h2>
            <p className="text-base sm:text-xl text-landing-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              A structured workflow that collects student variables, trains
              machine learning models, evaluates performance, and provides{" "}
              <span className="font-semibold text-foreground">
                explainable results for counselors
              </span>
              .
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {[
              {
                icon: BookOpen,
                title: "Survey Data Collection",
                desc: "Collects demographic, health & lifestyle, academic, and psychosocial variables through online and paper-based surveys, including the validated 6-Item KADS.",
                step: "01",
              },
              {
                icon: Zap,
                title: "Data Preprocessing",
                desc: "Handles missing values, removes duplicates, detects data quality issues, and applies encoding and normalization to prepare features for model training.",
                step: "02",
              },
              {
                icon: Brain,
                title: "Model Training",
                desc: "Trains and compares supervised models (Random Forest, LightGBM, Logistic Regression, and SVC) using an 80:20 split and stratified evaluation.",
                step: "03",
              },
              {
                icon: BarChart3,
                title: "Model Evaluation",
                desc: "Evaluates accuracy, precision, recall, F1-score, and confusion matrix. The best model is selected based on F1-score for balanced performance.",
                step: "04",
              },
              {
                icon: Sparkles,
                title: "Explainable AI (SHAP)",
                desc: "Uses SHAP to explain predictions at both global and individual levels, showing which factors increased or decreased risk classification.",
                step: "05",
              },
              {
                icon: Users,
                title: "Counselor Decision Support",
                desc: "Provides a dashboard and counselor-student messaging to help identify at-risk students and support evidence-based interventions.",
                step: "06",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="group relative">
                  <div className="absolute -inset-0.5 bg-linear-to-br from-landing-primary/20 to-landing-accent/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Card className="relative overflow-hidden p-6 sm:p-8 border-landing-primary/15 hover:border-landing-primary/40 transition-all duration-500 hover:shadow-xl bg-linear-to-br from-card/80 to-card/40 backdrop-blur-sm group-hover:bg-card">
                    <div className="absolute top-0 right-0 text-7xl sm:text-8xl font-bold text-landing-primary/5 group-hover:text-landing-primary/10 transition-colors duration-500">
                      {feature.step}
                    </div>
                    <div className="relative z-10">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-linear-to-br from-landing-primary/20 to-landing-accent/20 flex items-center justify-center mb-5 sm:mb-6 group-hover:from-landing-primary/30 group-hover:to-landing-accent/30 transition-all duration-500">
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-landing-primary group-hover:text-landing-accent transition-colors duration-500" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-landing-muted-foreground text-sm leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Assessment Factors */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-linear-to-b from-card/50 to-card/20 border-t border-border relative">
        <div className="absolute inset-0 bg-linear-to-r from-landing-primary/5 via-transparent to-landing-accent/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 text-balance">
              Assessment Factors Covered
            </h2>
            <p className="text-base sm:text-lg text-landing-muted-foreground max-w-3xl mx-auto">
              BISU-DRS assesses student variables across core dimensions and
              includes the 6-Item KADS for depressive symptom screening.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                category: "Demographic",
                items: ["Age", "Gender", "Course & Year Level"],
                color: "from-landing-primary/10 to-landing-primary/5",
              },
              {
                category: "Health & Lifestyle",
                items: [
                  "Sleep Duration",
                  "Breakfast Habit",
                  "Exercise & Habits",
                ],
                color: "from-landing-accent/10 to-landing-accent/5",
              },
              {
                category: "Academic",
                items: [
                  "Academic Pressure",
                  "Workload",
                  "Academic Dissatisfaction",
                ],
                color: "from-landing-primary/10 to-landing-primary/5",
              },
              {
                category: "Psychosocial",
                items: [
                  "Social Support",
                  "Bullying",
                  "Financial & Relationship Stress",
                ],
                color: "from-landing-accent/10 to-landing-accent/5",
              },
            ].map((group, i) => (
              <div key={i} className="group relative">
                <div className="absolute -inset-0.5 bg-linear-to-br from-landing-primary/10 to-landing-accent/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Card
                  className={`relative p-6 sm:p-7 border-landing-primary/15 bg-linear-to-br ${group.color} hover:border-landing-primary/40 transition-all duration-500 group-hover:shadow-lg`}
                >
                  <h3 className="font-bold text-landing-primary mb-4 sm:mb-5 text-base sm:text-lg">
                    {group.category}
                  </h3>
                  <ul className="space-y-3 sm:space-y-4">
                    {group.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-center gap-3 text-sm text-landing-muted-foreground group-hover:text-foreground transition-colors duration-300"
                      >
                        <div className="w-2 h-2 rounded-full bg-landing-primary group-hover:bg-landing-accent transition-colors duration-500 shrink-0" />
                        <span className="font-light">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 text-center text-xs sm:text-sm text-landing-muted-foreground">
            Survey items are adapted from validated instruments and include the{" "}
            <span className="font-semibold text-foreground">6-Item KADS</span>.
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border relative">
        <div className="absolute inset-0 bg-linear-to-b from-landing-primary/3 to-landing-accent/3 pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-10 sm:gap-16 lg:gap-20">
            <div>
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-1 h-8 bg-landing-primary rounded-full" />
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                  The Challenge
                </h3>
              </div>
              <ul className="space-y-4 sm:space-y-5">
                {[
                  "Depression risk among college students can increase due to academic pressure, social situations, and personal issues",
                  "Manual assessments require face-to-face scheduling, follow-ups, and time-consuming processing",
                  "Many students do not seek help early, so concerns may only be noticed when the situation becomes critical",
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 group">
                    <span className="text-landing-primary font-bold shrink-0 text-lg group-hover:text-xl transition-all duration-300">
                      ×
                    </span>
                    <span className="text-landing-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-1 h-8 bg-landing-accent rounded-full" />
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Our Solution
                </h3>
              </div>
              <ul className="space-y-4 sm:space-y-5">
                {[
                  "A web-based expert system that predicts depression risk based on personal, academic, and psychosocial variables",
                  "Early detection supports proactive counseling and prioritization of interventions for students in need",
                  "SHAP explanations provide transparent, factor-level insights to support evidence-based professional judgment",
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 group">
                    <CheckCircle2 className="w-6 h-6 text-landing-accent shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-landing-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Who Benefits */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-linear-to-b from-card/50 to-card/20 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-landing-primary/5 via-transparent to-landing-accent/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 text-balance">
              Who Benefits
            </h2>
            <p className="text-sm sm:text-lg text-landing-muted-foreground max-w-3xl mx-auto">
              BISU-DRS supports the BISU–Candijay community through accessible
              screening and counselor decision support.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                group: "Students",
                benefit:
                  "A private and accessible tool for early detection of depression risk and timely support",
                icon: Users,
              },
              {
                group: "Guidance Counselors",
                benefit:
                  "Decision support with explainable, evidence-based results to prioritize interventions",
                icon: Brain,
              },
              {
                group: "Facilitators",
                benefit:
                  "Monitoring of student well-being trends to support psychological needs",
                icon: BarChart3,
              },
              {
                group: "BISU–Candijay Campus",
                benefit:
                  "Strengthens mental health support services and promotes a healthier learning environment",
                icon: Sparkles,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="group relative">
                  <div className="absolute -inset-0.5 bg-linear-to-br from-landing-primary/20 to-landing-accent/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Card className="relative p-6 sm:p-8 border-landing-primary/15 text-center bg-linear-to-br from-card/80 to-card/40 hover:border-landing-primary/40 transition-all duration-500 group-hover:shadow-xl">
                    <Icon className="w-9 h-9 sm:w-10 sm:h-10 text-landing-primary mx-auto mb-4 group-hover:text-landing-accent transition-colors duration-500" />
                    <h3 className="font-bold text-foreground mb-2 sm:mb-3 text-base sm:text-lg">
                      {item.group}
                    </h3>
                    <p className="text-sm text-landing-muted-foreground leading-relaxed font-light">
                      {item.benefit}
                    </p>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Privacy / Ethics */}
      <section
        id="privacy"
        className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border relative scroll-mt-28"
      >
        <div className="absolute inset-0 bg-linear-to-b from-landing-primary/3 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 text-balance">
              Privacy & Ethical Considerations
            </h2>
            <p className="text-sm sm:text-lg text-landing-muted-foreground max-w-3xl mx-auto">
              The system is designed to support—not replace—professional
              judgment. Student information is handled with confidentiality and
              secure access controls.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Lock,
                title: "Confidential Data Handling",
                desc: "Responses are handled securely with role-based access control to limit sensitive information to authorized users.",
              },
              {
                icon: CheckCircle2,
                title: "Informed Consent",
                desc: "Participants are clearly informed about the purpose, procedures, and data use before participating in the assessment.",
              },
              {
                icon: Zap,
                title: "Explainability & Responsibility",
                desc: "SHAP explanations improve transparency by showing which factors influenced each result to support evidence-based decisions.",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Card
                  key={i}
                  className="p-6 sm:p-8 border-landing-primary/15 bg-linear-to-br from-card/80 to-card/40 hover:border-landing-primary/40 transition-all duration-500 hover:shadow-xl"
                >
                  <Icon className="w-9 h-9 sm:w-10 sm:h-10 text-landing-primary mb-4" />
                  <h3 className="font-bold text-foreground mb-2 sm:mb-3 text-base sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="text-sm text-landing-muted-foreground leading-relaxed font-light">
                    {item.desc}
                  </p>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 sm:mt-10 text-center text-xs sm:text-sm text-landing-muted-foreground">
            Compliance aligned with the{" "}
            <span className="font-semibold text-foreground">
              Data Privacy Act of 2012 (RA 10173)
            </span>{" "}
            and ethical handling of mental health information.
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-landing-primary/8 to-landing-accent/8 pointer-events-none" />
        <div className="absolute -top-40 right-0 w-72 h-72 sm:w-80 sm:h-80 bg-landing-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 left-0 w-72 h-72 sm:w-80 sm:h-80 bg-landing-primary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-5 sm:mb-8 text-balance leading-tight">
            Take the First Step
          </h2>
          <p className="text-sm sm:text-xl text-landing-muted-foreground mb-8 sm:mb-12 leading-relaxed max-w-2xl mx-auto font-light">
            BISU-DRS helps assess depression risk using survey-based indicators
            and supports guidance services with explainable insights for timely
            intervention.
          </p>

          <Link to="/register" className="inline-block w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto rounded-full bg-linear-to-r from-landing-primary to-landing-accent hover:shadow-2xl hover:shadow-landing-primary/20 text-landing-primary-foreground font-semibold px-8 sm:px-10 py-6 text-base sm:text-lg transition-all duration-300 transform hover:scale-102"
            >
              Get Started Now <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <div className="mt-5 sm:mt-6 text-xs text-landing-muted-foreground">
            Note: This tool does not provide a clinical diagnosis. Results are
            intended to support counselor assessment and decision-making.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-landing-primary/10 py-12 sm:py-16 px-4 sm:px-6 bg-linear-to-b from-card/30 to-background/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-landing-primary/5 via-transparent to-landing-accent/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-3 gap-10 sm:gap-12 mb-10 sm:mb-12 pb-10 sm:pb-12 border-b border-landing-primary/10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-landing-primary to-landing-accent flex items-center justify-center">
                  <Brain className="w-5 h-5 text-landing-primary-foreground" />
                </div>
                <span className="font-bold text-lg text-foreground">
                  BISU-DRS
                </span>
              </div>
              <p className="text-sm text-landing-muted-foreground leading-relaxed">
                A web-based expert system for predicting and explaining student
                depression risk using personal, academic, and psychosocial
                factors with SHAP explainability.
              </p>
              <p className="mt-4 text-xs text-landing-muted-foreground">
                Tech Stack: React JS • Supabase • Flask API
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="text-landing-muted-foreground hover:text-landing-primary transition-colors duration-300 font-light cursor-pointer"
                    type="button"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("privacy")}
                    className="text-landing-muted-foreground hover:text-landing-primary transition-colors duration-300 font-light cursor-pointer"
                    type="button"
                  >
                    Privacy & Ethics
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      toast.warning("Contact details are not available yet.")
                    }
                    className="text-landing-muted-foreground hover:text-landing-primary transition-colors duration-300 font-light cursor-pointer"
                    type="button"
                  >
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
                Research Basis
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <span className="text-landing-muted-foreground font-light">
                    6-Item KADS Screening
                  </span>
                </li>
                <li>
                  <span className="text-landing-muted-foreground font-light">
                    Model Comparison (RF, LightGBM, LR, SVC)
                  </span>
                </li>
                <li>
                  <span className="text-landing-muted-foreground font-light">
                    SHAP Global & Local Explanations
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center text-xs text-landing-muted-foreground space-y-3">
            <p className="font-medium">
              &copy; 2025 BISU-DRS — Bohol Island State University (Candijay
              Campus)
            </p>
            <p>
              Developed by: Jerald M. Cahulogan, Kimberly B. Ligan, Ma. Jhimea
              P. Magbanua, Jade P. Tagupa
            </p>
            <p className="pt-2 border-t border-border/30">
              Committed to student mental health through responsible,
              explainable, and ethical AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
