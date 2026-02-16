import { Home, Calendar, Settings, Shield, Plus, LogOut, Scissors, Users, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    useSidebar
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { useUserRole } from "@/hooks/useUserRole";
import { useSettings } from "@/hooks/useSettings";

export function AppSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setOpenMobile } = useSidebar();
    const { isAdmin } = useUserRole();
    const { settings } = useSettings();

    const handleNavigate = (path: string) => {
        navigate(path);
        setOpenMobile(false);
    };

    const menuItems = [
        { title: "Главная", icon: Home, path: "/dashboard" },
        { title: "Календарь", icon: Calendar, path: "/calendar" },
        { title: "Услуги", icon: Scissors, path: "/services" },
        { title: "Настройки", icon: Settings, path: "/settings" },
    ];

    const adminItems = [
        { title: "Главная", icon: Shield, path: "/admin" },
        { title: "Клиенты", icon: Users, path: "/clients" },
        { title: "Календарь", icon: Calendar, path: "/admin/calendar" },
    ];

    return (
        <Sidebar className="border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-3 px-2 py-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                        <User size={20} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="font-bold text-sm leading-none truncate">{settings?.master_name || 'Мастер'}</span>
                        <span className="text-[10px] text-muted-foreground truncate mt-1">
                            {settings?.master_profession || 'Специалист'}
                        </span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Основное</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="px-2">
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.path}>
                                    <SidebarMenuButton
                                        onClick={() => handleNavigate(item.path)}
                                        isActive={location.pathname === item.path}
                                        className={cn(
                                            "rounded-xl h-11 px-4 transition-all duration-200",
                                            location.pathname === item.path
                                                ? "bg-primary/10 text-primary font-bold shadow-sm"
                                                : "hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <item.icon size={20} className={cn(location.pathname === item.path && "text-primary")} />
                                        <span className="ml-2">{item.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {isAdmin && (
                    <SidebarGroup className="mt-4">
                        <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Администрирование</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="px-2">
                                {adminItems.map((item) => (
                                    <SidebarMenuItem key={item.path}>
                                        <SidebarMenuButton
                                            onClick={() => handleNavigate(item.path)}
                                            isActive={location.pathname === item.path}
                                            className={cn(
                                                "rounded-xl h-11 px-4 transition-all duration-200",
                                                location.pathname === item.path
                                                    ? "bg-primary/10 text-primary font-bold shadow-sm"
                                                    : "hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <item.icon size={20} className={cn(location.pathname.startsWith(item.path) && "text-primary")} />
                                            <span className="ml-2">{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter className="p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="rounded-xl h-11 px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
                            onClick={() => {/* Logout logic would go here */ }}
                        >
                            <LogOut size={20} />
                            <span className="ml-2">Выйти</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
