import AvatarDemo from "@/components/avatarDemo";
import { Link } from "react-router-dom";

export default function LandingPage() {

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
              <AvatarDemo />
            </div>
            <span className="text-foreground font-bold text-xl">BISU-DRS</span>
          </div>
          <div className="space-x-4">
            <Link to="/login">
              <button className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium transition">
                Sign In
              </button>
            </Link>
            <Link to="/register">
              <button className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-medium transition">
                Register
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-primary font-semibold uppercase tracking-wide mb-4">
              Bohol Island State University – Depression Risk System
            </p>

            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-8 leading-tight text-balance">
              Early Depression Detection for Student Mental Wellness
            </h1>

            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
              BISU-DRS is a data-driven expert system that predicts depression
              risk among students by analyzing personal, academic, and
              psychosocial factors. Using the validated 6-KADS assessment and
              machine learning with explainable AI, we enable early detection
              and timely counselor interventions.
            </p>

            <Link to="/login">
              <button className="px-10 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold text-lg transition transform hover:scale-105">
                Take Assessment
              </button>
            </Link>
          </div>

          <div className="bg-card rounded-3xl p-10 border border-border shadow-sm">
            <div className="bg-muted rounded-2xl p-6 space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  Depression Risk Level
                </p>
                <div className="h-3 bg-primary rounded w-1/3"></div>
                <div className="h-3 bg-muted-foreground/30 rounded w-2/3"></div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-semibold text-foreground mb-3">
                  Research-Backed Factors
                </p>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>
                    <span className="text-sm text-muted-foreground">
                      Academic Pressure & Workload
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>
                    <span className="text-sm text-muted-foreground">
                      Sleep Duration & Quality
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>
                    <span className="text-sm text-muted-foreground">
                      Emotional & Social Support
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 border-t border-border bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground text-center mb-4 text-balance">
            How BISU-DRS Works
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            A comprehensive system combining data science with counselor
            expertise to identify and support at-risk students.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                title: "Comprehensive Assessment",
                desc: "Students complete a validated survey covering personal background, academic performance, lifestyle (sleep, diet, exercise), and psychosocial factors using the 6-KADS scale.",
                icon: "📋",
              },
              {
                title: "Machine Learning Prediction",
                desc: "Advanced models (Random Forest, LGBM, Logistic Regression) trained on real student data identify depression risk patterns with high accuracy and reliability.",
                icon: "🤖",
              },
              {
                title: "Explainable AI (LIME)",
                desc: "Shows counselors exactly why a student is flagged—which specific factors like academic stress, poor sleep, or financial concerns are driving the assessment.",
                icon: "🔍",
              },
              {
                title: "Early Detection",
                desc: "Identifies at-risk students proactively before situations worsen, enabling targeted interventions and timely mental health support.",
                icon: "⚡",
              },
              {
                title: "Counselor Dashboard",
                desc: "Real-time visualizations and priority rankings help guidance counselors efficiently monitor student well-being and track campus mental health trends.",
                icon: "📊",
              },
              {
                title: "Complete Privacy",
                desc: "Anonymous responses, secure data handling, and strict ethical protocols ensure all student identities and mental health information remain completely confidential.",
                icon: "🔒",
              },
            ].map((f, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-card border border-border hover:border-primary/60 transition shadow-sm"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {f.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Factors Section */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground text-center mb-16 text-balance">
            What We Assess
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                category: "Personal Factors",
                items: [
                  "Age & Gender",
                  "Socioeconomic Status",
                  "Family History of Mental Illness",
                ],
              },
              {
                category: "Academic Factors",
                items: [
                  "GPA & Performance",
                  "Study Workload",
                  "Perceived Academic Pressure",
                ],
              },
              {
                category: "Lifestyle Factors",
                items: [
                  "Sleep Duration",
                  "Diet Quality",
                  "Physical Activity Level",
                ],
              },
              {
                category: "Psychosocial Factors",
                items: [
                  "Emotional Regulation",
                  "Social Support Network",
                  "Stress Management",
                ],
              },
            ].map((group, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-card border border-border"
              >
                <h3 className="font-bold text-foreground mb-4">
                  {group.category}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item, i) => (
                    <li key={i} className="text-muted-foreground text-sm">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 border-t border-border bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground text-center mb-10 text-balance">
            Why BISU-DRS Matters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                The Challenge
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    Depression among college students is increasing due to
                    academic pressure, social stress, and personal challenges
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    Manual counselor assessments are time-consuming and can't
                    reach all students needing support
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    Many students don't seek help early, waiting until problems
                    become critical
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                Our Solution
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    Automated assessment reaches all students efficiently and
                    consistently
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    Identifies at-risk students before situations worsen,
                    enabling proactive interventions
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    Gives counselors actionable insights to prioritize support
                    where it's needed most
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground text-center mb-16 text-balance">
            Who Benefits
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                group: "Students",
                benefits:
                  "Access a private, stigma-free tool for early detection and timely support",
              },
              {
                group: "Guidance Counselors",
                benefits:
                  "Automate analysis and identify at-risk students for targeted, evidence-based interventions",
              },
              {
                group: "Facilitators",
                benefits:
                  "Monitor student well-being trends to support psychological and academic needs",
              },
              {
                group: "Institution",
                benefits:
                  "Strengthen mental health services and create a healthier learning environment",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-card border border-border"
              >
                <h3 className="font-bold text-foreground mb-3 text-lg">
                  {item.group}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.benefits}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-border bg-muted text-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-balance">
            Your Mental Health Matters
          </h2>
          <p className="text-xl mb-10 leading-relaxed opacity-95">
            Take the first step toward understanding your mental wellness.
            BISU-DRS provides confidential support and connects you with
            counselors who care about your well-being.
          </p>

          <Link to="/login">
            <button className="px-10 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold text-lg transition transform hover:scale-105">
              Get Started Now
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-6 text-center text-muted-foreground">
        <div className="max-w-7xl mx-auto space-y-2">
          <p>
            &copy; 2025 BISU-DRS — Supporting Student Mental Wellness Through
            Data-Driven Insights
          </p>
          <p className="text-sm">
            Developed by: Jerald M. Cahulogan, Kimberly B. Ligan, Ma. Jhimea P.
            Magbanua, Jade P. Tagupa
          </p>
          <p className="text-xs opacity-75 pt-2">
            Bohol Island State University – Candijay Campus, College of Sciences
          </p>
        </div>
      </footer>
    </div>
  );
}
