"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

import { business } from '@ksr/config';
import { authService } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = 'Username or email is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    
    // Auto-focus first invalid field
    if (newErrors.email) {
      emailRef.current?.focus();
    } else if (newErrors.password) {
      passwordRef.current?.focus();
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);

    try {
      await authService.login({ email, password, rememberMe: rememberMe.toString() });
      toast.success('Successfully logged in');
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign in');
      setErrors({ password: ' ' }); // visually mark error but rely on toast for message
      passwordRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[linear-gradient(135deg,#FFF7F0_0%,#FFF3E8_50%,#FFE8D6_100%)] text-[#1A1A1A]">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Card className="w-full relative z-10 bg-white/70 backdrop-blur-xl border-white/40 shadow-2xl overflow-hidden p-2 sm:p-4 rounded-3xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center mb-2">
            <Image 
              src={business.logoUrl || '/logo.png'} 
              alt={business.name} 
              width={160} 
              height={100} 
              className="h-16 w-auto object-contain" 
              priority 
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Sign in to continue to the Admin Panel
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className={errors.email ? 'text-red-500' : ''}>
                Username or Email
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="admin@ksrshipping.com"
                className="premium-input h-12"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                ref={emailRef}
                error={!!errors.email}
                disabled={isLoading}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className={errors.password ? 'text-red-500' : ''}>
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="premium-input h-12 pr-10"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  ref={passwordRef}
                  error={!!errors.password}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Remember Me
              </label>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold" loading={isLoading}>
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-gray-100 pt-6 mt-2">
          <p className="text-xs text-gray-400 font-medium">
            Version 1.0
          </p>
        </CardFooter>
      </Card>
        </motion.div>
      </div>
    </div>
  );
}
