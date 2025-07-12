import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface text-theme">
      <Outlet />
    </div>
  );
};

export default PublicLayout;
