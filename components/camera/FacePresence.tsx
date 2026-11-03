"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

// Pinned to the installed @mediapipe/tasks-vision version. Only the model and
// runtime are downloaded; camera frames are processed in the browser and
// never leave the device.
const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

// Require a face in several checks in a row, so a single false positive
// can't count as the user being present.
const REQUIRED_HITS = 5;
// A timeout rather than requestAnimationFrame, so checks keep running (at a
// throttled rate) while the tab is in the background.
const CHECK_INTERVAL_MS = 200;

type Status = "loading" | "watching" | "insecure" | "denied" | "error";

type Presence = "unknown" | "present" | "away";

type FacePresenceProps = {
  // Called each time a face is confirmed after not being seen.
  onPresent: () => void;
  // Called once no face has been seen for awayAfterMs.
  onAway: () => void;
  awayAfterMs: number;
  // Shown while the camera is running; describes what the camera is doing.
  watchingMessage: string;
  // Shown with the camera errors, e.g. "Start the timer manually."
  fallbackMessage: string;
  onTurnOff: () => void;
};

export default function FacePresence({
  onPresent,
  onAway,
  awayAfterMs,
  watchingMessage,
  fallbackMessage,
  onTurnOff,
}: FacePresenceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("loading");

  const handlePresent = useEffectEvent(onPresent);
  const handleAway = useEffectEvent(onAway);
  const getAwayAfterMs = useEffectEvent(() => awayAfterMs);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let detector: FaceDetector | null = null;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const stop = () => {
      clearTimeout(timeout);
      stream?.getTracks().forEach((track) => track.stop());
      detector?.close();
      stream = null;
      detector = null;
    };

    const run = async () => {
      // Browsers only expose the camera on HTTPS or localhost.
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("insecure");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 320, height: 240 },
        });
      } catch {
        if (!cancelled) setStatus("denied");
        return;
      }

      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.6,
        });

        const video = videoRef.current;
        if (cancelled || !video) return stop();

        video.srcObject = stream;
        await video.play();
      } catch {
        stop();
        if (!cancelled) setStatus("error");
        return;
      }

      if (cancelled) return stop();
      setStatus("watching");

      let presence: Presence = "unknown";
      let hits = 0;
      let lastSeen = performance.now();
      let lastTimestamp = 0;

      const check = () => {
        const video = videoRef.current;
        if (cancelled || !detector || !video) return;

        if (video.readyState >= 2) {
          // detectForVideo needs strictly increasing timestamps.
          const timestamp = Math.max(performance.now(), lastTimestamp + 1);
          lastTimestamp = timestamp;

          const { detections } = detector.detectForVideo(video, timestamp);

          if (detections.length > 0) {
            hits += 1;
            lastSeen = timestamp;

            if (hits >= REQUIRED_HITS && presence !== "present") {
              presence = "present";
              handlePresent();
            }
          } else {
            hits = 0;

            if (
              timestamp - lastSeen >= getAwayAfterMs() &&
              presence !== "away"
            ) {
              presence = "away";
              handleAway();
            }
          }
        }

        timeout = setTimeout(check, CHECK_INTERVAL_MS);
      };

      check();
    };

    run();

    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  const message = {
    loading: "Starting camera…",
    watching: watchingMessage,
    insecure: `The camera only works over HTTPS or on localhost. ${fallbackMessage}`,
    denied: `Camera access was blocked. ${fallbackMessage}`,
    error: `Face detection couldn't load. ${fallbackMessage}`,
  }[status];

  return (
    <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
      <video
        ref={videoRef}
        muted
        playsInline
        className={`h-12 w-16 shrink-0 rounded-md bg-slate-100 object-cover -scale-x-100 ${
          status === "watching" ? "" : "hidden"
        }`}
      />

      <p className="min-w-0 flex-1 text-sm text-slate-500">
        <span className="font-medium text-slate-700">Camera · </span>
        {message}
      </p>

      <button
        type="button"
        onClick={onTurnOff}
        className="rounded-md px-2.5 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        {status === "loading" || status === "watching" ? "Turn off" : "Dismiss"}
      </button>
    </div>
  );
}
