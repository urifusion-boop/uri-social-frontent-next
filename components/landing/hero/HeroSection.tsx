"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 halftone-bg" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-uri-magenta/5" />

      {/* Floating elements */}
      <motion.div
        className="absolute top-20 right-[10%] w-24 h-24 rounded-full bg-uri-hot-pink/10 blur-3xl"
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-32 left-[15%] w-32 h-32 rounded-full bg-uri-purple/10 blur-3xl"
        animate={{
          y: [0, 20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex mb-6"
            >
              <Badge
                variant="secondary"
                className="px-4 py-1.5 text-sm font-medium bg-uri-magenta/10 text-uri-magenta border-uri-magenta/20 hover:bg-uri-magenta/20"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                AI-Powered Social Media Manager
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6"
            >
              Your social media manager{" "}
              <span className="text-gradient-primary">just clocked in.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed"
            >
              Meet Jane — your AI social media manager. She creates posts,
              publishes on schedule, monitors trends, engages with customers,
              and delivers weekly reports. No leave, no raises, just results.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10"
            >
              <Button
                size="lg"
                className="gradient-primary text-white text-base px-8 h-12 shadow-lg shadow-uri-magenta/20 hover:shadow-xl hover:shadow-uri-magenta/30 transition-all duration-300 group"
              >
                Hire Jane — It's Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 h-12 border-2 hover:bg-muted/50"
              >
                See Her in Action
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6"
            >
              <div className="flex -space-x-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-uri-magenta to-uri-hot-pink ring-4 ring-background flex items-center justify-center text-white text-sm font-semibold"
                    style={{ zIndex: 5 - i }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full bg-uri-yellow ring-4 ring-background flex items-center justify-center text-foreground text-xs font-bold">
                  +200
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">200+</span>{" "}
                businesses across Africa
              </p>
            </motion.div>
          </motion.div>

          {/* Visual comparison */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative"
          >
            <div className="grid gap-6">
              {/* Before card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="glass rounded-2xl p-6 border-destructive/20"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <Badge
                      variant="outline"
                      className="mb-2 border-destructive/30 text-destructive"
                    >
                      Before Jane
                    </Badge>
                    <h3 className="font-semibold text-lg mb-2">
                      "My last post was 3 weeks ago..."
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                      >
                        Behind Schedule
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                      >
                        0 Engagement
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* After card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="glass rounded-2xl p-6 border-uri-green/20 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-uri-green/10 rounded-full blur-3xl" />
                <div className="flex items-start gap-4 mb-4 relative">
                  <div className="w-12 h-12 rounded-xl bg-uri-green/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-uri-green" />
                  </div>
                  <div className="flex-1">
                    <Badge
                      variant="outline"
                      className="mb-2 border-uri-green/30 text-uri-green"
                    >
                      After Jane
                    </Badge>
                    <h3 className="font-semibold text-lg mb-2">
                      "Jane's got it handled."
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-uri-green/10 text-uri-green hover:bg-uri-green/20"
                      >
                        Posted Daily
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-uri-magenta/10 text-uri-magenta hover:bg-uri-magenta/20"
                      >
                        Scheduled
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Floating badges */}
            <motion.div
              className="absolute -top-6 -right-6 hidden xl:block"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Badge className="bg-uri-purple text-white shadow-lg px-3 py-1.5 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            </motion.div>
            <motion.div
              className="absolute -bottom-6 -left-6 hidden xl:block"
              animate={{
                y: [0, 10, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Badge className="bg-uri-blue text-white shadow-lg px-3 py-1.5 text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                +247% Reach
              </Badge>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
