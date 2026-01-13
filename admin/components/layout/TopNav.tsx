import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from '../../constants';

const TopNav: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('orderId');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchType === 'orderId') {
      navigate(`/orders?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      // For customer name or phone, we assume we're searching partners
      navigate(`/partners?q=${encodeURIComponent(searchQuery.trim())}&type=${searchType}`);
    }
  };

  const placeholderText = {
    orderId: 'Search by Order ID...',
    customerName: 'Search by Customer Name...',
    phone: 'Search by Phone...',
  }[searchType];

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex-shrink-0 flex items-center justify-between px-6">
      <div className="flex items-center">
        <span className="font-semibold text-w-text-main mr-4">System Status:</span>
        <div className="flex items-center">
          <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-green-600 font-medium">All Systems Operational</span>
        </div>
      </div>
      <form onSubmit={handleSearch} className="flex items-center w-full max-w-md">
        <div className="flex items-center w-full border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-w-primary/50 focus-within:border-w-primary transition">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="bg-slate-50 border-r border-slate-300 rounded-l-md px-3 py-2 text-sm text-w-text-body focus:outline-none"
            aria-label="Search type"
          >
            <option value="orderId">Order ID</option>
            <option value="customerName">Customer</option>
            <option value="phone">Phone</option>
          </select>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-w-text-muted" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholderText}
              className="w-full pl-10 pr-4 py-2 border-none rounded-r-lg focus:ring-0 outline-none"
              aria-label="Search input"
            />
          </div>
        </div>
      </form>
    </header>
  );
};

export default TopNav;