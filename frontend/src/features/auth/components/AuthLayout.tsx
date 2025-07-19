// src/features/auth/components/AuthLayout.tsx
import React from 'react';
import AnimatedShihTzu from '@/components/common/AnimatedShihTzu';
import { useAuthShihTzu } from '@/hooks/useAuthShihTzu';

interface AuthLayoutProps {
  children: React.ReactNode;
  onShihTzuReady?: (companion: ReturnType<typeof useAuthShihTzu>) => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, onShihTzuReady }) => {
  const companion = useAuthShihTzu();

  React.useEffect(() => {
    if (onShihTzuReady) {
      onShihTzuReady(companion);
    }
  }, [companion, onShihTzuReady]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient with animated elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/5">
        {/* Animated background orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-float-delayed" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Animated Shih Tzu */}
      <AnimatedShihTzu
        mood={companion.mood}
        position={companion.position}
        onPositionChange={companion.setPosition}
        size="md"
        className="z-20 drop-shadow-lg"
      />
      
      {/* Helper styles for floating animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-15px) translateX(-10px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out infinite;
          animation-delay: 3s;
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
