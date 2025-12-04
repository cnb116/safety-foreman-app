import React, { useState } from 'react';
import InputForm from './InputForm';
import ResultCard from './ResultCard';
import { HardHat, Home, Share2, ExternalLink, X } from 'lucide-react';
import { isKakao, openInChrome, isAndroid } from './utils/browser';

const API_KEY = "AIzaSyA-DlQRtKStTsEVFVJkXPUH6XioEehD4_I";

function App() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resetKey, setResetKey] = useState(0);
    const [isKakaoBrowser, setIsKakaoBrowser] = useState(false);
    const [showIOSModal, setShowIOSModal] = useState(false);

    React.useEffect(() => {
        const isKakaoApp = isKakao();
        setIsKakaoBrowser(isKakaoApp);

        if (isKakaoApp) {
            if (isAndroid()) {
                openInChrome();
            } else {
                setShowIOSModal(true);
            }
        }
    }, []);

    const handleReset = React.useCallback(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            try {
                window.speechSynthesis.cancel();
            } catch (e) {
                console.error("Failed to cancel speech:", e);
            }
        }
        setResult(null);
        setError(null);
        setLoading(false);
        setResetKey(prev => prev + 1);
    }, []);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert("링크가 복사되었습니다! \n크롬(Chrome)이나 사파리(Safari)에 붙여넣어 실행해주세요.");
        }).catch(() => {
            alert("링크 복사에 실패했습니다.");
        });
    };

    const handleOpenChrome = () => {
        if (isAndroid()) {
            openInChrome();
        } else {
            setShowIOSModal(true);
        }
    };

    const handleGenerate = React.useCallback(async (inputText) => {
        if (!API_KEY) {
            setError("API Key가 설정되지 않았습니다. .env 파일에 VITE_GEMINI_API_KEY를 추가해주세요.");
            return;
        }

        // Use the passed inputText, or fallback to empty string if something goes wrong
        const textToTranslate = typeof inputText === 'string' ? inputText : "";

        if (!textToTranslate.trim()) {
            // If no text, do nothing or show error? 
            // For now, just return to avoid empty calls
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const systemPrompt = `
당신은 30년 경력의 베테랑 건설 안전 관리자입니다.
사용자가 입력한 한국어 지시(현장 은어 포함)를 받으면, 즉시 번역하지 말고 **[생각의 사슬]**을 거쳐 JSON으로 출력하세요.

[Step 1: 은어 표준화]
- '반생이'->'결속선', '공구리'->'콘크리트', '하이바'->'안전모' 등 현장 용어를 표준어로 순화하세요.

[Step 2: 안전 의식 주입 (핵심)]
- 단순 지시라도 반드시 문장 끝에 상황에 맞는 **안전 수칙**을 한 문장 덧붙이세요.
- 예: '빨리 해' -> '신속하게 작업하되, **이동 시 낙하물에 주의하세요.**'

[Step 3: 다국어 출력]
- 정제된 내용을 중국어(zh-CN), 베트남어(vi-VN), 영어(en-US)로 번역하세요.
- 각 언어별로 발음(pronunciation)도 함께 제공하세요.

[JSON 출력 형식]
{
  "title": "작업 지시 (Safety Order)",
  "safety_icon": "⚠️", 
  "refined_text": "표준어로 순화된 한국어 문장",
  "translations": [
    { "lang": "zh-CN", "lang_name": "중국어", "text": "...", "pronunciation": "..." },
    { "lang": "vi-VN", "lang_name": "베트남어", "text": "...", "pronunciation": "..." },
    { "lang": "en-US", "lang_name": "영어", "text": "...", "pronunciation": "..." }
  ]
}
IMPORTANT: Output ONLY valid JSON. No markdown code blocks.
`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: systemPrompt + "\n\n사용자 입력: " + textToTranslate
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();

            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error("API 응답 형식이 올바르지 않습니다.");
            }

            const textResponse = data.candidates[0].content.parts[0].text;

            // Clean up markdown if present
            const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

            try {
                const parsedResult = JSON.parse(jsonString);

                // Validate structure
                if (!parsedResult || typeof parsedResult !== 'object') {
                    throw new Error("JSON 형식이 올바르지 않습니다.");
                }

                if (!Array.isArray(parsedResult.translations)) {
                    // Try to fix if it's wrapped or single object
                    console.warn("Translations is not an array, attempting to fix...");
                    parsedResult.translations = [];
                }

                setResult(parsedResult);
            } catch (e) {
                console.error("JSON Parse Error:", e, jsonString);
                throw new Error("AI 응답을 처리하는 중 오류가 발생했습니다. (JSON 파싱 실패)");
            }

        } catch (err) {
            console.error(err);
            setError(`통역 실패: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center py-10 px-4 relative">
            {/* Home Button */}
            <button
                onClick={handleReset}
                className="absolute top-4 left-4 p-3 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors z-50 cursor-pointer touch-manipulation"
                title="처음으로"
            >
                <Home size={24} className="text-yellow-500" />
            </button>

            {/* Copy Link Button */}
            <button
                onClick={handleCopyLink}
                className="absolute top-4 right-4 p-3 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors z-50 cursor-pointer touch-manipulation"
                title="링크 복사"
            >
                <Share2 size={24} className="text-yellow-500" />
            </button>

            {/* Header */}
            <header className="mb-10 text-center space-y-4">
                <div className="inline-flex items-center justify-center p-4 bg-yellow-500 rounded-full shadow-[0_0_40px_rgba(250,204,21,0.4)] mb-4">
                    <HardHat size={48} className="text-black" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-tight uppercase">
                    Global Foreman
                </h1>
                <p className="text-gray-400 text-lg font-medium">
                    건설 현장 안전 통역 시스템
                </p>
            </header>

            {/* Main Content */}
            <main className="w-full max-w-4xl space-y-8 flex flex-col items-center">

                {/* Kakao Browser Warning Button */}
                {isKakaoBrowser && (
                    <button
                        onClick={handleOpenChrome}
                        className="mb-6 px-6 py-3 bg-gray-800 border border-yellow-500/50 rounded-full flex items-center gap-2 text-yellow-400 font-bold animate-pulse hover:bg-gray-700 transition-colors cursor-pointer touch-manipulation"
                    >
                        <ExternalLink size={20} />
                        <span>소리가 안 나나요? 크롬으로 열기</span>
                    </button>
                )}

                <InputForm resetTrigger={resetKey} onSubmit={handleGenerate} isLoading={loading} />

                {error && (
                    <div className="p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-200 text-center w-full">
                        {error}
                    </div>
                )}

                {result && <ResultCard data={result} />}
            </main>

            {/* Footer */}
            <footer className="mt-20 text-gray-600 text-sm">
                © 2025 Global Foreman Safety System
            </footer>

            {/* iOS Guide Modal */}
            {showIOSModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4" onClick={() => setShowIOSModal(false)}>
                    <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl max-w-sm w-full space-y-4 relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowIOSModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                        <h3 className="text-xl font-bold text-white">브라우저로 열기</h3>
                        <p className="text-gray-300 leading-relaxed">
                            아이폰에서는 보안 정책상 앱 강제 전환이 불가능합니다.<br /><br />
                            <span className="text-yellow-400 font-bold">1. 우측 하단 점 3개(⋯) 메뉴 클릭</span><br />
                            <span className="text-yellow-400 font-bold">2. '다른 브라우저로 열기' 선택</span>
                        </p>
                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setShowIOSModal(false)}
                                className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
