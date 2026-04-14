import { useState, useMemo } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { Layout } from '@/components/Layout';
import { EventCard } from '@/components/EventCard';
import { useMaggieEventsForMonth } from '@/hooks/useMaggieEvents';
import { formatEventTime, sortByStart } from '@/lib/maggie';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MaggieEvent } from '@/lib/maggie';
import { STAGE_COLORS } from '@/lib/config';
import { StageFilterBar } from '@/components/StageFilterBar';
import { PageHero } from '@/components/PageHero';

function getStageColor(stage: string): string {
  return STAGE_COLORS[stage]?.bg || 'bg-primary';
}

export default function CalendarPage() {
  useSeoMeta({
    title: "Calendar — Maggie Mae's Bar Austin",
    description: "Full calendar of live music events at Maggie Mae's Bar on Sixth Street, Austin TX.",
  });

  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: events = [], isLoading } = useMaggieEventsForMonth(monthStart, monthEnd);

  const filteredEvents = useMemo(() => {
    return selectedStage
      ? events.filter((e) => e.stage === selectedStage)
      : events;
  }, [events, selectedStage]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, MaggieEvent[]>();
    filteredEvents.forEach((event) => {
      const dateKey = format(new Date(event.start * 1000), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, event]);
    });
    map.forEach((evts) => evts.sort(sortByStart));
    return map;
  }, [filteredEvents]);

  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDate.get(dateKey) || [];
  }, [selectedDate, eventsByDate]);

  const today = new Date();

  return (
    <Layout>
      <PageHero
        baseName="bldg-front-night"
        eyebrow="Live Music"
        title={<>Event <span className="gold-text">Calendar</span></>}
        subtitle="Browse all upcoming shows across our stages. Click any date to see details."
        paddingBottom="pb-12"
      />

      <StageFilterBar selectedStage={selectedStage} onSelect={setSelectedStage} />

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-4">
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentMonth(new Date());
                      setSelectedDate(new Date());
                    }}
                    className="text-xs font-display tracking-wider"
                  >
                    Today
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-display text-muted-foreground tracking-widest uppercase py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {isLoading && (
                <div className="flex items-center justify-center min-h-[400px]">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              )}

              {!isLoading && (
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDate.get(dateKey) || [];
                    const hasEvents = dayEvents.length > 0;
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isToday = isSameDay(day, today);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <Popover key={dateKey}>
                        <PopoverTrigger asChild>
                          <button
                            onClick={() => setSelectedDate(day)}
                            disabled={!isCurrentMonth}
                            className={cn(
                              'relative min-h-[80px] p-2 rounded-md transition-all flex flex-col items-center justify-start gap-1',
                              isCurrentMonth ? 'hover:bg-accent/50 cursor-pointer' : 'opacity-30 cursor-default',
                              isSelected && 'bg-primary/10 ring-2 ring-primary',
                              isToday && !isSelected && 'bg-accent'
                            )}
                          >
                            <span
                              className={cn(
                                'text-sm font-medium',
                                isToday ? 'text-primary font-bold' : 'text-foreground',
                                !isCurrentMonth && 'text-muted-foreground'
                              )}
                            >
                              {format(day, 'd')}
                            </span>
                            {hasEvents && isCurrentMonth && (
                              <div className="flex flex-wrap gap-0.5 justify-center max-w-full px-0.5">
                                {dayEvents.slice(0, 3).map((evt, idx) => (
                                  <div
                                    key={idx}
                                    className={cn('w-1.5 h-1.5 rounded-full', getStageColor(evt.stage))}
                                    title={evt.title}
                                  />
                                ))}
                                {dayEvents.length > 3 && (
                                  <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>
                                )}
                              </div>
                            )}
                          </button>
                        </PopoverTrigger>
                        {hasEvents && isCurrentMonth && (
                          <PopoverContent
                            align="start"
                            className="w-72 p-0 max-h-80 overflow-hidden"
                            sideOffset={5}
                          >
                            <div className="p-3 border-b bg-card">
                              <p className="font-serif font-semibold text-sm">
                                {format(day, 'EEEE, MMMM d')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <ScrollArea className="max-h-60">
                              <div className="p-2 space-y-2">
                                {dayEvents.map((evt) => (
                                  <div
                                    key={evt.id}
                                    className="p-2 rounded-md bg-background hover:bg-accent/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedDate(day)}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge
                                        variant="secondary"
                                        className={cn('text-[10px] px-1.5 py-0', getStageColor(evt.stage), 'text-white')}
                                      >
                                        {evt.stage}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground font-medium">
                                        {evt.price}
                                      </span>
                                    </div>
                                    <p className="font-medium text-sm line-clamp-1">{evt.title}</p>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                      <Clock size={10} />
                                      {formatEventTime(evt.start, evt.timezone)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </PopoverContent>
                        )}
                      </Popover>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedDate && (
              <div className="mt-8">
                <h3 className="font-serif text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
                {selectedDayEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDayEvents.map((event) => (
                      <EventCard key={`${event.raw.pubkey}:${event.id}`} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-lg">
                    <CalendarIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground font-serif">
                      No events on this date
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}