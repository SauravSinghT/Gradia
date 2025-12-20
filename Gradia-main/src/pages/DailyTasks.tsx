import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

const DailyTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { toast } = useToast();

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      createdAt: new Date(),
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle("");
    toast({ title: "Task added" });
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    toast({ title: "Task deleted" });
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text-accent">Daily Tasks</span>
          </h1>
          <p className="text-muted-foreground">
            Manage your daily learning activities
          </p>
        </div>
        {tasks.length > 0 && (
          <Card variant="glass" className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">
                {completedCount}/{tasks.length} completed ({progress}%)
              </span>
            </div>
          </Card>
        )}
      </div>

      {/* Add Task */}
      <Card variant="glow">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <Input
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              className="flex-1"
            />
            <Button variant="hero" onClick={addTask}>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      {tasks.length > 0 ? (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-accent" />
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  task.completed
                    ? "bg-success/5 border border-success/20"
                    : "bg-secondary/50 hover:bg-secondary"
                }`}
              >
                <button onClick={() => toggleTask(task.id)}>
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-success-soft" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </button>
                <span
                  className={`flex-1 ${
                    task.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTask(task.id)}
                  className="opacity-50 hover:opacity-100 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card variant="glass" className="p-12 text-center">
          <ListTodo className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tasks for today</h3>
          <p className="text-muted-foreground">
            Add your first task to start tracking your daily progress
          </p>
        </Card>
      )}
    </motion.div>
  );
};

export default DailyTasks;
