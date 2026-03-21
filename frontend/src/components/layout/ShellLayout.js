import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function ShellLayout({ title, subtitle, children, rightPanel, showTopbar = true }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg">
      {/* Overlay behind sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        {showTopbar ? (
          <Topbar
            title={title}
            subtitle={subtitle}
            right={null}
            onLogoClick={() => setSidebarOpen(prev => !prev)}
          />
        ) : null}
        <main className="mx-auto w-full max-w-[1200px] px-6 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_350px]">
            <div>{children}</div>
            {rightPanel ? <div className="hidden lg:block">{rightPanel}</div> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
