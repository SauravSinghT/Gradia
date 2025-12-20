import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  MessageSquare,
  Send,
  Sparkles,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";



// --- CONFIGURATION ---
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;



interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}



const suggestedQuestions = [
  "Explain the concept of derivatives in calculus",
  "Create a study plan for physics chapter 5",
  "Summarize the key points of the React lifecycle",
  "Give me a quiz on World War II history",
];



const AITutor = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI tutor powered by Gemini. I can help you explain complex topics, create study plans, or quiz you. What are we learning today? 📚",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [quotaResetTime, setQuotaResetTime] = useState<number | null>(null);

  // Auto-scroll to bottom ref
  const messagesEndRef = useRef<HTMLDivElement>(null);



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };



  useEffect(() => {
    scrollToBottom();
  }, [messages]);



  const sendMessage = async (retryCount = 0) => {
    if (!input.trim() || isLoading) return;


    // Check if quota is still being reset
    if (quotaResetTime && Date.now() < quotaResetTime) {
      const secondsLeft = Math.ceil((quotaResetTime - Date.now()) / 1000);
      toast({
        title: "Rate Limited",
        description: `Please wait ${secondsLeft} more seconds before trying again.`,
      });
      return;
    }


    // Rate limiting: enforce minimum 2 second delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < 2000) {
      toast({
        title: "Please Wait",
        description: "Sending messages too quickly. Wait 2 seconds.",
      });
      return;
    }



    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };



    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setLastRequestTime(now);



    try {
      if (!API_KEY) {
        throw new Error("Gemini API Key is missing");
      }



      const genAI = new GoogleGenerativeAI(API_KEY);
      // Using gemini-2.0-flash - better free tier quota (15 req/min vs 5 for 2.5-flash)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });



      const history = messages
        .filter((msg) => msg.id !== "1") 
        .map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        }));



      const chat = model.startChat({
        history: history,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });



      const result = await chat.sendMessage(input);
      const responseText = result.response.text();



      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };



      setMessages((prev) => [...prev, aiResponse]);



    } catch (error: any) {
      console.error("Gemini Error Details:", error);


      // Handle 429 quota exceeded errors - DON'T RETRY
      if (error.message.includes("429")) {
        // Extract retry delay from error if available
        const retryDelayMatch = error.message.match(/Please retry in (\d+)/);
        const retrySeconds = retryDelayMatch ? parseInt(retryDelayMatch[1]) : 60;

        const resetTime = Date.now() + (retrySeconds * 1000);
        setQuotaResetTime(resetTime);


        toast({
          variant: "destructive",
          title: "Quota Exceeded",
          description: `Free tier limit reached. Please wait ${retrySeconds} seconds.`,
        });


        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `⏳ I've hit the free tier rate limit. Please wait ${retrySeconds} seconds and try again. Consider upgrading to a paid plan for higher limits.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }


      // Handle 503 overload errors with retry (max 2 retries)
      if (error.message.includes("503") && retryCount < 2) {
        const waitTime = 2 ** retryCount;
        toast({
          title: "Server Busy",
          description: `Retrying in ${waitTime} seconds...`,
        });


        setTimeout(() => {
          sendMessage(retryCount + 1);
        }, 1000 * waitTime);
        return;
      }



      let errorMsg = "I'm having trouble connecting right now.";



      if (error.message.includes("404")) {
        errorMsg = "Model not found. Please check your API key.";
      } else if (error.message.includes("503")) {
        errorMsg = "Servers are overloaded. Please try again in a few minutes.";
      } else if (error.message.includes("401")) {
        errorMsg = "Invalid API key. Please check your VITE_GEMINI_API_KEY in .env";
      } else if (error.message.includes("429")) {
        errorMsg = "Rate limit exceeded. Please wait before sending another message.";
      }



      toast({
        variant: "destructive",
        title: "Error",
        description: errorMsg,
      });



      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);



    } finally {
      setIsLoading(false);
    }
  };





  const handleSuggestion = (question: string) => {
    setInput(question);
  };




  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-8rem)] flex flex-col"
    >
      <div className="mb-6">
        <h1 className="text-3xl font-sora font-bold mb-2">
          <span className="gradient-text">AI Tutor</span>
        </h1>
        <p className="text-muted-foreground">
          Powered by Gemini 2.0 Flash • Ask me anything
        </p>
      </div>




      <div className="flex-1 grid lg:grid-cols-4 gap-6 min-h-0">
        {/* Chat Area */}
        <Card className="lg:col-span-3 flex flex-col min-h-0 border-primary/20 shadow-lg">
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-primary to-cyan-soft"
                        : "bg-gradient-to-br from-accent to-amber-soft"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-accent-foreground" />
                    )}
                  </div>




                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-secondary/80 backdrop-blur-sm rounded-tl-sm border border-border"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </motion.div>
              ))}




              {/* Loading Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-amber-soft flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div className="bg-secondary p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>




            {/* Input Area */}
            <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-3"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything about your studies..."
                  className="flex-1 bg-background"
                  disabled={isLoading || (quotaResetTime ? Date.now() < quotaResetTime : false)}
                />
                <Button 
                    type="submit" 
                    variant="default" 
                    disabled={isLoading || !input.trim() || (quotaResetTime ? Date.now() < quotaResetTime : false)}
                    className="shadow-md hover:shadow-lg transition-all"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>




        {/* Sidebar Suggestions */}
        <div className="space-y-4">
          <Card className="border-primary/10 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Suggested Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2.5 px-3 text-xs whitespace-normal border border-transparent hover:border-primary/20 hover:bg-primary/5"
                  onClick={() => handleSuggestion(question)}
                  disabled={quotaResetTime ? Date.now() < quotaResetTime : false}
                >
                  {question}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* API Key Status Check */}
          {!API_KEY && (
             <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="p-4 flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                    <div className="text-xs text-destructive">
                        <strong>Missing API Key</strong>
                        <p>Add VITE_GEMINI_API_KEY to your .env file.</p>
                    </div>
                </CardContent>
             </Card>
          )}


          {/* Quota Status */}
          {quotaResetTime && Date.now() < quotaResetTime && (
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4 flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-xs text-yellow-600">
                  <strong>Rate Limited</strong>
                  <p>Free tier quota reached. Wait before trying again.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};




export default AITutor;