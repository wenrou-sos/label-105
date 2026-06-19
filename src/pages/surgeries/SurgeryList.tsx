import { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Input, Select, DatePicker, Modal, Message, Popconfirm } from '@arco-design/web-react';
import { Scissors, Plus, Search, Edit2, Trash2, Eye, Calendar, User } from 'lucide-react';
import { getSurgeries, deleteSurgery, updateSurgeryStatus } from '@/services/surgeryService';
import type { Surgery, SurgeryStatus, PaginatedResponse } from '../../../shared/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const SURGERY_NAMES = [
  '双眼皮手术',
  '隆鼻手术',
  '抽脂手术',
  '隆胸手术',
  '面部填充',
  '注射除皱',
  '其他',
];

const statusMap: Record<SurgeryStatus, { text: string; color: string }> = {
  scheduled: { text: '已预约', color: 'blue' },
  in_progress: { text: '进行中', color: 'gold' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' },
};

export default function SurgeryList() {
  const [data, setData] = useState<Surgery[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState<Surgery | null>(null);
  const [newStatus, setNewStatus] = useState<SurgeryStatus>('scheduled');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0];
        params.endDate = dateRange[1];
      }
      const response = await getSurgeries(params);
      if (response.success) {
        const result = response.data as PaginatedResponse<Surgery>;
        setData(result.list);
        setPagination((prev) => ({ ...prev, total: result.total }));
      }
    } catch (error) {
      Message.error('获取手术列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
    setDateRange([]);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await deleteSurgery(id);
      if (response.success) {
        Message.success('删除成功');
        fetchData();
      }
    } catch (error) {
      Message.error('删除失败');
    }
  };

  const handleStatusChange = (record: Surgery) => {
    setSelectedSurgery(record);
    setNewStatus(record.status);
    setStatusModalVisible(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedSurgery) return;
    try {
      const response = await updateSurgeryStatus(selectedSurgery.id, newStatus);
      if (response.success) {
        Message.success('状态更新成功');
        setStatusModalVisible(false);
        fetchData();
      }
    } catch (error) {
      Message.error('状态更新失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '手术名称',
      dataIndex: 'surgeryName',
      render: (text: string) => (
        <Space>
          <Scissors className="w-4 h-4 text-pink-500" />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '客户ID',
      dataIndex: 'customerId',
      width: 100,
    },
    {
      title: '手术日期',
      dataIndex: 'surgeryDate',
      render: (date: Date) => (
        <Space>
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{new Date(date).toLocaleDateString('zh-CN')}</span>
        </Space>
      ),
    },
    {
      title: '术者ID',
      dataIndex: 'surgeonId',
      width: 100,
      render: (id: number) => (
        <Space>
          <User className="w-4 h-4 text-gray-400" />
          <span>{id}</span>
        </Space>
      ),
    },
    {
      title: '麻醉方式',
      dataIndex: 'anesthesiaType',
      render: (type: string) => (
        <Tag color={type === 'local' ? 'cyan' : 'purple'}>
          {type === 'local' ? '局麻' : '全麻'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: SurgeryStatus) => {
        const s = statusMap[status] || { text: status, color: 'gray' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (date: Date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      dataIndex: 'actions',
      width: 240,
      render: (_: unknown, record: Surgery) => (
        <Space>
          <Button size="small" type="primary" status="success" icon={<Eye className="w-4 h-4" />}>
            查看
          </Button>
          <Button size="small" type="primary" icon={<Edit2 className="w-4 h-4" />}>
            编辑
          </Button>
          <Button
            size="small"
            type="primary"
            status="warning"
            onClick={() => handleStatusChange(record)}
          >
            状态
          </Button>
          <Popconfirm
            title="确认删除"
            content="确定要删除这条手术记录吗？"
            onOk={() => handleDelete(record.id)}
          >
            <Button size="small" type="primary" status="danger" icon={<Trash2 className="w-4 h-4" />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">手术管理</h1>
              <p className="text-gray-500 text-sm">管理所有手术项目记录</p>
            </div>
          </div>
          <Button type="primary" icon={<Plus className="w-4 h-4" />}>
            新增手术
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <Space wrap>
          <Input
            placeholder="搜索手术名称或客户ID"
            value={keyword}
            onChange={setKeyword}
            style={{ width: 240 }}
            prefix={<Search className="w-4 h-4 text-gray-400" />}
          />
          <Select
            placeholder="选择状态"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            allowClear
          >
            <Option value="scheduled">已预约</Option>
            <Option value="in_progress">进行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 280 }}
            placeholder={['开始日期', '结束日期']}
          />
          <Button type="primary" onClick={handleSearch} icon={<Search className="w-4 h-4" />}>
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <Table
          columns={columns}
          data={data}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showTotal: true,
            sizeCanChange: true,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
          }}
        />
      </div>

      <Modal
        title="更新手术状态"
        visible={statusModalVisible}
        onOk={confirmStatusChange}
        onCancel={() => setStatusModalVisible(false)}
      >
        <div className="py-4">
          <p className="mb-4 text-gray-600">
            当前手术: <span className="font-medium">{selectedSurgery?.surgeryName}</span>
          </p>
          <Select
            value={newStatus}
            onChange={(val) => setNewStatus(val as SurgeryStatus)}
            style={{ width: '100%' }}
          >
            <Option value="scheduled">已预约</Option>
            <Option value="in_progress">进行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}
