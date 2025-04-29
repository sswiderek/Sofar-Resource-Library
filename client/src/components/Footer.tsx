import { ExternalLink, Github } from "lucide-react";
import { useNotionDatabase } from "@/hooks/use-notion-database";

export default function Footer() {
  const { url: notionDatabaseUrl, isAvailable: notionAvailable } = useNotionDatabase();
  
  return (
    <footer className="w-full py-4 px-4 border-t border-neutral-200 mt-8 bg-slate-50">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-neutral-500">
          © {new Date().getFullYear()} Sofar Ocean Technologies
        </div>
        
        <div className="flex items-center gap-6">
          {notionAvailable && (
            <a 
              href={notionDatabaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm flex items-center text-neutral-600 hover:text-blue-600 transition-colors"
            >
              <span>Manage Resources in Notion</span>
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </a>
          )}
          
          <a 
            href="https://www.sofarocean.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm flex items-center text-neutral-600 hover:text-blue-600 transition-colors"
          >
            <span>Sofar Website</span>
            <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}