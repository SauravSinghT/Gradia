import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, X, Send, Sparkles, User, Bot } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- CONFIGURATION ---
// Ensure you have VITE_GEMINI_API_KEY in your .env file
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

interface Message {
  role: "user" | "model";
  text: string;
}

const CareerChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Initial greeting message
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hi there! 👋 Confused about which career path to choose? Tell me a bit about your interests (e.g., 'I love design', 'I like math', 'I want to build apps'), and I'll help you decide!",
    },
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change or chat opens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      
      // System instructions to keep the bot focused on your platform's specific offerings
      const systemContext = `
        You are a friendly, encouraging Career Counselor bot embedded in a learning platform.
        The platform offers these specific roadmaps:
        1. Web Developer (Frontend/Backend)
        2. Data Scientist (Math, Python, Analysis)
        3. Mobile Developer (iOS/Android, React Native)
        4. Cloud Engineer (AWS, Azure, Infrastructure)
        5. AI/ML Engineer (Neural Networks, Python)
        6. DevOps Engineer (CI/CD, Automation)

        Your Goal: Ask short clarifying questions to understand the user's interest if it's vague. 
        Then, recommend ONE or TWO of the specific roadmaps above that fit them best. 
        Explain WHY briefly. Keep responses under 3 sentences. Be enthusiastic and concise.
      `;

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: systemContext }] },
          { role: "model", parts: [{ text: "Understood. I am ready to guide the user to the correct roadmap." }] },
          // Convert current state history for context
          ...messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          }))
        ]
      });

      const result = await chat.sendMessage(userMsg);
      const response = result.response.text();

      setMessages((prev) => [...prev, { role: "model", text: response }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [...prev, { role: "model", text: "Oops! My brain froze. Try asking again?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end pointer-events-none">
      
      {/* 1. CHAT WINDOW (Only visible when open) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[350px] shadow-2xl pointer-events-auto origin-bottom-right"
          >
            <Card className="border-accent/30 shadow-xl overflow-hidden backdrop-blur-xl bg-background/95">
              
              {/* Chat Header */}
              <CardHeader className="p-4 bg-gradient-to-r from-accent/10 to-primary/10 border-b border-border/50 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shadow-lg shadow-accent/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Career Guide</CardTitle>
                    <p className="text-[10px] text-muted-foreground">AI Powered Assistant</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 hover:bg-background/20" 
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              
              {/* Chat Messages Area */}
              <CardContent className="p-0">
                <ScrollArea className="h-[350px] p-4 bg-secondary/5">
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "model" && (
                          <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center mt-1 shrink-0">
                            <Bot className="w-3 h-3 text-accent" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-card border border-border/50 rounded-tl-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                        {msg.role === "user" && (
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1 shrink-0">
                            <User className="w-3 h-3 text-primary" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Loading Indicator */}
                    {isLoading && (
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                          <Bot className="w-3 h-3 text-accent" />
                        </div>
                        <div className="text-xs text-muted-foreground self-center animate-pulse">Thinking...</div>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-3 border-t border-border/50 bg-background flex gap-2">
                  <Input
                    placeholder="Type your interests..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1 h-9 text-sm focus-visible:ring-accent"
                  />
                  <Button 
                    size="icon" 
                    className="h-9 w-9 bg-accent hover:bg-accent/90 transition-colors" 
                    onClick={handleSend} 
                    disabled={isLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. FLOATING BUTTON & TOOLTIP CONTAINER */}
      <div className="relative pointer-events-auto">
        
        {/* Tooltip / Popup Message (Only visible when chat is closed) */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: 1, duration: 0.3 }}
              className="absolute bottom-16 right-0 w-max max-w-[200px]"
            >
              <div className="bg-popover border border-border/50 text-popover-foreground text-xs font-medium p-3 rounded-xl shadow-xl relative backdrop-blur-md">
                <p>Confused about your career? 🤔</p>
                <p className="text-accent mt-1 font-bold">Ask me for help! 🚀</p>
                
                {/* Triangle Pointer */}
                <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-popover border-b border-r border-border/50 rotate-45 transform" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button with Continuous Bounce Animation */}
        <motion.button
          animate={{ y: [0, -8, 0] }}
          transition={{ 
            repeat: Infinity, 
            duration: 3, 
            ease: "easeInOut" 
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-accent to-purple-600 shadow-lg shadow-accent/40 flex items-center justify-center text-white border-2 border-white/20 relative z-50 cursor-pointer"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          
          {/* Notification Dot (Pulse) */}
          {!isOpen && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default CareerChatbot;