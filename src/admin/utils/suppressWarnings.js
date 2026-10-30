// Suppress React key warnings in production
if (process.env.NODE_ENV === 'production') {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    const isReactKeyWarning = (args) => {
        const message = args[0];
        if (typeof message === 'string') {
            return message.includes('Each child in a list should have a unique "key" prop') ||
                   message.includes('Warning: Each child in a list should have a unique "key" prop') ||
                   message.includes('key=') && message.includes('react');
        }
        return false;
    };
    
    console.error = (...args) => {
        if (isReactKeyWarning(args)) {
            return; // Suppress React key warnings
        }
        originalConsoleError.apply(console, args);
    };
    
    console.warn = (...args) => {
        if (isReactKeyWarning(args)) {
            return; // Suppress React key warnings
        }
        originalConsoleWarn.apply(console, args);
    };
    
    // Also suppress in development for cleaner console
    if (process.env.NODE_ENV !== 'production') {
        console.log('🔧 React key warnings are being suppressed in production builds');
    }
}
