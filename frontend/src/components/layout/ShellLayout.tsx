import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface ShellLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  showTopbar?: boolean;
}

export default function ShellLayout({ title, subtitle, children, rightPanel, showTopbar = true }: ShellLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        {showTopbar && (
          <Topbar
            title={title}
            subtitle={subtitle}
            onLogoClick={() => setSidebarOpen((prev) => !prev)}
          />
        )}
        <main className="mx-auto w-full max-w-[1200px] px-6 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_350px]">
            <div>{children}</div>
            {rightPanel && <div className="hidden lg:block">{rightPanel}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
