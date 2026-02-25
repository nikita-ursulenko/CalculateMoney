import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import OnboardingScreen from "./OnboardingScreen";

interface SidebarLayoutProps {
    children: React.ReactNode;
}

import { SidebarSwipeGesture } from "./SidebarSwipeGesture";

export function SidebarLayout({ children }: SidebarLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();

    // Do not render sidebar layout on the auth page
    if (location.pathname === '/') {
        return <>{children}</>;
    }

    const { isAdmin, isModerator, canManageClients, activeWorkspace, loading: workspaceLoading } = useWorkspace();
    const { user } = useAuth();

    // If logged in but has no workspace yet — show onboarding
    if (user && !workspaceLoading && !activeWorkspace && location.pathname !== '/') {
        return <OnboardingScreen />;
    }
    const isAddPage = location.pathname.includes('/add') || location.pathname.includes('/edit');

    // Non-admins without manage_clients permission cannot add clients
    const canAddClient = canManageClients;

    const showPlusButton = location.pathname === '/dashboard' ||
        location.pathname === '/admin' ||
        location.pathname === '/admin/' ||
        location.pathname === '/services' ||
        (location.pathname === '/clients' && canAddClient);

    return (
        <SidebarProvider>
            <SidebarSwipeGesture />
            <div className="flex min-h-screen w-full bg-background">
                <AppSidebar />
                <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                    {/* Mobile Header */}
                    <header className="md:hidden flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-30">
                        <SidebarTrigger />
                        <h1 className="font-bold text-lg text-primary">Beauty Balance</h1>
                        <div className="w-8" /> {/* Spacer */}
                    </header>

                    {/* Desktop Header Backdrop / Spacer */}
                    <div className="hidden md:block absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none" />

                    <div className="flex-1 overflow-auto relative scroll-smooth bg-secondary/10">
                        {children}

                        {/* Repositioned Add Button - Bottom Left */}
                        {showPlusButton && (
                            <Button
                                size="icon"
                                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all duration-300 z-40"
                                onClick={() => {
                                    if (location.pathname === '/services') {
                                        window.dispatchEvent(new CustomEvent('open-service-create'));
                                        return;
                                    }

                                    if (location.pathname === '/clients') {
                                        window.dispatchEvent(new CustomEvent('open-client-create'));
                                        return;
                                    }

                                    const searchParams = new URLSearchParams(location.search);
                                    const masterId = searchParams.get('master');
                                    const date = searchParams.get('date') || searchParams.get('from');

                                    if (location.pathname.startsWith('/admin')) {
                                        let url = '/admin/add';
                                        const params = new URLSearchParams();
                                        if (masterId) params.set('master', masterId);
                                        if (date) params.set('date', date);
                                        const queryString = params.toString();
                                        navigate(queryString ? `${url}?${queryString}` : url);
                                    } else {
                                        let url = '/add';
                                        if (date) url += `?date=${date}`;
                                        navigate(url);
                                    }
                                }}
                            >
                                <Plus size={32} />
                            </Button>
                        )}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
