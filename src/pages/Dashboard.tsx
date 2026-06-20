import { useEffect, useState } from 'react';
import { Card, Grid, Avatar, Tag, Table, Space, Progress } from '@arco-design/web-react';
import { Users, Scissors, Calendar, DollarSign, TrendingUp, TrendingDown, Activity, Heart, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLowStockMedicines, getExpiringMedicines } from '@/services/medicineService.ts';
import type { Medicine, MedicineBatch } from '../../shared/types.ts';
import { getExpiryStatus } from '@/lib/utils.ts';
import { usePermission } from '@/hooks/usePermission.ts';

const { Row, Col } = Grid;

interface LowStockItem extends Medicine {
  lowStock?: boolean;
  threshold?: number;
}

interface ExpiringBatch extends MedicineBatch {
  medicineName?: string;
  medicineSpecifications?: string;
  unit?: string;
  expiryStatus?: 'expired' | 'near' | 'normal';
  daysLeft?: number;
}

const statCards = [
  {
    title: '今日客户',
    value: '128',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'from-pink-400 to-rose-500',
    bgColor: 'bg-pink-50',
  },
  {
    title: '今日手术',
    value: '24',
    change: '+8.3%',
    trend: 'up',
    icon: Scissors,
    color: 'from-blue-400 to-sky-500',
    bgColor: 'bg-blue-50',
  },
  {
    title: '本月预约',
    value: '356',
    change: '-2.1%',
    trend: 'down',
    icon: Calendar,
    color: 'from-amber-400 to-yellow-500',
    bgColor: 'bg-amber-50',
  },
  {
    title: '今日营收',
    value: '¥128,500',
    change: '+18.7%',
    trend: 'up',
    icon: DollarSign,
    color: 'from-emerald-400 to-green-500',
    bgColor: 'bg-emerald-50',
  },
];

const trendData = [
  { date: '1月', customers: 1200, surgeries: 320, revenue: 156000 },
  { date: '2月', customers: 1350, surgeries: 380, revenue: 189000 },
  { date: '3月', customers: 1520, surgeries: 420, revenue: 215000 },
  { date: '4月', customers: 1480, surgeries: 400, revenue: 198000 },
  { date: '5月', customers: 1680, surgeries: 450, revenue: 245000 },
  { date: '6月', customers: 1820, surgeries: 520, revenue: 286000 },
];

const pieData = [
  { type: '双眼皮手术', value: 185, color: '#F472B6' },
  { type: '隆鼻手术', value: 142, color: '#4A90D9' },
  { type: '玻尿酸填充', value: 218, color: '#D4AF37' },
  { type: '肉毒素注射', value: 167, color: '#10B981' },
  { type: '吸脂塑形', value: 98, color: '#8B5CF6' },
  { type: '其他项目', value: 68, color: '#64748B' },
];

const recentCustomers = [
  { id: 1, name: '张女士', age: 28, project: '双眼皮手术', date: '2024-01-15', status: 'completed' },
  { id: 2, name: '李女士', age: 35, project: '隆鼻手术', date: '2024-01-15', status: 'in_progress' },
  { id: 3, name: '王女士', age: 42, project: '玻尿酸填充', date: '2024-01-14', status: 'scheduled' },
  { id: 4, name: '陈女士', age: 31, project: '肉毒素注射', date: '2024-01-14', status: 'completed' },
  { id: 5, name: '刘女士', age: 29, project: '吸脂塑形', date: '2024-01-13', status: 'cancelled' },
];

const getStatusTag = (status: string) => {
  const statusMap: Record<string, { text: string; color: string }> = {
    scheduled: { text: '已预约', color: 'blue' },
    in_progress: { text: '进行中', color: 'gold' },
    completed: { text: '已完成', color: 'green' },
    cancelled: { text: '已取消', color: 'red' },
  };
  const s = statusMap[status] || { text: status, color: 'gray' };
  return <Tag color={s.color}>{s.text}</Tag>;
};

const maxCustomers = Math.max(...trendData.map(d => d.customers));
const maxSurgeries = Math.max(...trendData.map(d => d.surgeries));
const totalPie = pieData.reduce((sum, item) => sum + item.value, 0);

