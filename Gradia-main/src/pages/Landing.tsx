import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Target,
  Brain,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Rocket,
  FileText,
  BarChart3,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const features = [
  {
    icon: FileText,
    title: "Smart File Upload",
    description:
      "Upload syllabus, notes, textbooks & PYQs. AI processes everything for you.",
    gradient: "from-primary to-cyan-soft",
  },
  {
    icon: Target,
    title: "Priority Topics",
    description:
      "AI identifies the most important topics based on exam patterns.",
    gradient: "from-accent to-amber-soft",
  },
  {
    icon: Brain,
    title: "AI Summaries",
    description:
      "Get concise chapter summaries and expected question banks instantly.",
    gradient: "from-primary to-cyan-soft",
  },
  {
    icon: Sparkles,
    title: "Flashcard Engine",
    description:
      "Auto-generated flashcards for key concepts and memorization.",
    gradient: "from-accent to-amber-soft",
  },
  {
    icon: BarChart3,
    title: "Adaptive Tests",
    description:
      "Smart quizzes that adapt to your learning and track performance.",
    gradient: "from-primary to-cyan-soft",
  },
  {
    icon: MessageSquare,
    title: "AI Tutor",
    description:
      "24/7 contextual AI tutor that knows your progress and weak areas.",
    gradient: "from-accent to-amber-soft",
  },
];

const careerFeatures = [
  {
    icon: Rocket,
    title: "Go-Getter Guide",
    description: "Personalized career roadmaps with timeline constraints.",
  },
  {
    icon: TrendingUp,
    title: "Daily Task Manager",
    description: "Bite-sized daily tasks to keep you on track.",
  },
  {
    icon: GraduationCap,
    title: "Learning Modules",
    description: "Step-by-step courses with theory and mini-projects.",
  },
  {
    icon: Users,
    title: "Community Forums",
    description: "Connect, collaborate, and learn from peers.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-soft flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-sora font-bold text-foreground">
              Gradia
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors link-underline"
            >
              Features
            </a>
            <a
              href="#academic"
              className="text-muted-foreground hover:text-foreground transition-colors link-underline"
            >
              Academic
            </a>
            <a
              href="#career"
              className="text-muted-foreground hover:text-foreground transition-colors link-underline"
            >
              Career
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button variant="hero">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 min-h-screen flex items-center">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-hero-pattern opacity-40" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px]" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered Learning Platform
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-sora font-bold mb-6 leading-tight"
            >
              Master What{" "}
              <span className="gradient-text">Truly Matters</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              Your intelligent companion for exam preparation and career
              success. Upload your materials, get AI insights, and ace your
              goals.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/signup">
                <Button variant="hero" size="xl" className="group">
                  Start Learning Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="glass" size="xl">
                  <BookOpen className="w-5 h-5" />
                  View Demo
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
            >
              {[
                { value: "50K+", label: "Students" },
                { value: "95%", label: "Success Rate" },
                { value: "24/7", label: "AI Support" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-sora font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 rounded-full bg-primary" />
          </div>
        </motion.div>
      </section>

      {/* Academic Features Section */}
      <section id="academic" className="py-24 relative">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:60px_60px] opacity-5" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              <BookOpen className="w-4 h-4" />
              Academic Mastery
            </span>
            <h2 className="text-4xl md:text-5xl font-sora font-bold mb-4">
              AI-Powered <span className="gradient-text">Exam Prep</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Upload your study materials and let AI do the heavy lifting.
              Focus on what matters most.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card variant="feature" className="h-full p-6 group cursor-pointer">
                  <CardContent className="p-0">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <feature.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-sora font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Section */}
      <section id="career" className="py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[150px]" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-4">
                <Rocket className="w-4 h-4" />
                Career Launch
              </span>
              <h2 className="text-4xl md:text-5xl font-sora font-bold mb-6">
                Your <span className="gradient-text-accent">Go-Getter</span>{" "}
                Guide
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Get personalized career roadmaps tailored to your interests
                and timeline. From Web Dev to AI — we've got you covered.
              </p>

              <div className="space-y-4">
                {careerFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-amber-soft flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Career Dashboard Preview */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 rounded-3xl blur-3xl" />
                <Card variant="glass" className="relative p-6 rounded-3xl">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-sora font-semibold">
                        Your Career Roadmap
                      </h3>
                      <span className="text-xs px-3 py-1 rounded-full bg-success/20 text-success-soft">
                        3 weeks left
                      </span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { day: "Day 1-7", task: "HTML & CSS Fundamentals", progress: 100 },
                        { day: "Day 8-14", task: "JavaScript Essentials", progress: 65 },
                        { day: "Day 15-21", task: "React & Projects", progress: 0 },
                      ].map((item) => (
                        <div
                          key={item.day}
                          className="p-4 rounded-xl bg-secondary/50"
                        >
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">{item.day}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.progress}%
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.task}
                          </p>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-accent to-amber-soft rounded-full transition-all"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-hero-pattern opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/10 blur-[150px]" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-sora font-bold mb-6">
              Ready to <span className="gradient-text">Transform</span> Your
              Learning?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands of students who are already using Gradia to ace
              their exams and launch their careers.
            </p>
            <Link to="/signup">
              <Button variant="hero" size="xl" className="group">
                Get Started For Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-cyan-soft flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-sora font-bold">Gradia</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Gradia. Master What Matters.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
