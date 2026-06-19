import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Tag, Message, Checkbox } from '@arco-design/web-react';
import { Shield, Edit2, Save } from 'lucide-react';
import * as systemService from '@/services/systemService';
import type { Role } from '../../../shared/types';

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [form] = Form.useForm();

  const permissionGroups = [
    {
      title: '顾客管理',
      permissions: [
        { label: '查看顾客', value: 'customer:read' },
        { label: '创建顾客', value: 'customer:create' },
        { label: '编辑顾客', value: 'customer:update' },
        { label: '删除顾客', value: 'customer:delete' },
      ],
    },
    {
      title: '咨询管理',
      permissions: [
        { label: '查看咨询', value: 'consultation:read' },
        { label: '创建咨询', value: 'consultation:create' },
        { label: '编辑咨询', value: 'consultation:update' },
      ],
    },
    {
      title: '照片管理',
      permissions: [
        { label: '查看照片', value: 'photo:view' },
        { label: '上传照片', value: 'photo:upload' },
        { label: '删除照片', value: 'photo:delete' },
      ],
    },
    {
      title: '手术管理',
      permissions: [
        { label: '查看手术', value: 'surgery:read' },
        { label: '创建手术', value: 'surgery:create' },
        { label: '编辑手术', value: 'surgery:update' },
        { label: '删除手术', value: 'surgery:delete' },
      ],
    },
    {
      title: '知情同意书',
      permissions: [
        { label: '查看同意书', value: 'consent:read' },
        { label: '签署同意书', value: 'consent:sign' },
      ],
    },
    {
      title: '耗材管理',
      permissions: [
        { label: '查看耗材', value: 'supply:read' },
        { label: '录入耗材', value: 'supply:create' },
        { label: '编辑耗材', value: 'supply:update' },
      ],
    },
    {
      title: '术后管理',
      permissions: [
        { label: '查看回访', value: 'postop:read' },
        { label: '创建回访', value: 'postop:create' },
        { label: '编辑回访', value: 'postop:update' },
      ],
    },
    {
      title: '药品管理',
      permissions: [
        { label: '查看药品', value: 'medicine:read' },
        { label: '药品入库', value: 'medicine:inbound' },
        { label: '药品出库', value: 'medicine:outbound' },
        { label: '溯源查询', value: 'medicine:trace' },
      ],
    },
    {
      title: '系统管理',
      permissions: [
        { label: '用户管理', value: 'system:user' },
        { label: '角色管理', value: 'system:role' },
        { label: '系统设置', value: 'system:setting' },
      ],
    },
  ];

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await systemService.getRoles();
      if (response.success) {
        setRoles(response.data || []);
      }
    } catch (error) {
      Message.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setSelectedPermissions(role.permissions);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      
      if (editingRole) {
        const response = await systemService.updateRole(editingRole.id, {
          permissions: selectedPermissions,
          ...values,
        });
        if (response.success) {
          Message.success('角色权限更新成功');
        }
      }
      
      setModalVisible(false);
      fetchRoles();
    } catch (error) {
      // Form validation error
    }
  };

  const handleCheckAll = (groupPermissions: string[], checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...new Set([...selectedPermissions, ...groupPermissions])]);
    } else {
      setSelectedPermissions(selectedPermissions.filter(p => !groupPermissions.includes(p)));
    }
  };

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      render: (text: string, record: Role) => (
        <Space>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-neutral-500">{record.code}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '权限数量',
      dataIndex: 'permissions',
      render: (perms: string[]) => (
        <Tag color="blue">{perms.includes('*') ? '全部权限' : `${perms.length} 项权限`}</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
    },
    {
      title: '操作',
      dataIndex: 'id',
      width: 120,
      render: (_: unknown, record: Role) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<Edit2 size={14} />}
            onClick={() => handleEdit(record)}
            disabled={record.code === 'admin'}
          >
            编辑权限
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-neutral-800">角色权限</h2>
          <p className="text-neutral-500 mt-1">管理系统角色和权限配置</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <Table
          loading={loading}
          columns={columns}
          data={roles}
          pagination={false}
          rowKey="id"
        />
      </div>

      <Modal
        title={`编辑角色权限 - ${editingRole?.name}`}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="保存权限"
        cancelText="取消"
        style={{ width: 700 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="角色名称"
            field="name"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          
          <Form.Item label="描述" field="description">
            <Input.TextArea placeholder="请输入角色描述" rows={2} />
          </Form.Item>

          <div className="mt-4">
            <h4 className="text-lg font-medium mb-4">权限配置</h4>
            <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
              {permissionGroups.map((group, groupIndex) => {
                const allChecked = group.permissions.every(p => selectedPermissions.includes(p.value));
                const someChecked = group.permissions.some(p => selectedPermissions.includes(p.value));
                
                return (
                  <div key={groupIndex} className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Checkbox
                        checked={allChecked}
                        indeterminate={someChecked && !allChecked}
                        onChange={(checked) => handleCheckAll(group.permissions.map(p => p.value), checked)}
                      >
                        <span className="font-medium">{group.title}</span>
                      </Checkbox>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {group.permissions.map((perm, permIndex) => (
                        <Checkbox
                          key={permIndex}
                          checked={selectedPermissions.includes(perm.value)}
                          onChange={(checked) => {
                            if (checked) {
                              setSelectedPermissions([...selectedPermissions, perm.value]);
                            } else {
                              setSelectedPermissions(selectedPermissions.filter(p => p !== perm.value));
                            }
                          }}
                        >
                          {perm.label}
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManagement;
