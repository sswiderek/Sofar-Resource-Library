import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 p-4 overflow-hidden"
        >
          {/* Simple gradient background without animations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800"></div>
          </div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 w-full max-w-md rounded-lg bg-white p-8 shadow-xl"
          >
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center bg-white rounded-md p-1 shadow-sm">
              <img 
                src="/sofar-logo.png" 
                alt="Sofar Logo" 
                className="h-full w-auto object-contain"
              />
            </div>
            
            <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">Sofar Resource Library</h2>
            <p className="mb-6 text-center text-sm text-gray-600">
              This is a protected resource. Please enter the password to continue.
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
              
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              
              <AlertDialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                <AlertDialogContent className="max-w-xs"> 
                  <AlertDialogTitle className="text-center text-blue-600">Password Assistance</AlertDialogTitle>
                  <AlertDialogDescription className="text-center">
                    Please message the #marketing Slack channel or check 1password for password assistance.
                  </AlertDialogDescription>
                  <AlertDialogFooter className="flex justify-center">
                    <AlertDialogAction className="bg-blue-600 hover:bg-blue-700">Got it</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
