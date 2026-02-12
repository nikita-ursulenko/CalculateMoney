import { useState, useRef, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, Minus, Maximize, Edit2, X, User, Shield } from 'lucide-react';
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
import { MasterSelector } from '@/components/MasterSelector';

interface Appointment {
    id: string;
    clientName: string;
    service: string;
    startTime: string; // ISO date for position on calendar
    start_time: string; // HH:mm for display
    end_time: string; // HH:mm for display
    durationMinutes: number;
    transaction_type: 'service' | 'debt_salon_to_master' | 'debt_master_to_salon';
    payment_method?: 'cash' | 'card';
    price: number;
    tips?: number;
    recipient_role?: 'me' | 'master' | 'admin';
    masterId: string;
}

const MOCK_MASTERS = [
    { user_id: 'm1', master_name: 'Анна Маникюр', rate_general: 40, rate_cash: 40, rate_card: 40, use_different_rates: false },
    { user_id: 'm2', master_name: 'Ольга Педикюр', rate_general: 50, rate_cash: 50, rate_card: 50, use_different_rates: false },
    { user_id: 'm3', master_name: 'Елена Визаж', rate_general: 45, rate_cash: 45, rate_card: 45, use_different_rates: false },
];

const MOCK_APPOINTMENTS: Appointment[] = [
    {
        id: '1',
        clientName: 'Анна Петрова',
        service: 'Маникюр + Покрытие',
        startTime: '2026-02-12T10:00:00',
        start_time: '10:00',
        end_time: '11:30',
        durationMinutes: 90,
        transaction_type: 'service',
        payment_method: 'card',
        price: 50,
        tips: 5,
        recipient_role: 'me',
        masterId: 'm1'
    },
    {
        id: '2',
        clientName: 'Мария Иванова',
        service: 'Педикюр',
        startTime: '2026-02-12T14:00:00',
        start_time: '14:00',
        end_time: '15:00',
        durationMinutes: 60,
        transaction_type: 'service',
        payment_method: 'cash',
        price: 40,
        recipient_role: 'master',
        masterId: 'm2'
    },
    {
        id: '3',
        clientName: 'Салон',
        service: 'Ресницы для админа',
        startTime: '2026-02-12T16:00:00',
        start_time: '16:00',
        end_time: '16:30',
        durationMinutes: 30,
        transaction_type: 'debt_salon_to_master',
        price: 30,
        masterId: 'm1'
    },
    {
        id: '4',
        clientName: 'Елена Сидорова',
        service: 'Снятие + Уход',
        startTime: '2026-02-13T12:00:00',
        start_time: '12:00',
        end_time: '12:45',
        durationMinutes: 45,
        transaction_type: 'service',
        payment_method: 'card',
        price: 25,
        recipient_role: 'admin',
        masterId: 'm3'
    },
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 to 22:00
const BASE_HOUR_HEIGHT = 80;

export default function AdminCalendar() {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [zoom, setZoom] = useState(1.0);
    const [selectedMasterId, setSelectedMasterId] = useState<string>('m1');

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
        return MOCK_APPOINTMENTS.filter(app =>
            isSameDay(new Date(app.startTime), date) &&
            app.masterId === selectedMasterId
        );
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
                {/* Header with Navigation - Sticky horizontally, scrolls away vertically */}
                <div className="sticky left-0 w-full border-b px-4 py-3 bg-background z-30">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h1 className="text-lg font-bold flex items-center gap-2">
                                <Shield className="text-primary" size={20} />
                                Календарь мастеров
                            </h1>
                        </div>

                        <div className="flex flex-col gap-2">
                            <MasterSelector
                                masters={MOCK_MASTERS}
                                selectedMasterId={selectedMasterId}
                                onSelectMaster={setSelectedMasterId}
                            />

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
                        {/* Time Column Header Spacer - Sticky Top and Left */}
                        <div className="w-14 border-r border-slate-300 bg-background flex items-end justify-end p-1 shrink-0 sticky left-0 z-[60]">
                            <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-tighter text-right leading-none">Время</span>
                        </div>

                        {appointmentsToRender.map(({ date }, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex-1 text-center flex flex-col justify-center border-r border-slate-300 last:border-r-0 min-w-0 transition-colors cursor-pointer hover:bg-primary/10 active:bg-primary/20",
                                    isSameDay(date, new Date()) && "bg-primary/5"
                                )}
                                onClick={() => navigate(`/admin/add?date=${format(date, 'yyyy-MM-dd')}`)}
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
                        {/* Time Labels Column - Sticky horizontally */}
                        <div className="w-14 bg-background border-r shadow-md flex flex-col sticky left-0 z-[45] shrink-0">
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
                                                            className={cn(
                                                                "absolute left-1.5 right-1.5 p-2 overflow-hidden rounded-xl border-l-4 cursor-pointer transition-all shadow-sm group active:scale-[0.98] z-40",
                                                                app.transaction_type === 'service'
                                                                    ? "bg-primary/10 border-primary hover:bg-primary/20"
                                                                    : app.transaction_type === 'debt_salon_to_master'
                                                                        ? "bg-green-500/10 border-green-500 hover:bg-green-500/20"
                                                                        : "bg-red-500/10 border-red-500 hover:bg-red-500/20"
                                                            )}
                                                            style={{ top, height }}
                                                        >
                                                            <div className="flex justify-between items-start gap-1">
                                                                <p className={cn(
                                                                    "text-[10px] font-black truncate leading-tight uppercase tracking-tight",
                                                                    app.transaction_type === 'service' ? "text-primary" : app.transaction_type === 'debt_salon_to_master' ? "text-green-700" : "text-red-700"
                                                                )}>
                                                                    {app.clientName}
                                                                </p>
                                                                <span className="text-[9px] font-bold opacity-60 shrink-0">{app.price}€</span>
                                                            </div>
                                                            {parseFloat(height) >= 35 && (
                                                                <p className="text-[9px] opacity-70 truncate leading-tight font-medium mt-0.5">
                                                                    {app.service}
                                                                </p>
                                                            )}
                                                            {parseFloat(height) >= 55 && (
                                                                <div className="flex items-center gap-1.5 mt-1 text-[8px] opacity-50 font-bold shrink-0">
                                                                    <Clock size={8} />
                                                                    <span>{app.start_time} - {app.end_time}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                                                        <div className={cn(
                                                            "p-6 pb-4",
                                                            app.transaction_type === 'service' ? "bg-primary/5" : app.transaction_type === 'debt_salon_to_master' ? "bg-green-500/5" : "bg-red-500/5"
                                                        )}>
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                                                                        app.transaction_type === 'service' ? "bg-primary/10 text-primary" : app.transaction_type === 'debt_salon_to_master' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                                                                    )}>
                                                                        <User size={24} />
                                                                    </div>
                                                                    <div>
                                                                        <DialogTitle className="text-xl font-black">{app.clientName}</DialogTitle>
                                                                        <p className="text-xs font-bold opacity-60 uppercase tracking-widest">
                                                                            {app.transaction_type === 'service' ? 'Услуга' : 'Доп. оплата'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-2xl font-black">{app.price}€</p>
                                                                    {app.payment_method && (
                                                                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-50">
                                                                            {app.payment_method === 'cash' ? 'Наличные' : 'Карта'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                                                                <div className="flex items-center gap-1.5">
                                                                    <CalendarIcon size={14} className="text-primary/60" />
                                                                    {format(new Date(app.startTime), 'd MMMM', { locale: ru })}
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Clock size={14} className="text-primary/60" />
                                                                    {app.start_time} — {app.end_time}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-6 pt-4 space-y-6">
                                                            <div className="space-y-2">
                                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Описание / Услуги</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {app.service.split(',').map((s, i) => (
                                                                        <span key={i} className="px-3 py-1 bg-secondary rounded-xl text-xs font-bold border border-border/50">
                                                                            {s.trim()}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                {app.tips !== undefined && app.tips > 0 && (
                                                                    <div className="p-3 bg-green-50 rounded-2xl border border-green-100">
                                                                        <p className="text-[10px] font-bold uppercase text-green-600/70 tracking-tight">Чаевые</p>
                                                                        <p className="text-lg font-black text-green-700">{app.tips}€</p>
                                                                    </div>
                                                                )}
                                                                {app.recipient_role && (
                                                                    <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                                                                        <p className="text-[10px] font-bold uppercase text-blue-600/70 tracking-tight">Кто принял</p>
                                                                        <p className="text-sm font-black text-blue-700 uppercase">
                                                                            {app.recipient_role === 'me' ? 'Я' : app.recipient_role === 'master' ? 'Мастер' : 'Админ'}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="p-6 pt-0 flex gap-3">
                                                            <Button
                                                                className="flex-1 h-12 rounded-2xl btn-primary-gradient font-bold shadow-lg shadow-primary/20"
                                                                onClick={() => navigate(`/admin/edit/${app.id}`)}
                                                            >
                                                                <Edit2 size={18} className="mr-2" />
                                                                Изменить
                                                            </Button>
                                                            <DialogTrigger asChild>
                                                                <Button variant="outline" className="h-12 w-12 rounded-2xl border-2">
                                                                    <X size={20} />
                                                                </Button>
                                                            </DialogTrigger>
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
