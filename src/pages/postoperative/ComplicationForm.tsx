import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Space,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Modal,
  Message,
  Tag,
  Grid,
  Drawer,
} from '@arco-design/web-react';
import {
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Save,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getComplications,
  createComplication,
  updateComplication,
  deleteComplication,
} from '@/services/postopService.ts';
import { getSurgeries } from '@/services/surgeryService.ts';
import type { Complication, Surgery } from '../../../shared/types.ts';

const { Row, Col } = Grid;
const { TextArea } = Input;

const categoryOptions = [
  { value: '感染', label: '感染' },
  { value: '出血', label: '出血' },
  { value: '血肿', label: '血肿' },
  { value: '瘢痕增生', label: '瘢痕增生' },
  { value: '神经损伤', label: '神经损伤' },
  { value: '过敏反应', label: '过敏反应' },
  { value: '其他', label: '其他' },
];

export default function ComplicationForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<(Complication & { customerName?: string; surgeryName?: string; recordedByName?: string })[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Complication | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
    fetchSurgeries();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getComplications();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (error) {
      Message.error('获取并发症列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchSurgeries = async () => {
    try {
      const res = await getSurgeries({ page: 1, pageSize: 100 });
      if (res.success && res.data) {
        setSurgeries(res.data.list);
      }
    } catch (error) {
      Message.error('获取手术列表失败');
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleEdit = (record: typeof data[0]) => {
    setEditingRecord(record);
    form.setFieldsValue({
      surgeryId: record.surgeryId,
      category: record.category,
      description: record.description,
      treatment: record.treatment,
      occurredAt: new Date(record.occurredAt),
      resolvedAt: record.resolvedAt ? new Date(record.resolvedAt) : undefined,
    });
    setDrawerVisible(true);
  };

  const handleDelete = (record: typeof data[0]) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除该并发症记录吗？`,
      onOk: async () => {
        try {
          await deleteComplication(record.id);
          Message.success('删除成功');
          fetchData();
        } catch (error) {
          Message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async (values: Partial<Complication>) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        occurredAt: values.occurredAt?.toISOString(),
        resolvedAt: values.resolvedAt?.toISOString(),
      };

      if (editingRecord) {
        await updateComplication(editingRecord.id, data);
        Message.success('更新成功');
      } else {
        await createComplication(values.surgeryId!, data);
        Message.success('创建成功');
      }
      setDrawerVisible(false);
      fetchData();
    } catch (error) {
      Message.error(editingRecord ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const surgeryOptions = surgeries.map((s) => ({
    value: s.id,
    label: `${s.surgeryName} - ${new Date(s.surgeryDate).toLocaleDateString('zh-CN')}`,
  }));

  const columns = [
    {
      title: '顾客信息',
      dataIndex: 'customerName',
      render: (text: string, record: typeof data[0]) => (
        <Space>
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <User className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <div className="font-medium">{text || '-'}</div>
            <div className="text-xs text-gray-500">{record.surgeryName}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      render: (text: string) => (
        <Tag color="red" icon={<AlertTriangle className="w-3 h-3" />}>
          {text}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      render: (text: string) => (
        <div className="max-w-xs truncate" title={text}>
          {text}
        </div>
      ),
    },
    {
      title: '发生时间',
      dataIndex: 'occurredAt',
      render: (date: Date) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'resolvedAt',
      render: (date?: Date) =>
        date ? (
          <Space size={4}>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-green-600">已解决</span>
          </Space>
        ) : (
          <Space size={4}>
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-orange-600">处理中</span>
          </Space>
        ),
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
            onClick={() => handleEdit(record)}
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
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={<ArrowLeft className="w-5 h-5" />}
              onClick={() => navigate('/postoperative')}
            />
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">并发症记录</h1>
                <p className="text-sm text-gray-500">管理和记录术后并发症情况</p>
              </div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAdd}
          >
            新增记录
          </Button>
        </div>

        <Table
          loading={loading}
          columns={columns}
          data={data}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: true }}
        />
      </Card>

      <Drawer
        width={520}
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>{editingRecord ? '编辑并发症记录' : '新增并发症记录'}</span>
          </div>
        }
        visible={drawerVisible}
        onOk={() => form.submit()}
        onCancel={() => setDrawerVisible(false)}
        okText={editingRecord ? '更新' : '保存'}
        cancelText="取消"
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit}
          initialValues={{ category: '其他' }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="关联手术"
                field="surgeryId"
                rules={[{ required: true, message: '请选择手术' }]}
              >
                <Select
                  placeholder="请选择手术"
                  options={surgeryOptions}
                  disabled={!!editingRecord}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="并发症分类"
                field="category"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="请选择分类" options={categoryOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="发生时间"
                field="occurredAt"
                rules={[{ required: true, message: '请选择发生时间' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择日期"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="症状描述"
            field="description"
            rules={[{ required: true, message: '请输入症状描述' }]}
          >
            <TextArea
              placeholder="请详细描述症状..."
              style={{ minHeight: 100 }}
              maxLength={500}
              showWordLimit
            />
          </Form.Item>

          <Form.Item label="处理措施" field="treatment">
            <TextArea
              placeholder="请描述采取的处理措施..."
              style={{ minHeight: 100 }}
              maxLength={500}
              showWordLimit
            />
          </Form.Item>

          <Form.Item label="解决时间" field="resolvedAt">
            <DatePicker
              style={{ width: '100%' }}
              placeholder="如已解决请选择解决日期"
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
