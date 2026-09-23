import React from 'react';
import ManagementPortal from '../components/ManagementPortal.jsx';

export default function ManagementApp() {
  return (
    <div className="w-full h-[calc(100dvh-80px)] overflow-hidden m-0 p-0 bg-white">
      <ManagementPortal />
    </div>
  );
}
