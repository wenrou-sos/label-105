import { useState, useMemo } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Breadcrumb } from '@arco-design/web-react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  Scissors,
  HeartPulse,
  Pill,
  Settings,
  User,
  LogOut,
  Shield,
  UserCog,
} from 'lucide-react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { usePermission } from '@/hooks/usePermission';
import type { UserRole } from '../../../shared/types';

const Sider = Layout.Sider;
const Header = Layout.Header;
const Content = Layout.Content;
const Footer = Layout.Footer;
const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;

interface MenuItemConfig {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  permission?: string | string[];
  role?: UserRole | UserRole[];
  minimumRole?: UserRole;
  children?: MenuItemConfig[];
}

const menuItems: MenuItemConfig[] = [
  {
    key: 'dashboard',
    label: '数据仪表盘',
    icon: <LayoutDashboard size={18} />,
    path: '/dashboard',
  },
  {
    key: 'customers',
    label: '顾客咨询管理',
    icon: <Users size={18} />,
    children: [
      {
        key: 'customer-list',
        label: '顾客列表',
        path: '/customers',
        permission: 'customer:read',
      },
      {
        key: 'customer-add',
        label: '新增顾客',
        path: '/customers/new',
        permission: 'customer:create',
      },
    ],
  },
  {
    key: 'surgeries',
    label: '手术项目管理',
    icon: <Scissors size={18} />,
    children: [
      {
        key: 'surgery-list',
        label: '手术排期',
        path: '/surgeries',
        permission: 'surgery:read',
      },
      {
        key: 'surgery-add',
        label: '新建手术',
        path: '/surgeries/new',
        permission: 'surgery:create',
      },
    ],
  },
  {
    key: 'postoperative',
    label: '术后恢复管理',
    icon: <HeartPulse size={18} />,
    children: [
      {
        key: 'postop-list',
        label: '回访记录',
        path: '/postoperative',
        permission: 'postop:read',
      },
    ],
  },
  {
    key: 'medicines',
    label: '药品针剂管理',
    icon: <Pill size={18} />,
    children: [
      {
        key: 'medicine-list',
        label: '药品列表',
        path: '/medicines',
        permission: 'medicine:read',
      },
      {
        key: 'medicine-inbound',
        label: '扫码入库',
        path: '/medicines/scan/inbound',
        permission: 'medicine:inbound',
      },
      {
        key: 'medicine-outbound',
        label: '扫码出库',
        path: '/medicines/scan/outbound',
        permission: 'medicine:outbound',
      },
      {
        key: 'medicine-trace',
        label: '溯源查询',
        path: '/medicines/trace',
        permission: 'medicine:trace',
      },
    ],
  },
  {
    key: 'system',
    label: '系统管理',
    icon: <Settings size={18} />,
    minimumRole: 'admin',
    children: [
      {
        key: 'system-users',
        label: '用户管理',
        path: '/system/users',
        permission: 'system:user',
      },
      {
        key: 'system-roles',
        label: '角色权限',
        path: '/system/roles',
        permission: 'system:role',
      },
    ],
  },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { canAccess } = usePermission();

  const filteredMenuItems = useMemo(() => {
    const filterItems = (items: MenuItemConfig[]): MenuItemConfig[] => {
      return items
        .filter((item) =>
          canAccess({
            permission: item.permission,
            role: item.role,
            minimumRole: item.minimumRole,
          })
        )
        .map((item) => ({
          ...item,
          children: item.children ? filterItems(item.children) : undefined,
        }))
        .filter((item) => !item.children || item.children.length > 0);
    };
    return filterItems(menuItems);
  }, [canAccess]);

  const selectedKeys = useMemo(() => {
    const pathname = location.pathname;
    const findKeys = (items: MenuItemConfig[], parentKey?: string): string[] => {
      for (const item of items) {
        if (item.path === pathname) {
          return parentKey ? [parentKey, item.key] : [item.key];
        }
        if (item.children) {
          const found = findKeys(item.children, item.key);
          if (found.length > 0) return found;
        }
      }
      return [];
    };
    return findKeys(filteredMenuItems);
  }, [location.pathname, filteredMenuItems]);

  const handleMenuClick = (key: string) => {
    const findPath = (items: MenuItemConfig[]): string | undefined => {
      for (const item of items) {
        if (item.key === key && item.path) return item.path;
        if (item.children) {
          const found = findPath(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    const path = findPath(filteredMenuItems);
    if (path) {
      navigate(path);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderMenuItems = (items: MenuItemConfig[]) => {
    return items.map((item) => {
      if (item.children && item.children.length > 0) {
        return (
          <SubMenu
            key={item.key}
            title={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                {item.icon}
                <span>{item.label}</span>
              </span>
            }
          >
            {renderMenuItems(item.children)}
          </SubMenu>
        );
      }
      return (
        <MenuItem key={item.key}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {item.icon}
            <span>{item.label}</span>
          </span>
        </MenuItem>
      );
    });
  };

  const userDropdownList = (
    <Menu>
      <Menu.Item key="profile" onClick={() => navigate('/profile')}>
        <User size={16} className="inline mr-2" />
        个人中心
      </Menu.Item>
      <Menu.Item key="settings" onClick={() => navigate('/system/users')}>
        <UserCog size={16} className="inline mr-2" />
        用户管理
      </Menu.Item>
      {user?.role === 'admin' && (
        <Menu.Item key="roles" onClick={() => navigate('/system/roles')}>
          <Shield size={16} className="inline mr-2" />
          角色权限
        </Menu.Item>
      )}
      <Menu.Item key="divider" disabled style={{ height: 1, padding: 0, margin: '8px 0', background: '#e5e7eb' }} />
      <Menu.Item key="logout" onClick={handleLogout}>
        <LogOut size={16} className="inline mr-2" />
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout className="h-screen">
      <Header className="bg-white border-b border-gray-200 flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link to="/">首页</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>当前页面</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-4">
          <Dropdown droplist={userDropdownList} position="br">
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-md">
              <Avatar size={32} style={{ backgroundColor: '#3370ff' }}>
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
              <span className="text-sm font-medium">{user?.name || '用户'}</span>
            </div>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider
          collapsed={collapsed}
          collapsible
          trigger={null}
          breakpoint="lg"
          width={240}
          collapsedWidth={64}
        >
          <div className="h-16 flex items-center justify-center border-b border-pink-200">
            {collapsed ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-md">
                <span className="text-lg font-bold text-white">医</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-md">
                  <span className="text-lg font-bold text-white">医</span>
                </div>
                <span className="text-lg font-serif font-bold text-pink-800">医美管理系统</span>
              </div>
            )}
          </div>
          <Menu
            style={{ width: '100%' }}
            selectedKeys={selectedKeys}
            onClickMenuItem={handleMenuClick}
            collapse={collapsed}
          >
            {renderMenuItems(filteredMenuItems)}
          </Menu>
        </Sider>
        <Layout className="bg-gray-50">
          <Content className="p-6 overflow-auto">
            <Outlet />
          </Content>
          <Footer className="text-center text-neutral-400 text-sm py-4 border-t border-neutral-200 bg-white">
            医美诊所管理平台 © 2024 | 医疗数据安全保护中
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
}
