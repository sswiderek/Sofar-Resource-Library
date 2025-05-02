import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CORRECT_PASSWORD = 'sofar2025';
const LOCAL_STORAGE_KEY = 'sofar_resource_auth';

interface PasswordProtectionProps {
  children: React.ReactNode;
}

export function PasswordProtection({ children }: PasswordProtectionProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add CSS keyframes to document for the background animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gradientBackground {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes shimmer {
        0% { opacity: 0.3; }
        50% { opacity: 0.6; }
        100% { opacity: 0.3; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    // Check if already authenticated via localStorage
    const storedAuth = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedAuth === 'true') {
      setAuthenticated(true);
    }
    
    // Simulating a bit of loading for a smoother experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === CORRECT_PASSWORD) {
      // Store authentication in localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
      setAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      // Vibrate animation for incorrect password
      const form = document.getElementById('password-form');
      if (form) {
        form.classList.add('animate-wiggle');
        setTimeout(() => {
          form.classList.remove('animate-wiggle');
        }, 500);
      }
    }
  };

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence>
      {!isLoading && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"  
          style={{
            background: `radial-gradient(circle at 30% 50%, rgba(30, 64, 175, 0.9), rgba(29, 78, 216, 0.6) 50%, rgba(30, 58, 138, 0.8)), 
                       linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #1e40af 100%)`,
            backgroundSize: '200% 200%',
            animation: 'gradientBackground 15s ease infinite'
          }}
        >
          {/* Ocean-inspired background elements */}
          {/* Light effect overlay */}
          <div className="absolute inset-0 opacity-60" style={{
            background: `radial-gradient(circle at 70% 20%, rgba(255, 255, 255, 0.15) 0%, rgba(0, 0, 0, 0) 60%), 
                         radial-gradient(circle at 30% 80%, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0) 50%)`,
            animation: 'shimmer 5s infinite ease-in-out'
          }}></div>
          
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating particles that resemble bubbles */}
            {[...Array(20)].map((_, i) => (
              <motion.div 
                key={i}
                className="absolute rounded-full bg-white"
                style={{ 
                  height: `${Math.max(4, Math.min(12, Math.random() * 8))}px`,
                  width: `${Math.max(4, Math.min(12, Math.random() * 8))}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: 0.2 + (Math.random() * 0.3)
                }}
                animate={{ 
                  y: [0, -30],
                  opacity: [0.2, 0]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3 + (Math.random() * 5), 
                  delay: Math.random() * 5,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 w-full max-w-md rounded-lg bg-white p-8 shadow-xl"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
              <img 
                src="/sofar-logo.png" 
                alt="Sofar Logo" 
                className="h-full w-auto object-contain"
              />
            </div>
            
            <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">Sofar Resource Library</h2>
            <p className="mb-6 text-center text-gray-600">
              Welcome to Sofar's curated collection of marine intelligence resources. 
              <span className="block mt-1 text-blue-600 font-medium">Enter your password to explore.</span>
            </p>
            
            <form onSubmit={handleSubmit} id="password-form" className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter password"
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600"
                >
                  {error}
                </motion.p>
              )}
              
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200"
              >
                Enter Resource Library
              </Button>
            </form>
            
            <div className="mt-6 text-center text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Sofar Ocean. All rights reserved.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
