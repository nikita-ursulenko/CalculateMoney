import { useState, useRef, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, Minus, Maximize, MinusCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';

interface Appointment {
    id: string;
    clientName: string;
    service: string;
    startTime: string;
    durationMinutes: number;
    start_time?: string;
    end_time?: string;
}

const MOCK_APPOINTMENTS: Appointment[] = [
    {
        id: '1',
        clientName: 'Анна',
        service: 'Маникюр + Покрытие',
        startTime: '2026-02-12T10:00:00',
        durationMinutes: 90,
    },
    {
        id: '2',
        clientName: 'Мария',
        service: 'Педикюр',
        startTime: '2026-02-12T14:00:00',
        durationMinutes: 60,
    },
    {
        id: '3',
        clientName: 'Елена',
        service: 'Снятие + Уход',
        startTime: '2026-02-13T12:00:00',
        durationMinutes: 45,
    },
    {
        id: '4',
        clientName: 'Ольга',
        service: 'Маникюр',
        startTime: '2026-02-15T11:00:00',
        durationMinutes: 60,
    },
    {
        id: '5',
        clientName: 'Виктория',
        service: 'Наращивание',
        startTime: '2026-02-11T14:30:00',
        durationMinutes: 120,
    },
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 to 22:00
const BASE_HOUR_HEIGHT = 80;

export default function CalendarPage() {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [zoom, setZoom] = useState(1.0);

    // Pinch to zoom state
    const touchStartRef = useRef<{ dist: number; zoom: number } | null>(null);
    const hourHeight = BASE_HOUR_HEIGHT * zoom;

    const navigateDate = (amount: number) => {
        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + amount * 7);
        setCurrentDate(nextDate);
    };

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const getDayAppointments = (date: Date) => {
        return MOCK_APPOINTMENTS.filter(app => isSameDay(new Date(app.startTime), date));
    };

    const calculatePosition = (startTime: string, duration: number) => {
        const start = new Date(startTime);
        const startMinutes = (start.getHours() - 8) * 60 + start.getMinutes();
        const top = (startMinutes / 60) * hourHeight;
        const height = (duration / 60) * hourHeight;
        return { top: `${top}px`, height: `${height}px` };
    };

    const appointmentsToRender = weekDays.map(date => ({ date, apps: getDayAppointments(date) }));

    // Touch handlers for pinch-to-zoom
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            touchStartRef.current = { dist, zoom };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && touchStartRef.current) {
            const dist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            const scale = dist / touchStartRef.current.dist;
            const nextZoom = Math.min(Math.max(touchStartRef.current.zoom * scale, 0.5), 3.0);
            setZoom(nextZoom);
        }
    };

    const handleTouchEnd = () => {
        touchStartRef.current = null;
    };

    const changeZoom = (delta: number) => {
        setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3.0));
    };

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Main Scrollable Area (Vertical & Horizontal) */}
            <div className="flex-1 overflow-auto touch-auto scrollbar-hide relative flex flex-col">
                {/* Header with Navigation - Scrolls away vertically */}
                <div className="relative border-b px-4 py-3 bg-background z-10">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h1 className="text-lg font-bold flex items-center gap-2">
                                <CalendarIcon className="text-primary" size={20} />
                                Расписание на неделю
                            </h1>
                        </div>

                        <div className="flex items-center justify-between bg-secondary/30 rounded-xl p-1 shadow-sm">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate(-1)}>
                                <ChevronLeft size={18} />
                            </Button>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" className="text-sm font-medium h-auto py-1 px-4 hover:bg-primary/5 transition-colors">
                                        {`${format(weekStart, 'd MMM')} - ${format(weekDays[6], 'd MMM, yyyy', { locale: ru })}`}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="center">
                                    <Calendar
                                        mode="single"
                                        selected={currentDate}
                                        onSelect={(date) => date && setCurrentDate(date)}
                                        initialFocus
                                        locale={ru}
                                    />
                                </PopoverContent>
                            </Popover>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateDate(1)}>
                                <ChevronRight size={18} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Grid Area with synchronized horizontal scroll */}
                <div
                    className="relative min-w-[700px] flex flex-col flex-1"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Header for Days - Sticky Top relative to the main scroll container */}
                    <div className="flex border-b sticky top-0 bg-background z-50 h-14">
                        {/* Time Column Header Spacer - Also sticky top to match dates row */}
                        <div className="w-14 border-r border-slate-300 bg-background flex items-end justify-end p-1 shrink-0">
                            <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-tighter text-right leading-none">Время</span>
                        </div>

                        {appointmentsToRender.map(({ date }, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex-1 text-center flex flex-col justify-center border-r border-slate-300 last:border-r-0 min-w-0 transition-colors cursor-pointer hover:bg-primary/10 active:bg-primary/20",
                                    isSameDay(date, new Date()) && "bg-primary/5"
                                )}
                                onClick={() => navigate(`/add?date=${format(date, 'yyyy-MM-dd')}`)}
                            >
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{format(date, 'eee', { locale: ru })}</p>
                                <p className={cn(
                                    "text-base font-black leading-none mt-1",
                                    isSameDay(date, new Date()) && "text-primary"
                                )}>{format(date, 'd')}</p>
                            </div>
                        ))}
                    </div>

                    {/* Main Grid Body Area */}
                    <div className="flex relative flex-1">
                        {/* Time Labels Column - Scrolls horizontally with grid */}
                        <div className="w-14 bg-background border-r shadow-sm flex flex-col z-20 shrink-0">
                            <div className="relative flex-1">
                                {HOURS.map((hour, idx) => (
                                    <div
                                        key={hour}
                                        style={{ height: `${hourHeight}px` }}
                                        className={cn(
                                            "relative w-full border-b border-slate-300",
                                            idx === 0 && "border-t border-t-slate-300"
                                        )}
                                    >
                                        <span className="absolute top-0 right-2 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-background px-1 z-10">
                                            {`${hour}:00`}
                                        </span>
                                    </div>
                                ))}
                                {/* Final hour label */}
                                <div className="relative w-full">
                                    <span className="absolute top-0 right-2 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-background px-1 z-10">
                                        {HOURS[HOURS.length - 1] + 1}:00
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Columns and Appointments Content Layer */}
                        <div className="flex-1 relative bg-background" style={{ minHeight: `${HOURS.length * hourHeight}px` }}>
                            {/* Unified Background Grid Layer (Horizontal Lines) */}
                            <div className="absolute inset-0 pointer-events-none z-0">
                                {HOURS.map((hour, idx) => (
                                    <div
                                        key={hour}
                                        style={{ height: `${hourHeight}px` }}
                                        className={cn(
                                            "border-b border-slate-300 relative",
                                            idx === 0 && "border-t border-t-slate-300"
                                        )}
                                    >
                                        {/* Half-hour dashed line */}
                                        <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-200/50" />
                                    </div>
                                ))}
                            </div>

                            {/* Vertical Day Lines (Overlay) */}
                            <div className="absolute inset-0 pointer-events-none z-20 flex border-l border-slate-300">
                                {appointmentsToRender.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className="flex-1 border-r border-slate-300 h-full"
                                    />
                                ))}
                            </div>

                            {/* Appointment Cards */}
                            <div className="flex absolute inset-0 z-30">
                                {appointmentsToRender.map(({ date, apps }, colIdx) => (
                                    <div
                                        key={colIdx}
                                        className="flex-1 relative h-full"
                                    >
                                        {apps.map((app) => {
                                            const { top, height } = calculatePosition(app.startTime, app.durationMinutes);
                                            return (
                                                <Dialog key={app.id}>
                                                    <DialogTrigger asChild>
                                                        <div
                                                            className="absolute left-1.5 right-1.5 p-2 overflow-hidden rounded-xl bg-primary/10 border-l-4 border-primary hover:bg-primary/20 cursor-pointer transition-all shadow-sm group active:scale-[0.98] z-40"
                                                            style={{ top, height }}
                                                        >
                                                            <p className="text-[11px] font-black truncate text-primary leading-tight uppercase tracking-tight">
                                                                {app.clientName}
                                                            </p>
                                                            {parseFloat(height) >= 35 && (
                                                                <p className="text-[10px] text-primary/70 truncate leading-tight font-medium mt-0.5">
                                                                    {app.service}
                                                                </p>
                                                            )}
                                                            {parseFloat(height) >= 55 && (
                                                                <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-primary/50 font-bold shrink-0">
                                                                    <Clock size={10} />
                                                                    <span>{format(new Date(app.startTime), 'HH:mm')}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[425px] p-6 rounded-3xl">
                                                        <DialogHeader className="mb-4">
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <DialogTitle className="text-lg font-black tracking-tight">
                                                                    {app.clientName}
                                                                </DialogTitle>
                                                                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                                    <Clock size={10} className="text-primary/70" />
                                                                    <span className="text-[10px] font-bold">
                                                                        {app.durationMinutes}м
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <VisuallyHidden>
                                                                <DialogDescription>
                                                                    Детали записи для {app.clientName}
                                                                </DialogDescription>
                                                            </VisuallyHidden>
                                                            <div className="text-[11px] text-left text-muted-foreground font-medium flex items-center gap-1.5 px-0.5">
                                                                <CalendarIcon size={12} className="text-primary/60" />
                                                                {format(new Date(app.startTime), 'd MMMM', { locale: ru })}
                                                                <span className="mx-1 opacity-30">•</span>
                                                                {app.start_time || format(new Date(app.startTime), 'HH:mm')}
                                                                {app.end_time ? ` - ${app.end_time}` : ''}
                                                            </div>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-2">
                                                            <div className="space-y-1.5">
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {app.service.split(',').map((s, i) => (
                                                                        <span key={i} className="px-2.5 py-0.5 bg-secondary/60 rounded-lg text-[10px] font-bold border border-border/40 text-secondary-foreground/80">
                                                                            {s.trim()}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 mt-2">
                                                            <Button className="flex-1 rounded-2xl h-11 btn-primary-gradient text-sm font-bold" onClick={() => navigate(`/add/${app.id}`)}>Изменить</Button>
                                                            <Button variant="outline" className="flex-1 rounded-2xl h-11 text-sm font-bold" onClick={() => { }}>Закрыть</Button>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Zoom Controls - Fixed outside the scroll area for visibility */}
            <div className="fixed bottom-24 right-4 flex flex-col gap-2 z-[60]">
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full shadow-lg border bg-background/80 backdrop-blur"
                    onClick={() => changeZoom(0.2)}
                >
                    <Plus size={20} />
                </Button>
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full shadow-lg border bg-background/80 backdrop-blur"
                    onClick={() => changeZoom(-0.2)}
                >
                    <Minus size={20} />
                </Button>
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full shadow-lg border bg-background/80 backdrop-blur"
                    onClick={() => setZoom(1.0)}
                >
                    <Maximize size={18} />
                </Button>
            </div>
        </div>
    );
}
