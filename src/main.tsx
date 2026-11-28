import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/plus-jakarta-sans/800.css'
import '@fontsource/bricolage-grotesque/600.css'
import '@fontsource/bricolage-grotesque/700.css'
import '@fontsource/bricolage-grotesque/800.css'
import './index.css'
import { installAuthFetchInterceptor } from './lib/auth/fetch-interceptor'
import App from './App'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { PwaInstallBanner } from './components/mobile/PwaInstallBanner'
import { registerSW } from 'virtual:pwa-register'

installAuthFetchInterceptor()
registerSW({ immediate: true })

const PageFallback = (
  <div className="min-h-screen bg-sandstone flex items-center justify-center p-6">
    <div className="flex items-center gap-3 text-xs font-semibold text-espresso">
      <span className="size-4 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      <span>Memuat Developer Sales OS...</span>
    </div>
  </div>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <Suspense fallback={PageFallback}>
        <App />
      </Suspense>
      <PwaInstallBanner />
    </AppErrorBoundary>
  </StrictMode>,
)
