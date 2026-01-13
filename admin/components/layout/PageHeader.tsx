import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children }) => {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold text-w-text-main">{title}</h2>
        <p className="text-w-text-muted mt-1">{subtitle}</p>
      </div>
      {children && <div className="flex items-center space-x-2">{children}</div>}
    </div>
  );
};

export default PageHeader;
