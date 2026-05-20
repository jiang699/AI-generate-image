"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthContext } from './auth-provider';
import { toast } from 'sonner';

export function SigninModal() {
  const { showSigninModal, setShowSigninModal, signin, setShowSignupModal } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signin(email, password);
    
    if (result.success) {
      toast.success('登录成功！');
      setEmail('');
      setPassword('');
    } else {
      toast.error(result.error || '登录失败');
    }
    
    setLoading(false);
  };

  const handleSignupClick = () => {
    setShowSigninModal(false);
    setShowSignupModal(true);
  };

  return (
    <Dialog open={showSigninModal} onOpenChange={setShowSigninModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">登录</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>
          
          <p className="text-center text-sm text-muted-foreground">
            还没有账号？{' '}
            <button
              type="button"
              onClick={handleSignupClick}
              className="text-purple-500 hover:text-purple-600 underline"
            >
              立即注册
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SignupModal() {
  const { showSignupModal, setShowSignupModal, signup, setShowSigninModal } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }
    
    setLoading(true);

    const result = await signup(email, password, displayName);
    
    if (result.success) {
      toast.success('注册成功！已赠送100积分');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');
    } else {
      toast.error(result.error || '注册失败');
    }
    
    setLoading(false);
  };

  const handleSigninClick = () => {
    setShowSignupModal(false);
    setShowSigninModal(true);
  };

  return (
    <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">免费注册</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">显示名称</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="请输入显示名称"
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码（至少8位）"
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              required
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '注册中...' : '免费注册'}
          </Button>
          
          <p className="text-center text-sm text-muted-foreground">
            已有账号？{' '}
            <button
              type="button"
              onClick={handleSigninClick}
              className="text-purple-500 hover:text-purple-600 underline"
            >
              立即登录
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
