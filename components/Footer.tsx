
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900">
      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Career Launchpad AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
