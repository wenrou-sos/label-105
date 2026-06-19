import { useEffect, useState } from 'react';
import { Table, Card, Space, Button, Input, Tag, Modal, Message } from '@arco-design/web-react';
import { Plus, Search, Edit, Trash2, Calendar, User, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPostOpVisits, deletePostOpVisit } from '@/services/postopService.ts';
import type { PostOpVisit, LevelType } from '../../../shared/types.ts';

const { Search: SearchInput } = Input;

const LevelIndicator = ({ level }: { level: LevelType }) => {
  const colors = ['#00B42A', '#F7BA1E', '#FF7D00', '#F53F3F'];
  const labels = ['无', '轻度', '中度', '重度'];

  return (
    <Space size={4}>
      <span
        className="inline-block w-3 h-3 rounded-full"
        style={{ backgroundColor: colors[level] }}
      />
      <span className="text-sm text-gray-600">{labels[level]}</span>
    </Space>
  );
};

export default function PostOpList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<(PostOpVisit & { customerName?: string; surgeryName?: string; recordedByName?: string })[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getPostOpVisits({ page, pageSize, keyword });
      if (res.success && res.data) {
        setData(res.data.list);
        setPagination({
          current: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
        });
      }
    } catch (error) {
      Message.error('获取回访列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageChange = (page: number, pageSize: number) => {
    fetchData(page, pageSize);
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
    fetchData(1, pagination.pageSize);
  };

  const handleDelete = (record: typeof data[0]) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${record.customerName} 的回访记录吗？`,
      onOk: async () => {
        try {
          await deletePostOpVisit(record.id);
          Message.success('删除成功');
          fetchData(pagination.current, pagination.pageSize);
        } catch (error) {
          Message.error('删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '顾客信息',
      dataIndex: 'customerName',
      render: (text: string, record: typeof data[0]) => (
        <Space>
          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
            <User className="w-4 h-4 text-pink-500" />
          </div>
          <div>
            <div className="font-medium">{text || '-'}</div>
            <div className="text-xs text-gray-500">{record.surgeryName}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '回访日期',
      dataIndex: 'visitDate',
      render: (date: Date) => (
        <Space size={4}>
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{new Date(date).toLocaleDateString('zh-CN')}</span>
        </Space>
      ),
    },
    {
      title: '红肿',
      dataIndex: 'swellingLevel',
      render: (level: LevelType) => <LevelIndicator level={level} />,
    },
    {
      title: '疼痛',
      dataIndex: 'painLevel',
      render: (level: LevelType) => <LevelIndicator level={level} />,
    },
    {
      title: '淤青',
      dataIndex: 'bruisingLevel',
      render: (level: LevelType) => <LevelIndicator level={level} />,
    },
    {
      title: '拆线日期',
      dataIndex: 'sutureRemovalDate',
      render: (date?: Date) => (date ? new Date(date).toLocaleDateString('zh-CN') : '-'),
    },
    {
      title: '记录人',
      dataIndex: 'recordedByName',
      render: (text?: string) => text || '-',
    },
    {
      title: '操作',
      dataIndex: 'id',
      render: (_: number, record: typeof data[0]) => (
        <Space size={8}>
          <Button
            type="text"
            size="small"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => navigate(`/postoperative/visit/${record.id}/edit`)}
          />
          <Button
            type="text"
            size="small"
            status="danger"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-100">
              <Activity className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">术后回访列表</h1>
              <p className="text-sm text-gray-500">管理和查看所有术后回访记录</p>
            </div>
          </div>
          <Space>
            <SearchInput
              placeholder="搜索顾客姓名..."
              style={{ width: 240 }}
              allowClear
              onSearch={handleSearch}
            />
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/postoperative/visit/new')}
            >
              新增回访
            </Button>
            <Button
              icon={<Activity className="w-4 h-4" />}
              onClick={() => navigate('/postoperative/complications')}
            >
              并发症记录
            </Button>
            <Button
              icon={<Search className="w-4 h-4" />}
              onClick={() => navigate('/postoperative/photo-compare')}
            >
              照片对比
            </Button>
          </Space>
        </div>

        <Table
          loading={loading}
          columns={columns}
          data={data}
          rowKey="id"
          pagination={{
            ...pagination,
            showTotal: true,
            onChange: handlePageChange,
          }}
        />
      </Card>
    </div>
  );
}
