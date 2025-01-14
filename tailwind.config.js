/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                mono: ['Courier New', 'monospace']
            },
            gridTemplateColumns: {
                '13': 'repeat(13, minmax(0, 1fr))',
                '14': 'repeat(14, minmax(0, 1fr))',
                '15': 'repeat(15, minmax(0, 1fr))',
                '16': 'repeat(16, minmax(0, 1fr))',
                '17': 'repeat(17, minmax(0, 1fr))',
                '18': 'repeat(18, minmax(0, 1fr))',
                '19': 'repeat(19, minmax(0, 1fr))',
                '20': 'repeat(20, minmax(0, 1fr))',
                '21': 'repeat(21, minmax(0, 1fr))',
                '22': 'repeat(22, minmax(0, 1fr))',
                '23': 'repeat(23, minmax(0, 1fr))',
                '24': 'repeat(24, minmax(0, 1fr))',
                '25': 'repeat(25, minmax(0, 1fr))',
                '26': 'repeat(26, minmax(0, 1fr))',
                '27': 'repeat(27, minmax(0, 1fr))',

            },
            gridColumn: {
                'span-13': 'span 13 / span 13',
                'span-14': 'span 14 / span 14',
                'span-15': 'span 15 / span 15',
                'span-16': 'span 16 / span 16',
                'span-17': 'span 17 / span 17',
                'span-18': 'span 18 / span 18',
                'span-19': 'span 19 / span 19',
                'span-20': 'span 20 / span 20',
                'span-21': 'span 21 / span 21',
                'span-22': 'span 22 / span 22',
                'span-23': 'span 23 / span 23',
                'span-24': 'span 24 / span 24',
                'span-25': 'span 25 / span 25',
                'span-26': 'span 26 / span 26',
                'span-27': 'span 27 / span 27'
            },
            gridColumnStart: {
                '13': '13',
                '14': '14',
                '15': '15',
                '16': '16',
                '17': '17',
                '18': '18',
                '19': '19',
                '20': '20',
                '21': '21',
                '22': '22',
                '23': '23',
                '24': '24',
                '25': '25',
                '26': '26',
                '27': '27'
            }
        }
    },
    plugins: [
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries')
    ]
};
