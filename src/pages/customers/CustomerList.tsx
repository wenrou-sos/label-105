import { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Message, Tag, Popconfirm, Select, Checkbox } from '@arco-design/web-react';
import { Search, Plus, Eye, Edit, Trash2, UserPlus, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, deleteCustomer, getTags } from '@/services/customerService.ts';
import type { Customer, CustomerTag } from '../../../shared/types.ts';

const { Search: SearchInput } = Input;
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

export default function CustomerList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const fetchTags = async () => {
    try {
      const res = await getTags();
      if (res.success && res.data) {
        setTags(res.data);
      }
    } catch (_error) {
      Message.error('获取标签列表失败');
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: { page: number; pageSize: number; keyword?: string; tagIds?: string } = {
        page,
        pageSize,
      };
      if (keyword) params.keyword = keyword;
      if (selectedTagIds.length > 0) params.tagIds = selectedTagIds.join(',');
      const res = await getCustomers(params);
      if (res.success && res.data) {
        setData(res.data.list);
        setTotal(res.data.total);
      }
    } catch (_error) {
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

  const handleTagFilterChange = (checkedValues: string[]) => {
    setSelectedTagIds(checkedValues.map((v) => Number(v)));
    setPage(1);
    setTimeout(() => fetchData(), 0);
  };

  const handleClearTagFilter = () => {
    setSelectedTagIds([]);
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
    } catch (_error) {
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
      title: '标签',
      dataIndex: 'tags',
      width: 240,
      render: (tags: CustomerTag[]) => (
        <Space wrap size={4}>
          {tags && tags.length > 0 ? (
            tags.map((tag) => (
              <Tag key={tag.id} color={tagColorMap[tag.color] || 'blue'}>
                {tag.name}
              </Tag>
            ))
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </Space>
      ),
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
          <Select
            mode="multiple"
            placeholder="按标签筛选"
            style={{ width: 260 }}
            allowClear
            value={selectedTagIds.map(String)}
            onChange={handleTagFilterChange}
            onClear={handleClearTagFilter}
            prefix={<Filter className="w-4 h-4 text-gray-400" />}
            triggerElement={({ value }: { value: unknown }) => (
              <Button>
                <Filter className="w-4 h-4 mr-1" />
                标签筛选
                {value && Array.isArray(value) && value.length > 0 && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    {value.length}
                  </Tag>
                )}
              </Button>
            )}
          >
            {tags.map((tag) => (
              <Option key={tag.id} value={String(tag.id)}>
                <Checkbox checked={selectedTagIds.includes(tag.id)} />
                <Tag color={tagColorMap[tag.color] || 'blue'} style={{ marginLeft: 8 }}>
                  {tag.name}
                </Tag>
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/customers/new')}
          >
            新增顾客
          </Button>
        </Space>
      </div>

      {selectedTagIds.length > 0 && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600 text-sm">已选标签：</span>
          <Space wrap size={4}>
            {selectedTagIds.map((tid) => {
              const tag = tags.find((t) => t.id === tid);
              return tag ? (
                <Tag
                  key={tid}
                  color={tagColorMap[tag.color] || 'blue'}
                  closable
                  onClose={() => handleTagFilterChange(selectedTagIds.filter((id) => id !== tid).map(String))}
                >
                  {tag.name}
                </Tag>
              ) : null;
            })}
          </Space>
          <Button size="mini" type="text" onClick={handleClearTagFilter}>
            清除全部
          </Button>
        </div>
      )}

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
        scroll={{ x: 1400 }}
      />
    </div>
  );
}
