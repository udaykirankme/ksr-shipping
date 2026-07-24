import Image from 'next/image';
import { business } from '@ksr/config';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative">
      <div className="w-full max-w-[440px] relative z-10">
        {/* Soft ambient glow behind the card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-orange-300 rounded-3xl blur-2xl opacity-20"></div>
        {children}
      </div>
    </div>
  );
}
