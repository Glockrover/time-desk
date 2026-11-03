"use client";

import FacePresence from "@/components/camera/FacePresence";
import type { FaceCamera } from "@/hooks/useFaceCamera";
import type { TimeTracker } from "@/hooks/useTimeTracker";

// How long the camera must see no one before the timer goes on break. Kept
// just above a couple of detection checks, so leaving the frame starts a break
// right away but a single missed frame doesn't.
const AWAY_AFTER_MS = 500;

type FaceCameraPanelProps = {
  camera: FaceCamera;
  tracker: TimeTracker;
  selectedProjectId: number | null;
  // Starts the timer with the chosen project; resolves to true on success.
  onStartTimer: () => Promise<boolean>;
};

// Starts the timer when the user is seen, and takes and ends breaks as they
// leave and come back.
export default function FaceCameraPanel({
  camera,
  tracker,
  selectedProjectId,
  onStartTimer,
}: FaceCameraPanelProps) {
  const { isWorking, isOnBreak } = tracker;

  const handlePresent = async () => {
    if (!isWorking) {
      if (camera.autoStart && selectedProjectId !== null) {
        camera.markAutoStartUsed();

        if (await onStartTimer()) {
          camera.finishAutoStart();
        }
      }
    } else if (isOnBreak && camera.isAutoBreak) {
      camera.setAutoBreak(false);
      tracker.endBreak();
    }
  };

  const handleAway = () => {
    if (isWorking && !isOnBreak) {
      camera.setAutoBreak(true);
      tracker.startBreak();
    }
  };

  // One camera for both auto-start and away detection, so it stays on when
  // the timer starts instead of restarting.
  const showCamera = isWorking
    ? camera.presence
    : camera.autoStart && selectedProjectId !== null;

  if (showCamera) {
    return (
      <FacePresence
        onPresent={handlePresent}
        onAway={handleAway}
        awayAfterMs={AWAY_AFTER_MS}
        watchingMessage={
          !isWorking
            ? "Look at the camera to start your timer."
            : !isOnBreak
              ? "Your timer goes on break as soon as you leave the camera frame."
              : camera.isAutoBreak
                ? "You stepped away, so you're on break. Look at the camera to resume."
                : "You're on a break. Press Resume when you're back."
        }
        fallbackMessage={
          isWorking
            ? "Use Break and Resume manually."
            : "Start the timer manually."
        }
        onTurnOff={isWorking ? camera.turnOffPresence : camera.dismissAutoStart}
      />
    );
  }

  if (!isWorking && camera.autoStart) {
    return (
      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
        <p className="min-w-0 flex-1 text-sm text-slate-500">
          <span className="font-medium text-slate-700">Face auto-start · </span>
          {tracker.projects.length === 0
            ? "Add the project you're working on, then look at the camera to start your timer."
            : "Choose or add the project you're working on, then look at the camera to start your timer."}
        </p>

        <button
          type="button"
          onClick={camera.dismissAutoStart}
          className="rounded-md px-2.5 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          Turn off
        </button>
      </div>
    );
  }

  return null;
}
