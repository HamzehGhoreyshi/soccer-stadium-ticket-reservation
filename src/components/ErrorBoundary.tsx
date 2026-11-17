import { Component, type ReactNode } from 'react'

/** Last-resort fallback so a rendering error never leaves a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.error(error)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="fatal" role="alert">
        <h1>مشکلی پیش آمد</h1>
        <p className="muted">صفحه درست بارگذاری نشد. دوباره از نقشهٔ ورزشگاه شروع کنید.</p>
        <a
          className="btn btn--primary"
          href="#/"
          onClick={() => {
            this.setState({ failed: false })
          }}
        >
          بازگشت به نقشه
        </a>
      </div>
    )
  }
}
