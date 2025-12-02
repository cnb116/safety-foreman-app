import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';

const InputForm = ({ onSubmit, isLoading }) => {
    const [text, setText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();


            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'ko-KR';

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;

                // Overwrite text with new speech (Command Mode)
                setText(transcript);

                // Auto-submit on final result
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
            setText(''); // Clear previous text when starting new recording
            recognition.start();
            setIsListening(true);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onSubmit(text);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={isListening ? "듣고 있습니다... (말씀이 끝나면 자동으로 번역됩니다)" : "예: 야! 반생이 챙겨서 비계 위로 올라가!"}
                        className={`w-full p-4 pr-12 h-32 bg-gray-900 border-2 rounded-xl text-white placeholder-gray-500 focus:ring-2 transition-all resize-none text-lg ${isListening
                            ? 'border-red-500 ring-red-500/20 animate-pulse'
                            : 'border-yellow-500/30 focus:border-yellow-400 focus:ring-yellow-400/20'
                            }`}
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`absolute right-3 bottom-3 p-3 rounded-full transition-all ${isListening
                            ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]'
                            : 'bg-yellow-400 text-black hover:bg-yellow-300'
                            }`}
                        title="음성 입력"
                    >
                        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !text.trim()}
                    className="w-full py-4 bg-yellow-400 text-black font-bold text-xl rounded-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.3)]"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" />
                            <span>안전 통역 중...</span>
                        </>
                    ) : (
                        <>
                            <Send size={24} />
                            <span>통역 시작 (Safety Translate)</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default InputForm;
