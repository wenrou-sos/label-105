import { useState, useEffect } from 'react';
import { Form, Input, Button, Radio, DatePicker, Message, Space, Card } from '@arco-design/web-react';
import { User, Phone, Calendar, MapPin, Save, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCustomer, updateCustomer, getCustomerById } from '@/services/customerService.ts';
import type { Customer } from '../../../shared/types.ts';

const FormItem = Form.Item;
const { TextArea } = Input;
const { Group: RadioGroup } = Radio;

export default function CustomerForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

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
      }
    } catch (error) {
      Message.error('获取顾客信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Partial<Customer>) => {
    setLoading(true);
    try {
      const data: Partial<Customer> & { birthday?: string } = {
        ...values,
        birthday: values.birthday ? values.birthday.toISOString() : undefined,
      } as Partial<Customer> & { birthday?: string };
      
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
    } catch (error) {
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
