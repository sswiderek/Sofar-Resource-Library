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
      <header className="bg-gradient-to-r from-blue-700 to-blue-600 shadow-md border-b border-blue-800">
        <div className="py-4 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-4">
          <div className="flex items-center">
            <img 
              src="/sofar-logo.png" 
              alt="Sofar Logo" 
              className="h-10 w-auto mr-3 bg-white p-1 rounded-md shadow-sm"
            />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white">
                Sofar Resource Library
              </h1>
              <div className="h-0.5 w-full bg-gradient-to-r from-blue-300 to-sky-300 rounded-full mt-0.5"></div>
            </div>
          </div>
          
          <nav className="flex mt-4 md:mt-0">
            <ul className="flex space-x-3">
              <li>
                <Link href="/">
                  <span className={`flex items-center px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${isActive('/') ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10'}`}>
                    <Home className="h-4 w-4 mr-1" />
                    Home
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/admin/analytics">
                  <span className={`flex items-center px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${isActive('/admin/analytics') ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10'}`}>
                    <BarChart3 className="h-4 w-4 mr-1" />
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
