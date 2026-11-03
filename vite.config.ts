import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './', // GitHub Pages 하위 경로에서도 동작하도록 상대 경로 사용
  plugins: [
    react(),
    // PWA: 홈 화면에 추가하면 앱처럼 실행된다.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '스쿨뷰 - 고등학교 정보 가이드',
        short_name: '스쿨뷰',
        description: '고등학교의 과목·동아리·학교생활을 미리 알고, 직접 선택하는 정보 가이드',
        lang: 'ko',
        theme_color: '#1f4e9a',
        background_color: '#f6f8fc',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
