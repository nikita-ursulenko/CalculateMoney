import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleClose = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom-full duration-300">
            <div className="bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl p-4 flex items-center justify-between gap-4 max-w-md mx-auto">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                        <Download size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Установите приложение</p>
                        <p className="text-xs text-muted-foreground">Для быстрого доступа</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleInstallClick}
                        size="sm"
                        className="rounded-xl font-bold bg-primary text-primary-foreground btn-primary-gradient shadow-lg shadow-primary/20"
                    >
                        Установить
                    </Button>
                    <Button
                        onClick={handleClose}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                    >
                        <X size={16} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
