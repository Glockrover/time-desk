"use client";

import { useRef, useState } from "react";
import {
  AUTO_BREAK_KEY,
  FACE_AUTO_START_KEY,
  FACE_PRESENCE_OFF_KEY,
  readSessionFlag,
  writeSessionFlag,
} from "@/lib/face-camera-flags";

// What the camera is allowed to do this login. Every change is mirrored to
// sessionStorage so it survives reloads.
export function useFaceCamera() {
  const isInitialized = useRef(false);

  // Whether the camera should be watching for a face to start the timer.
  const [autoStart, setAutoStart] = useState(false);

  // Whether the camera keeps watching while the timer runs, to put the timer
  // on break when the user walks away.
  const [presence, setPresence] = useState(false);

  // True while the running break was started by the camera.
  const [isAutoBreak, setIsAutoBreak] = useState(false);

  // Reads the saved flags. Only the first call counts, so it can be called on
  // every load. Auto-start only arms if no timer was running at login.
  const initialize = (hasRunningEntry: boolean) => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    setPresence(!readSessionFlag(FACE_PRESENCE_OFF_KEY));
    setIsAutoBreak(readSessionFlag(AUTO_BREAK_KEY));

    if (!hasRunningEntry) {
      setAutoStart(!readSessionFlag(FACE_AUTO_START_KEY));
    }
  };

  const dismissAutoStart = () => {
    writeSessionFlag(FACE_AUTO_START_KEY, true);
    setAutoStart(false);
  };

  // Auto-start is used up as soon as it fires, but the state is only cleared
  // once the timer is running, so the camera stays mounted through the switch
  // and isn't restarted.
  const markAutoStartUsed = () => {
    writeSessionFlag(FACE_AUTO_START_KEY, true);
  };

  const finishAutoStart = () => {
    setAutoStart(false);
  };

  const turnOffPresence = () => {
    writeSessionFlag(FACE_PRESENCE_OFF_KEY, true);
    setPresence(false);
  };

  const setAutoBreak = (on: boolean) => {
    writeSessionFlag(AUTO_BREAK_KEY, on);
    setIsAutoBreak(on);
  };

  return {
    autoStart,
    presence,
    isAutoBreak,
    initialize,
    dismissAutoStart,
    markAutoStartUsed,
    finishAutoStart,
    turnOffPresence,
    setAutoBreak,
  };
}

export type FaceCamera = ReturnType<typeof useFaceCamera>;
