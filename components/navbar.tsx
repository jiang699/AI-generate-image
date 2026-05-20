"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Pixel Alchemy</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden items-center gap-8 md:flex">
          <Link 
            href="#features" 
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            功能
          </Link>
          <Link 
            href="#pricing" 
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            定价
          </Link>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            登录
          </Button>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
          >
            免费注册
          </Button>
        </div>
      </div>
    </nav>
  )
}
