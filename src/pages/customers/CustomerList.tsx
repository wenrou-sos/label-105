import { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Message, Modal, Tag, Popconfirm } from '@arco-design/web-react';
import { Search, Plus, Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, deleteCustomer } from '@/services/customerService.ts';
import type { Customer } from '../../../shared/types.ts';

const { Search: SearchInput } = Input;

export default function CustomerList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCustomers({ page, pageSize, keyword });
      if (res.success && res.data) {
        setData(res.data.list);
        setTotal(res.data.total);
      }
    } catch (error) {
      Message.error('获取顾客列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
    setTimeout(() => fetchData(), 0);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteCustomer(id);
      if (res.success) {
        Message.success('删除成功');
        fetchData();
      }
    } catch (error) {
      Message.error('删除失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 120,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 80,
      render: (gender: string) => (
        <Tag color={gender === 'female' ? 'pink' : 'blue'}>
          {gender === 'female' ? '女' : '男'}
        </Tag>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 140,
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      width: 180,
    },
    {
      title: '咨询记录',
      dataIndex: 'consultation',
      width: 100,
      render: (consultation: unknown) => (
        consultation ? <Tag color="green">已咨询</Tag> : <Tag color="gray">未咨询</Tag>
      ),
    },
    {
      title: '照片数量',
      dataIndex: 'photos',
      width: 100,
      render: (photos: unknown[]) => photos?.length || 0,
    },
    {
      title: '手术次数',
      dataIndex: 'surgeries',
      width: 100,
      render: (surgeries: unknown[]) => surgeries?.length || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: Customer) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => navigate(`/customers/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="text"
            size="small"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => navigate(`/customers/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Button
            type="text"
            size="small"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => navigate(`/customers/${record.id}/consultation`)}
          >
            咨询
          </Button>
          <Button
            type="text"
            size="small"
            icon={<span className="text-lg">📷</span>}
            onClick={() => navigate(`/customers/${record.id}/photos`)}
          >
            照片
          </Button>
          <Popconfirm
            title="确认删除"
            content="确定要删除该顾客吗？此操作不可恢复。"
            onOk={() => handleDelete(record.id)}
          >
            <Button
              type="text"
              size="small"
              status="danger"
              icon={<Trash2 className="w-4 h-4" />}
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
        <h2 className="text-xl font-semibold text-gray-800">顾客列表</h2>
        <Space>
          <SearchInput
            placeholder="搜索姓名/手机号"
            style={{ width: 300 }}
            allowClear
            onSearch={handleSearch}
            prefix={<Search className="w-4 h-4 text-gray-400" />}
          />
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/customers/new')}
          >
            新增顾客
          </Button>
        </Space>
      </div>

      <Table
        loading={loading}
        columns={columns}
        data={data}
        rowKey="id"
        pagination={{
          total,
          current: page,
          pageSize,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          showTotal: true,
          pageSizeChangeResetCurrent: true,
        }}
        scroll={{ x: 1200 }}
      />
    </div>
  );
}
