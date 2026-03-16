"use client";

import {
  eachMonthOfInterval,
  eachYearOfInterval,
  endOfYear,
  format,
  isAfter,
  isBefore,
  startOfYear,
} from "date-fns";
import { ChevronDownIcon, ClockIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { CaptionLabelProps, MonthGridProps } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DateTimePicker({
  selected,
  onSelect,
}: {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
}) {
  const id = useId();
  const today = new Date();
  const [month, setMonth] = useState(selected ?? today);
  const [date, setDate] = useState<Date | undefined>(selected);
  const [isYearView, setIsYearView] = useState(false);
  const [time, setTime] = useState(
    selected ? format(selected, "HH:mm:ss") : "12:00:00"
  );
  const startDate = new Date(1980, 6);
  const endDate = new Date(2030, 6);

  const years = eachYearOfInterval({
    end: endOfYear(endDate),
    start: startOfYear(startDate),
  });

  function combineDateTime(d: Date, t: string): Date {
    const [h, m, s] = t.split(":").map(Number);
    const result = new Date(d);
    result.setHours(h, m, s ?? 0, 0);
    return result;
  }

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    onSelect?.(newDate ? combineDateTime(newDate, time) : undefined);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);
    if (date) {
      onSelect?.(combineDateTime(date, newTime));
    }
  };

  return (
    <div>
      <Calendar
        className="overflow-hidden rounded-md border p-2"
        classNames={{
          month_caption: "ms-2.5 me-20 justify-start",
          nav: "justify-end",
        }}
        components={{
          CaptionLabel: (props: CaptionLabelProps) => (
            <CaptionLabel
              isYearView={isYearView}
              setIsYearView={setIsYearView}
              {...props}
            />
          ),
          MonthGrid: (props: MonthGridProps) => {
            return (
              <MonthGrid
                className={props.className}
                currentMonth={month.getMonth()}
                currentYear={month.getFullYear()}
                endDate={endDate}
                isYearView={isYearView}
                onMonthSelect={(selectedMonth: Date) => {
                  setMonth(selectedMonth);
                  setIsYearView(false);
                }}
                setIsYearView={setIsYearView}
                startDate={startDate}
                years={years}
              >
                {props.children}
              </MonthGrid>
            );
          },
        }}
        defaultMonth={new Date()}
        endMonth={endDate}
        mode="single"
        month={month}
        onMonthChange={setMonth}
        onSelect={handleDateSelect}
        selected={date}
        startMonth={startDate}
      />
      <div className="border-t p-3">
        <div className="flex items-center gap-3">
          <Label className="text-xs" htmlFor={id}>
            Enter time
          </Label>
          <div className="relative grow">
            <Input
              className="peer appearance-none ps-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              id={id}
              onChange={handleTimeChange}
              step="1"
              type="time"
              value={time}
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <ClockIcon aria-hidden="true" size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthGrid({
  className,
  children,
  isYearView,
  startDate,
  endDate,
  years,
  currentYear,
  currentMonth,
  onMonthSelect,
}: {
  className?: string;
  children: React.ReactNode;
  isYearView: boolean;
  setIsYearView: React.Dispatch<React.SetStateAction<boolean>>;
  startDate: Date;
  endDate: Date;
  years: Date[];
  currentYear: number;
  currentMonth: number;
  onMonthSelect: (date: Date) => void;
}) {
  const currentYearRef = useRef<HTMLDivElement>(null);
  const currentMonthButtonRef = useRef<HTMLButtonElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isYearView && currentYearRef.current && scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement;
      if (viewport) {
        const yearTop = currentYearRef.current.offsetTop;
        viewport.scrollTop = yearTop;
      }
      setTimeout(() => {
        currentMonthButtonRef.current?.focus();
      }, 100);
    }
  }, [isYearView]);

  return (
    <div className="relative">
      <table className={className}>{children}</table>
      {isYearView && (
        <div className="-mx-2 -mb-2 absolute inset-0 z-20 bg-background">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            {years.map((year) => {
              const months = eachMonthOfInterval({
                end: endOfYear(year),
                start: startOfYear(year),
              });
              const isCurrentYear = year.getFullYear() === currentYear;

              return (
                <div
                  key={year.getFullYear()}
                  ref={isCurrentYear ? currentYearRef : undefined}
                >
                  <CollapsibleYear
                    open={isCurrentYear}
                    title={year.getFullYear().toString()}
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {months.map((month) => {
                        const isDisabled =
                          isBefore(month, startDate) || isAfter(month, endDate);
                        const isCurrentMonth =
                          month.getMonth() === currentMonth &&
                          year.getFullYear() === currentYear;

                        return (
                          <Button
                            className="h-7"
                            disabled={isDisabled}
                            key={month.getTime()}
                            onClick={() => onMonthSelect(month)}
                            ref={
                              isCurrentMonth ? currentMonthButtonRef : undefined
                            }
                            size="sm"
                            type="button"
                            variant={isCurrentMonth ? "default" : "outline"}
                          >
                            {format(month, "MMM")}
                          </Button>
                        );
                      })}
                    </div>
                  </CollapsibleYear>
                </div>
              );
            })}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

function CaptionLabel({
  children,
  isYearView,
  setIsYearView,
}: {
  isYearView: boolean;
  setIsYearView: React.Dispatch<React.SetStateAction<boolean>>;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <Button
      className="-ms-2 flex items-center gap-2 font-medium text-sm hover:bg-transparent data-[state=open]:text-muted-foreground/80 [&[data-state=open]>svg]:rotate-180"
      data-state={isYearView ? "open" : "closed"}
      onClick={() => setIsYearView((prev) => !prev)}
      size="sm"
      type="button"
      variant="ghost"
    >
      {children}
      <ChevronDownIcon
        aria-hidden="true"
        className="shrink-0 text-muted-foreground/80 transition-transform duration-200"
        size={16}
      />
    </Button>
  );
}

function CollapsibleYear({
  title,
  children,
  open,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <Collapsible className="border-t px-2 py-1.5" defaultOpen={open}>
      <CollapsibleTrigger asChild>
        <Button
          className="flex w-full justify-start gap-2 font-medium text-sm hover:bg-transparent [&[data-state=open]>svg]:rotate-180"
          size="sm"
          type="button"
          variant="ghost"
        >
          <ChevronDownIcon
            aria-hidden="true"
            className="shrink-0 text-muted-foreground/80 transition-transform duration-200"
            size={16}
          />
          {title}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden px-3 py-1 text-sm transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
