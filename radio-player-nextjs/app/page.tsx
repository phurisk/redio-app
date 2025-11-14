'use client';

import { useState, useRef, useEffect } from 'react';

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL || '/api/stream';

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Handle audio events for better streaming
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
      setError(null);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setError('เกิดข้อผิดพลาดในการเล่น กำลังลองใหม่...');
      setIsBuffering(false);
      
      // Auto reconnect after 3 seconds
      if (isPlaying) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (audio) {
            audio.load();
            audio.play().catch(err => console.error('Reconnect error:', err));
          }
        }, 3000);
      }
    };

    const handleStalled = () => {
      console.warn('Stream stalled, reloading...');
      if (isPlaying && audio) {
        audio.load();
        audio.play().catch(err => console.error('Reload error:', err));
      }
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleStalled);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setError(null);
        audioRef.current.play().catch(err => {
          console.error('Play error:', err);
          setError('ไม่สามารถเล่นได้ กรุณาลองอีกครั้ง');
        });
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <audio
        ref={audioRef}
        src={STREAM_URL}
        preload="auto"
        crossOrigin="anonymous"
      />
      
      <div className="w-full max-w-lg">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
          {/* Album Art / Visual */}
          <div className="relative h-64 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Demo Radio</h2>
              <p className="text-white/80 text-sm">Live Streaming</p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="p-8">
            {/* Song Info */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Now Playing
              </h3>
              <p className="text-gray-500 text-sm">
                Streaming from AzuraCast
              </p>
            </div>

            {/* Live Indicator / Status */}
            <div className="flex items-center justify-center mb-6">
              {error ? (
                <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 rounded-full">
                  <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium text-yellow-600">กำลังเชื่อมต่อใหม่...</span>
                </div>
              ) : isBuffering ? (
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full">
                  <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs font-medium text-blue-600">กำลังโหลด...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 rounded-full">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <span className="text-sm font-medium text-red-600">LIVE</span>
                </div>
              )}
            </div>

            {/* Main Play Button */}
            <div className="flex items-center justify-center space-x-6 mb-8">
              <button
                onClick={togglePlay}
                disabled={isBuffering}
                className={`w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-purple-300 ${isBuffering ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isBuffering ? (
                  <svg className="animate-spin w-7 h-7" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isPlaying ? (
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* Volume Control */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleMute}
                  className="text-gray-600 hover:text-purple-600 transition-colors focus:outline-none"
                >
                  {isMuted || volume === 0 ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : volume < 50 ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(147, 51, 234) ${volume}%, rgb(229, 231, 235) ${volume}%, rgb(229, 231, 235) 100%)`
                    }}
                  />
                </div>
                
                <span className="text-sm font-medium text-gray-600 w-10 text-right">
                  {volume}%
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-center text-xs text-gray-400 mb-2">
                Powered by AzuraCast • Next.js • Vercel
              </p>
              <p className="text-center text-xs text-gray-300">
                © 2025 Phuris Kruacharee
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgb(147, 51, 234);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgb(147, 51, 234);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </main>
  );
}
