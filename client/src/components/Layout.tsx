import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center self-start">
            <img 
              src="/sofar-logo.png" 
              alt="Sofar Logo" 
              className="h-8 w-auto mr-3"
            />
            <h1 className="text-xl font-semibold text-neutral-700 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Partner Resource Library
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="bg-white border-t border-neutral-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-neutral-500">
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
