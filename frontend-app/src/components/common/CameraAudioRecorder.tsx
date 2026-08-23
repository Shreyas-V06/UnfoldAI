import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Mic,
  Video,
  Square,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { clsx } from 'clsx';

interface CameraAudioRecorderProps {
  onMediaReady: (blob: Blob) => void;
  onClear: () => void;
  disabled?: boolean;
}

export const CameraAudioRecorder: React.FC<CameraAudioRecorderProps> = ({
  onMediaReady,
  onClear,
  disabled = false,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAudioOnly, setIsAudioOnly] = useState(false);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Request camera + microphone permission
  const requestMediaAccess = useCallback(async (audioOnly = false) => {
    setPermissionError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: true,
        video: audioOnly ? false : { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setHasPermission(true);
      setIsAudioOnly(audioOnly);

      if (videoPreviewRef.current && !audioOnly) {
        videoPreviewRef.current.srcObject = mediaStream;
      }

      // Setup audio analyzer for volume visualization
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(mediaStream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const updateMeter = () => {
          if (!analyserRef.current) return;
          const data = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setAudioLevel(Math.min(100, Math.round((avg / 255) * 150)));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch (e) {
        console.warn('AudioContext visualization error:', e);
      }
    } catch (err: any) {
      console.warn('Media access error:', err);
      if (!audioOnly) {
        // Fallback: try audio-only if camera failed
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setStream(audioStream);
          setHasPermission(true);
          setIsAudioOnly(true);
          return;
        } catch (audioErr) {
          setHasPermission(false);
          setPermissionError('Camera and Microphone access was denied or is not supported.');
        }
      } else {
        setHasPermission(false);
        setPermissionError('Microphone access was denied or is not supported.');
      }
    }
  }, [stream]);

  // Initial media request on mount
  useEffect(() => {
    requestMediaAccess(false);
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Sync video preview ref when stream changes
  useEffect(() => {
    if (videoPreviewRef.current && stream && !isAudioOnly) {
      videoPreviewRef.current.srcObject = stream;
    }
  }, [stream, isAudioOnly]);

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    setMediaBlobUrl(null);
    onClear();

    let mimeType = 'video/webm;codecs=vp8,opus';
    if (isAudioOnly || !MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else {
        mimeType = 'audio/webm';
      }
    }

    try {
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(finalBlob);
        setMediaBlobUrl(url);
        onMediaReady(finalBlob);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('MediaRecorder start error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleReset = () => {
    if (isRecording) stopRecording();
    setMediaBlobUrl(null);
    setRecordingTime(0);
    onClear();
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 md:p-6 space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            {isAudioOnly ? <Mic className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              {isAudioOnly ? 'Audio Microphone Recorder' : 'Live Camera & Voice Recorder'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAudioOnly
                ? 'Speaking clearly into your microphone'
                : 'Live video tracking analyzes facial engagement, gaze, and oral fluency'}
            </p>
          </div>
        </div>

        {/* Switch camera / audio mode button */}
        <button
          type="button"
          onClick={() => requestMediaAccess(!isAudioOnly)}
          disabled={isRecording || disabled}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isAudioOnly ? (
            <>
              <Camera className="w-3.5 h-3.5 text-rose-500" />
              <span>Enable Camera</span>
            </>
          ) : (
            <>
              <CameraOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Audio Only</span>
            </>
          )}
        </button>
      </div>

      {/* Permission Denied Notice */}
      {hasPermission === false && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-200 text-xs md:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-bold">{permissionError || 'Camera/Microphone Permission Required'}</p>
            <p className="opacity-90">
              Please enable camera/microphone permissions in your browser bar to practice reading aloud.
            </p>
          </div>
          <button
            type="button"
            onClick={() => requestMediaAccess(false)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer"
          >
            Grant Access
          </button>
        </div>
      )}

      {/* Live Video / Audio Display Frame */}
      <div className="relative w-full aspect-video md:aspect-[16/9] max-h-[320px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center">
        {/* Live Camera View */}
        {!isAudioOnly && !mediaBlobUrl && (
          <video
            ref={videoPreviewRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        )}

        {/* Audio Only Mode Visualizer */}
        {isAudioOnly && !mediaBlobUrl && (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-300">
            <div
              className={clsx(
                'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-150',
                isRecording
                  ? 'bg-rose-600/30 ring-4 ring-rose-500 scale-105'
                  : 'bg-slate-800'
              )}
            >
              <Mic
                className={clsx(
                  'w-10 h-10',
                  isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-400'
                )}
              />
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {isRecording ? 'Listening to your voice...' : 'Ready to record audio'}
            </span>
          </div>
        )}

        {/* Recorded Preview Playback */}
        {mediaBlobUrl && (
          <video
            ref={recordedVideoRef}
            src={mediaBlobUrl}
            controls
            className="w-full h-full object-cover"
          />
        )}

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {isRecording ? (
            <div className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>REC {formatSeconds(recordingTime)}</span>
            </div>
          ) : mediaBlobUrl ? (
            <div className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Recorded ({formatSeconds(recordingTime)})</span>
            </div>
          ) : (
            <div className="px-3 py-1 bg-slate-900/80 backdrop-blur text-slate-200 text-xs font-medium rounded-full flex items-center gap-1.5 border border-white/10">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Visual Feed</span>
            </div>
          )}
        </div>

        {/* Sound Bar Level Indicator */}
        {!mediaBlobUrl && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
            <Mic className="w-3.5 h-3.5 text-slate-300" />
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-75"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {!isRecording && !mediaBlobUrl && (
            <button
              type="button"
              onClick={startRecording}
              disabled={!hasPermission || disabled}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Start Recording</span>
            </button>
          )}

          {isRecording && (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer animate-pulse"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop & Save Recording</span>
            </button>
          )}

          {mediaBlobUrl && (
            <button
              type="button"
              onClick={handleReset}
              disabled={disabled}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Record Again</span>
            </button>
          )}
        </div>

        {mediaBlobUrl && (
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Ready for multimodal speech & visual behavioral evaluation</span>
          </div>
        )}
      </div>
    </div>
  );
};
