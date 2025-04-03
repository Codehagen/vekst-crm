"use client";

import { useCallback, useState } from "react";
import { getWorkspaceUsers } from "@/app/actions/tickets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  workspaceRole: string;
}

interface UserAssignSelectProps {
  ticketId: string;
  onAssign: (ticketId: string, userId: string) => void;
}

export function UserAssignSelect({
  ticketId,
  onAssign,
}: UserAssignSelectProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch workspace users when the dropdown is opened
  const handleOpenChange = useCallback(
    async (open: boolean) => {
      setIsOpen(open);

      if (open && users.length === 0) {
        try {
          setIsLoading(true);
          const workspaceUsers = await getWorkspaceUsers();
          setUsers(workspaceUsers);
        } catch (error) {
          console.error("Failed to fetch workspace users:", error);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [users.length]
  );

  const handleValueChange = useCallback(
    (value: string) => {
      onAssign(ticketId, value);
    },
    [ticketId, onAssign]
  );

  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <Label htmlFor={`${ticketId}-assignee`} className="sr-only">
        Assignee
      </Label>
      <Select
        onValueChange={handleValueChange}
        onOpenChange={handleOpenChange}
        open={isOpen}
      >
        <SelectTrigger
          className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
          id={`${ticketId}-assignee`}
        >
          <SelectValue placeholder="Tildel sak" />
        </SelectTrigger>
        <SelectContent align="end">
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="ml-2 text-xs text-muted-foreground">
                Loading users...
              </span>
            </div>
          ) : (
            <>
              {users.map((user) => (
                <SelectItem
                  key={user.id}
                  value={user.id}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      {user.image && (
                        <AvatarImage src={user.image} alt={user.name} />
                      )}
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                </SelectItem>
              ))}
              {users.length === 0 && !isLoading && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No users found
                </div>
              )}
            </>
          )}
        </SelectContent>
      </Select>
    </>
  );
}
