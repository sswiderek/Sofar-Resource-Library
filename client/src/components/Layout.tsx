import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <header className="bg-black shadow-md">
        <div className="py-4 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto px-4">
          <div className="flex items-center">
            <img 
              src="/sofar-logo.png" 
              alt="Sofar Logo" 
              className="h-9 w-auto mr-3 brightness-[1.15]"
            />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white">
                Sales Enablement Hub
              </h1>
              <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mt-0.5"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto">{children}</main>

      <footer className="bg-neutral-900 text-white py-5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-neutral-300">
              &copy; {new Date().getFullYear()} Sofar Ocean. All rights reserved.
            </div>
            <div className="mt-3 md:mt-0">
              <span className="text-sm text-neutral-400">
                Last updated: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
