import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HardHat, Home, Share2, ExternalLink, X, Mic, MicOff, Send, Loader2, Volume2, Download, AlertTriangle } from 'lucide-react';

// ==========================================
// 1. 유틸리티 (Browser Utils)
// ==========================================
const isKakao = () => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return ua.indexOf('kakaotalk') > -1;
};

const isAndroid = () => {
    if (typeof window === 'undefined') return false;
    return /android/i.test(window.navigator.userAgent);
};

const isIOS = () => {
    if (typeof window === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

const openInChrome = () => {
    if (!isKakao()) return;
    if (isAndroid()) {
        const url = window.location.href.replace(/^https?:\/\//i, '');
        const intentUrl = `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`;
        window.location.href = intentUrl;
    } else {
        return false;
    }
};

// ==========================================
// 2. 하위 컴포넌트 (Components)
// ==========================================

// --- ErrorBoundary ---
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
                    <p className="text-gray-300 mb-6">앱을 처리하는 중 문제가 발생했습니다.<br />아래 버튼을 눌러 새로고침 해주세요.</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400">새로고침</button>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- ListInputForm (음성 인식 전문) ---
const InputForm = ({ onSubmit, isLoading, resetTrigger }) => {
    const [text, setText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);

    useEffect(() => {
        setText('');
        setIsListening(false);
        if (recognition) {
            try { recognition.stop(); } catch (e) { }
        }
    }, [resetTrigger]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'ko-KR';

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setText(transcript);
                if (event.results[0].isFinal) {
                    setIsListening(false);
                    onSubmit(transcript.trim());
                }
            };

            recognitionInstance.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        }
    }, [onSubmit]);

    const toggleListening = () => {
        if (!recognition) {
            alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
            return;
        }
        if (isListening) {
            recognition.stop();
        } else {
            setText('');
            recognition.start();
            setIsListening(true);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) onSubmit(text);
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={isListening ? "듣고 있습니다..." : "예: 야! 반생이 챙겨서 비계 위로 올라가!"}
                        className={`w-full p-4 pr-12 h-32 bg-gray-900 border-2 rounded-xl text-white placeholder-gray-500 focus:ring-2 transition-all resize-none text-lg ${isListening ? 'border-red-500 ring-red-500/20 animate-pulse' : 'border-yellow-500/30 focus:border-yellow-400 focus:ring-yellow-400/20'}`}
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`absolute right-3 bottom-3 p-3 rounded-full transition-all ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-yellow-400 text-black hover:bg-yellow-300'}`}
                    >
                        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                </div>
                <button
                    type="submit"
                    disabled={isLoading || !text.trim()}
                    className="w-full py-4 bg-yellow-400 text-black font-bold text-xl rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? <><Loader2 className="animate-spin" /><span>안전 통역 중...</span></> : <><Send size={24} /><span>통역 시작 (Safety Translate)</span></>}
                </button>
            </form>
        </div>
    );
};

