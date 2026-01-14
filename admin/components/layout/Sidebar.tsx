import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_LINKS } from '../../constants';

const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-w-primary text-white flex flex-col flex-shrink-0">
      <div className="h-20 flex items-center px-6">
        <h1 className="text-2xl font-bold">PurWash Admin</h1>
      </div>
      <nav className="flex-1 px-4 py-4">
        <ul>
          {NAV_LINKS.map((link) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {link.icon}
                <span className="ml-3">{link.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-6 border-t border-white/10 text-sm text-gray-400">
        <p>&copy; 2024 PurWash Inc.</p>
      </div>
    </div>
  );
};

export default Sidebar;
