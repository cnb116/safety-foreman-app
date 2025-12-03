import React from 'react';
import { Volume2, Download, AlertTriangle } from 'lucide-react';

const ResultCard = ({ data }) => {
    if (!data) return null;

    const handleSpeak = (text, lang) => {
        window.speechSynthesis.cancel(); // Stop previous

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        // Try to find a specific voice for better quality/matching
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(v => v.lang.includes(lang) || v.lang.includes(lang.split('-')[0]));

        if (matchingVoice) {
            utterance.voice = matchingVoice;
        }

        // Mobile fix: ensure volume is 1
        utterance.volume = 1;
        utterance.rate = 0.9; // Slightly slower for clarity

        utterance.onerror = (e) => {
            console.error('TTS Error:', e);
            alert('음성 재생 중 오류가 발생했습니다. 기기 설정을 확인해주세요.');
        };

        window.speechSynthesis.speak(utterance);
    };

    // Dummy download function since we don't have the video generation logic from the "Shorts App" yet
    // But the user asked to keep the button.
    const handleDownload = () => {
        alert('교육 자료 영상 다운로드 기능은 준비 중입니다.');
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 space-y-6 animate-fade-in">
            {/* Main Safety Order Card */}
            <div className="bg-gray-900 border-2 border-yellow-500 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.15)]">
                <div className="bg-yellow-500 p-4 flex items-center gap-3">
                    <span className="text-3xl">{data.safety_icon || '⚠️'}</span>
                    <h2 className="text-2xl font-black text-black uppercase tracking-wider">
                        {data.title || 'Safety Order'}
                    </h2>
                </div>

                <div className="p-6 space-y-6">
                    {/* Refined Korean Text */}
                    <div className="space-y-2">
                        <label className="text-yellow-500 text-sm font-bold tracking-widest uppercase">
                            Standardized Order (표준어 + 안전수칙)
                        </label>
                        <div className="text-2xl font-bold text-white leading-relaxed bg-black/30 p-4 rounded-xl border border-gray-700">
                            {data.refined_text}
                        </div>
                    </div>

                    {/* Translations */}
                    <div className="space-y-4">
                        {data.translations?.map((item, index) => (
                            <div
                                key={index}
                                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-yellow-500/50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase bg-gray-900 px-2 py-1 rounded">
                                        {item.lang_name}
                                    </span>
                                    <button
                                        onClick={() => handleSpeak(item.text, item.lang)}
                                        className="text-yellow-400 hover:text-yellow-300 transition-colors p-1"
                                        title="듣기"
                                    >
                                        <Volume2 size={24} />
                                    </button>
                                </div>
                                <p className="text-xl text-white font-medium mb-1">{item.text}</p>
                                <p className="text-sm text-gray-400 italic">{item.pronunciation}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Footer */}
                <div className="bg-gray-950 p-4 border-t border-gray-800 flex justify-center">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors font-medium"
                    >
                        <Download size={20} />
                        <span>교육 자료 영상 다운로드</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultCard;
