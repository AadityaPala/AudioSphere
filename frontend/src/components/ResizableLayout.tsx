import React, { useState, useRef } from 'react';

interface ResizableLayoutProps {
  children: React.ReactNode[];
}

export function ResizableLayout({ children }: ResizableLayoutProps) {
  const [leftWidth, setLeftWidth] = useState<number>(360); // Sidebar width
  const [rightWidth, setRightWidth] = useState<number>(320); // Recommendation panel width
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizeLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(260, Math.min(500, startWidth + (moveEvent.clientX - startX)));
      setLeftWidth(newWidth);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(260, Math.min(500, startWidth - (moveEvent.clientX - startX)));
      setRightWidth(newWidth);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div ref={containerRef} className="relative z-10 hidden lg:flex w-full h-full p-6 gap-3 overflow-hidden select-none">
      {/* Left Resizable Panel (Sidebar) */}
      <div style={{ width: `${leftWidth}px` }} className="h-full flex flex-col shrink-0 relative transition-all">
        {children[0]}
        {/* Resizer Handle */}
        <div onMouseDown={startResizeLeft} className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-col-resize z-30 group flex items-center justify-center">
          <div className="w-1 h-8 rounded-full bg-white/10 group-hover:bg-indigo-500 transition-colors" />
        </div>
      </div>

      {/* Center Main Player View (Auto-expanding) */}
      <div className="flex-1 h-full flex flex-col min-w-[320px] transition-all">
        {children[1]}
      </div>

      {/* Right Resizable Panel (Recommendations) */}
      <div style={{ width: `${rightWidth}px` }} className="h-full flex flex-col shrink-0 relative transition-all">
        {/* Resizer Handle */}
        <div onMouseDown={startResizeRight} className="absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize z-30 group flex items-center justify-center">
          <div className="w-1 h-8 rounded-full bg-white/10 group-hover:bg-indigo-500 transition-colors" />
        </div>
        {children[2]}
      </div>
    </div>
  );
}