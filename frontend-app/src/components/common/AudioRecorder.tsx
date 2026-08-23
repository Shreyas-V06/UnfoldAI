import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Upload, Volume2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface AudioRecorderProps {
  onAudioReady: (audio: Blob | File) => void;
  onClear?: () => void;
  disabled?: boolean;
  maxDurationSec?: number;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioReady,
  onClear,
  disabled = false,
  maxDurationSec = 60,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [audioUrl]);

  // Audio level visualizer
  const updateVisualizer = () => {
    if (!analyserRef.current || !isRecording) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));

    animFrameRef.current = requestAnimationFrame(updateVisualizer);
  };

  const startRecording = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Audio Context for visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onAudioReady(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => {
          if (prev + 1 >= maxDurationSec) {
            stopRecording();
            return maxDurationSec;
          }
          return prev + 1;
        });
      }, 1000);

      // Start visualizer
      updateVisualizer();
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access or upload an audio file.'
          : 'Unable to access microphone. You can upload an audio file instead.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    setAudioLevel(0);
  };

  const handleReset = () => {
    stopRecording();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    if (onClear) onClear();
  };

  const togglePlayback = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleReset();
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      onAudioReady(file);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm transition-all">
      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs md:text-sm rounded-xl flex items-center gap-2 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioElementRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Recording Controls */}
        {!audioUrl ? (
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={disabled}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all focus:ring-4 focus:ring-rose-200 disabled:opacity-50 cursor-pointer"
              >
                <Mic className="w-5 h-5 animate-pulse" />
                <span>Start Speaking</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-2xl shadow-md transition-all animate-pulse focus:ring-4 focus:ring-slate-300 cursor-pointer"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>Stop ({formatTime(recordingTime)})</span>
              </button>
            )}

            {/* Visual sound bars */}
            {isRecording && (
              <div className="flex items-center gap-1 h-8 px-3 bg-rose-100 dark:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-rose-500 rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(4, (audioLevel * (i + 1) * 3) % 28)}px`,
                    }}
                  />
                ))}
                <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300 ml-2">
                  {formatTime(recordingTime)}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Playback Controls */
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <button
              type="button"
              onClick={togglePlayback}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause Voice' : 'Listen to Voice'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium text-sm transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Record Again</span>
            </button>

            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Audio Captured</span>
            </div>
          </div>
        )}

        {/* Upload Fallback */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*,video/*"
            className="hidden"
          />
          {!audioUrl && !isRecording && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload audio file</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
