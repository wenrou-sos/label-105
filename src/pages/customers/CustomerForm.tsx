import { useState, useEffect } from 'react';
import { Form, Input, Button, Radio, DatePicker, Message, Space, Card, Checkbox, Tag } from '@arco-design/web-react';
import { User, Phone, Calendar, Save, ArrowLeft, Tag as TagIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCustomer, updateCustomer, getCustomerById, getTags } from '@/services/customerService.ts';
import type { Customer, CustomerTag } from '../../../shared/types.ts';

const FormItem = Form.Item;
const { TextArea } = Input;
const { Group: RadioGroup } = Radio;

const tagColorMap: Record<string, string> = {
  gold: 'gold',
  red: 'red',
  purple: 'purple',
  blue: 'arcoblue',
  orange: 'orange',
  gray: 'gray',
  green: 'green',
  cyan: 'cyan',
  pink: 'pink',
  lime: 'lime',
};

export default function CustomerForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const fetchTags = async () => {
    try {
      const res = await getTags();
      if (res.success && res.data) {
        setTags(res.data);
      }
    } catch (_error) {
      Message.error('获取标签列表失败');
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (isEdit) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res = await getCustomerById(Number(id));
      if (res.success && res.data) {
        const customer = res.data;
        form.setFieldsValue({
          name: customer.name,
          gender: customer.gender,
          phone: customer.phone,
          idCard: customer.idCard,
          birthday: customer.birthday ? new Date(customer.birthday) : undefined,
          contactAddress: customer.contactAddress,
        });
        setSelectedTagIds(customer.tagIds || []);
      }
    } catch (_error) {
      Message.error('获取顾客信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTagChange = (checkedValues: string[]) => {
    setSelectedTagIds(checkedValues.map((v) => Number(v)));
  };

  const handleSubmit = async (values: Partial<Customer>) => {
    setLoading(true);
    try {
      const data: Partial<Customer> & { birthday?: string; tagIds?: number[] } = {
        ...values,
        birthday: values.birthday ? (values.birthday as unknown as Date).toISOString() : undefined,
        tagIds: selectedTagIds,
      } as Partial<Customer> & { birthday?: string; tagIds?: number[] };
      
      if (isEdit) {
        const res = await updateCustomer(Number(id), data);
        if (res.success) {
          Message.success('更新成功');
          navigate('/customers');
        }
      } else {
        const res = await createCustomer(data);
        if (res.success) {
          Message.success('创建成功');
          navigate('/customers');
        }
      }
    } catch (_error) {
      Message.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Button
            type="text"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/customers')}
          />
          <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? '编辑顾客' : '新增顾客'}
          </h2>
        </div>

        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormItem
              field="name"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input
                prefix={<User className="w-4 h-4 text-gray-400" />}
                placeholder="请输入姓名"
                size="large"
              />
            </FormItem>

            <FormItem
              field="gender"
              label="性别"
              rules={[{ required: true, message: '请选择性别' }]}
            >
              <RadioGroup size="large">
                <Radio value="male">男</Radio>
                <Radio value="female">女</Radio>
              </RadioGroup>
            </FormItem>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormItem
              field="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { match: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              ]}
            >
              <Input
                prefix={<Phone className="w-4 h-4 text-gray-400" />}
                placeholder="请输入手机号"
                size="large"
                maxLength={11}
              />
            </FormItem>

            <FormItem
              field="birthday"
              label="出生日期"
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择出生日期"
                size="large"
                prefix={<Calendar className="w-4 h-4 text-gray-400" />}
              />
            </FormItem>
          </div>

          <FormItem
            field="idCard"
            label="身份证号"
            rules={[
              {
                match: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
                message: '请输入正确的身份证号',
              },
            ]}
          >
            <Input
              placeholder="请输入身份证号"
              size="large"
              maxLength={18}
            />
          </FormItem>

          <FormItem
            field="contactAddress"
            label="联系地址"
          >
            <TextArea
              placeholder="请输入联系地址"
              rows={3}
            />
          </FormItem>

          <FormItem
            label="客户标签"
          >
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-3 text-gray-600">
                <TagIcon className="w-4 h-4" />
                <span className="text-sm">选择适合该客户的标签（可多选）</span>
              </div>
              {tags.length > 0 ? (
                <Checkbox.Group
                  value={selectedTagIds.map(String)}
                  onChange={handleTagChange}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                >
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center">
                      <Checkbox value={String(tag.id)}>
                        <Tag color={tagColorMap[tag.color] || 'blue'} style={{ marginLeft: 4 }}>
                          {tag.name}
                        </Tag>
                      </Checkbox>
                    </div>
                  ))}
                </Checkbox.Group>
              ) : (
                <span className="text-gray-400 text-sm">暂无标签，可在系统设置中添加</span>
              )}
              {selectedTagIds.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">已选择 {selectedTagIds.length} 个标签</span>
                </div>
              )}
            </div>
          </FormItem>

          <FormItem>
            <Space className="w-full justify-end">
              <Button
                size="large"
                onClick={() => navigate('/customers')}
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
                {isEdit ? '保存修改' : '创建顾客'}
              </Button>
            </Space>
          </FormItem>
        </Form>
      </Card>
    </div>
  );
}
