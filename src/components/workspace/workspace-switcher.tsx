"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getAllWorkspaces,
  switchUserWorkspace,
} from "@/app/actions/workspaces/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

interface Workspace {
  id: string;
  name: string;
}

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string;
}

export function WorkspaceSwitcher({
  currentWorkspaceId,
}: WorkspaceSwitcherProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>(
    currentWorkspaceId || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const router = useRouter();

  // Fetch available workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      setIsFetching(true);
      try {
        const result = await getAllWorkspaces();
        if (result.success && result.workspaces) {
          setWorkspaces(result.workspaces);
          if (!selectedWorkspace && result.workspaces.length > 0) {
            setSelectedWorkspace(result.workspaces[0].id);
          }
        } else {
          toast.error(result.error || "Failed to load workspaces");
        }
      } catch (error) {
        toast.error("Failed to load workspaces");
      } finally {
        setIsFetching(false);
      }
    };

    fetchWorkspaces();
  }, [selectedWorkspace]);

  // Handle workspace switch
  const handleSwitchWorkspace = async () => {
    if (!selectedWorkspace || selectedWorkspace === currentWorkspaceId) return;

    setIsLoading(true);
    try {
      const result = await switchUserWorkspace(selectedWorkspace);
      if (result.success) {
        toast.success(
          `Switched to ${
            workspaces.find((w) => w.id === selectedWorkspace)?.name
          }`
        );
        // Refresh the page to load data from the new workspace
        router.refresh();
      } else {
        toast.error(result.error || "Failed to switch workspace");
      }
    } catch (error) {
      toast.error("Failed to switch workspace");
    } finally {
      setIsLoading(false);
    }
  };

  if (workspaces.length <= 1) {
    return null; // Don't show the switcher if there's only one or no workspace
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Switcher</CardTitle>
        <CardDescription>Switch between available workspaces</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select
            value={selectedWorkspace}
            onValueChange={setSelectedWorkspace}
            disabled={isLoading || isFetching}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleSwitchWorkspace}
          disabled={
            isLoading || isFetching || selectedWorkspace === currentWorkspaceId
          }
          className="w-full"
        >
          {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          Switch Workspace
        </Button>
      </CardContent>
    </Card>
  );
}
