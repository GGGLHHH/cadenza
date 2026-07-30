import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  integrations: [
    react(),
    starlight({
      title: 'Cadenza',
      description: 'Accessible React components — React Aria behaviour, shadcn styling',
      customCss: ['./src/styles/global.css'],
      sidebar: [
        { label: '组件', items: [{ autogenerate: { directory: 'components' } }] },
      ],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
