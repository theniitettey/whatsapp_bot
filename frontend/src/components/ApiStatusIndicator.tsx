import { Activity } from "lucide-react";
import { motion } from "motion/react";

type ApiStatus = "operational" | "degraded" | "down";

interface ApiStatusIndicatorProps {
  status: ApiStatus;
  className?: string;
}

const statusConfig = {
  operational: {
    color: "bg-green-500",
    ringColor: "ring-green-500/20",
    text: "All Systems Operational",
    dotColor: "bg-green-400",
  },
  degraded: {
    color: "bg-yellow-500",
    ringColor: "ring-yellow-500/20",
    text: "Degraded Performance",
    dotColor: "bg-yellow-400",
  },
  down: {
    color: "bg-red-500",
    ringColor: "ring-red-500/20",
    text: "System Outage",
    dotColor: "bg-red-400",
  },
};

export function ApiStatusIndicator({ status, className = "" }: ApiStatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
      transition={{
        duration: 0.5,
        y: {
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }
      }}
      className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-lg shadow-neutral-200/50 dark:shadow-neutral-900/50 ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring */}
        <div className={`absolute h-3 w-3 rounded-full ${config.color} ${config.ringColor} ring-4 animate-ping opacity-75`} />
        {/* Static dot */}
        <div className={`relative h-3 w-3 rounded-full ${config.color}`} />
      </div>
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
        <span className="text-sm text-neutral-700 dark:text-neutral-300">{config.text}</span>
      </div>
    </motion.div>
  );
}
