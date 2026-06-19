import { useEffect, useState } from 'react';
import {
  Card,
  Space,
  Button,
  Form,
  Input,
  Select,
  Message,
  Tag,
  Grid,
  List,
  Divider,
  Badge,
  Result,
  Alert,
} from '@arco-design/web-react';
import {
  ArrowLeft,
  QrCode,
  ArrowUpFromLine,
  CheckCircle,
  Trash2,
  Barcode,
  User,
  Package,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTraceCodeByCode, scanOutbound } from '@/services/medicineService.ts';
import { getCustomers } from '@/services/customerService.ts';
import type { TraceCode, Customer } from '../../../shared/types.ts';

const { Row, Col } = Grid;
const { Search: SearchInput } = Input;

interface TraceCodeDetail {
  batchNumber?: string;
  medicineName?: string;
  expiryDate?: Date;
  medicineSpecifications?: string;
  usedByName?: string;
  customerName?: string;
}

interface ScannedItem {
  code: string;
  traceCode: TraceCode & TraceCodeDetail;
  status: 'valid' | 'invalid' | 'used' | 'expired';
}

export default function ScanOutbound() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await getCustomers({ page: 1, pageSize: 100 });
      if (res.success && res.data) {
        setCustomers(res.data.list);
      }
    } catch (error) {
      Message.error('获取顾客列表失败');
    }
  };

  const validateTraceCode = async (code: string): Promise<ScannedItem | null> => {
    try {
      const res = await getTraceCodeByCode(code);
      if (res.success && res.data) {
        const traceCode = res.data as TraceCode & TraceCodeDetail;
        let status: ScannedItem['status'] = 'valid';

        if (traceCode.status !== 'in_stock') {
          status = 'used';
        } else if (
          traceCode.expiryDate &&
          new Date(traceCode.expiryDate) < new Date()
        ) {
          status = 'expired';
        }

        return {
          code,
          traceCode,
          status,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleScan = async () => {
    if (!scanInput.trim()) {
      Message.warning('请输入追溯码');
      return;
    }

    const existing = scannedItems.find((item) => item.code === scanInput.trim());
    if (existing) {
      Message.warning('该追溯码已扫描');
      return;
    }

    setLoading(true);
    try {
      const result = await validateTraceCode(scanInput.trim());
      if (result) {
        setScannedItems((prev) => [...prev, result]);

        if (result.status === 'used') {
          Message.warning('该追溯码已被使用');
        } else if (result.status === 'expired') {
          Message.warning('该药品已过期');
        } else {
          Message.success('扫码成功');
        }
      } else {
        Message.error('追溯码不存在');
      }
    } catch (error) {
      Message.error('扫码失败');
    } finally {
      setLoading(false);
      setScanInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const handleRemoveItem = (code: string) => {
    setScannedItems((prev) => prev.filter((item) => item.code !== code));
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      Message.error('请选择关联顾客');
      return;
    }

    const validItems = scannedItems.filter((item) => item.status === 'valid');
    if (validItems.length === 0) {
      Message.error('没有可出库的有效追溯码');
      return;
    }

    setLoading(true);
    try {
      for (const item of validItems) {
        await scanOutbound(item.code, selectedCustomer);
      }
      setCompleted(true);
      Message.success(`成功出库 ${validItems.length} 个药品`);
    } catch (error) {
      Message.error('出库失败');
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.name} - ${c.phone}`,
  }));

  const validCount = scannedItems.filter((item) => item.status === 'valid').length;
  const invalidCount = scannedItems.filter((item) => item.status !== 'valid').length;

  const getStatusInfo = (status: ScannedItem['status']) => {
    const statusMap = {
      valid: { color: 'green', text: '有效', icon: CheckCircle },
      invalid: { color: 'gray', text: '无效', icon: AlertTriangle },
      used: { color: 'orange', text: '已使用', icon: AlertTriangle },
      expired: { color: 'red', text: '已过期', icon: AlertTriangle },
    };
    return statusMap[status];
  };

  if (completed) {
    const validItems = scannedItems.filter((item) => item.status === 'valid');
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <Card>
          <Result
            status="success"
            title="出库成功"
            subTitle={`已成功出库 ${validItems.length} 个药品`}
            extra={[
              <Button key="back" onClick={() => navigate('/medicines')}>
                返回列表
              </Button>,
              <Button
                key="continue"
                type="primary"
                onClick={() => {
                  setCompleted(false);
                  setScannedItems([]);
                  setSelectedCustomer(null);
                  form.resetFields();
                }}
              >
                继续出库
              </Button>,
            ]}
          />

          <Card className="mt-6" title="出库明细">
            <List
              size="small"
              dataSource={validItems}
              render={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-green-500" />
                      </div>
                    }
                    title={
                      <Space>
                        <span>{item.traceCode.medicineName}</span>
                        <Tag color="green">出库成功</Tag>
                      </Space>
                    }
                    description={
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>规格：{item.traceCode.medicineSpecifications}</div>
                        <div>批次：{item.traceCode.batchNumber}</div>
                        <div className="font-mono">追溯码：{item.code}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="text"
            icon={<ArrowLeft className="w-5 h-5" />}
            onClick={() => navigate('/medicines')}
          />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <ArrowUpFromLine className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">扫码出库</h1>
              <p className="text-sm text-gray-500">扫描追溯码完成出库，关联使用顾客</p>
            </div>
          </div>
        </div>

        <Row gutter={24}>
          <Col span={24} lg={14}>
            <Card
              title={
                <Space>
                  <Barcode className="w-5 h-5 text-indigo-500" />
                  <span>扫码录入</span>
                </Space>
              }
              className="mb-6"
            >
              <Space size={12} className="w-full mb-4">
                <SearchInput
                  placeholder="请输入或扫描追溯码"
                  style={{ flex: 1, minWidth: 200 }}
                  value={scanInput}
                  onChange={setScanInput}
                  onSearch={handleScan}
                  onKeyPress={handleKeyPress}
                  allowClear
                />
                <Button
                  type="primary"
                  loading={loading}
                  icon={<QrCode className="w-4 h-4" />}
                  onClick={handleScan}
                >
                  扫码
                </Button>
              </Space>

              <p className="text-xs text-gray-400">
                提示：请扫描药品包装盒上的追溯码，或手动输入追溯码
              </p>
            </Card>

            <Card
              title={
                <div className="flex items-center justify-between">
                  <Space>
                    <Package className="w-5 h-5 text-indigo-500" />
                    <span>已扫描药品</span>
                  </Space>
                  <Space size={16}>
                    <Badge count={validCount} color="green" text="有效" />
                    {invalidCount > 0 && (
                      <Badge count={invalidCount} color="red" text="异常" />
                    )}
                  </Space>
                </div>
              }
              style={{ minHeight: 400 }}
            >
              {scannedItems.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <QrCode className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>暂无扫描记录</p>
                  <p className="text-sm">请扫描追溯码开始出库</p>
                </div>
              ) : (
                <List
                  size="small"
                  dataSource={scannedItems}
                  render={(item) => {
                    const statusInfo = getStatusInfo(item.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <List.Item
                        actions={[
                          <Button
                            key="delete"
                            type="text"
                            size="small"
                            status="danger"
                            icon={<Trash2 className="w-4 h-4" />}
                            onClick={() => handleRemoveItem(item.code)}
                          />,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                item.status === 'valid'
                                  ? 'bg-green-100'
                                  : 'bg-red-100'
                              }`}
                            >
                              <Package
                                className={`w-5 h-5 ${
                                  item.status === 'valid'
                                    ? 'text-green-500'
                                    : 'text-red-500'
                                }`}
                              />
                            </div>
                          }
                          title={
                            <Space className="w-full">
                              <span className="font-medium">
                                {item.traceCode.medicineName}
                              </span>
                              <Tag color={statusInfo.color} icon={<StatusIcon className="w-3 h-3" />}>
                                {statusInfo.text}
                              </Tag>
                            </Space>
                          }
                          description={
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>
                                {item.traceCode.medicineSpecifications} | 批次：
                                {item.traceCode.batchNumber}
                              </div>
                              <div className="font-mono">{item.code}</div>
                              {item.status !== 'valid' && (
                                <Alert
                                  type="warning"
                                  content={
                                    item.status === 'used'
                                      ? '该药品已被使用'
                                      : '该药品已过期'
                                  }
                                  style={{ padding: '4px 8px' }}
                                />
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </Card>
          </Col>

          <Col span={24} lg={10}>
            <Card
              title={
                <Space>
                  <User className="w-5 h-5 text-pink-500" />
                  <span>关联顾客</span>
                </Space>
              }
              className="sticky top-6"
            >
              <Form form={form} layout="vertical">
                <Form.Item
                  label="选择顾客"
                  field="customerId"
                  rules={[{ required: true, message: '请选择关联顾客' }]}
                >
                  <Select
                    placeholder="请搜索并选择顾客"
                    options={customerOptions}
                    showSearch
                    onChange={(val) => setSelectedCustomer(val)}
                  />
                </Form.Item>
              </Form>

              {selectedCustomer && (
                <div className="p-4 bg-gray-50 rounded-xl mb-6">
                  {(() => {
                    const customer = customers.find((c) => c.id === selectedCustomer);
                    if (!customer) return null;
                    return (
                      <Space>
                        <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-pink-500" />
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                          {customer.gender && (
                            <div className="text-xs text-gray-400">
                              {customer.gender === 'female' ? '女' : '男'}
                            </div>
                          )}
                        </div>
                      </Space>
                    );
                  })()}
                </div>
              )}

              <Divider />

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">已扫描数量</span>
                  <span className="font-medium">{scannedItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">有效数量</span>
                  <span className="font-medium text-green-600">{validCount}</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">异常数量</span>
                    <span className="font-medium text-red-600">{invalidCount}</span>
                  </div>
                )}
              </div>

              {invalidCount > 0 && (
                <Alert
                  type="warning"
                  content={`有 ${invalidCount} 个异常追溯码将不会出库`}
                  className="mb-4"
                />
              )}

              <Button
                type="primary"
                size="large"
                long
                loading={loading}
                disabled={validCount === 0 || !selectedCustomer}
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={handleSubmit}
              >
                确认出库 ({validCount})
              </Button>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
