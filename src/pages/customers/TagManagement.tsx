import { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Space, Message, Tag, Popconfirm, Modal, Form, Input, Select,
  Empty,
} from '@arco-design/web-react';
import { Plus, Edit, Trash2, Tag as TagIcon, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getTags, createTag, updateTag, deleteTag, getTagStats,
} from '@/services/customerService.ts';
import type { CustomerTag } from '../../../shared/types.ts';
import { usePermission } from '@/hooks/usePermission.ts';

const FormItem = Form.Item;
const Option = Select.Option;

const tagColorMap: Record<string, string> = {
  gold: 'gold',
  red: 'red',
  purple: 'purple',
  blue: 'arcoblue',
  orange: 'orange',
  gray: 'gray',
  green: 'green',
  cyan: 'cyan',
  pink: 'pink',
  lime: 'lime',
};

const colorOptions = [
  { value: 'gold', label: '金色' },
  { value: 'red', label: '红色' },
  { value: 'purple', label: '紫色' },
  { value: 'blue', label: '蓝色' },
  { value: 'orange', label: '橙色' },
  { value: 'gray', label: '灰色' },
  { value: 'green', label: '绿色' },
  { value: 'cyan', label: '青色' },
  { value: 'pink', label: '粉色' },
  { value: 'lime', label: '亮绿' },
];

interface TagStat {
  tagId: number;
  tagName: string;
  color: string;
  customerCount: number;
}

export default function TagManagement() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canManage = hasPermission('customer:update');

  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [stats, setStats] = useState<Record<number, number>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<CustomerTag | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tagsRes, statsRes] = await Promise.allSettled([getTags(), getTagStats()]);
      if (tagsRes.status === 'fulfilled' && tagsRes.value.success && tagsRes.value.data) {
        setTags(tagsRes.value.data);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.success && statsRes.value.data) {
        const statMap: Record<number, number> = {};
        statsRes.value.data.forEach((s: TagStat) => {
          statMap[s.tagId] = s.customerCount;
        });
        setStats(statMap);
      }
    } catch {
      Message.error('获取标签数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setEditingTag(null);
    form.resetFields();
    form.setFieldsValue({ color: 'blue' });
    setModalVisible(true);
  };

  const openEditModal = (tag: CustomerTag) => {
    setEditingTag(tag);
    form.setFieldsValue({
      name: tag.name,
      color: tag.color,
      description: tag.description,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: { name: string; color: string; description?: string }) => {
    setSubmitting(true);
    try {
      if (editingTag) {
        const res = await updateTag(editingTag.id, values);
        if (res.success) {
          Message.success('标签更新成功');
          setModalVisible(false);
          fetchData();
        }
      } else {
        const res = await createTag(values);
        if (res.success) {
          Message.success('标签创建成功');
          setModalVisible(false);
          fetchData();
        }
      }
    } catch {
      Message.error(editingTag ? '更新失败' : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteTag(id);
      if (res.success) {
        Message.success('删除成功');
        fetchData();
      }
    } catch {
      Message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '标签',
      dataIndex: 'name',
      width: 180,
      render: (name: string, record: CustomerTag) => (
        <Tag color={tagColorMap[record.color] || 'blue'} style={{ fontSize: 14, padding: '2px 12px' }}>
          {name}
        </Tag>
      ),
    },
    {
      title: '颜色',
      dataIndex: 'color',
      width: 120,
      render: (color: string) => (
        <Space>
          <span
            className="inline-block w-4 h-4 rounded-full border border-gray-200"
            style={{ backgroundColor: color === 'blue' ? '#165dff' : color }}
          />
          <span className="text-gray-600 text-sm">{colorOptions.find((c) => c.value === color)?.label || color}</span>
        </Space>
      ),
    },
    {
      title: '说明',
      dataIndex: 'description',
      render: (description: string) => description || <span className="text-gray-400">-</span>,
    },
    {
      title: '关联客户数',
      dataIndex: 'id',
      width: 120,
      render: (id: number) => (
        <Tag color="arcoblue">{stats[id] || 0} 人</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: CustomerTag) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<Edit className="w-4 h-4" />}
            disabled={!canManage}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            content={`该标签当前关联 ${stats[record.id] || 0} 个客户，删除后将解除所有关联，确定删除吗？`}
            onOk={() => handleDelete(record.id)}
            disabled={!canManage}
          >
            <Button
              type="text"
              size="small"
              status="danger"
              icon={<Trash2 className="w-4 h-4" />}
              disabled={!canManage}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/customers')}
          />
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-pink-500" />
            客户标签管理
          </h2>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          disabled={!canManage}
          onClick={openCreateModal}
        >
          新增标签
        </Button>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
        <span className="font-medium">提示：</span>
        在这里管理所有客户标签（如"VIP""高意向""复购客户"等）。标签创建后可在顾客列表按标签筛选，在顾客详情页为顾客打标签。
        {!canManage && <span className="text-orange-600 ml-1">当前角色无管理权限，仅可查看。</span>}
      </div>

      {tags.length > 0 ? (
        <Table
          loading={loading}
          columns={columns}
          data={tags}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1000 }}
        />
      ) : (
        <div className="py-16">
          <Empty description={loading ? '加载中...' : '暂无标签，点击右上角新增'} />
        </div>
      )}

      <Modal
        title={
          <span className="flex items-center gap-2">
            <TagIcon className="w-4 h-4" />
            {editingTag ? '编辑标签' : '新增标签'}
          </span>
        }
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        style={{ width: 480 }}
      >
        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit}
          className="mt-2"
        >
          <FormItem
            field="name"
            label="标签名称"
            rules={[
              { required: true, message: '请输入标签名称' },
              { maxLength: 20, message: '标签名称不超过20个字符' },
            ]}
          >
            <Input placeholder="如：VIP、高意向、复购客户" size="large" maxLength={20} />
          </FormItem>

          <FormItem
            field="color"
            label="标签颜色"
            rules={[{ required: true, message: '请选择标签颜色' }]}
          >
            <Select placeholder="请选择颜色" size="large">
              {colorOptions.map((c) => (
                <Option key={c.value} value={c.value}>
                  <Space>
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: c.value === 'blue' ? '#165dff' : c.value }}
                    />
                    {c.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </FormItem>

          <FormItem
            field="description"
            label="标签说明"
            rules={[{ maxLength: 100, message: '说明不超过100个字符' }]}
          >
            <Input.TextArea placeholder="选填，描述该标签的用途" rows={3} maxLength={100} showWordLimit />
          </FormItem>

          <FormItem>
            <Space className="w-full justify-end">
              <Button size="large" onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={submitting}
                icon={<Plus className="w-4 h-4" />}
              >
                {editingTag ? '保存修改' : '创建标签'}
              </Button>
            </Space>
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}
