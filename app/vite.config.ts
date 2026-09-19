import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/errata-desk/app/',
  build: {outDir: 'dist'},
})
