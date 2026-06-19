import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, Space, Tag, Message, Popconfirm } from '@arco-design/web-react';
import { UserPlus, Edit2, Trash2, Shield, User } from 'lucide-react';
import * as systemService from '@/services/systemService';
import type { User as UserType, UserRole } from '../../../shared/types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [form] = Form.useForm();

  const roleOptions = [
    { label: '系统管理员', value: 'admin' },
    { label: '咨询师', value: 'consultant' },
    { label: '医生', value: 'doctor' },
    { label: '护士', value: 'nurse' },
  ];

  const getRoleTag = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      admin: 'gold',
      consultant: 'pink',
      doctor: 'blue',
      nurse: 'green',
    };
    const labels: Record<UserRole, string> = {
      admin: '管理员',
      consultant: '咨询师',
      doctor: '医生',
      nurse: '护士',
    };
    return <Tag color={colors[role]}>{labels[role]}</Tag>;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await systemService.getUsers({ page: 1, pageSize: 100 });
      if (response.success) {
        setUsers(response.data?.list || []);
      }
    } catch (error) {
      Message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await systemService.deleteUser(id);
      if (response.success) {
        Message.success('删除成功');
        fetchUsers();
      }
    } catch (error) {
      Message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      
      if (editingUser) {
        const response = await systemService.updateUser(editingUser.id, values);
        if (response.success) {
          Message.success('更新成功');
        }
      } else {
        const response = await systemService.createUser(values);
        if (response.success) {
          Message.success('创建成功');
        }
      }
      
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      // Form validation error
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      render: (text: string) => (
        <Space>
          <User size={16} className="text-neutral-400" />
          {text}
        </Space>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
    },
    {
      title: '角色',
      dataIndex: 'role',
      render: (role: UserRole) => getRoleTag(role),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (date: Date) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      dataIndex: 'id',
      width: 180,
      render: (_: unknown, record: UserType) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<Shield size={14} />}
            onClick={() => {}}
          >
            权限
          </Button>
          <Button
            type="text"
            size="small"
            icon={<Edit2 size={14} />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该用户吗？"
            onOk={() => handleDelete(record.id)}
          >
            <Button type="text" size="small" status="danger" icon={<Trash2 size={14} />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-neutral-800">用户管理</h2>
          <p className="text-neutral-500 mt-1">管理系统用户账号和权限</p>
        </div>
        <Button
          type="primary"
          icon={<UserPlus size={18} />}
          onClick={handleAdd}
        >
          新增用户
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <Table
          loading={loading}
          columns={columns}
          data={users}
          pagination={{ pageSize: 10 }}
          rowKey="id"
        />
      </div>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="用户名"
            field="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>
          
          {!editingUser && (
            <Form.Item
              label="初始密码"
              field="password"
              rules={[{ required: true, message: '请输入初始密码' }]}
            >
              <Input.Password placeholder="请输入初始密码" />
            </Form.Item>
          )}
          
          <Form.Item
            label="姓名"
            field="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          
          <Form.Item
            label="角色"
            field="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色" options={roleOptions} />
          </Form.Item>
          
          <Form.Item label="账号状态" field="isActive" initialValue={true}>
            <Switch checkedText="正常" uncheckedText="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
