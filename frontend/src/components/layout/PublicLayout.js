import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import Footer from './Footer';

const PublicLayout = () => {
  const location = useLocation();
  const isDemoTest = location.pathname === '/demo-test';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-grow">
        <Outlet />
      </main>
      {!isDemoTest && !isAuthPage && <Footer />}
    </div>
  );
};

export default PublicLayout;