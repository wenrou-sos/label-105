import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Space,
  Button,
  Input,
  Tag,
  Tabs,
  Modal,
  Message,
  Badge,
  Statistic,
  Grid,
} from '@arco-design/web-react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  QrCode,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search as SearchIcon,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getMedicines,
  deleteMedicine,
  getLowStockMedicines,
  getExpiringMedicines,
  getMedicineBatches,
} from '@/services/medicineService.ts';
import type { Medicine, MedicineBatch, MedicineCategory } from '../../../shared/types.ts';
import { getExpiryStatus, isLowStock } from '@/lib/utils.ts';

const { Row, Col } = Grid;
const { Search: SearchInput } = Input;

const categoryMap: Record<MedicineCategory, { label: string; color: string; icon: string }> = {
  botulinum: { label: '肉毒素', color: 'purple', icon: '💉' },
  hyaluronic: { label: '玻尿酸', color: 'blue', icon: '💧' },
  water_light: { label: '水光针', color: 'cyan', icon: '✨' },
  other: { label: '其他', color: 'gray', icon: '📦' },
};

export default function MedicineList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Medicine[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [activeCategory, setActiveCategory] = useState<MedicineCategory | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [stats, setStats] = useState({ lowStock: 0, expiring: 0, total: 0 });
  const [batchMap, setBatchMap] = useState<Record<number, MedicineBatch[]>>({});

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeCategory, keyword, pagination.current, pagination.pageSize]);

  const fetchStats = async () => {
    try {
      const [lowStockRes, expiringRes] = await Promise.all([
        getLowStockMedicines(),
        getExpiringMedicines(30),
      ]);
      setStats({
        lowStock: lowStockRes.data?.length || 0,
        expiring: expiringRes.data?.length || 0,
        total: 0,
      });
    } catch (error) {
      console.error('获取统计数据失败');
    }
  };

  const fetchBatches = async (medicineId: number) => {
    try {
      const res = await getMedicineBatches(medicineId);
      if (res.success && res.data) {
        setBatchMap((prev) => ({ ...prev, [medicineId]: res.data as MedicineBatch[] }));
      }
    } catch {
      console.error('获取批次列表失败');
    }
  };

  const fetchData = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const params: any = { page, pageSize, keyword };
      if (activeCategory !== 'all') {
        params.category = activeCategory;
      }
      const res = await getMedicines(params);
      if (res.success && res.data) {
        setData(res.data.list);
        setPagination({
          current: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
        });
        setStats((prev) => ({ ...prev, total: res.data!.total }));
      }
    } catch (error) {
      Message.error('获取药品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number, pageSize: number) => {
    fetchData(page, pageSize);
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
    fetchData(1, pagination.pageSize);
  };

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key as MedicineCategory | 'all');
    fetchData(1, pagination.pageSize);
  };

  const handleDelete = (record: Medicine) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除药品「${record.name}」吗？`,
      onOk: async () => {
        try {
          await deleteMedicine(record.id);
          Message.success('删除成功');
          fetchData();
          fetchStats();
        } catch (error) {
          Message.error('删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '药品信息',
      dataIndex: 'name',
      render: (text: string, record: Medicine) => {
        const category = categoryMap[record.category];
        return (
          <Space>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: `var(--color-${category.color}-100)` }}
            >
              {category.icon}
            </div>
            <div>
              <div className="font-medium">{text}</div>
              <div className="text-xs text-gray-500">{record.specifications}</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: '分类',
      dataIndex: 'category',
      render: (category: MedicineCategory) => {
        const cat = categoryMap[category];
        return <Tag color={cat.color}>{cat.label}</Tag>;
      },
    },
    {
      title: '生产厂家',
      dataIndex: 'manufacturer',
    },
    {
        title: '库存',
        dataIndex: 'stock',
        render: (stock: number, record: Medicine) => (
          <Space>
            <Badge status={isLowStock(stock) ? 'warning' : 'success'} />
            <span className={isLowStock(stock) ? 'text-orange-500 font-medium' : ''}>
              {stock} {record.unit}
            </span>
            {isLowStock(stock) && <Tag color="orange">低库存</Tag>}
          </Space>
        ),
      },
    {
        title: '操作',
      dataIndex: 'id',
      render: (_: number, record: Medicine) => (
        <Space size={8}>
          <Button
            type="text"
            size="small"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => navigate(`/medicines/${record.id}/edit`)}
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

  const batchColumns = [
    {
      title: '批次号',
      dataIndex: 'batchNumber',
      render: (text: string) => <span className="font-mono">{text}</span>,
    },
    {
      title: '有效期',
      dataIndex: 'expiryDate',
      render: (expiryDate: string) => {
        const info = getExpiryStatus(expiryDate);
        return (
          <Space>
            <span
              className={
                info.status === 'expired'
                  ? 'text-red-600 font-medium'
                  : info.status === 'warning'
                    ? 'text-orange-600 font-medium'
                    : ''
              }
            >
              {new Date(expiryDate).toLocaleDateString('zh-CN')}
            </span>
            <Tag color={info.color}>{info.label}</Tag>
          </Space>
        );
      },
    },
    {
      title: '批次库存',
      dataIndex: 'quantity',
      render: (qty: number) => <span>{qty}</span>,
    },
    {
      title: '入库时间',
      dataIndex: 'receivedDate',
      render: (d: string) => new Date(d).toLocaleDateString('zh-CN'),
    },
    {
      title: '验收人',
      dataIndex: 'receivedByName',
      render: (text?: string) => text || '-',
    },
  ];

  const getBatchRowClassName = (record: MedicineBatch) => {
    const info = getExpiryStatus(record.expiryDate);
    if (info.status === 'expired') return 'bg-red-50';
    if (info.status === 'warning') return 'bg-amber-50';
    return '';
  };

  const renderExpandedRow = (record: Medicine) => {
    const batches = batchMap[record.id] || [];
    if (batches.length === 0) {
      return <div className="py-3 text-gray-400 text-sm">暂无批次记录</div>;
    }
    return (
      <div className="py-2">
        <div className="text-xs text-gray-500 mb-2">
          共 {batches.length} 个批次 ·
          <span className="text-red-500"> 红色为已过期</span> ·
          <span className="text-orange-500"> 橙色为近效期（30天内）</span>
        </div>
        <Table
          size="small"
          pagination={false}
          rowKey="id"
          data={batches}
          columns={batchColumns}
          rowClassName={getBatchRowClassName}
        />
      </div>
    );
  };

  const statCards = [
    {
      title: '药品总数',
      value: stats.total,
      icon: Package,
      color: 'blue',
    },
    {
      title: '库存预警',
      value: stats.lowStock,
      icon: AlertTriangle,
      color: 'orange',
    },
    {
      title: '临期药品',
      value: stats.expiring,
      icon: AlertTriangle,
      color: 'red',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <Row gutter={[16, 16]} className="mb-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Col span={24} sm={12} lg={8} key={index}>
              <Card className="h-full">
                <div className="flex items-center justify-between">
                  <Statistic title={card.title} value={card.value} />
                  <div
                    className={`p-3 rounded-xl`}
                    style={{ backgroundColor: `var(--color-${card.color}-100)` }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: `var(--color-${card.color}-600)` }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100">
              <Package className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">药品管理</h1>
              <p className="text-sm text-gray-500">管理所有药品和针剂库存</p>
            </div>
          </div>

          <Space wrap>
            <SearchInput
              placeholder="搜索药品名称..."
              style={{ width: 240 }}
              allowClear
              onSearch={handleSearch}
            />
            <Button
              icon={<ArrowDownToLine className="w-4 h-4" />}
              onClick={() => navigate('/medicines/scan-inbound')}
            >
              扫码入库
            </Button>
            <Button
              icon={<ArrowUpFromLine className="w-4 h-4" />}
              onClick={() => navigate('/medicines/scan-outbound')}
            >
              扫码出库
            </Button>
            <Button
              icon={<SearchIcon className="w-4 h-4" />}
              onClick={() => navigate('/medicines/trace-query')}
            >
              溯源查询
            </Button>
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/medicines/new')}
            >
              新增药品
            </Button>
          </Space>
        </div>

        <Tabs
          activeTab={activeCategory}
          onChange={handleCategoryChange}
          type="card"
          className="mb-6"
        >
          <Tabs.TabPane key="all" title="全部" />
          {Object.entries(categoryMap).map(([key, value]) => (
            <Tabs.TabPane key={key} title={value.label} />
          ))}
        </Tabs>

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
          expandedRowRender={(record: Medicine) => renderExpandedRow(record)}
          onExpand={(record: Medicine, expanded: boolean) => {
            if (expanded) {
              fetchBatches(record.id);
            }
          }}
        />
      </Card>
    </div>
  );
}
