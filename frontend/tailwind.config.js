/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // PowerSense Energy Theme
        'energy-green': '#2ECC71',
        'deep-green': '#27AE60',
        'solar-yellow': '#F1C40F',
        'light-mint': '#ECF9F1',
        'dark-charcoal': '#2C3E50',
        
        // Organized by purpose
        primary: {
          DEFAULT: '#2ECC71',
          light: '#58D68D',
          dark: '#27AE60',
        },
        secondary: {
          DEFAULT: '#27AE60',
          light: '#52BE80',
          dark: '#1E8449',
        },
        accent: {
          DEFAULT: '#F1C40F',
          light: '#F4D03F',
          dark: '#D4AC0D',
        },
        background: {
          DEFAULT: '#ECF9F1',
          light: '#FFFFFF',
          dark: '#D5F5E3',
        },
        text: {
          DEFAULT: '#2C3E50',
          light: '#5D6D7E',
          dark: '#1C2833',
        },
        
        // Additional semantic color names for consistency
        textPrimary: '#2C3E50',
        textSecondary: '#5D6D7E',
        
        // Status colors using the theme
        success: '#2ECC71',
        warning: '#F1C40F',
        danger: '#E74C3C',
        info: '#3498DB',
      },
    },
  },
  plugins: [],
}
