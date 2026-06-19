import { useEffect, useState } from 'react';
import { Form, Card, Space, Button, DatePicker, Input, Select, Message, Grid } from '@arco-design/web-react';
import { ArrowLeft, Save, Activity } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPostOpVisitById, createPostOpVisit, updatePostOpVisit } from '@/services/postopService.ts';
import { getSurgeries } from '@/services/surgeryService.ts';
import type { PostOpVisit, LevelType, Surgery } from '../../../shared/types.ts';

const { Row, Col } = Grid;
const { TextArea } = Input;

const LevelSelector = ({
  value,
  onChange,
  label,
}: {
  value?: LevelType;
  onChange?: (val: LevelType) => void;
  label: string;
}) => {
  const colors = ['#00B42A', '#F7BA1E', '#FF7D00', '#F53F3F'];
  const labels = ['无', '轻度', '中度', '重度'];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-4">
        {[0, 1, 2, 3].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange?.(level as LevelType)}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
              value === level
                ? 'border-gray-800 bg-gray-50'
                : 'border-transparent hover:bg-gray-50'
            }`}
          >
            <span
              className="w-6 h-6 rounded-full transition-transform hover:scale-110"
              style={{ backgroundColor: colors[level] }}
            />
            <span className="text-xs text-gray-600">{labels[level]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default function VisitForm() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const isEdit = params.id && params.id !== 'new';

  useEffect(() => {
    fetchSurgeries();
    if (isEdit) {
      fetchVisitDetail(Number(params.id));
    }
  }, [params.id]);

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

  const fetchVisitDetail = async (id: number) => {
    setLoading(true);
    try {
      const res = await getPostOpVisitById(id);
      if (res.success && res.data) {
        form.setFieldsValue({
          surgeryId: res.data.surgeryId,
          visitDate: new Date(res.data.visitDate),
          swellingLevel: res.data.swellingLevel,
          painLevel: res.data.painLevel,
          bruisingLevel: res.data.bruisingLevel,
          sutureRemovalDate: res.data.sutureRemovalDate ? new Date(res.data.sutureRemovalDate) : undefined,
          notes: res.data.notes,
        });
      }
    } catch (error) {
      Message.error('获取回访详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Partial<PostOpVisit>) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        visitDate: values.visitDate?.toISOString(),
        sutureRemovalDate: values.sutureRemovalDate?.toISOString(),
      };

      if (isEdit) {
        await updatePostOpVisit(Number(params.id), data);
        Message.success('更新成功');
      } else {
        await createPostOpVisit(data);
        Message.success('创建成功');
      }
      navigate('/postoperative');
    } catch (error) {
      Message.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const surgeryOptions = surgeries.map((s) => ({
    value: s.id,
    label: `${s.surgeryName} - ${new Date(s.surgeryDate).toLocaleDateString('zh-CN')}`,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="text"
            icon={<ArrowLeft className="w-5 h-5" />}
            onClick={() => navigate('/postoperative')}
          />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-100">
              <Activity className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {isEdit ? '编辑回访记录' : '新增回访记录'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEdit ? '修改术后回访记录信息' : '创建新的术后回访记录'}
              </p>
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit}
          initialValues={{
            swellingLevel: 0 as LevelType,
            painLevel: 0 as LevelType,
            bruisingLevel: 0 as LevelType,
          }}
        >
          <Row gutter={24}>
            <Col span={24} md={12}>
              <Form.Item
                label="关联手术"
                field="surgeryId"
                rules={[{ required: true, message: '请选择手术' }]}
              >
                <Select
                  placeholder="请选择手术"
                  options={surgeryOptions}
                  disabled={isEdit}
                />
              </Form.Item>
            </Col>
            <Col span={24} md={12}>
              <Form.Item
                label="回访日期"
                field="visitDate"
                rules={[{ required: true, message: '请选择回访日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择回访日期"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">恢复情况评估</h3>
            <Row gutter={24}>
              <Col span={24} md={8}>
                <Form.Item
                  field="swellingLevel"
                  rules={[{ required: true, message: '请选择红肿级别' }]}
                >
                  <LevelSelector label="红肿级别" />
                </Form.Item>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  field="painLevel"
                  rules={[{ required: true, message: '请选择疼痛级别' }]}
                >
                  <LevelSelector label="疼痛级别" />
                </Form.Item>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  field="bruisingLevel"
                  rules={[{ required: true, message: '请选择淤青级别' }]}
                >
                  <LevelSelector label="淤青级别" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Row gutter={24}>
            <Col span={24} md={12}>
              <Form.Item label="拆线日期" field="sutureRemovalDate">
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择拆线日期"
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="备注" field="notes">
            <TextArea
              placeholder="请输入备注信息"
              style={{ minHeight: 120 }}
              maxLength={500}
              showWordLimit
            />
          </Form.Item>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={() => navigate('/postoperative')}>取消</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<Save className="w-4 h-4" />}
            >
              {isEdit ? '更新' : '保存'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
