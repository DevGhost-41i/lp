// Simple performance monitoring utility
export class PerformanceMonitor {
    private static marks: Map<string, number> = new Map();

    static start(label: string) {
        this.marks.set(label, performance.now());
    }

    static end(label: string): number {
        const startTime = this.marks.get(label);
        if (!startTime) {
            console.warn(`No start mark found for: ${label}`);
            return 0;
        }

        const duration = performance.now() - startTime;
        this.marks.delete(label);

        // Log in development only
        if (import.meta.env.DEV) {
            console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
        }

        return duration;
    }

    static measure(label: string, fn: () => void) {
        this.start(label);
        fn();
        return this.end(label);
    }

    static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
        this.start(label);
        try {
            const result = await fn();
            this.end(label);
            return result;
        } catch (error) {
            this.end(label);
            throw error;
        }
    }
}

// Usage example:
// PerformanceMonitor.start('dashboard-load');
// ... do work ...
// PerformanceMonitor.end('dashboard-load');
//
// Or:
// const result = await PerformanceMonitor.measureAsync('fetch-data', async () => {
//   return await fetchData();
// });
