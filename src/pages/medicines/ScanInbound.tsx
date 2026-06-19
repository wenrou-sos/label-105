import { useEffect, useState } from 'react';
import {
  Card,
  Space,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Message,
  Tag,
  Grid,
  Steps,
  List,
  Divider,
  Badge,
} from '@arco-design/web-react';
import {
  ArrowLeft,
  QrCode,
  ArrowDownToLine,
  CheckCircle,
  Plus,
  Trash2,
  Barcode,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMedicines, createBatch, addTraceCodes, scanInbound } from '@/services/medicineService.ts';
import type { Medicine, MedicineBatch } from '../../../shared/types.ts';

const { Row, Col } = Grid;
const { Step } = Steps;
const { TextArea } = Input;

const generateTraceCode = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRC-${timestamp}-${random}`;
};

export default function ScanInbound() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const [batchInfo, setBatchInfo] = useState<Partial<MedicineBatch> | null>(null);
  const [createdBatch, setCreatedBatch] = useState<MedicineBatch | null>(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await getMedicines({ page: 1, pageSize: 100 });
      if (res.success && res.data) {
        setMedicines(res.data.list);
      }
    } catch (error) {
      Message.error('获取药品列表失败');
    }
  };

  const handleMedicineSelect = (medicineId: number) => {
    const medicine = medicines.find((m) => m.id === medicineId) || null;
    setSelectedMedicine(medicine);
  };

  const generateBatchNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `B${year}${month}${day}${random}`;
  };

  const handleBatchSubmit = async (values: any) => {
    if (!selectedMedicine) {
      Message.error('请先选择药品');
      return;
    }

    setLoading(true);
    try {
      const batchNumber = values.batchNumber || generateBatchNumber();
      const traceCodes = Array.from({ length: values.quantity || 1 }, () => generateTraceCode());

      const batchData = {
        ...values,
        batchNumber,
        expiryDate: values.expiryDate?.toISOString(),
        receivedDate: new Date().toISOString(),
        traceCodes,
      };

      const res = await createBatch(selectedMedicine.id, batchData);
      if (res.success && res.data) {
        setCreatedBatch(res.data);
        setBatchInfo(batchData);
        setScannedCodes(traceCodes);
        setStep(1);
        Message.success('批次创建成功');
      }
    } catch (error) {
      Message.error('创建批次失败');
    } finally {
      setLoading(false);
    }
  };

  const handleManualScan = () => {
    const newCode = generateTraceCode();
    setScannedCodes((prev) => [...prev, newCode]);
  };

  const handleAutoGenerate = async (count: number) => {
    if (!createdBatch) return;

    setLoading(true);
    try {
      const newCodes = Array.from({ length: count }, () => generateTraceCode());
      const res = await addTraceCodes(createdBatch.id, newCodes);
      if (res.success && res.data) {
        setScannedCodes((prev) => [...prev, ...newCodes]);
        Message.success(`成功生成 ${count} 个追溯码`);
      }
    } catch (error) {
      Message.error('生成追溯码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCode = (code: string) => {
    setScannedCodes((prev) => prev.filter((c) => c !== code));
  };

  const handleFinish = async () => {
    setStep(2);
    Message.success('入库完成');
  };

  const medicineOptions = medicines.map((m) => ({
    value: m.id,
    label: `${m.name} - ${m.specifications}`,
  }));

  const renderStep0 = () => (
    <Form
      form={form}
      layout="vertical"
      onSubmit={handleBatchSubmit}
      initialValues={{
        batchNumber: generateBatchNumber(),
        quantity: 1,
      }}
    >
      <Row gutter={24}>
        <Col span={24} md={12}>
          <Form.Item
            label="选择药品"
            field="medicineId"
            rules={[{ required: true, message: '请选择药品' }]}
          >
            <Select
              placeholder="请选择入库药品"
              options={medicineOptions}
              onChange={handleMedicineSelect}
              showSearch
            />
          </Form.Item>
        </Col>
        <Col span={24} md={12}>
          <Form.Item
            label="批次号"
            field="batchNumber"
            rules={[{ required: true, message: '请输入批次号' }]}
          >
            <Input placeholder="系统自动生成或手动输入" />
          </Form.Item>
        </Col>
      </Row>

      {selectedMedicine && (
        <Card className="mb-6 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Package className="w-8 h-8 text-indigo-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{selectedMedicine.name}</h3>
              <p className="text-gray-500">
                {selectedMedicine.specifications} | {selectedMedicine.manufacturer}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <Tag color="blue">当前库存: {selectedMedicine.stock} {selectedMedicine.unit}</Tag>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Row gutter={24}>
        <Col span={24} md={8}>
          <Form.Item
            label="入库数量"
            field="quantity"
            rules={[{ required: true, message: '请输入入库数量' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={10000}
              placeholder="请输入数量"
            />
          </Form.Item>
        </Col>
        <Col span={24} md={8}>
          <Form.Item
            label="有效期"
            field="expiryDate"
            rules={[{ required: true, message: '请选择有效期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择有效期"
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Col>
        <Col span={24} md={8}>
          <Form.Item label="备注" field="remarks">
            <Input placeholder="请输入备注" />
          </Form.Item>
        </Col>
      </Row>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button onClick={() => navigate('/medicines')}>取消</Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={<ArrowDownToLine className="w-4 h-4" />}
        >
          创建批次并生成追溯码
        </Button>
      </div>
    </Form>
  );

  const renderStep1 = () => (
    <div>
      <Card className="mb-6 bg-gray-50">
        <h3 className="font-semibold mb-4">批次信息</h3>
        <Row gutter={24}>
          <Col span={12} md={6}>
            <div className="text-sm text-gray-500 mb-1">药品名称</div>
            <div className="font-medium">{selectedMedicine?.name}</div>
          </Col>
          <Col span={12} md={6}>
            <div className="text-sm text-gray-500 mb-1">批次号</div>
            <div className="font-medium font-mono">{batchInfo?.batchNumber}</div>
          </Col>
          <Col span={12} md={6}>
            <div className="text-sm text-gray-500 mb-1">入库数量</div>
            <div className="font-medium">{batchInfo?.quantity} {selectedMedicine?.unit}</div>
          </Col>
          <Col span={12} md={6}>
            <div className="text-sm text-gray-500 mb-1">有效期</div>
            <div className="font-medium">
              {batchInfo?.expiryDate && new Date(batchInfo.expiryDate).toLocaleDateString('zh-CN')}
            </div>
          </Col>
        </Row>
      </Card>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <Space>
          <h3 className="font-semibold">追溯码列表</h3>
          <Badge count={scannedCodes.length} color="blue" />
        </Space>
        <Space>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={handleManualScan}
          >
            手动扫码
          </Button>
          <Button
            icon={<Barcode className="w-4 h-4" />}
            onClick={() => handleAutoGenerate(10)}
          >
            批量生成10个
          </Button>
        </Space>
      </div>

      <Card style={{ maxHeight: 400, overflow: 'auto' }}>
        <List
          size="small"
          dataSource={scannedCodes}
          render={(item, index) => (
            <List.Item
              key={item}
              actions={[
                <Button
                  key="delete"
                  type="text"
                  size="small"
                  status="danger"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => handleRemoveCode(item)}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-green-500" />
                  </div>
                }
                title={
                  <Space>
                    <span className="font-mono">{item}</span>
                    <Tag color="green">待入库</Tag>
                  </Space>
                }
                description={`第 ${index + 1} 个`}
              />
            </List.Item>
          )}
        />
        {scannedCodes.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无追溯码，请扫码或批量生成</p>
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-3 pt-4 mt-6 border-t">
        <Button onClick={() => setStep(0)}>上一步</Button>
        <Button
          type="primary"
          onClick={handleFinish}
          loading={loading}
          icon={<CheckCircle className="w-4 h-4" />}
        >
          确认入库
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">入库成功</h2>
      <p className="text-gray-500 mb-8">
        已成功入库 {scannedCodes.length} 个 {selectedMedicine?.name}
      </p>

      <Card className="max-w-md mx-auto text-left">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">批次号</span>
            <span className="font-mono">{batchInfo?.batchNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">药品名称</span>
            <span>{selectedMedicine?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">入库数量</span>
            <span>{scannedCodes.length} {selectedMedicine?.unit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">追溯码数量</span>
            <span>{scannedCodes.length} 个</span>
          </div>
          <Divider />
          <div className="flex justify-between">
            <span className="text-gray-500">入库时间</span>
            <span>{new Date().toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </Card>

      <div className="flex justify-center gap-3 mt-8">
        <Button onClick={() => navigate('/medicines')}>返回列表</Button>
        <Button
          type="primary"
          onClick={() => {
            setStep(0);
            setScannedCodes([]);
            setBatchInfo(null);
            setCreatedBatch(null);
            form.resetFields();
            form.setFieldValue('batchNumber', generateBatchNumber());
          }}
        >
          继续入库
        </Button>
      </div>
    </div>
  );

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
            <div className="p-2 rounded-lg bg-green-100">
              <ArrowDownToLine className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">扫码入库</h1>
              <p className="text-sm text-gray-500">扫描药品追溯码完成入库</p>
            </div>
          </div>
        </div>

        <Steps current={step} className="mb-8 max-w-2xl mx-auto">
          <Step title="创建批次" description="选择药品和批次信息" />
          <Step title="扫码录入" description="扫描或生成追溯码" />
          <Step title="完成" description="入库成功" />
        </Steps>

        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </Card>
    </div>
  );
}
