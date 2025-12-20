import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Target,
  Brain,
  ArrowRight,
  MessageSquare,
  Rocket,
  LogOut,
} from "lucide-react";
import AcademicChart from "@/components/dashboard/AcademicChart";
import CareerChart from "@/components/dashboard/CareerChart";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const quickActions = [
  {
    title: "Study Sets",
    description: "Organize your materials",
    icon: BookOpen,
    href: "/dashboard/study-sets",
    color: "primary",
  },
  {
    title: "Priority Topics",
    description: "Focus on what matters",
    icon: Target,
    href: "/dashboard/priority",
    color: "accent",
  },
  {
    title: "Start Quiz",
    description: "Test your knowledge",
    icon: Brain,
    href: "/dashboard/tests",
    color: "primary",
  },
  {
    title: "AI Tutor",
    description: "Get instant help",
    icon: MessageSquare,
    href: "/dashboard/tutor",
    color: "accent",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Student");

  // --- 1. AUTH PROTECTION & PERSONALIZATION ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      // If no token, redirect to login
      navigate("/login");
    } else if (storedUser) {
      // If user data exists, set the name
      const user = JSON.parse(storedUser);
      setUserName(user.name);
    }
  }, [navigate]);

  // --- 2. LOGOUT FUNCTION ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Welcome Header */}
      <motion.div 
        variants={fadeInUp} 
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2">
            Welcome back, <span className="gradient-text">{userName}</span>! 👋
          </h1>
          <p className="text-muted-foreground">
            Start your learning journey by uploading study materials or exploring features
          </p>
        </div>

        {/* Added Logout Button for Testing */}
        <Button variant="outline" onClick={handleLogout} className="shrink-0">
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeInUp}>
        <h3 className="text-lg font-sora font-semibold mb-4">
          Quick Actions
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.href}>
              <Card
                className="p-4 group cursor-pointer h-full border hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-0 flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                      action.color === "primary"
                        ? "bg-gradient-to-br from-primary to-cyan-soft"
                        : "bg-gradient-to-br from-accent to-amber-soft"
                    }`}
                  >
                    <action.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{action.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Analytics Charts */}
      <motion.div variants={fadeInUp} className="grid lg:grid-cols-2 gap-6">
        <AcademicChart />
        <CareerChart />
      </motion.div>

      {/* Get Started Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={fadeInUp}>
          <Card className="border hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-primary" />
                Academic Mastery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Upload your syllabus, notes, and previous year questions to get AI-powered summaries, flashcards, and priority topics.
              </p>
              <Link to="/dashboard/study-sets">
                <Button variant="default">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="border hover:border-accent/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Rocket className="w-5 h-5 text-accent" />
                Career Launch
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Get a personalized career roadmap with daily tasks, learning modules, and progress tracking to achieve your goals.
              </p>
              <Link to="/dashboard/career">
                <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-white">
                  Explore Careers
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;