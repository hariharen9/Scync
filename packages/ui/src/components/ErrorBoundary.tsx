import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[Scync ErrorBoundary]', error, errorInfo);
  }

  private getErrorText(): string {
    const { error, errorInfo } = this.state;
    const lines: string[] = [];

    lines.push('=== Scync Runtime Error ===');
    lines.push('');

    if (error) {
      lines.push(`Error: ${error.message}`);
      if (error.stack) {
        lines.push('');
        lines.push('Stack Trace:');
        lines.push(error.stack);
      }
    }

    if (errorInfo?.componentStack) {
      lines.push('');
      lines.push('Component Stack:');
      lines.push(errorInfo.componentStack);
    }

    lines.push('');
    lines.push(`Time: ${new Date().toISOString()}`);
    lines.push(`URL: ${window.location.href}`);

    return lines.join('\n');
  }

  private handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(this.getErrorText());
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Fallback for older environments
      const textarea = document.createElement('textarea');
      textarea.value = this.getErrorText();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo, copied } = this.state;

    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.iconWrapper}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}>
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <div>
              <h1 style={styles.title}>Something went wrong</h1>
              <p style={styles.subtitle}>Scync encountered an unexpected error</p>
            </div>
          </div>

          {/* Error message */}
          <div style={styles.errorBox}>
            <p style={styles.errorLabel}>Error</p>
            <p style={styles.errorMessage}>{error?.message ?? 'Unknown error'}</p>
          </div>

          {/* Stack trace */}
          {(error?.stack || errorInfo?.componentStack) && (
            <div style={styles.stackBox}>
              <p style={styles.errorLabel}>Details</p>
              <pre style={styles.stackTrace}>
                {error?.stack ?? ''}
                {errorInfo?.componentStack ? `\n\nComponent Stack:${errorInfo.componentStack}` : ''}
              </pre>
            </div>
          )}

          {/* Actions */}
          <div style={styles.actions}>
            <button
              id="error-boundary-copy-btn"
              onClick={this.handleCopy}
              style={copied ? { ...styles.button, ...styles.buttonCopied } : styles.button}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  Copy Error
                </>
              )}
            </button>

            <button
              id="error-boundary-try-again-btn"
              onClick={this.handleReset}
              style={{ ...styles.button, ...styles.buttonSecondary }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Try Again
            </button>

            <button
              id="error-boundary-reload-btn"
              onClick={this.handleReload}
              style={{ ...styles.button, ...styles.buttonGhost }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Reload App
            </button>
          </div>

          <p style={styles.footer}>
            If this keeps happening, please{' '}
            <a
              href="https://github.com/hariharen9/Scync/issues"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              open an issue on GitHub
            </a>
            {' '}with the copied error details.
          </p>
        </div>
      </div>
    );
  }
}

// Inline styles — self-contained, no dependency on Tailwind or CSS files
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: '#060606',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    zIndex: 9999,
  },
  container: {
    width: '100%',
    maxWidth: '640px',
    background: '#0f0f0f',
    border: '1px solid #262626',
    borderRadius: '16px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#fafafa',
    lineHeight: 1.3,
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '13px',
    color: '#737373',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.06)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: '10px',
    padding: '16px',
  },
  errorLabel: {
    margin: '0 0 6px',
    fontSize: '10px',
    fontWeight: '600',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#ef4444',
  },
  errorMessage: {
    margin: 0,
    fontSize: '14px',
    color: '#fca5a5',
    fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
    wordBreak: 'break-word' as const,
  },
  stackBox: {
    background: '#0a0a0a',
    border: '1px solid #1f1f1f',
    borderRadius: '10px',
    padding: '16px',
    maxHeight: '200px',
    overflow: 'auto',
  },
  stackTrace: {
    margin: 0,
    fontSize: '11px',
    color: '#525252',
    fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    borderRadius: '8px',
    border: '1px solid #a855f7',
    background: 'rgba(168, 85, 247, 0.1)',
    color: '#c084fc',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  buttonCopied: {
    border: '1px solid #22c55e',
    background: 'rgba(34, 197, 94, 0.1)',
    color: '#86efac',
  },
  buttonSecondary: {
    border: '1px solid #262626',
    background: '#1a1a1a',
    color: '#a3a3a3',
  },
  buttonGhost: {
    border: '1px solid transparent',
    background: 'transparent',
    color: '#525252',
  },
  footer: {
    margin: 0,
    fontSize: '12px',
    color: '#404040',
    lineHeight: 1.6,
  },
  link: {
    color: '#a855f7',
    textDecoration: 'none',
  },
};
