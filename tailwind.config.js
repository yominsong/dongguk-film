/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: [
    "./**/forms.py",
    "./**/static/js/*.js",
    "./**/templates/*.{html,js}",
    "./**/templates/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'flamingo': {
          DEFAULT: '#F15922',
          '50': '#FCDBCF',
          '100': '#FBCCBB',
          '200': '#F8AF95',
          '300': '#F6936F',
          '400': '#F37648',
          '500': '#F15922',
          '600': '#CE400D',
          '700': '#99300A',
          '800': '#641F06',
          '900': '#300F03'
        },
      },
      fontFamily: {
        "pretendard": ["Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Roboto", 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', "sans-serif"]
      }
    },
  },
  corePlugins: {
    aspectRatio: false,
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
