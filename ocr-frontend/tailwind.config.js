/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4a89dc',
          DEFAULT: '#2a6dc5',
          dark: '#1d4e94',
        },
        accent: '#65a4ff',
        darkBg: '#1a1a2e',
        darkSurface: '#222249',
        darkBorder: '#2a2a5a',
        darkText: {
          primary: '#ffffff',
          secondary: '#b8b8d0'
        },
        lightText: {
          primary: '#333333',
          secondary: '#666666'
        }
      },
      backgroundColor: theme => ({
        ...theme('colors'),
        'dark': '#1a1a2e',
        'light': '#f8f9fa',
      }),
      borderColor: theme => ({
        ...theme('colors'),
        'dark': '#2a2a5a',
        'light': '#e2e8f0',
      }),
      textColor: theme => ({
        ...theme('colors'),
        'dark-primary': '#ffffff',
        'dark-secondary': '#b8b8d0',
        'light-primary': '#333333',
        'light-secondary': '#666666',
      }),
      transitionProperty: {
        'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.800'),
            maxWidth: '100%',
            strong: {
              color: theme('colors.gray.900'),
            },
            h1: {
              color: theme('colors.gray.900'),
            },
            h2: {
              color: theme('colors.gray.900'),
            },
            h3: {
              color: theme('colors.gray.900'),
            },
            h4: {
              color: theme('colors.gray.900'),
            },
            thead: {
              color: theme('colors.gray.900'),
            },
            'tbody tr': {
              borderBottomColor: theme('colors.gray.200'),
            },
          },
        },
        invert: {
          css: {
            color: theme('colors.gray.200'),
            strong: {
              color: theme('colors.white'),
            },
            h1: {
              color: theme('colors.white'),
            },
            h2: {
              color: theme('colors.white'),
            },
            h3: {
              color: theme('colors.white'),
            },
            h4: {
              color: theme('colors.white'),
            },
            thead: {
              color: theme('colors.white'),
            },
            'tbody tr': {
              borderBottomColor: theme('colors.gray.700'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
} 