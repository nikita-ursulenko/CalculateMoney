import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageWrapperProps {
    children: ReactNode;
    className?: string;
    custom?: any; // Add custom prop for Framer Motion
}

export function PageWrapper({ children, className, custom }: PageWrapperProps) {
    const location = useLocation();
    const isAddEntry = location.pathname.includes('/add') || location.pathname.includes('/edit');

    // Different variants for different pages if needed
    // For AddEntry: Slide Up (Modal-like)
    // For Others: Fade In

    const variants: Variants = {
        initial: (direction: string) => {
            if (isAddEntry) return { y: '100%', opacity: 0, scale: 1 };
            if (direction === 'forward') return { x: '100%', opacity: 0, scale: 1 };
            if (direction === 'back') return { x: '-100%', opacity: 0, scale: 1 };
            return { opacity: 0, scale: 0.98 };
        },
        enter: {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.4
            }
        },
        exit: (direction: string) => {
            if (isAddEntry) return { y: '100%', opacity: 0, scale: 1, transition: { duration: 0.2 } };
            if (direction === 'forward') return { x: '-100%', opacity: 0, scale: 1, transition: { duration: 0.3, ease: 'easeIn' } };
            if (direction === 'back') return { x: '100%', opacity: 0, scale: 1, transition: { duration: 0.3, ease: 'easeIn' } };
            return { opacity: 0, scale: 0.98, transition: { duration: 0.2 } };
        }
    };

    return (
        <motion.div
            variants={variants}
            initial="initial"
            animate="enter"
            exit="exit"
            className={className}
            style={{ width: '100%', height: '100%' }} // Ensure full size
        >
            {children}
        </motion.div>
    );
}
