declare module 'vite-plugin-pwa' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export interface VitePWAOptions {
        registerType?: 'autoUpdate' | 'prompt';
        [key: string]: any;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export function VitePWA(options?: Partial<VitePWAOptions>): any[];
}
