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
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="py-4 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-4">
          <div className="flex items-center">
            <img 
              src="/sofar-logo.png" 
              alt="Sofar Logo" 
              className="h-9 w-auto mr-3"
            />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-[#0066CC]">
                Sofar Resource Library
              </h1>
              <div className="h-0.5 w-full bg-gradient-to-r from-[#0066CC] to-[#00A7E1] rounded-full mt-0.5"></div>
            </div>
          </div>
          
          <nav className="flex mt-4 md:mt-0">
            <ul className="flex space-x-4">
              <li>
                <Link href="/">
                  <span className={`flex items-center px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${isActive('/') ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Home className="h-4 w-4 mr-1" />
                    Home
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/admin/analytics">
                  <span className={`flex items-center px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${isActive('/admin/analytics') ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'}`}>
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

      <footer className="bg-white border-t border-neutral-200 py-5">
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
