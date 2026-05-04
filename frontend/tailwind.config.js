/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    'Inter',
                    'ui-sans-serif',
                    'system-ui',
                    'Segoe UI',
                    'Roboto',
                    'Helvetica Neue',
                    'Arial',
                    'sans-serif',
                ],
            },
            colors: {
                // Primary coral — single accent, used for CTAs, focus rings, link hovers.
                // Sourced from the EarlyHub logo's "Hub" lettering and bird beak.
                primary: {
                    50: '#fef0ee',
                    100: '#fde0dc',
                    200: '#fbc1ba',
                    300: '#f8a297',
                    400: '#f67d6f',
                    500: '#f25445', // brand coral
                    600: '#df3c2d',
                    700: '#bc2f22',
                    800: '#8e2319',
                    900: '#5e1810',
                },
                // Navy — structural / "Early" lettering / dark surfaces.
                navy: {
                    50: '#eef0f7',
                    100: '#d7dcec',
                    200: '#aab3d3',
                    300: '#7d8ab8',
                    400: '#52639b',
                    500: '#2f437d',
                    600: '#1e2c5e', // brand navy
                    700: '#162247',
                    800: '#0f1830',
                    900: '#080d1c',
                },
                // Light, neutral surfaces.
                surface: {
                    50: '#ffffff',
                    100: '#fafbfc',
                    200: '#f5f6f8',
                    300: '#e8eaed',
                    400: '#d3d6db',
                    500: '#9ca3af',
                    600: '#6b7280',
                    700: '#4b5563',
                    800: '#1f2937',
                    900: '#0f172a',
                },
            },
            boxShadow: {
                card: '0 4px 14px rgba(15, 23, 42, 0.06)',
                'card-hover': '0 12px 28px rgba(15, 23, 42, 0.10)',
            },
            borderRadius: {
                xl: '0.875rem',
                '2xl': '1rem',
            },
            animation: {
                'fade-in': 'fade-in 0.3s ease-out',
                'slide-up': 'slide-up 0.4s ease-out',
                'slide-down': 'slide-down 0.4s ease-out',
            },
            keyframes: {
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-down': {
                    '0%': { opacity: '0', transform: 'translateY(-16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
};
