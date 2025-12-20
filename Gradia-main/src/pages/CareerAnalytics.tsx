import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

const CareerAnalytics = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-sora font-bold mb-2">
          <span className="gradient-text-accent">Career Analytics</span>
        </h1>
        <p className="text-muted-foreground">
          Track your progress on the career roadmap
        </p>
      </div>

      {/* Empty State */}
      <Card variant="glass" className="p-12 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-amber-soft flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-10 h-10 text-accent-foreground" />
        </div>
        <h3 className="text-xl font-sora font-semibold mb-3">No analytics yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Start working on your career roadmap to track your daily progress, completed tasks, and learning milestones
        </p>
        <Link to="/dashboard/career">
          <Button variant="accent">
            <Rocket className="w-4 h-4 mr-2" />
            View Career Roadmap
          </Button>
        </Link>
      </Card>

      {/* What you'll track */}
      <div className="grid sm:grid-cols-3 gap-6">
        <Card variant="feature">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold mb-2">Daily Progress</h3>
            <p className="text-sm text-muted-foreground">
              Track tasks completed each day
            </p>
          </CardContent>
        </Card>
        <Card variant="feature">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold mb-2">Milestones</h3>
            <p className="text-sm text-muted-foreground">
              Monitor key achievements reached
            </p>
          </CardContent>
        </Card>
        <Card variant="feature">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">⏱️</div>
            <h3 className="font-semibold mb-2">Time Investment</h3>
            <p className="text-sm text-muted-foreground">
              See hours spent learning
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default CareerAnalytics;
