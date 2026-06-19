import { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Select, Checkbox, Message, Space, Card, Divider } from '@arco-design/web-react';
import { ArrowLeft, Save, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomerConsultation, createConsultation, updateConsultation, getCustomerById } from '@/services/customerService.ts';
import type { Consultation, Customer } from '../../../shared/types.ts';

const FormItem = Form.Item;
const { TextArea } = Input;
const { Group: CheckboxGroup } = Checkbox;

const TARGET_AREA_OPTIONS = [
  { label: '面部', value: 'face' },
  { label: '眼部', value: 'eye' },
  { label: '鼻部', value: 'nose' },
  { label: '胸部', value: 'chest' },
  { label: '吸脂', value: 'liposuction' },
  { label: '注射', value: 'injection' },
];

const BUDGET_OPTIONS = [
  { label: '1万以下', value: '1万以下' },
  { label: '1-3万', value: '1-3万' },
  { label: '3-5万', value: '3-5万' },
  { label: '5-10万', value: '5-10万' },
  { label: '10-20万', value: '10-20万' },
  { label: '20万以上', value: '20万以上' },
];

export default function ConsultationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorContent, setEditorContent] = useState('');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [customerRes, consultationRes] = await Promise.all([
        getCustomerById(Number(id)),
        getCustomerConsultation(Number(id)),
      ]);

      if (customerRes.success && customerRes.data) {
        setCustomer(customerRes.data);
      }

      if (consultationRes.success && consultationRes.data) {
        const consultation = consultationRes.data;
        form.setFieldsValue({
          targetAreas: consultation.targetAreas,
          budgetRange: consultation.budgetRange,
          medicalHistory: consultation.medicalHistory,
        });
        setEditorContent(consultation.consultationNotes);
        if (editorRef.current) {
          editorRef.current.innerHTML = consultation.consultationNotes;
        }
      }
    } catch (error) {
      Message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setEditorContent(editorRef.current.innerHTML);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setEditorContent(editorRef.current.innerHTML);
    }
  };

  const handleSubmit = async (values: Partial<Consultation>) => {
    if (!editorContent.trim()) {
      Message.error('请填写沟通纪要');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...values,
        consultationNotes: editorContent,
      };

      const existingConsultation = await getCustomerConsultation(Number(id));
      
      if (existingConsultation.success && existingConsultation.data) {
        const res = await updateConsultation(Number(id), data);
        if (res.success) {
          Message.success('更新成功');
          navigate(`/customers/${id}`);
        }
      } else {
        const res = await createConsultation(Number(id), data);
        if (res.success) {
          Message.success('创建成功');
          navigate(`/customers/${id}`);
        }
      }
    } catch (error) {
      Message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const ToolbarButton = ({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-600 hover:text-gray-900"
    >
      {children}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Button
            type="text"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(`/customers/${id}`)}
          />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">咨询登记</h2>
            {customer && (
              <p className="text-sm text-gray-500 mt-1">
                顾客：{customer.name} | 性别：{customer.gender === 'female' ? '女' : '男'} | 电话：{customer.phone}
              </p>
            )}
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <FormItem
            field="targetAreas"
            label="想改善的部位"
            rules={[{ required: true, message: '请至少选择一个想改善的部位' }]}
          >
            <CheckboxGroup options={TARGET_AREA_OPTIONS} />
          </FormItem>

          <FormItem
            field="budgetRange"
            label="预算范围"
            rules={[{ required: true, message: '请选择预算范围' }]}
          >
            <Select
              placeholder="请选择预算范围"
              options={BUDGET_OPTIONS}
              size="large"
              style={{ width: 300 }}
            />
          </FormItem>

          <FormItem
            field="medicalHistory"
            label="过往医美史"
            rules={[{ required: true, message: '请填写过往医美史' }]}
          >
            <TextArea
              placeholder="请详细描述过往的医美经历、手术史、过敏史等"
              rows={4}
              showWordLimit
              maxLength={1000}
            />
          </FormItem>

          <Divider />

          <FormItem
            label="沟通纪要"
            required
            validateStatus={!editorContent.trim() ? 'error' : undefined}
            help={!editorContent.trim() ? '请填写沟通纪要' : ''}
          >
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
                <ToolbarButton onClick={() => execCommand('bold')} title="加粗">
                  <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('italic')} title="斜体">
                  <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('underline')} title="下划线">
                  <Underline className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="无序列表">
                  <List className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <ToolbarButton onClick={() => execCommand('justifyLeft')} title="左对齐">
                  <AlignLeft className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('justifyCenter')} title="居中">
                  <AlignCenter className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('justifyRight')} title="右对齐">
                  <AlignRight className="w-4 h-4" />
                </ToolbarButton>
              </div>
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                className="min-h-[200px] p-4 focus:outline-none"
                style={{ minHeight: '200px' }}
                data-placeholder="请输入沟通纪要..."
              />
            </div>
          </FormItem>

          <FormItem>
            <Space className="w-full justify-end">
              <Button
                size="large"
                onClick={() => navigate(`/customers/${id}`)}
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                icon={<Save className="w-4 h-4" />}
              >
                保存咨询记录
              </Button>
            </Space>
          </FormItem>
        </Form>
      </Card>
    </div>
  );
}
