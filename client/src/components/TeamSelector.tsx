import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Team } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamSelectorProps {
  selectedTeam: string | null;
  onTeamChange: (teamId: string) => void;
}

// Custom component to display team with logo
const TeamDisplay = ({ team }: { team: Team | undefined }) => {
  if (!team) return null;
  
  return (
    <div className="flex items-center gap-2">
      {team.slug === 'pme' && (
        <img src="/pme-logo.png" alt="PME Logo" className="h-5 w-auto object-contain" />
      )}
      <span>{team.name}</span>
    </div>
  );
};

export default function TeamSelector({ 
  selectedTeam, 
  onTeamChange 
}: TeamSelectorProps) {
  const { data: teams = [], isLoading, error } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });
  
  // Find the currently selected team object
  const selectedTeamObject = selectedTeam 
    ? teams.find(t => t.slug === selectedTeam) 
    : undefined;

  if (isLoading) {
    return (
      <div className="w-full md:w-72">
        <label className="block text-sm font-medium text-neutral-500 mb-1">
          Viewing resources as:
        </label>
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full md:w-72">
        <label className="block text-sm font-medium text-neutral-500 mb-1">
          Viewing resources as:
        </label>
        <div className="text-sm text-destructive">
          Failed to load teams. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-72">
      <label htmlFor="team-select" className="block text-sm font-medium text-neutral-500 mb-1">
        Viewing resources as:
      </label>
      <Select 
        value={selectedTeam || ""} 
        onValueChange={onTeamChange}
      >
        <SelectTrigger id="team-select" className="w-full bg-white">
          {selectedTeamObject ? (
            <TeamDisplay team={selectedTeamObject} />
          ) : (
            <SelectValue 
              placeholder="Select your team"
              className="flex items-center gap-2"
            />
          )}
        </SelectTrigger>
        <SelectContent>
          {teams.map((team: Team) => (
            <SelectItem key={team.slug} value={team.slug} className="flex items-center p-1">
              <TeamDisplay team={team} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
