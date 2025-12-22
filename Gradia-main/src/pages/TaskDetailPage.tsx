import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Code, BookOpen, ExternalLink, Dumbbell } from "lucide-react";
import { Task } from "./CareerRoadmap"; // Import Task type

const TaskDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Retrieve data passed via React Router state
  const task = location.state?.task as Task;
  const careerName = location.state?.careerName as string;

  // Fallback if accessed directly without state
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-bold mb-4">Task not found</h2>
        <Button onClick={() => navigate("/dashboard/roadmap")}>Back to Roadmap</Button>
      </div>
    );
  }

  // Construct a safe search URL for YouTube
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    task.youtube_query
  )}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-6xl mx-auto"
    >
      {/* Navigation & Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>{careerName} Roadmap</span>
            <span>/</span>
            <span>Task Details</span>
          </div>
          <h1 className="text-2xl font-sora font-bold">{task.title}</h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* CENTER/LEFT: Video Section (Takes up 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass" className="overflow-hidden border-accent/20">
            {/* Simulated Video Player UI */}
            <div className="aspect-video bg-black/90 relative group flex items-center justify-center">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
              
              <div className="z-10 text-center p-6">
                <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(255,107,0,0.4)] group-hover:scale-110 transition-transform cursor-pointer">
                  <Play className="w-6 h-6 text-white fill-current ml-1" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 max-w-md mx-auto">
                  {task.youtube_query}
                </h3>
                <p className="text-gray-400 text-sm mb-6">Recommended Tutorial Search</p>
                
                <Button 
                  onClick={() => window.open(youtubeSearchUrl, "_blank")}
                  className="bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Watch on YouTube
                </Button>
              </div>
            </div>
            <CardContent className="p-4 bg-secondary/20">
              <div className="flex items-center justify-between">
                 <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Recommended Resource
                 </span>
              </div>
            </CardContent>
          </Card>

          {/* CODE SNIPPET */}
          <Card variant="feature">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-accent" />
                Code Example
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/80 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto border border-white/10">
                <pre>{task.code_snippet}</pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SIDE SECTION: Explanation & Exercise */}
        <div className="space-y-6">
          <Card variant="glow">
            <CardHeader>
              <CardTitle className="text-lg">Concept Overview</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              {task.explanation}
            </CardContent>
          </Card>

          <Card variant="feature" className="border-accent/30 bg-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Dumbbell className="w-5 h-5 text-accent" />
                Practice Exercise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium mb-4">{task.exercise}</p>
              <div className="text-sm text-muted-foreground bg-background/50 p-3 rounded border border-border">
                <span className="font-bold text-foreground">Goal: </span>
                Complete this exercise to master the concept.
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-center pt-4">
             <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>
                Complete Task
             </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskDetailPage;