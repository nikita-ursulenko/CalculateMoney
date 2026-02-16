import { useEffect, useRef } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export function SidebarSwipeGesture() {
    const { setOpenMobile, openMobile } = useSidebar();
    const isMobile = useIsMobile();
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!isMobile) return;

        const handleTouchStart = (e: TouchEvent) => {
            // Create a zone from the left edge (e.g., 20px) where the swipe can start
            // This mimics native behavior
            if (e.touches[0].clientX > 30) {
                touchStartRef.current = null;
                return;
            }

            touchStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStartRef.current || openMobile) return;

            const touchEnd = {
                x: e.changedTouches[0].clientX,
                y: e.changedTouches[0].clientY
            };

            const diffX = touchEnd.x - touchStartRef.current.x;
            const diffY = touchEnd.y - touchStartRef.current.y;

            // Check if it's a horizontal swipe
            // Abs(diffX) > Abs(diffY) means horizontal movement dominates
            // diffX > 50 means swiped right at least 50px
            if (Math.abs(diffX) > Math.abs(diffY) && diffX > 50) {
                setOpenMobile(true);
            }

            touchStartRef.current = null;
        };

        // Use passive: false if we needed to preventDefault, but here we just observe
        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isMobile, openMobile, setOpenMobile]);

    return null;
}