// --- ResultCard (결과 표시 및 TTS) ---
const ResultCard = ({ data }) => {
    if (!data) return null;
    const [showWarning, setShowWarning] = useState(false);

    const handleSpeak = (text, lang) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            setShowWarning(true);
            return;
        }
        try {
            window.speechSynthesis.cancel();
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = lang;
                utterance.volume = 1;
                utterance.rate = 0.9;
                window.currentUtterance = utterance; // GC Prevention
                utterance.onend = () => { window.currentUtterance = null; };
                utterance.onerror = () => { setShowWarning(true); };
                window.speechSynthesis.speak(utterance);
            }, 50);
        } catch (e) {
            setShowWarning(true);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 space-y-6 animate-fade-in">
            <div className="bg-gray-900 border-2 border-yellow-500 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.15)]">
                <div className="bg-yellow-500 p-4 flex items-center gap-3">
                    <span className="text-3xl">{data.safety_icon || '⚠️'}</span>
                    <h2 className="text-2xl font-black text-black uppercase tracking-wider">{data.title || 'Safety Order'}</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-yellow-500 text-sm font-bold tracking-widest uppercase">Standardized Order (표준어 + 안전수칙)</label>
                        <div className="text-2xl font-bold text-white leading-relaxed bg-black/30 p-4 rounded-xl border border-gray-700">{data.refined_text}</div>
                    </div>
                    <div className="space-y-4">
                        {Array.isArray(data.translations) && data.translations.map((item, index) => (
                            <div key={index} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-yellow-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase bg-gray-900 px-2 py-1 rounded">{item.lang_name}</span>
                                    <button onClick={() => handleSpeak(item.text, item.lang)} className="text-yellow-400 p-1"><Volume2 size={24} /></button>
                                </div>
                                <p className="text-xl text-white font-medium mb-1">{item.text}</p>
                                <p className="text-sm text-gray-400 italic">{item.pronunciation}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 3. 메인 앱 (Main App)
// ==========================================
function App() {
    // API KEY 관리: 환경변수 -> 로컬스토리지 -> 사용자 입력 순
    const [apiKey, setApiKey] = useState(() => {
        return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || "";
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resetKey, setResetKey] = useState(0);
    const [isKakaoBrowser, setIsKakaoBrowser] = useState(false);
    const [showIOSModal, setShowIOSModal] = useState(false);
    const [showKeyInput, setShowKeyInput] = useState(false);

    useEffect(() => {
        const isKakaoApp = isKakao();
        setIsKakaoBrowser(isKakaoApp);
        if (isKakaoApp) {
            isAndroid() ? openInChrome() : setShowIOSModal(true);
        }
        // 키가 없으면 입력창 표시
        if (!apiKey) setShowKeyInput(true);
    }, []);

    // API Key 변경 시 로컬스토리지 저장
    const updateApiKey = (newKey) => {
        setApiKey(newKey);
        if (newKey) {
            localStorage.setItem('gemini_api_key', newKey);
        } else {
            localStorage.removeItem('gemini_api_key');
        }
    };

    const handleReset = useCallback(() => {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setResult(null);
        setError(null);
        setLoading(false);
        setResetKey(p => p + 1);
    }, []);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => alert("링크 복사 완료!")).catch(() => alert("복사 실패"));
    };

    const handleGenerate = useCallback(async (inputText) => {
        if (!apiKey) {
            setError("API Key가 필요합니다. 상단 열쇠 아이콘을 눌러 키를 입력해주세요.");
            setShowKeyInput(true);
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const systemPrompt = `
당신은 30년 경력의 베테랑 건설 안전 관리자입니다.
사용자 입력을 받으면 [Step 1: 은어 표준화], [Step 2: 안전 의식 주입], [Step 3: 다국어 출력(중/베/영)] 과정을 거쳐 JSON으로 출력하세요.
JSON 형식:
{
  "title": "작업 지시 (Safety Order)",
  "safety_icon": "⚠️",
  "refined_text": "표준어 문장 + 안전 수칙",
  "translations": [
    { "lang": "zh-CN", "lang_name": "중국어", "text": "...", "pronunciation": "..." },
    { "lang": "vi-VN", "lang_name": "베트남어", "text": "...", "pronunciation": "..." },
    { "lang": "en-US", "lang_name": "영어", "text": "...", "pronunciation": "..." }
  ]
}
IMPORTANT: Output ONLY valid JSON.
`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + "\n\n사용자 입력: " + inputText }] }] })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                // 400 Bad Request (API Key Invalid) 처리
                if (response.status === 400 || response.status === 403) {
                    localStorage.removeItem('gemini_api_key'); // 잘못된 키 삭제
                    setShowKeyInput(true);
                    throw new Error("API Key가 올바르지 않거나 만료되었습니다. 다시 입력해주세요.");
                }
                throw new Error(errData.error?.message || response.statusText);
            }

            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textResponse) throw new Error("API 응답이 비어있습니다.");

            const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedResult = JSON.parse(jsonString);

            if (!parsedResult.translations) parsedResult.translations = [];
            setResult(parsedResult);

        } catch (err) {
            console.error(err);
            setError(`통역 실패: ${err.message}`);
            if (err.message.includes('API key') || err.message.includes('403') || err.message.includes('Key')) {
                setShowKeyInput(true);
            }
        } finally {
            setLoading(false);
        }
    }, [apiKey]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center py-10 px-4 relative">
            {/* Top Controls */}
            <div className="absolute top-4 w-full flex justify-between px-4 z-50">
                <button onClick={handleReset} className="p-3 bg-gray-800 rounded-full hover:bg-gray-700"><Home size={24} className="text-yellow-500" /></button>
                <div className="flex gap-2">
                    <button onClick={() => setShowKeyInput(!showKeyInput)} className="p-3 bg-gray-800 rounded-full hover:bg-gray-700 text-yellow-500 font-bold text-xs flex items-center">API KEY</button>
                    <button onClick={handleCopyLink} className="p-3 bg-gray-800 rounded-full hover:bg-gray-700"><Share2 size={24} className="text-yellow-500" /></button>
                </div>
            </div>

            {/* API Key Input Modal/Area */}
            {showKeyInput && (
                <div className="w-full max-w-lg mb-6 p-4 bg-gray-900 border border-yellow-500/50 rounded-xl animate-fade-in relative">
                    <button onClick={() => setShowKeyInput(false)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><X size={16} /></button>
                    <label className="block text-yellow-500 font-bold mb-2">Google Gemini API Key 입력</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => updateApiKey(e.target.value)}
                        placeholder="AIza..."
                        className="w-full p-2 bg-black border border-gray-700 rounded text-white mb-2"
                    />
                    <p className="text-xs text-gray-400">키는 브라우저에 안전하게 저장되며, 앱을 껐다 켜도 유지됩니다.</p>
                </div>
            )}

            {/* Header */}
            <header className="mb-10 text-center space-y-4 pt-10">
                <div className="inline-flex items-center justify-center p-4 bg-yellow-500 rounded-full shadow-[0_0_40px_rgba(250,204,21,0.4)] mb-4">
                    <HardHat size={48} className="text-black" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase">Global Foreman</h1>
            </header>

            {/* Main Content */}
            <main className="w-full max-w-4xl space-y-8 flex flex-col items-center">
                {isKakaoBrowser && (
                    <button onClick={openInChrome} className="mb-6 px-6 py-3 bg-gray-800 border border-yellow-500/50 rounded-full flex items-center gap-2 text-yellow-400 font-bold animate-pulse hover:bg-gray-700">
                        <ExternalLink size={20} /><span>소리가 안 나나요? 크롬으로 열기</span>
                    </button>
                )}

                <InputForm resetTrigger={resetKey} onSubmit={handleGenerate} isLoading={loading} />

                {error && <div className="p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-200 text-center w-full">{error}</div>}

                {result && <ResultCard data={result} />}
            </main>

            {/* iOS Modal */}
            {showIOSModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4" onClick={() => setShowIOSModal(false)}>
                    <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl max-w-sm w-full space-y-4 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowIOSModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
                        <h3 className="text-xl font-bold text-white">브라우저로 열기</h3>
                        <p className="text-gray-300">아이폰에서는 보안상 앱 전환이 안됩니다.<br />우측 하단 점 3개 메뉴 -> '다른 브라우저로 열기'를 선택하세요.</p>
                        <div className="flex justify-end"><button onClick={() => setShowIOSModal(false)} className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg">확인</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
