import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-theme">
      <Outlet />
    </div>
  );
};

export default PublicLayout;
