/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nexus: {
          DEFAULT: 'rgb(var(--nexus) / <alpha-value>)',
          50:'#f0f1ff',100:'#e2e4ff',200:'#c8ccff',
          300:'#a5aaff',400:'#817afc',500:'#6366f1',
          600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81',
        },
      },
      backgroundColor: {
        base:    'rgb(var(--bg)   / <alpha-value>)',
        'base-2':'rgb(var(--bg2)  / <alpha-value>)',
        'base-3':'rgb(var(--bg3)  / <alpha-value>)',
      },
      borderColor:{ base:'rgb(var(--border) / <alpha-value>)' },
      textColor:{
        primary:  'rgb(var(--text)  / <alpha-value>)',
        secondary:'rgb(var(--text2) / <alpha-value>)',
        muted:    'rgb(var(--text3) / <alpha-value>)',
        nexus:    'rgb(var(--nexus) / <alpha-value>)',
      },
      fontFamily:{
        sans:   ['Inter','system-ui','sans-serif'],
        display:['"Plus Jakarta Sans"','Inter','sans-serif'],
      },
      animation:{
        'fade-in':  'fadeIn .18s ease-out',
        'slide-up': 'slideUp .28s cubic-bezier(.16,1,.3,1)',
        'scale-in': 'scaleIn .2s cubic-bezier(.16,1,.3,1)',
        shimmer:    'shimmer 1.6s linear infinite',
      },
      keyframes:{
        fadeIn: {from:{opacity:0},to:{opacity:1}},
        slideUp:{from:{opacity:0,transform:'translateY(12px)'},to:{opacity:1,transform:'translateY(0)'}},
        scaleIn:{from:{opacity:0,transform:'scale(.94)'},to:{opacity:1,transform:'scale(1)'}},
        shimmer:{'0%':{backgroundPosition:'-1000px 0'},'100%':{backgroundPosition:'1000px 0'}},
      },
      boxShadow:{
        card:  '0 1px 3px rgba(0,0,0,.04),0 4px 16px rgba(0,0,0,.04)',
        glass: '0 4px 24px -2px rgba(0,0,0,.08)',
        glow:  '0 0 24px rgb(var(--nexus)/.28)',
        'glow-sm':'0 0 12px rgb(var(--nexus)/.18)',
      },
    },
  },
  plugins:[],
};
