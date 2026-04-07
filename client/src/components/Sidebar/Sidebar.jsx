import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z', label: 'Home' },
  { to: '/trending', icon: 'M17.53 11.2c-.23-.3-.5-.56-.76-.82-.65-.6-1.4-1.03-2.03-1.66-.93-.9-1.13-2.44-.45-3.55.53.14 1.06.37 1.52.7-.51-.89-1.26-1.64-2.19-2.1-1.06-.54-2.28-.72-3.44-.5-1.17.22-2.24.89-2.97 1.83-.74.94-1.09 2.13-.97 3.3.06.58.23 1.16.53 1.66-.73-.44-1.28-1.14-1.5-1.93-.12-.41-.15-.84-.1-1.26-1.36 1.25-2.12 3.07-2 4.96.04.5.13 1.01.27 1.5.77 2.8 3.12 4.94 5.97 5.34 3.08.44 5.93-.88 7.46-3.53.46-.79.73-1.68.76-2.6.04-1-.21-1.98-.73-2.84-.29-.46-.64-.87-1.07-1.25.31.67.43 1.41.35 2.13-.08.71-.36 1.38-.81 1.92z', label: 'Trending' },
  { to: '/subscriptions', icon: 'M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z', label: 'Subscriptions', auth: true },
  { to: '/history', icon: 'M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z', label: 'History', auth: true },
  { to: '/liked', icon: 'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z', label: 'Liked Videos', auth: true },
];

export default function Sidebar({ collapsed }) {
  const { user } = useAuth();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {NAV_ITEMS.map((item) => {
        if (item.auth && !user) return null;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            end={item.to === '/'}
            title={collapsed ? item.label : ''}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d={item.icon} />
            </svg>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        );
      })}
    </aside>
  );
}
