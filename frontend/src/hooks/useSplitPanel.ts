import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSplitPanelOptions {
  defaultPercent?: number;
  minPercent?: number;
  maxPercent?: number;
}

export function useSplitPanel({
  defaultPercent = 60,
  minPercent = 30,
  maxPercent = 75,
}: UseSplitPanelOptions = {}) {
  const [leftPercent, setLeftPercent] = useState(defaultPercent);
  const [isResizing, setIsResizing] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const updatePercent = useCallback(
    (clientX: number) => {
      const workspace = workspaceRef.current;
      if (!workspace) {
        return;
      }

      const rect = workspace.getBoundingClientRect();
      const nextPercent = ((clientX - rect.left) / rect.width) * 100;
      setLeftPercent(Math.min(maxPercent, Math.max(minPercent, nextPercent)));
    },
    [maxPercent, minPercent]
  );

  const onResizerMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      isDraggingRef.current = true;
      setIsResizing(true);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    []
  );

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current) {
        return;
      }

      updatePercent(event.clientX);
    };

    const onMouseUp = () => {
      if (!isDraggingRef.current) {
        return;
      }

      isDraggingRef.current = false;
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [updatePercent]);

  return {
    leftPercent,
    rightPercent: 100 - leftPercent,
    workspaceRef,
    isResizing,
    onResizerMouseDown,
  };
}
