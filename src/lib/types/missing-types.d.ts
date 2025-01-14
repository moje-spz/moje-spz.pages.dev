declare module '@testing-library/jest-dom' {
    const matchers: {
        toBeInTheDocument(): void;
        toHaveClass(className: string): void;
        toHaveValue(value: string): void;
        // Add other matchers as needed
    };
    export = matchers;
}

// If you need any specific Node.js types, you can declare them here
declare module 'node' {
    export interface Process {
        env: Record<string, string>;
    }
    export const process: Process;
}
