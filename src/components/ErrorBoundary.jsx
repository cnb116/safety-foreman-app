import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">오류가 발생했습니다</h1>
                    <p className="text-gray-300 mb-6">
                        앱을 처리하는 중 문제가 발생했습니다.<br />
                        아래 버튼을 눌러 새로고침 해주세요.
                    </p>
                    <div className="bg-gray-800 p-4 rounded-lg mb-6 text-left max-w-md overflow-auto text-xs text-red-300 font-mono">
                        {this.state.error && this.state.error.toString()}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors"
                    >
                        새로고침
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
