import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Partner } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface PartnerSelectorProps {
  selectedPartner: string | null;
  onPartnerChange: (partnerId: string) => void;
}

export default function PartnerSelector({ 
  selectedPartner, 
  onPartnerChange 
}: PartnerSelectorProps) {
  const { data: partners, isLoading, error } = useQuery({
    queryKey: ['/api/partners'],
  });

  if (isLoading) {
    return (
      <div className="mt-3 md:mt-0 w-full md:w-72">
        <label className="block text-sm font-medium text-neutral-500 mb-1">
          Viewing resources as:
        </label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 md:mt-0 w-full md:w-72">
        <label className="block text-sm font-medium text-neutral-500 mb-1">
          Viewing resources as:
        </label>
        <div className="text-sm text-destructive">
          Failed to load partners. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 md:mt-0 w-full md:w-72">
      <label htmlFor="partner-select" className="block text-sm font-medium text-neutral-500 mb-1">
        Viewing resources as:
      </label>
      <Select 
        value={selectedPartner || ""} 
        onValueChange={onPartnerChange}
      >
        <SelectTrigger id="partner-select" className="w-full bg-white">
          <SelectValue placeholder="Select your partner organization" />
        </SelectTrigger>
        <SelectContent>
          {partners?.map((partner: Partner) => (
            <SelectItem key={partner.slug} value={partner.slug}>
              {partner.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
