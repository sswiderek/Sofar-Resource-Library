import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Database, ExternalLink } from "lucide-react";
import { FeedbackDialog } from "./FeedbackDialog";

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
        <div className="py-3 flex items-center justify-between max-w-7xl mx-auto px-3 sm:px-4">
          <Link href="/">
            <div className="flex items-center cursor-pointer hover:opacity-90">
              <img 
                src="/sofar-logo.png" 
                alt="Sofar Logo" 
                className="h-8 w-auto mr-2 sm:mr-3 bg-white rounded-md p-1"
              />
              <h1 className="text-base xs:text-lg sm:text-xl font-semibold text-white truncate">
                <span className="hidden xs:inline">Sofar </span>Resource Library
              </h1>
            </div>
          </Link>
          
          <nav className="flex items-center">
            <ul className="flex items-center space-x-2 xs:space-x-4 sm:space-x-6">
              <li>
                <a 
                  href="https://www.notion.so/sofarocean/1ac8ff95945081eda6d6d0538f2eed87?v=1ac8ff9594508161bf7c000c0d182979&pvs=4" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-white hover:text-blue-100 font-medium"
                >
                  <Database className="h-4 w-4 mr-1" />
                  <span className="inline-block mt-0.5 hidden xs:inline">Notion Database</span>
                  <ExternalLink className="h-3 w-3 ml-1 opacity-75" />
                </a>
              </li>
              {/* Analytics link hidden as requested, still accessible directly at /admin/analytics */}
              <li className="ml-1 xs:ml-2 sm:ml-3">
                <FeedbackDialog />
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-1 xs:px-2 sm:px-3 md:px-4">{children}</main>

      <footer className="bg-white border-t border-neutral-200 py-3 sm:py-4 md:py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-xs sm:text-sm text-neutral-600">
              &copy; {new Date().getFullYear()} Sofar Ocean. All rights reserved.
            </div>
            <div className="mt-2 md:mt-0">
              <span className="text-xs sm:text-sm text-neutral-500">
                Last updated: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
