import { useState, useEffect } from 'react';
import { Button, Card, Tabs, Tag, Space, Descriptions, Table, Empty, Image, Modal } from '@arco-design/web-react';
import { ArrowLeft, Edit, UserPlus, Camera, Calendar, User, Phone, MapPin, FileText, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomerById, getCustomerConsultation, getCustomerPhotos } from '@/services/customerService.ts';
import type { Customer, Consultation, Photo, Surgery } from '../../../shared/types.ts';

const { TabPane } = Tabs;

const TARGET_AREA_MAP: Record<string, string> = {
  face: '面部',
  eye: '眼部',
  nose: '鼻部',
  chest: '胸部',
  liposuction: '吸脂',
  injection: '注射',
};

const PHOTO_ANGLE_MAP: Record<string, string> = {
  front: '正面',
  side45: '侧面45°',
  side90: '侧面90°',
};

export default function CustomerDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [customerRes, consultationRes, photosRes] = await Promise.all([
        getCustomerById(Number(id)),
        getCustomerConsultation(Number(id)),
        getCustomerPhotos(Number(id)),
      ]);

      if (customerRes.success && customerRes.data) {
        setCustomer(customerRes.data);
      }
      if (consultationRes.success && consultationRes.data) {
        setConsultation(consultationRes.data);
      }
      if (photosRes.success && photosRes.data) {
        setPhotos(photosRes.data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (url: string) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  };

  const surgeryColumns = [
    {
      title: '手术名称',
      dataIndex: 'surgeryName',
    },
    {
      title: '手术日期',
      dataIndex: 'surgeryDate',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          scheduled: { color: 'blue', text: '已预约' },
          in_progress: { color: 'orange', text: '进行中' },
          completed: { color: 'green', text: '已完成' },
          cancelled: { color: 'gray', text: '已取消' },
        };
        const info = statusMap[status] || { color: 'gray', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '麻醉方式',
      dataIndex: 'anesthesiaType',
      render: (type: string) => type === 'local' ? '局部麻醉' : '全身麻醉',
    },
  ];

  const preopPhotos = photos.filter(p => p.angle);
  const postopPhotos = photos.filter(p => p.type === 'postoperative');

  const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) => (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value || '-'}</p>
      </div>
    </div>
  );

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <Empty description={loading ? '加载中...' : '未找到顾客信息'} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card loading={loading}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <Button
              type="text"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/customers')}
            />
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-3xl font-bold">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">{customer.name}</h1>
                <Tag color={customer.gender === 'female' ? 'pink' : 'blue'}>
                  {customer.gender === 'female' ? '女' : '男'}
                </Tag>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <InfoItem
                  icon={<Phone className="w-4 h-4 text-gray-500" />}
                  label="手机号"
                  value={customer.phone}
                />
                <InfoItem
                  icon={<User className="w-4 h-4 text-gray-500" />}
                  label="身份证号"
                  value={customer.idCard}
                />
                <InfoItem
                  icon={<Calendar className="w-4 h-4 text-gray-500" />}
                  label="出生日期"
                  value={customer.birthday ? new Date(customer.birthday).toLocaleDateString('zh-CN') : null}
                />
                <InfoItem
                  icon={<MapPin className="w-4 h-4 text-gray-500" />}
                  label="联系地址"
                  value={customer.contactAddress}
                />
              </div>
            </div>
          </div>

          <Space>
            <Button
              icon={<Edit className="w-4 h-4" />}
              onClick={() => navigate(`/customers/${id}/edit`)}
            >
              编辑信息
            </Button>
            <Button
              type="primary"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => navigate(`/customers/${id}/consultation`)}
            >
              {consultation ? '编辑咨询' : '咨询登记'}
            </Button>
            <Button
              icon={<Camera className="w-4 h-4" />}
              onClick={() => navigate(`/customers/${id}/photos`)}
            >
              上传照片
            </Button>
          </Space>
        </div>
      </Card>

      <Card>
        <Tabs defaultActiveTab="consultation">
          <TabPane key="consultation" title={
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              咨询记录
            </span>
          }>
            {consultation ? (
              <div className="space-y-6">
                <Descriptions
                  column={2}
                  data={[
                    {
                      label: '想改善的部位',
                      value: (
                        <Space wrap>
                          {consultation.targetAreas.map(area => (
                            <Tag key={area} color="blue">
                              {TARGET_AREA_MAP[area] || area}
                            </Tag>
                          ))}
                        </Space>
                      ),
                    },
                    {
                      label: '预算范围',
                      value: consultation.budgetRange,
                    },
                    {
                      label: '咨询时间',
                      value: new Date(consultation.createdAt).toLocaleString('zh-CN'),
                    },
                    {
                      label: '咨询师ID',
                      value: consultation.consultantId,
                    },
                  ]}
                />

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">过往医美史</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                    {consultation.medicalHistory || '-'}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">沟通纪要</h3>
                  <div
                    className="bg-gray-50 rounded-lg p-4 text-gray-700"
                    dangerouslySetInnerHTML={{ __html: consultation.consultationNotes || '-' }}
                  />
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Empty description="暂无咨询记录" />
                <Button
                  type="primary"
                  icon={<UserPlus className="w-4 h-4" />}
                  onClick={() => navigate(`/customers/${id}/consultation`)}
                  className="mt-4"
                >
                  立即登记
                </Button>
              </div>
            )}
          </TabPane>

          <TabPane key="photos" title={
            <span className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              术前照片
            </span>
          }>
            {preopPhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-6">
                {preopPhotos.map(photo => (
                  <div key={photo.id} className="relative group">
                    <Card
                      hoverable
                      cover={
                        <div className="h-64 overflow-hidden">
                          <img
                            src={photo.thumbnailUrl || photo.url}
                            alt={PHOTO_ANGLE_MAP[photo.angle || ''] || '照片'}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => handlePreview(photo.url)}
                          />
                        </div>
                      }
                    >
                      <Card.Meta
                        title={PHOTO_ANGLE_MAP[photo.angle || ''] || '照片'}
                        description={new Date(photo.createdAt).toLocaleDateString('zh-CN')}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<Eye className="w-4 h-4" />}
                        onClick={() => handlePreview(photo.url)}
                        className="absolute top-3 right-3 bg-white/90"
                      >
                        查看
                      </Button>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Empty description="暂无术前照片" />
                <Button
                  type="primary"
                  icon={<Camera className="w-4 h-4" />}
                  onClick={() => navigate(`/customers/${id}/photos`)}
                  className="mt-4"
                >
                  上传照片
                </Button>
              </div>
            )}

            {postopPhotos.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4">术后照片</h3>
                <div className="grid grid-cols-4 gap-4">
                  {postopPhotos.map(photo => (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handlePreview(photo.url)}
                    >
                      <img
                        src={photo.thumbnailUrl || photo.url}
                        alt="术后照片"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabPane>

          <TabPane key="surgeries" title={
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              手术历史
            </span>
          }>
            {customer.surgeries && customer.surgeries.length > 0 ? (
              <Table
                columns={surgeryColumns}
                data={customer.surgeries}
                rowKey="id"
                pagination={false}
              />
            ) : (
              <div className="py-12 text-center">
                <Empty description="暂无手术记录" />
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="照片预览"
        visible={previewVisible}
        onOk={() => setPreviewVisible(false)}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        style={{ width: 700 }}
      >
        {previewImage && (
          <img
            src={previewImage}
            alt="预览"
            className="w-full rounded-lg"
          />
        )}
      </Modal>
    </div>
  );
}
