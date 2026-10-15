import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** 点击“返回地图”时的回调（由外层负责切场景） */
  onRecover: () => void;
}

interface State {
  error: Error | null;
}

/**
 * 错误边界：任何场景渲染崩溃时显示可恢复界面，避免空白页
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[游园会] 场景渲染出错：', error, info.componentStack);
  }

  private recover = () => {
    this.setState({ error: null });
    this.props.onRecover();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="error-box">
          <div style={{ fontSize: 64 }}>🦊💦</div>
          <div>游园会的某个设施临时故障了……</div>
          <div style={{ fontSize: 20, color: 'var(--c-ink-soft)' }}>{this.state.error.message}</div>
          <button className="btn" onClick={this.recover}>
            返回地图
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
