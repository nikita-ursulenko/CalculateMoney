import { Home, Calendar, Settings, Shield, Plus, LogOut, Scissors, Users, User, ChevronsUpDown, Check } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useWorkspace } from "@/hooks/useWorkspace";
import { useSettings } from "@/hooks/useSettings";

export function AppSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setOpenMobile } = useSidebar();

    const { activeWorkspace, workspaces, setActiveWorkspace, isAdmin } = useWorkspace();
    const { settings } = useSettings();
    const { signOut } = useAuth();

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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="bg-background/50 hover:bg-background/80 border border-border/50 shadow-sm rounded-xl data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <User className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-bold">
                                    {activeWorkspace?.workspace?.name || 'Загрузка...'}
                                </span>
                                <span className="truncate text-[10px] text-muted-foreground uppercase tracking-widest">
                                    {isAdmin ? 'Администратор' : (settings?.master_profession || 'Мастер')}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
                        align="start"
                        side="bottom"
                        sideOffset={4}
                    >
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            Ваши Салоны
                        </div>
                        {workspaces.map((ws) => (
                            <DropdownMenuItem
                                key={ws.workspace_id}
                                onClick={() => setActiveWorkspace(ws.workspace_id)}
                                className={cn(
                                    "gap-2 p-2 cursor-pointer",
                                    activeWorkspace?.workspace_id === ws.workspace_id && "bg-accent"
                                )}
                            >
                                <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                                    <User className="size-3 text-muted-foreground" />
                                </div>
                                <span className="flex-1 truncate">{ws.workspace?.name}</span>
                                {activeWorkspace?.workspace_id === ws.workspace_id && (
                                    <Check className="size-4 text-primary" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
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
                            onClick={async () => {
                                await signOut();
                                navigate('/login');
                            }}
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
