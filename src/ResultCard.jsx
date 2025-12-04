import React from 'react';
import { Sparkles, Download, Share2 } from 'lucide-react';

const ResultCard = ({ data }) => {
    if (!data) return null;

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: '로또 꿈해몽 결과',
                text: `${data.title}\n\n${data.interpretation}\n\n행운의 번호: ${data.lucky_numbers.join(', ')}`,
                url: window.location.href,
            }).catch(console.error);
        } else {
            alert("공유하기를 지원하지 않는 브라우저입니다.");
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 space-y-6 animate-fade-in">
            {/* Mystical Card */}
            <div className="bg-indigo-900/80 border-2 border-purple-400/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(129,140,248,0.25)] backdrop-blur-sm relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-50"></div>

                <div className="bg-indigo-950/50 p-6 flex flex-col items-center gap-4 border-b border-purple-500/20">
                    <Sparkles className="text-yellow-300 animate-pulse" size={32} />
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 uppercase tracking-widest">
                        {data.title || '운명의 계시'}
                    </h2>
                </div>

                <div className="p-8 space-y-8">
                    {/* Interpretation Text */}
                    <div className="space-y-4 text-center">
                        <div className="text-lg md:text-xl text-indigo-100 leading-relaxed font-medium">
                            "{data.interpretation}"
                        </div>
                    </div>

                    {/* Lucky Numbers */}
                    <div className="space-y-4">
                        <div className="text-center text-purple-300 text-sm font-bold tracking-widest uppercase mb-4">
                            Lucky Numbers
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                            {data.lucky_numbers && data.lucky_numbers.map((num, index) => (
                                <div
                                    key={index}
                                    className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-black text-xl shadow-lg border-2 border-yellow-300 transform hover:scale-110 transition-transform duration-300"
                                >
                                    {num}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Image Prompt / Visual (Placeholder for now) */}
                    <div className="mt-8 p-4 bg-black/40 rounded-xl border border-indigo-500/30">
                        <div className="text-xs text-indigo-400 mb-2 uppercase tracking-wider text-center">Visual Inspiration</div>
                        <p className="text-sm text-gray-400 italic text-center">
                            {data.image_prompt}
                        </p>
                    </div>
                </div>

                {/* Action Footer */}
                <div className="bg-indigo-950/80 p-4 border-t border-purple-500/20 flex justify-center gap-4">
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-white/5"
                    >
                        <Share2 size={20} />
                        <span>결과 공유하기</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultCard;
