import React from '@/lib/react-helpers';
import { Link } from 'react-router-dom';
import { IconDashboard, IconUsers, IconCourse, IconReport, IconSettings, IconLogout, IconBug } from '../../components/icons';
import { ROUTES } from '@/lib/routes';

const Sidebar: React.FC = () => {
  const menuItems = [
    { icon: <IconDashboard />, label: 'Dashboard', path: ROUTES.HR_DASHBOARD },
    { icon: <IconUsers />, label: 'Employees', path: ROUTES.HR_DASHBOARD_EMPLOYEES },
    { icon: <IconCourse />, label: 'Learning', path: ROUTES.HR_DASHBOARD_COURSES },
    { icon: <IconReport />, label: 'Reports', path: ROUTES.HR_DASHBOARD_REPORTS },
    { icon: <IconSettings />, label: 'Settings', path: '/hr-dashboard/settings' },
    { icon: <IconBug />, label: 'Debug Utility', path: ROUTES.HR_DASHBOARD_TEST_UTILITY },
  ];

  return (
    <div className="w-60 bg-white h-screen overflow-y-auto border-r">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">HR Dashboard</h2>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link
                  to={item.path}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-500">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar; 