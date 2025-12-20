import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare } from "lucide-react";

const Community = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-sora font-bold mb-2">
          <span className="gradient-text">Community</span>
        </h1>
        <p className="text-muted-foreground">
          Connect with fellow learners, share knowledge, and collaborate
        </p>
      </div>

      {/* Coming Soon */}
      <Card variant="glass" className="p-12 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-cyan-soft flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-primary-foreground" />
        </div>
        <h3 className="text-xl font-sora font-semibold mb-3">Community Coming Soon</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          We're building a space for you to discuss topics, share resources, collaborate on projects, and support each other's learning journey
        </p>
        <Button variant="hero" disabled>
          <MessageSquare className="w-4 h-4 mr-2" />
          Join Waitlist
        </Button>
      </Card>

      {/* Features Preview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card variant="feature">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">💬</div>
            <h3 className="font-semibold mb-2">Discussion Forums</h3>
            <p className="text-sm text-muted-foreground">
              Ask questions and share insights with peers
            </p>
          </CardContent>
        </Card>
        <Card variant="feature">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-semibold mb-2">Study Groups</h3>
            <p className="text-sm text-muted-foreground">
              Form groups to study together
            </p>
          </CardContent>
        </Card>
        <Card variant="feature">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">🤝</div>
            <h3 className="font-semibold mb-2">Peer Reviews</h3>
            <p className="text-sm text-muted-foreground">
              Get feedback on your projects
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default Community;
