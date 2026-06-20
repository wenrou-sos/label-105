import { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Radio, Button, Card, Space, Message, Steps, Grid } from '@arco-design/web-react';
import { Scissors, User, Calendar, Syringe, FileText, Save, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { createSurgery, updateSurgery } from '@/services/surgeryService';
import type { Surgery, AnesthesiaType } from '../../../shared/types';

const { Row, Col } = Grid;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const SURGERY_NAMES = [
  '双眼皮手术',
  '隆鼻手术',
  '抽脂手术',
  '隆胸手术',
  '面部填充',
  '注射除皱',
  '其他',
];

interface SurgeryFormProps {
  customerId?: number;
  surgeryId?: number;
  initialData?: Partial<Surgery>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SurgeryForm({ customerId, surgeryId, initialData, onSuccess, onCancel }: SurgeryFormProps) {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!surgeryId && !initialData) {
      const dateParam = searchParams.get('date');
      if (dateParam) {
        const parsed = new Date(`${dateParam}T10:00:00`);
        if (!isNaN(parsed.getTime())) {
          form.setFieldValue('surgeryDate', parsed);
        }
      }
    }
  }, [surgeryId, initialData, searchParams, form]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const data = {
        ...values,
        surgeryDate: values.surgeryDate ? values.surgeryDate.toISOString() : undefined,
      };

      let response;
      if (surgeryId) {
        response = await updateSurgery(surgeryId, data);
      } else if (customerId) {
        response = await createSurgery(customerId, data);
      } else {
        Message.error('请选择客户');
        setSubmitting(false);
        return;
      }

      if (response.success) {
        Message.success(surgeryId ? '更新成功' : '创建成功');
        onSuccess?.();
      }
    } catch (error) {
      Message.error(surgeryId ? '更新失败' : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    const values = await form.validate();
    if (values) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleConfirm = async () => {
    const values = await form.validate();
    if (values) {
      handleSubmit(values);
    }
  };

  const steps = [
    { title: '基本信息', icon: <FileText className="w-4 h-4" /> },
    { title: '手术详情', icon: <Scissors className="w-4 h-4" /> },
    { title: '确认提交', icon: <Save className="w-4 h-4" /> },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="客户ID"
                field="customerId"
                rules={[{ required: true, message: '请输入客户ID' }]}
              >
                <Input
                  type="number"
                  placeholder="请输入客户ID"
                  prefix={<User className="w-4 h-4 text-gray-400" />}
                  disabled={!!customerId}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="手术日期"
                field="surgeryDate"
                rules={[{ required: true, message: '请选择手术日期' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder="请选择手术日期和时间"
                  prefix={<Calendar className="w-4 h-4 text-gray-400" />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="术者ID"
                field="surgeonId"
                rules={[{ required: true, message: '请选择术者' }]}
              >
                <Select
                  placeholder="请选择术者"
                  style={{ width: '100%' }}
                  prefix={<User className="w-4 h-4 text-gray-400" />}
                >
                  <Option value={1}>张医生</Option>
                  <Option value={2}>李医生</Option>
                  <Option value={3}>王医生</Option>
                  <Option value={4}>刘医生</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="麻醉方式"
                field="anesthesiaType"
                rules={[{ required: true, message: '请选择麻醉方式' }]}
              >
                <Radio.Group>
                  <Radio value="local">
                    <Space>
                      <Syringe className="w-4 h-4 text-cyan-500" />
                      局麻
                    </Space>
                  </Radio>
                  <Radio value="general">
                    <Space>
                      <Syringe className="w-4 h-4 text-purple-500" />
                      全麻
                    </Space>
                  </Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
        );
      case 1:
        return (
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                label="手术名称"
                field="surgeryName"
                rules={[{ required: true, message: '请选择手术名称' }]}
              >
                <Select
                  placeholder="请选择手术名称"
                  style={{ width: '100%' }}
                  prefix={<Scissors className="w-4 h-4 text-pink-500" />}
                >
                  {SURGERY_NAMES.map((name) => (
                    <Option key={name} value={name}>
                      {name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="手术状态"
                field="status"
                rules={[{ required: true, message: '请选择手术状态' }]}
              >
                <Radio.Group>
                  <Radio value="scheduled">已预约</Radio>
                  <Radio value="in_progress">进行中</Radio>
                  <Radio value="completed">已完成</Radio>
                  <Radio value="cancelled">已取消</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="手术备注" field="operationNotes">
                <TextArea
                  placeholder="请输入手术备注信息..."
                  style={{ minHeight: 120 }}
                  showWordLimit
                  maxLength={1000}
                />
              </Form.Item>
            </Col>
          </Row>
        );
      case 2:
        return (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">请确认以下信息</h3>
            <div className="space-y-3">
              <Form.Item shouldUpdate noStyle>
                {({ getFieldsValue }) => {
                  const values = getFieldsValue();
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-500">客户ID</span>
                        <span className="font-medium">{values.customerId || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-500">手术日期</span>
                        <span className="font-medium">
                          {values.surgeryDate
                            ? new Date(values.surgeryDate).toLocaleString('zh-CN')
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-500">术者ID</span>
                        <span className="font-medium">{values.surgeonId || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-500">麻醉方式</span>
                        <span className="font-medium">
                          {values.anesthesiaType === 'local' ? '局麻' : values.anesthesiaType === 'general' ? '全麻' : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-500">手术名称</span>
                        <span className="font-medium">{values.surgeryName || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-500">手术状态</span>
                        <span className="font-medium">{values.status || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-500">手术备注</span>
                        <span className="font-medium max-w-xs text-right">{values.operationNotes || '-'}</span>
                      </div>
                    </div>
                  );
                }}
              </Form.Item>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {surgeryId ? '编辑手术' : '新增手术'}
            </h1>
            <p className="text-gray-500 text-sm">
              {surgeryId ? '修改手术项目信息' : '录入新的手术项目信息'}
            </p>
          </div>
        </div>

        <Steps current={currentStep} style={{ maxWidth: 600 }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} icon={step.icon} />
          ))}
        </Steps>
      </div>

      <Card className="max-w-4xl mx-auto">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            customerId: customerId || initialData?.customerId,
            surgeryDate: initialData?.surgeryDate ? new Date(initialData.surgeryDate) : undefined,
            surgeonId: initialData?.surgeonId,
            anesthesiaType: (initialData?.anesthesiaType as AnesthesiaType) || 'local',
            surgeryName: initialData?.surgeryName,
            status: initialData?.status || 'scheduled',
            operationNotes: initialData?.operationNotes,
          }}
          onSubmit={handleSubmit}
        >
          {renderStepContent()}

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Space>
              {currentStep > 0 && (
                <Button onClick={handlePrev} icon={<ArrowLeft className="w-4 h-4" />}>
                  上一步
                </Button>
              )}
              {onCancel && (
                <Button onClick={onCancel}>取消</Button>
              )}
            </Space>
            <Space>
              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={handleNext} icon={<ArrowRight className="w-4 h-4" />}>
                  下一步
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button
                  type="primary"
                  onClick={handleConfirm}
                  loading={submitting}
                  icon={<Save className="w-4 h-4" />}
                >
                  确认提交
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
}
