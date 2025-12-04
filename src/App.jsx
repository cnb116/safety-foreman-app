import React, { useState, useEffect } from 'react';
import InputForm from './InputForm';
import ResultCard from './ResultCard';
import { Sparkles, Home, Share2, ExternalLink, X, Moon } from 'lucide-react';
import { isKakao, openInChrome, isAndroid } from './utils/browser';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDmd3_6dtn65dyA7dQToSwVUs4CCfR1WxI";

function App() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("");
    const [error, setError] = useState(null);
    const [resetKey, setResetKey] = useState(0);
    const [isKakaoBrowser, setIsKakaoBrowser] = useState(false);
    const [showIOSModal, setShowIOSModal] = useState(false);

    useEffect(() => {
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

    // Rolling Loading Message Logic
    useEffect(() => {
        let interval;
        if (loading) {
            const messages = [
                "AI가 꿈의 기운을 읽고 있습니다...",
                "별자리를 분석 중입니다...",
                "숫자를 점지하는 중..."
            ];
            let index = 0;
            setLoadingText(messages[0]);
            interval = setInterval(() => {
                index = (index + 1) % messages.length;
                setLoadingText(messages[index]);
            }, 2000);
        } else {
            setLoadingText("");
        }
        return () => clearInterval(interval);
    }, [loading]);

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

        const textToTranslate = typeof inputText === 'string' ? inputText : "";

        if (!textToTranslate.trim()) {
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const systemPrompt = `
당신은 100년 수련한 AI 점술가입니다.
사용자가 꿈을 입력하면 즉시 답하지 말고, 다음 **[점술의 사슬]** 과정을 거쳐 신중하게 응답하세요.

[Step 1: 상징 분석 (Symbolism)]
- 꿈 내용에서 핵심 키워드 3~4개를 추출하고, 각각의 상징적 의미(재물, 건강, 태몽 등)를 분석하세요.

[Step 2: 수비학적 변환 (Numerology)]
- 추출된 키워드를 '로또 번호(1~45)'와 연결하세요. (예: 돼지=8, 불=9, 조상님=1...)
- **반드시 꿈의 내용과 연관된 번호**를 포함하여 6개의 행운 숫자를 생성하세요.

[Step 3: 계시 (Revelation)]
- 위 분석을 바탕으로 희망찬 해몽 풀이와, 신비로운 부적 이미지를 생성하세요.

[JSON 출력 형식]
{
  "title": "🌙 한밤의 계시",
  "interpretation": "황금 돼지는 엄청난 재물을 상징합니다. 하늘을 날았으니 그 운이 승천할 기세군요...",
  "lucky_numbers": [8, 12, 23, 33, 41, 45],
  "image_prompt": "Golden pig flying in the starry night sky, tarot card style, glowing aura, mystical, 8k resolution"
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

                setResult(parsedResult);
            } catch (e) {
                console.error("JSON Parse Error:", e, jsonString);
                throw new Error("AI 응답을 처리하는 중 오류가 발생했습니다. (JSON 파싱 실패)");
            }

        } catch (err) {
            console.error(err);
            setError(`해몽 실패: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <div className="min-h-screen bg-indigo-950 text-white flex flex-col items-center py-10 px-4 relative overflow-hidden">
            {/* Background Stars Effect (Simple CSS) */}
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                backgroundSize: '50px 50px'
            }}></div>

            {/* Home Button */}
            <button
                onClick={handleReset}
                className="absolute top-4 left-4 p-3 bg-indigo-900/80 rounded-full hover:bg-indigo-800 transition-colors z-50 cursor-pointer touch-manipulation border border-indigo-700"
                title="처음으로"
            >
                <Home size={24} className="text-purple-300" />
            </button>

            {/* Copy Link Button */}
            <button
                onClick={handleCopyLink}
                className="absolute top-4 right-4 p-3 bg-indigo-900/80 rounded-full hover:bg-indigo-800 transition-colors z-50 cursor-pointer touch-manipulation border border-indigo-700"
                title="링크 복사"
            >
                <Share2 size={24} className="text-purple-300" />
            </button>

            {/* Header */}
            <header className="mb-10 text-center space-y-4 z-10 relative">
                <div className="inline-flex items-center justify-center p-4 bg-indigo-900 rounded-full shadow-[0_0_40px_rgba(129,140,248,0.4)] mb-4 border border-indigo-500/50">
                    <Moon size={48} className="text-yellow-300" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-indigo-200 to-purple-300 tracking-tight">
                    Lotto Dream
                </h1>
                <p className="text-indigo-300 text-lg font-medium">
                    AI 로또 꿈해몽 & 번호 추천
                </p>
            </header>

            {/* Main Content */}
            <main className="w-full max-w-4xl space-y-8 flex flex-col items-center z-10 relative">

                {/* Kakao Browser Warning Button */}
                {isKakaoBrowser && (
                    <button
                        onClick={handleOpenChrome}
                        className="mb-6 px-6 py-3 bg-indigo-900 border border-purple-500/50 rounded-full flex items-center gap-2 text-purple-300 font-bold animate-pulse hover:bg-indigo-800 transition-colors cursor-pointer touch-manipulation"
                    >
                        <ExternalLink size={20} />
                        <span>소리가 안 나나요? 크롬으로 열기</span>
                    </button>
                )}

                <InputForm
                    resetTrigger={resetKey}
                    onSubmit={handleGenerate}
                    isLoading={loading}
                    loadingText={loadingText}
                />

                {error && (
                    <div className="p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-200 text-center w-full">
                        {error}
                    </div>
                )}

                {result && <ResultCard data={result} />}
            </main>

            {/* Footer */}
            <footer className="mt-20 text-indigo-400 text-sm z-10">
                © 2025 AI Lotto Dream Interpreter
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
