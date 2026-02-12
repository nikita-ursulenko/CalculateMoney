import { useState, useRef, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
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
}

const MOCK_APPOINTMENTS: Appointment[] = [
    {
        id: '1',
        clientName: 'Анна',
        service: 'Маникюр + Покрытие',
        startTime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
        durationMinutes: 90,
    },
    {
        id: '2',
        clientName: 'Мария',
        service: 'Педикюр',
        startTime: new Date(new Date().setHours(13, 30, 0, 0)).toISOString(),
        durationMinutes: 60,
    },
    {
        id: '3',
        clientName: 'Елена',
        service: 'Снятие + Уход',
        startTime: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
        durationMinutes: 45,
    },
    {
        id: '4',
        clientName: 'Ольга',
        service: 'Маникюр',
        startTime: new Date(addDays(new Date().setHours(11, 0, 0, 0), 1)).toISOString(),
        durationMinutes: 60,
    },
    {
        id: '5',
        clientName: 'Виктория',
        service: 'Наращивание',
        startTime: new Date(addDays(new Date().setHours(14, 0, 0, 0), -1)).toISOString(),
        durationMinutes: 120,
    },
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 to 22:00
const BASE_HOUR_HEIGHT = 80;

export default function CalendarPage() {
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
        <div className="min-h-screen pb-24 bg-background">
            {/* Header with Navigation */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-4 py-3">
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

            {/* Calendar Grid */}
            <div
                className="relative flex"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Time Labels Column */}
                <div className="sticky left-0 z-10 w-12 bg-background/95 pt-10 border-r transition-[height] duration-75">
                    {HOURS.map((hour) => (
                        <div key={hour} style={{ height: `${hourHeight}px` }} className="relative border-b border-transparent">
                            <span className="absolute -top-2.5 right-2 text-[10px] font-medium text-muted-foreground transition-all">
                                {`${hour}:00`}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex-1 overflow-x-auto touch-auto">
                    <div className="relative min-w-[700px]">
                        {/* Header for Days in Week View */}
                        <div className="flex border-b sticky top-0 bg-background/90 z-10">
                            {appointmentsToRender.map(({ date }, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex-1 text-center py-2 border-r last:border-r-0 min-w-0 transition-colors",
                                        isSameDay(date, new Date()) && "bg-primary/5"
                                    )}
                                >
                                    <p className="text-[10px] text-muted-foreground uppercase">{format(date, 'eee', { locale: ru })}</p>
                                    <p className={cn(
                                        "text-sm font-bold",
                                        isSameDay(date, new Date()) && "text-primary"
                                    )}>{format(date, 'd')}</p>
                                </div>
                            ))}
                        </div>

                        {/* Grid Lines */}
                        <div className="absolute inset-0 pt-10">
                            {HOURS.map((hour) => (
                                <div key={hour} style={{ height: `${hourHeight}px` }} className="border-b border-muted/20 relative">
                                    <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-muted/10 pointer-events-none" />
                                </div>
                            ))}
                        </div>

                        {/* Columns and Appointments */}
                        <div className="flex relative pt-10" style={{ minHeight: `${HOURS.length * hourHeight}px` }}>
                            {appointmentsToRender.map(({ date, apps }, colIdx) => (
                                <div key={colIdx} className="flex-1 relative border-r last:border-r-0">
                                    {apps.map((app) => {
                                        const { top, height } = calculatePosition(app.startTime, app.durationMinutes);
                                        return (
                                            <Dialog key={app.id}>
                                                <DialogTrigger asChild>
                                                    <div
                                                        className="absolute left-1 right-1 p-1.5 overflow-hidden rounded-md bg-primary/10 border-l-2 border-primary hover:bg-primary/20 cursor-pointer transition-all z-1 shadow-sm"
                                                        style={{ top, height }}
                                                    >
                                                        <p className="text-[10px] font-bold truncate text-primary leading-tight">
                                                            {app.clientName}
                                                        </p>
                                                        {parseFloat(height) >= 30 && (
                                                            <p className="text-[8px] text-muted-foreground truncate leading-tight mt-0.5">
                                                                {app.service}
                                                            </p>
                                                        )}
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[425px] p-6 rounded-2xl">
                                                    <DialogHeader className="mb-4">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <DialogTitle className="text-xl font-bold">
                                                                {app.clientName}
                                                            </DialogTitle>
                                                            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                                                                {app.durationMinutes} мин
                                                            </span>
                                                        </div>
                                                        <VisuallyHidden>
                                                            <DialogDescription>
                                                                Детали записи для {app.clientName}
                                                            </DialogDescription>
                                                        </VisuallyHidden>
                                                        <div className="text-sm text-left text-muted-foreground mt-1">
                                                            {app.service} • {format(new Date(app.startTime), 'HH:mm')}
                                                        </div>
                                                    </DialogHeader>

                                                    <div className="space-y-4 py-4">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Услуга</p>
                                                            <p className="text-base font-medium">{app.service}</p>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1 bg-secondary/30 p-3 rounded-xl">
                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Дата</p>
                                                                <p className="text-sm font-semibold">{format(new Date(app.startTime), 'd MMMM', { locale: ru })}</p>
                                                            </div>
                                                            <div className="space-y-1 bg-secondary/30 p-3 rounded-xl border border-primary/10">
                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Время</p>
                                                                <div className="flex items-center gap-2 text-primary">
                                                                    <Clock size={16} />
                                                                    <p className="text-lg font-bold">{format(new Date(app.startTime), 'HH:mm')}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 pt-2">
                                                        <Button className="flex-1 rounded-xl" onClick={() => { }}>Редактировать</Button>
                                                        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { }}>Закрыть</Button>
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

            {/* Floating Zoom Controls */}
            <div className="fixed bottom-24 right-4 flex flex-col gap-2 z-30">
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