export default function Dashboard() {
  const navigate = useNavigate();
  const { canAccess } = usePermission();
  const canViewMeds = canAccess({ permission: 'medicine:read' });
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [expiring, setExpiring] = useState<ExpiringBatch[]>([]);
  const [alertLoading, setAlertLoading] = useState(false);

  useEffect(() => {
    if (!canViewMeds) return;
    const fetchAlerts = async () => {
      setAlertLoading(true);
      try {
        const [lowRes, expRes] = await Promise.all([
          getLowStockMedicines(),
          getExpiringMedicines(30),
        ]);
        setLowStock((lowRes.data ?? []) as LowStockItem[]);
        setExpiring((expRes.data ?? []) as ExpiringBatch[]);
      } catch {
        // 无权限或请求失败时静默处理
      } finally {
        setAlertLoading(false);
      }
    };
    fetchAlerts();
  }, [canViewMeds]);

  const columns = [
    {
      title: '客户信息',
      dataIndex: 'name',
      render: (_: string, record: typeof recentCustomers[0]) => (
        <Space>
          <Avatar style={{ backgroundColor: '#F8B4D9' }} size={32}>
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-xs text-gray-500">{record.age}岁</div>
          </div>
        </Space>
      ),
    },
    {
      title: '手术项目',
      dataIndex: 'project',
    },
    {
      title: '日期',
      dataIndex: 'date',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) => getStatusTag(status),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">数据仪表盘</h1>
        <p className="text-gray-500">欢迎回来，查看今日运营数据</p>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Col span={24} sm={12} lg={6} key={index}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">{card.title}</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                      {card.value}
                    </p>
                    <div className="flex items-center gap-1">
                      {card.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          card.trend === 'up' ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {card.change}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">较昨日</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bgColor}`}>
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {canViewMeds && (
        <Card
          loading={alertLoading}
          className="mb-6"
          title={
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>药品预警</span>
              {lowStock.length + expiring.length > 0 && (
                <Tag color="red">{lowStock.length + expiring.length} 项需关注</Tag>
              )}
            </div>
          }
          extra={
            <a
              className="text-pink-500 hover:text-pink-600 text-sm cursor-pointer"
              onClick={() => navigate('/medicines')}
            >
              查看药品管理
            </a>
          }
        >
          {lowStock.length === 0 && expiring.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
              <p>暂无库存与效期预警，库存状况良好</p>
            </div>
          ) : (
            <Row gutter={24}>
              <Col span={24} md={12}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-5 bg-orange-400 rounded" />
                  <span className="font-medium text-gray-700">低库存药品</span>
                  <Tag color="orange">{lowStock.length}</Tag>
                </div>
                {lowStock.length === 0 ? (
                  <div className="text-sm text-gray-400 py-4">暂无低库存药品</div>
                ) : (
                  <div className="space-y-2">
                    {lowStock.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className="w-4 h-4 text-orange-500 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {m.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {m.specifications} · {m.manufacturer}
                            </div>
                          </div>
                        </div>
                        <Tag color="red">仅剩 {m.stock} {m.unit}</Tag>
                      </div>
                    ))}
                  </div>
                )}
              </Col>
              <Col span={24} md={12}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-5 bg-red-400 rounded" />
                  <span className="font-medium text-gray-700">近效期 / 已过期批次</span>
                  <Tag color="red">{expiring.length}</Tag>
                </div>
                {expiring.length === 0 ? (
                  <div className="text-sm text-gray-400 py-4">暂无临期批次</div>
                ) : (
                  <div className="space-y-2">
                    {expiring.slice(0, 5).map((b) => {
                      const info = getExpiryStatus(b.expiryDate);
                      return (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-red-50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Calendar
                              className={`w-4 h-4 shrink-0 ${
                                info.status === 'expired' ? 'text-red-500' : 'text-orange-500'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">
                                {b.medicineName}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                批次 {b.batchNumber} · 有效期至{' '}
                                {new Date(b.expiryDate).toLocaleDateString('zh-CN')}
                              </div>
                            </div>
                          </div>
                          <Tag color={info.color}>{info.label}</Tag>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Col>
            </Row>
          )}
        </Card>
      )}

      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24} lg={16}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-pink-500" />
                <span>运营趋势</span>
              </div>
            }
            extra={<Tag color="blue">近6个月</Tag>}
            className="h-full"
          >
            <div className="space-y-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-400" />
                    <span className="text-sm text-gray-600">客户数量</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                    <span className="text-sm text-gray-600">手术数量</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {trendData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 w-12">{item.date}</span>
                      <span className="text-gray-700 font-medium w-16 text-right">{item.customers} 人</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-500"
                            style={{ width: `${(item.customers / maxCustomers) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pl-12">
                      <div className="flex-1">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-sky-500 rounded-full transition-all duration-500"
                            style={{ width: `${(item.surgeries / maxSurgeries) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{item.surgeries} 台</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={24} lg={8}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                <span>项目分布</span>
              </div>
            }
            className="h-full"
          >
            <div className="space-y-4">
              {pieData.map((item, index) => {
                const percentage = ((item.value / totalPie) * 100).toFixed(1);
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-700">{item.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{item.value}</span>
                        <span className="text-gray-400 text-xs">({percentage}%)</span>
                      </div>
                    </div>
                    <Progress 
                      percent={parseFloat(percentage)} 
                      color={item.color}
                      trailColor="#f3f4f6"
                      size="small"
                      showText={false}
                    />
                  </div>
                );
              })}
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">总手术量</span>
                  <span className="text-xl font-bold text-gray-800">{totalPie}</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>近期客户</span>
          </div>
        }
        extra={<a className="text-pink-500 hover:text-pink-600 text-sm">查看全部</a>}
      >
        <Table
          columns={columns}
          data={recentCustomers}
          pagination={false}
          rowKey="id"
        />
      </Card>
    </div>
  );
}
