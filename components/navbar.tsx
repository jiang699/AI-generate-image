"use client";

import Link from "next/link";
import { Sparkles, User, LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "./auth-provider";
import { toast } from "sonner";

export function Navbar() {
  const { user, signout, setShowSigninModal, setShowSignupModal, loading } = useAuthContext();

  const handleSignout = async () => {
    const result = await signout();
    if (result.success) {
      toast.success('已退出登录');
    } else {
      toast.error(result.error || '退出失败');
    }
  };

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
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          ) : user ? (
            /* 已登录状态 */
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                <Wallet className="h-4 w-4" />
                <span className="font-medium text-purple-600">{user.credits}</span>
                <span>积分</span>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                onClick={handleSignout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">退出</span>
              </Button>
              
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
          ) : (
            /* 未登录状态 */
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowSigninModal(true)}
              >
                登录
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                onClick={() => setShowSignupModal(true)}
              >
                免费注册
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
