import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BarChart3, Home, Settings, User } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <header className="bg-[#1e5bb0] shadow-md">
        <div className="py-3 flex items-center justify-between max-w-7xl mx-auto px-4">
          <div className="flex items-center">
            <img 
              src="/sofar-logo.png" 
              alt="Sofar Logo" 
              className="h-8 w-auto mr-3 bg-white rounded-md p-1"
            />
            <h1 className="text-xl font-semibold text-white">
              Sofar Resource Library
            </h1>
          </div>
          
          <nav className="flex">
            <ul className="flex space-x-6">
              <li>
                <Link href="/">
                  <span className="flex items-center text-white hover:text-blue-100 font-medium cursor-pointer">
                    <Home className="h-4 w-4 mr-1.5" />
                    Home
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/admin/analytics">
                  <span className="flex items-center text-white hover:text-blue-100 font-medium cursor-pointer">
                    <BarChart3 className="h-4 w-4 mr-1.5" />
                    Analytics
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto">{children}</main>

      <footer className="bg-white border-t border-neutral-200 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-neutral-600">
              &copy; {new Date().getFullYear()} Sofar Ocean. All rights reserved.
            </div>
            <div className="mt-3 md:mt-0">
              <span className="text-sm text-neutral-500">
                Last updated: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
