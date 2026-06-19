import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  Message,
  Popconfirm,
  Card,
  Grid,
  InputNumber,
  Switch,
  Alert,
  Typography,
} from '@arco-design/web-react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Tag as TagIcon,
  Barcode,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Link,
  History,
} from 'lucide-react';
import { getSurgerySupplies, addSupply, removeSupply } from '@/services/surgeryService';
import type { Supply, SupplyType } from '../../../shared/types';

const { Row, Col } = Grid;
const { Option } = Select;
const { Text, Paragraph } = Typography;

interface SupplyManagementProps {
  surgeryId?: number;
}

const SUPPLY_TYPES: { value: SupplyType; label: string; color: string }[] = [
  { value: 'implant', label: '植入类', color: 'red' },
  { value: 'consumable', label: '耗材类', color: 'blue' },
  { value: 'medicine', label: '药品类', color: 'green' },
];

export default function SupplyManagement({ surgeryId }: SupplyManagementProps) {
  const [data, setData] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [traceModalVisible, setTraceModalVisible] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);

  const fetchData = async () => {
    if (!surgeryId) return;
    setLoading(true);
    try {
      const response = await getSurgerySupplies(surgeryId);
      if (response.success) {
        setData(response.data || []);
      }
    } catch (error) {
      Message.error('获取耗材列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (surgeryId) {
      fetchData();
    }
  }, [surgeryId]);

  const handleAdd = () => {
    setEditingSupply(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Supply) => {
    setEditingSupply(record);
    form.setFieldsValue({
      name: record.name,
      brand: record.brand,
      batchNumber: record.batchNumber,
      expiryDate: record.expiryDate ? new Date(record.expiryDate) : undefined,
      type: record.type,
      isImplant: record.isImplant,
      traceCode: record.traceCode,
      customerId: record.customerId,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await removeSupply(id);
      if (response.success) {
        Message.success('删除成功');
        fetchData();
      }
    } catch (error) {
      Message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    if (!surgeryId) {
      Message.error('请先选择手术');
      return;
    }

    if (values.isImplant && !values.customerId) {
      Message.warning('植入类耗材必须关联客户');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        ...values,
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : undefined,
        usedAt: new Date().toISOString(),
      };

      const response = await addSupply(surgeryId, data);
      if (response.success) {
        Message.success(editingSupply ? '更新成功' : '添加成功');
        setModalVisible(false);
        fetchData();
      }
    } catch (error) {
      Message.error(editingSupply ? '更新失败' : '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrace = (record: Supply) => {
    setSelectedSupply(record);
    setTraceModalVisible(true);
  };

  const isExpired = (expiryDate: Date) => {
    return new Date(expiryDate) < new Date();
  };

  const getTypeTag = (type: SupplyType) => {
    const typeInfo = SUPPLY_TYPES.find((t) => t.value === type);
    return typeInfo ? <Tag color={typeInfo.color}>{typeInfo.label}</Tag> : null;
  };

  const filteredData = data.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword.toLowerCase()) ||
      item.brand.toLowerCase().includes(keyword.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(keyword.toLowerCase());
    const matchType = !typeFilter || item.type === typeFilter;
    return matchKeyword && matchType;
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '耗材名称',
      dataIndex: 'name',
      render: (text: string, record: Supply) => (
        <Space>
          <Package className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium">{text}</div>
            {record.traceCode && (
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Barcode className="w-3 h-3" />
                {record.traceCode}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      render: (text: string) => (
        <Space>
          <TagIcon className="w-4 h-4 text-gray-400" />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '批号',
      dataIndex: 'batchNumber',
      render: (text: string) => (
        <span className="font-mono text-sm">{text}</span>
      ),
    },
    {
      title: '有效期',
      dataIndex: 'expiryDate',
      render: (date: Date) => {
        const expired = isExpired(date);
        return (
          <Space>
            <Calendar className={`w-4 h-4 ${expired ? 'text-red-500' : 'text-gray-400'}`} />
            <span className={expired ? 'text-red-500' : ''}>
              {new Date(date).toLocaleDateString('zh-CN')}
            </span>
            {expired && <Tag color="red">已过期</Tag>}
          </Space>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (type: SupplyType) => getTypeTag(type),
    },
    {
      title: '植入物',
      dataIndex: 'isImplant',
      render: (isImplant: boolean) =>
        isImplant ? (
          <Tag color="red" icon={<CheckCircle className="w-3 h-3" />}>
            是
          </Tag>
        ) : (
          <Tag color="gray" icon={<XCircle className="w-3 h-3" />}>
            否
          </Tag>
        ),
    },
    {
      title: '关联客户',
      dataIndex: 'customerId',
      render: (customerId: number) =>
        customerId ? (
          <Space>
            <User className="w-4 h-4 text-blue-500" />
            <span>客户 #{customerId}</span>
          </Space>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: '使用时间',
      dataIndex: 'usedAt',
      render: (date: Date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      dataIndex: 'actions',
      width: 220,
      render: (_: unknown, record: Supply) => (
        <Space>
          <Button
            size="small"
            type="primary"
            status="success"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => handleTrace(record)}
          >
            追溯
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            content="确定要删除这条耗材记录吗？"
            onOk={() => handleDelete(record.id)}
          >
            <Button
              size="small"
              type="primary"
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">假体/耗材管理</h1>
              <p className="text-gray-500 text-sm">
                {surgeryId ? `手术ID: ${surgeryId}` : '管理所有耗材记录'}
              </p>
            </div>
          </div>
          <Button type="primary" icon={<Plus className="w-4 h-4" />} onClick={handleAdd}>
            添加耗材
          </Button>
        </div>
      </div>

      <Row gutter={16} className="mb-4">
        <Col span={6}>
          <Card className="h-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {data.filter((d) => d.type === 'implant').length}
                </div>
                <div className="text-sm text-gray-500">植入类</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="h-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {data.filter((d) => d.type === 'consumable').length}
                </div>
                <div className="text-sm text-gray-500">耗材类</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="h-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {data.filter((d) => d.type === 'medicine').length}
                </div>
                <div className="text-sm text-gray-500">药品类</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="h-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {data.filter((d) => isExpired(d.expiryDate)).length}
                </div>
                <div className="text-sm text-gray-500">已过期</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <Space wrap>
          <Input
            placeholder="搜索名称、品牌、批号"
            value={keyword}
            onChange={setKeyword}
            style={{ width: 280 }}
            prefix={<Search className="w-4 h-4 text-gray-400" />}
          />
          <Select
            placeholder="选择类型"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 160 }}
            allowClear
          >
            {SUPPLY_TYPES.map((type) => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>
          <Button type="primary" icon={<Search className="w-4 h-4" />} onClick={fetchData}>
            搜索
          </Button>
          <Button onClick={() => { setKeyword(''); setTypeFilter(''); fetchData(); }}>
            重置
          </Button>
        </Space>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <Table
          columns={columns}
          data={filteredData}
          loading={loading}
          rowKey="id"
          pagination={{
            showTotal: true,
            sizeCanChange: true,
          }}
        />
      </div>

      <Modal
        title={
          <Space>
            <Package className="w-5 h-5 text-green-500" />
            <span>{editingSupply ? '编辑耗材' : '添加耗材'}</span>
          </Space>
        }
        visible={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        okText={editingSupply ? '保存' : '添加'}
        confirmLoading={submitting}
        style={{ width: 600 }}
      >
        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit}
          initialValues={{
            type: 'consumable',
            isImplant: false,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="耗材名称"
                field="name"
                rules={[{ required: true, message: '请输入耗材名称' }]}
              >
                <Input
                  placeholder="请输入耗材名称"
                  prefix={<Package className="w-4 h-4 text-gray-400" />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="品牌"
                field="brand"
                rules={[{ required: true, message: '请输入品牌' }]}
              >
                <Input
                  placeholder="请输入品牌"
                  prefix={<TagIcon className="w-4 h-4 text-gray-400" />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="批号"
                field="batchNumber"
                rules={[{ required: true, message: '请输入批号' }]}
              >
                <Input
                  placeholder="请输入批号"
                  prefix={<Barcode className="w-4 h-4 text-gray-400" />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="有效期"
                field="expiryDate"
                rules={[{ required: true, message: '请选择有效期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择有效期"
                  prefix={<Calendar className="w-4 h-4 text-gray-400" />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="耗材类型"
                field="type"
                rules={[{ required: true, message: '请选择耗材类型' }]}
              >
                <Select placeholder="请选择耗材类型" style={{ width: '100%' }}>
                  {SUPPLY_TYPES.map((type) => (
                    <Option key={type.value} value={type.value}>
                      <Tag color={type.color}>{type.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="追溯码" field="traceCode">
                <Input
                  placeholder="请输入追溯码（可选）"
                  prefix={<Barcode className="w-4 h-4 text-gray-400" />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue, setFieldsValue }) => {
              const currentType = getFieldValue('type');
              const isImplant = getFieldValue('isImplant');
              const forceImplant = currentType === 'implant';

              if (forceImplant && !isImplant) {
                setTimeout(() => setFieldsValue({ isImplant: true }), 0);
              }

              return (
                <>
                  <Form.Item label="是否为植入物" field="isImplant">
                    <Switch
                      checked={forceImplant || isImplant}
                      disabled={forceImplant}
                      onChange={(checked) => setFieldsValue({ isImplant: checked })}
                    />
                  </Form.Item>

                  {(forceImplant || isImplant) && (
                    <>
                      <Alert
                        type="warning"
                        showIcon
                        className="mb-4"
                        content="植入类耗材必须关联客户，以便进行追溯管理"
                      />
                      <Form.Item
                        label="关联客户ID"
                        field="customerId"
                        rules={[{ required: true, message: '请输入关联客户ID' }]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          placeholder="请输入关联客户ID"
                          min={1}
                          prefix={<User className="w-4 h-4 text-gray-400" />}
                        />
                      </Form.Item>
                    </>
                  )}
                </>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <History className="w-5 h-5 text-blue-500" />
            <span>耗材追溯信息</span>
          </Space>
        }
        visible={traceModalVisible}
        onCancel={() => setTraceModalVisible(false)}
        footer={null}
        style={{ width: 600 }}
      >
        {selectedSupply && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">基本信息</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">耗材名称</span>
                  <span className="font-medium">{selectedSupply.name}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">品牌</span>
                  <span className="font-medium">{selectedSupply.brand}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">批号</span>
                  <span className="font-mono">{selectedSupply.batchNumber}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">有效期</span>
                  <span className={isExpired(selectedSupply.expiryDate) ? 'text-red-500 font-medium' : 'font-medium'}>
                    {new Date(selectedSupply.expiryDate).toLocaleDateString('zh-CN')}
                    {isExpired(selectedSupply.expiryDate) && ' (已过期)'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">类型</span>
                  <span>{getTypeTag(selectedSupply.type)}</span>
                </div>
                {selectedSupply.traceCode && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">追溯码</span>
                    <span className="font-mono">{selectedSupply.traceCode}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedSupply.customerId && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Link className="w-4 h-4 text-blue-500" />
                  关联信息
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">关联客户</span>
                    <span className="font-medium">客户 #{selectedSupply.customerId}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">关联手术</span>
                    <span className="font-medium">
                      {selectedSupply.surgeryId ? `手术 #${selectedSupply.surgeryId}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">使用时间</span>
                    <span className="font-medium">
                      {new Date(selectedSupply.usedAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Alert
              type="info"
              showIcon
              content={
                <div>
                  <Text bold>追溯说明：</Text>
                  <Paragraph className="mt-1" style={{ marginBottom: 0 }}>
                    该耗材的全流程信息已记录，可通过批号和追溯码进行全链路追溯。
                    如遇质量问题，可快速定位使用该批次耗材的所有客户。
                  </Paragraph>
                </div>
              }
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
