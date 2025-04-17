import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ResourceCardSkeleton() {
  return (
    <Card className="bg-white overflow-hidden border border-neutral-200 h-full flex flex-col">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        <Skeleton className="h-6 w-full mb-1" />
        <Skeleton className="h-6 w-3/4 mb-3" />
        
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-1" />
        <Skeleton className="h-4 w-5/6 flex-grow" />
        
        <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-end items-center">
          <Skeleton className="h-5 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ResourceListSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-4 w-16" />
          </div>
          
          <Skeleton className="h-6 w-full mb-1" />
          <Skeleton className="h-6 w-3/4 mb-3" />
          
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3 mb-3" />
          
          <div className="mb-2 flex flex-wrap gap-1">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
          
          <div className="flex items-center mt-2">
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 sm:ml-6 flex sm:flex-col sm:items-end">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function ResourceLoadingGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ResourceCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ResourceLoadingList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ResourceListSkeleton key={i} />
      ))}
    </div>
  );
}