import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error || 'Terjadi kesalahan tampilan.'),
    };
  }

  componentDidCatch(error: unknown) {
    console.error('[AppErrorBoundary]', error);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-sandstone text-espresso flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-warmborder rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-espresso">Halaman gagal dimuat</h2>
          <p className="text-xs text-warmmuted leading-relaxed">
            Terjadi gangguan saat merender komponen. Data server tetap aman.
          </p>
          <div className="text-[11px] font-mono bg-sandstone/60 border border-warmborder rounded-lg p-2.5 text-red-700 break-words">
            {this.state.errorMessage}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-9 px-4 rounded-lg bg-espresso text-white text-xs font-semibold cursor-pointer"
            >
              Muat Ulang
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  const authRaw = window.localStorage.getItem('devos_auth_session_v1');
                  window.localStorage.clear();
                  if (authRaw) window.localStorage.setItem('devos_auth_session_v1', authRaw);
                } catch {
                  /* ignore */
                }
                window.location.reload();
              }}
              className="h-9 px-4 rounded-lg border border-warmborder bg-white text-espresso text-xs font-semibold cursor-pointer"
            >
              Bersihkan Cache Lokal &amp; Muat Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }
}
