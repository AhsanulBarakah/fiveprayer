const plugin = require('tailwindcss/plugin');

const config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './blocks/**/*.{js,ts,jsx,tsx,php}',
    './php/**/*.php'
  ],
  theme: {
    extend: {
      screens: {
        'c-mdx': { max: '782px' }
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif']
      },
      dropShadow: {
        'c-dsh-1': '0 0px 2px rgba(187, 203, 207, 0.291)'
      }
    }
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('current', '&.active');
    })
  ]
};

module.exports = config;
