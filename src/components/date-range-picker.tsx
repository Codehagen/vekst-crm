"use client";

import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";

interface DateRangePickerProps {
  defaultStartDate?: string;
  defaultEndDate?: string;
}

export function DateRangePicker({
  defaultStartDate,
  defaultEndDate,
}: DateRangePickerProps) {
  const router = useRouter();

  const [date, setDate] = useState<DateRange | undefined>({
    from: defaultStartDate ? new Date(defaultStartDate) : undefined,
    to: defaultEndDate ? new Date(defaultEndDate) : undefined,
  });

  const [isOpen, setIsOpen] = useState(false);

  // This would be used to trigger a server action or client-side filtering
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDate(range);

    if (range?.from && range?.to) {
      // In a real implementation, we would update URL params or trigger a server action
      // For now, just refresh the page to simulate
      router.refresh();
    }
  };

  return (
    <div className="grid gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(range) => {
              handleDateRangeChange(range);
              if (range?.from && range?.to) {
                setIsOpen(false);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
