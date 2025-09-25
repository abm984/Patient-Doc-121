
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace with your GitHub username and repo name
const repoName = 'Patient-Doc-121'

export default defineConfig({
  plugins: [react()],
  base: `/Patient-Doc-121/`, // 👈 required for GitHub Pages

  
  preview: {
    allowedHosts: ['wlspesh2.skm.org.pk']}
})