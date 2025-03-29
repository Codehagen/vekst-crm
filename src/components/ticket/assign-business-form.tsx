"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { searchBusinesses, updateTicket } from "@/app/actions/tickets";
import { toast } from "sonner";

interface Business {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Ticket {
  id: string;
  title: string;
  submitterName: string | null;
  submitterEmail: string | null;
  submittedCompanyName: string | null;
}

interface AssignBusinessFormProps {
  ticket: Ticket;
}

export function AssignBusinessForm({ ticket }: AssignBusinessFormProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(
    ticket.submittedCompanyName || ""
  );
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch businesses when search term changes
  useEffect(() => {
    async function searchBusinessesByTerm() {
      if (!searchTerm.trim()) {
        setBusinesses([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchBusinesses(searchTerm);
        setBusinesses(results);
      } catch (error) {
        console.error("Error searching businesses:", error);
        toast.error("Error", {
          description: "Failed to search businesses",
        });
      } finally {
        setIsLoading(false);
      }
    }

    const debounce = setTimeout(() => {
      searchBusinessesByTerm();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBusinessId) return;

    setIsSubmitting(true);
    try {
      await updateTicket(ticket.id, {
        businessId: selectedBusinessId,
        status: "open", // Update status from unassigned to open
      });

      toast.success("Success", {
        description: "Business assigned to ticket successfully",
      });

      // Redirect back to ticket detail page
      router.push(`/tickets/${ticket.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error assigning business:", error);
      toast.error("Error", {
        description: "Failed to assign business to ticket",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="search">Search Business</Label>
          <Input
            id="search"
            placeholder="Enter business name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Search for a business to assign to this ticket
          </p>
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Searching businesses...</p>
          </div>
        ) : businesses.length === 0 ? (
          searchTerm.trim() !== "" && (
            <div className="py-4 text-center">
              <p className="text-muted-foreground">No businesses found</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() =>
                  router.push(
                    "/businesses/new?from=ticket&ticketId=" + ticket.id
                  )
                }
              >
                Create new business
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <Label>Select a Business</Label>
            <RadioGroup
              value={selectedBusinessId || ""}
              onValueChange={(value) => setSelectedBusinessId(value)}
            >
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className="flex items-start space-x-2 mb-2"
                >
                  <RadioGroupItem
                    value={business.id}
                    id={business.id}
                    className="mt-1"
                  />
                  <Label
                    htmlFor={business.id}
                    className="flex-1 cursor-pointer"
                  >
                    <Card className="hover:border-primary transition-colors">
                      <CardContent className="p-4">
                        <div className="font-medium">{business.name}</div>
                        <div className="text-muted-foreground text-sm">
                          {business.email} • {business.phone}
                        </div>
                      </CardContent>
                    </Card>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !selectedBusinessId}>
            {isSubmitting ? "Assigning..." : "Assign Business"}
          </Button>
        </div>
      </div>
    </form>
  );
}
