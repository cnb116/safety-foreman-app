import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';

const InputForm = ({ onSubmit, isLoading, loadingText, resetTrigger }) => {
    const [text, setText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);

    // Reset form when resetTrigger changes
    useEffect(() => {
        setText('');
        setIsListening(false);
        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {
                // Ignore error if already stopped
            }
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
                        placeholder={isListening ? "꿈 내용을 말씀해주세요... (말씀이 끝나면 자동으로 분석됩니다)" : "예: 돼지떼가 집으로 들어오는 꿈을 꿨어. 로또 번호 알려줘!"}
                        className={`w-full p-4 pr-12 h-32 bg-gray-900 border-2 rounded-xl text-white placeholder-gray-500 focus:ring-2 transition-all resize-none text-lg ${isListening
                            ? 'border-purple-500 ring-purple-500/20 animate-pulse'
                            : 'border-purple-500/30 focus:border-purple-400 focus:ring-purple-400/20'
                            }`}
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`absolute right-3 bottom-3 p-3 rounded-full transition-all ${isListening
                            ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]'
                            : 'bg-purple-500 text-white hover:bg-purple-400'
                            }`}
                        title="음성 입력"
                    >
                        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !text.trim()}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xl rounded-xl hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" />
                            <span>{loadingText || "분석 중..."}</span>
                        </>
                    ) : (
                        <>
                            <Send size={24} />
                            <span>꿈해몽 & 번호 받기</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default InputForm;
