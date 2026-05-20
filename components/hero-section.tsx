"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuthContext } from "./auth-provider";

export function HeroSection() {
  const { user, setShowSignupModal, loading } = useAuthContext();

  const handleStartCreating = () => {
    if (loading) return;
    
    if (!user) {
      // 如果未登录，显示注册/登录模态框
      setShowSignupModal(true);
    }
    // 如果已登录，Link 会自动跳转到工作台
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
          </span>
          AI驱动的创意引擎
        </div>

        {/* Main Headline */}
        <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          将你的想象力，
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            炼成视觉黄金
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
          借助先进的AI技术，只需简单的文字描述，即可创造出令人惊叹的视觉作品。
          <br className="hidden sm:block" />
          无需任何设计经验，人人都是艺术家。
        </p>

        {/* CTA Button */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button 
            asChild={user !== null}
            onClick={!user ? handleStartCreating : undefined}
            size="lg" 
            className="group h-12 gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-8 text-base font-medium text-white hover:from-purple-600 hover:to-pink-600"
            disabled={loading}
          >
            {user ? (
              <Link href="/workbench">
                开始免费创作
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                开始免费创作
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            无需信用卡 · 每月100张免费额度
          </p>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
