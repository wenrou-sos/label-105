import { useState } from 'react';
import {
  Card,
  Space,
  Button,
  Input,
  Message,
  Tag,
  Timeline,
  Grid,
  Descriptions,
  Empty,
  Result,
  Alert,
} from '@arco-design/web-react';
import {
  ArrowLeft,
  Search,
  QrCode,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  User,
  Calendar,
  Factory,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTraceCodeByCode } from '@/services/medicineService.ts';
import type { TraceCode, TraceCodeStatus } from '../../../shared/types.ts';

const { Row, Col } = Grid;
const { Search: SearchInput } = Input;

interface TraceDetail {
  traceCode: TraceCode & {
    batchNumber?: string;
    expiryDate?: Date;
    medicineName?: string;
    medicineSpecifications?: string;
    usedByName?: string;
    customerName?: string;
  };
}

const statusMap: Record<TraceCodeStatus, { color: string; text: string; icon: any }> = {
  in_stock: { color: 'green', text: '在库', icon: Package },
  used: { color: 'blue', text: '已使用', icon: CheckCircle },
  expired: { color: 'orange', text: '已过期', icon: AlertTriangle },
  returned: { color: 'gray', text: '已退回', icon: ArrowLeft },
};

export default function TraceQuery() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [traceDetail, setTraceDetail] = useState<TraceDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (code: string) => {
    if (!code.trim()) {
      Message.warning('请输入追溯码');
      return;
    }

    setLoading(true);
    setNotFound(false);
    setTraceDetail(null);

    try {
      const res = await getTraceCodeByCode(code.trim());
      if (res.success && res.data) {
        setTraceDetail({ traceCode: res.data });
      } else {
        setNotFound(true);
      }
    } catch (error) {
      setNotFound(true);
      Message.error('查询失败');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchCode);
    }
  };

  const getTimelineNodes = (detail: TraceDetail) => {
    const { traceCode } = detail;
    const nodes = [];

    nodes.push({
      color: '#00B42A',
      icon: <Factory className="w-5 h-5 text-white" />,
      title: '生产入库',
      content: traceCode.batchNumber
        ? `批次号：${traceCode.batchNumber}`
        : '批次信息',
      time: traceCode.createdAt
        ? new Date(traceCode.createdAt).toLocaleString('zh-CN')
        : '',
    });

    nodes.push({
      color: '#165DFF',
      icon: <ArrowDownToLine className="w-5 h-5 text-white" />,
      title: '扫码入库',
      content: traceCode.medicineName
        ? `药品：${traceCode.medicineName} ${traceCode.medicineSpecifications || ''}`
        : '入库完成',
      time: traceCode.createdAt
        ? new Date(traceCode.createdAt).toLocaleString('zh-CN')
        : '',
    });

    if (traceCode.status === 'used' && traceCode.usedAt) {
      nodes.push({
        color: '#722ED1',
        icon: <User className="w-5 h-5 text-white" />,
        title: '关联顾客',
        content: traceCode.customerName
          ? `使用顾客：${traceCode.customerName}`
          : '已关联顾客',
        time: new Date(traceCode.usedAt).toLocaleString('zh-CN'),
      });

      nodes.push({
        color: '#F53F3F',
        icon: <ArrowUpFromLine className="w-5 h-5 text-white" />,
        title: '扫码出库',
        content: traceCode.usedByName
          ? `操作人：${traceCode.usedByName}`
          : '出库完成',
        time: new Date(traceCode.usedAt).toLocaleString('zh-CN'),
      });
    }

    return nodes;
  };

  const statusInfo = traceDetail ? statusMap[traceDetail.traceCode.status] : null;
  const StatusIcon = statusInfo?.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <Card>
        <div className="flex items-center gap-4 mb-8">
          <Button
            type="text"
            icon={<ArrowLeft className="w-5 h-5" />}
            onClick={() => navigate('/medicines')}
          />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Search className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">溯源查询</h1>
              <p className="text-sm text-gray-500">输入追溯码查询药品完整溯源信息</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100">
            <Space size={12} className="w-full">
              <div className="flex-1 relative">
                <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  size="large"
                  placeholder="请输入或扫描追溯码"
                  style={{ paddingLeft: 42 }}
                  value={searchCode}
                  onChange={setSearchCode}
                  onKeyPress={handleKeyPress}
                  allowClear
                />
              </div>
              <Button
                type="primary"
                size="large"
                loading={loading}
                icon={<Search className="w-4 h-4" />}
                onClick={() => handleSearch(searchCode)}
              >
                查询
              </Button>
            </Space>
            <p className="text-xs text-gray-400 mt-3 ml-1">
              提示：追溯码位于药品包装盒上，格式如 TRC-XXXXXXXX-XXXXXX
            </p>
          </Card>
        </div>

        {notFound && (
          <div className="max-w-2xl mx-auto">
            <Result
              status="404"
              title="未找到追溯码"
              subTitle="请检查追溯码是否正确，或该药品尚未录入系统"
              extra={
                <Button type="primary" onClick={() => setNotFound(false)}>
                  重新查询
                </Button>
              }
            />
          </div>
        )}

        {traceDetail && (
          <div className="max-w-4xl mx-auto">
            <Row gutter={24}>
              <Col span={24} lg={10}>
                <Card className="mb-6">
                  <div className="text-center mb-6">
                    <div
                      className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-${
                        statusInfo?.color
                      }-100`}
                      style={{
                        backgroundColor: `var(--color-${statusInfo?.color}-100)`,
                      }}
                    >
                      {StatusIcon && (
                        <StatusIcon
                          className="w-10 h-10"
                          style={{ color: `var(--color-${statusInfo?.color}-600)` }}
                        />
                      )}
                    </div>
                    <Tag color={statusInfo?.color} size="large">
                      {statusInfo?.text}
                    </Tag>
                  </div>

                  <Descriptions
                    column={1}
                    size="small"
                    data={[
                      {
                        label: '追溯码',
                        value: (
                          <span className="font-mono text-sm">
                            {traceDetail.traceCode.code}
                          </span>
                        ),
                      },
                      {
                        label: '药品名称',
                        value: traceDetail.traceCode.medicineName || '-',
                      },
                      {
                        label: '规格',
                        value: traceDetail.traceCode.medicineSpecifications || '-',
                      },
                      {
                        label: '批次号',
                        value: (
                          <span className="font-mono text-sm">
                            {traceDetail.traceCode.batchNumber || '-'}
                          </span>
                        ),
                      },
                      {
                        label: '有效期',
                        value: traceDetail.traceCode.expiryDate
                          ? new Date(traceDetail.traceCode.expiryDate).toLocaleDateString(
                              'zh-CN'
                            )
                          : '-',
                      },
                    ]}
                  />
                </Card>

                {traceDetail.traceCode.status === 'used' && (
                  <Card
                    title={
                      <Space>
                        <User className="w-5 h-5 text-pink-500" />
                        <span>使用信息</span>
                      </Space>
                    }
                  >
                    <Descriptions
                      column={1}
                      size="small"
                      data={[
                        {
                          label: '使用顾客',
                          value: traceDetail.traceCode.customerName || '-',
                        },
                        {
                          label: '操作人',
                          value: traceDetail.traceCode.usedByName || '-',
                        },
                        {
                          label: '使用时间',
                          value: traceDetail.traceCode.usedAt
                            ? new Date(traceDetail.traceCode.usedAt).toLocaleString(
                                'zh-CN'
                              )
                            : '-',
                        },
                      ]}
                    />
                  </Card>
                )}

                {traceDetail.traceCode.expiryDate &&
                  new Date(traceDetail.traceCode.expiryDate) < new Date() && (
                    <Alert
                      type="warning"
                      content="该药品已过期"
                      className="mt-4"
                    />
                  )}
              </Col>

              <Col span={24} lg={14}>
                <Card
                  title={
                    <Space>
                      <Clock className="w-5 h-5 text-indigo-500" />
                      <span>溯源链</span>
                    </Space>
                  }
                >
                  <Timeline>
                    {getTimelineNodes(traceDetail).map((node, index) => (
                      <Timeline.Item
                        key={index}
                        dotColor={node.color}
                        dot={
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: node.color }}
                          >
                            {node.icon}
                          </div>
                        }
                      >
                        <div className="mb-1">
                          <span className="font-semibold text-gray-800">
                            {node.title}
                          </span>
                          <span className="text-xs text-gray-400 ml-3">
                            {node.time}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{node.content}</div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Card>

                <Card
                  className="mt-6"
                  title={
                    <Space>
                      <Factory className="w-5 h-5 text-blue-500" />
                      <span>药品信息</span>
                    </Space>
                  }
                >
                  <Descriptions
                    column={2}
                    size="small"
                    data={[
                      {
                        label: '药品名称',
                        value: traceDetail.traceCode.medicineName || '-',
                      },
                      {
                        label: '规格',
                        value: traceDetail.traceCode.medicineSpecifications || '-',
                      },
                      {
                        label: '批次号',
                        value: traceDetail.traceCode.batchNumber || '-',
                        span: 2,
                      },
                      {
                        label: '入库时间',
                        value: traceDetail.traceCode.createdAt
                          ? new Date(traceDetail.traceCode.createdAt).toLocaleString(
                              'zh-CN'
                            )
                          : '-',
                      },
                      {
                        label: '有效期至',
                        value: traceDetail.traceCode.expiryDate
                          ? new Date(traceDetail.traceCode.expiryDate).toLocaleDateString(
                              'zh-CN'
                            )
                          : '-',
                      },
                    ]}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {!traceDetail && !notFound && (
          <div className="max-w-2xl mx-auto py-16">
            <Empty description="输入追溯码开始查询" />
          </div>
        )}
      </Card>
    </div>
  );
}
