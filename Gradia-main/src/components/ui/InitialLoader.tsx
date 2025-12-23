import { motion } from "framer-motion";
import { Sparkles, BrainCircuit, Rocket, Zap } from "lucide-react";

interface InitialLoaderProps {
  minimal?: boolean;
}

const InitialLoader = ({ minimal = false }: InitialLoaderProps) => {
  return (
    <motion.div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden 
        ${minimal ? "bg-black/10 backdrop-blur-[2px]" : "bg-background"}`}
      
      // 1. Initial State
      initial={{ opacity: 1 }}
      
      // 2. FADE OUT ANIMATION (Exit)
      exit={{
        opacity: 0,
        transition: { 
          duration: 0.8, 
          ease: "easeInOut" 
        },
      }}
    >
      {/* Background Ambient Glow (Only for First Visit) */}
      {!minimal && (
        <>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px]" 
          />
        </>
      )}

      <div className="relative flex flex-col items-center justify-center">
        
        {/* Main Icon Assembly */}
        <div className="relative w-32 h-32 mb-8">
          
          {/* Rings */}
          <motion.div
            className="absolute inset-0 rounded-full border border-primary/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
          
          <motion.div
            className="absolute inset-0 rounded-full border border-accent/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
          />

          {/* Central Logo */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/40">
              <BrainCircuit className="w-12 h-12 text-white fill-white/20" />
            </div>
          </motion.div>

          {/* Orbiting Particles */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-background p-2 rounded-full border border-border shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
          </motion.div>

          <motion.div
            className="absolute inset-0"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-1/2 -right-8 -translate-y-1/2 bg-background p-2 rounded-full border border-border shadow-sm">
              <Rocket className="w-4 h-4 text-blue-500 fill-blue-500" />
            </div>
          </motion.div>

          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 1 }}
          >
            <div className="absolute -bottom-4 left-0 bg-background p-2 rounded-full border border-border shadow-sm">
              <Zap className="w-4 h-4 text-purple-500 fill-purple-500" />
            </div>
          </motion.div>
        </div>

        {/* Text Section (Hidden in Minimal Mode) */}
        {!minimal && (
          <div className="text-center space-y-2 relative z-10">
            <motion.h1
              className="text-4xl font-sora font-bold tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-foreground">Grad</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                ia
              </span>
            </motion.h1>
            
            <div className="h-6 flex items-center justify-center overflow-hidden relative">
              <motion.p 
                className="text-sm text-muted-foreground font-medium"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Initializing your workspace...
              </motion.p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InitialLoader;