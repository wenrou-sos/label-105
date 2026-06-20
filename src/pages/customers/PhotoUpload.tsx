import { useState, useRef, useEffect } from 'react';
import { Button, Message, Card, Modal, Tag, Popconfirm } from '@arco-design/web-react';
import { ArrowLeft, Upload, Crop as CropIcon, Trash2, Eye, Check } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getCustomerPhotos, uploadPhoto, deletePhoto, getCustomerById } from '@/services/customerService.ts';
import type { Photo, PhotoAngle, Customer } from '../../../shared/types.ts';

interface PhotoUploadItem {
  angle: PhotoAngle;
  label: string;
  description: string;
  photo: Photo | null;
}

const REQUIRED_ANGLES: PhotoUploadItem[] = [
  { angle: 'front', label: '正面', description: '正视镜头，面部表情自然', photo: null },
  { angle: 'side45', label: '侧面45°', description: '头部转向一侧，与镜头呈45°角', photo: null },
  { angle: 'side90', label: '侧面90°', description: '完全侧面，耳朵轮廓清晰可见', photo: null },
];

export default function PhotoUpload() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [photos, setPhotos] = useState<PhotoUploadItem[]>(REQUIRED_ANGLES);
  const [uploadingAngle, setUploadingAngle] = useState<PhotoAngle | null>(null);
  
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [customerRes, photosRes] = await Promise.all([
        getCustomerById(Number(id)),
        getCustomerPhotos(Number(id)),
      ]);

      if (customerRes.success && customerRes.data) {
        setCustomer(customerRes.data);
      }

      if (photosRes.success && photosRes.data) {
        const preopPhotos = photosRes.data.filter(p => !p.postOpVisitId && ['front', 'side45', 'side90'].includes(p.angle || ''));
        setPhotos(REQUIRED_ANGLES.map(item => ({
          ...item,
          photo: preopPhotos.find(p => p.angle === item.angle) || null,
        })));
      }
    } catch (error) {
      Message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (angle: PhotoAngle) => {
    setUploadingAngle(angle);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Message.error('请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCropModalVisible(true);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCroppedImage = (): Promise<string | null> => {
    if (!completedCrop || !imageRef.current) return Promise.resolve(null);

    const canvas = document.createElement('canvas');
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

    canvas.width = completedCrop.width! * scaleX;
    canvas.height = completedCrop.height! * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);

    ctx.drawImage(
      imageRef.current,
      completedCrop.x! * scaleX,
      completedCrop.y! * scaleY,
      completedCrop.width! * scaleX,
      completedCrop.height! * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(dataUrl);
    });
  };

  const handleCropComplete = async () => {
    if (!uploadingAngle) return;

    const croppedDataUrl = await getCroppedImage();
    if (!croppedDataUrl) {
      Message.error('裁剪失败');
      return;
    }

    setLoading(true);
    try {
      const res = await uploadPhoto(Number(id), {
        type: uploadingAngle,
        angle: uploadingAngle,
        url: croppedDataUrl,
        thumbnailUrl: croppedDataUrl,
      });
      if (res.success && res.data) {
        Message.success('上传成功');
        setCropModalVisible(false);
        setSelectedImage(null);
        setCompletedCrop(null);
        fetchData();
      }
    } catch (error) {
      Message.error('上传失败');
    } finally {
      setLoading(false);
      setUploadingAngle(null);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    try {
      const res = await deletePhoto(photoId);
      if (res.success) {
        Message.success('删除成功');
        fetchData();
      }
    } catch (error) {
      Message.error('删除失败');
    }
  };

  const handlePreview = (url: string) => {
    setPreviewImage(url);
    setPreviewModalVisible(true);
  };

  const allUploaded = photos.every(p => p.photo !== null);

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              type="text"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate(`/customers/${id}`)}
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">术前照片上传</h2>
              {customer && (
                <p className="text-sm text-gray-500 mt-1">
                  顾客：{customer.name} | 性别：{customer.gender === 'female' ? '女' : '男'}
                </p>
              )}
            </div>
          </div>
          {allUploaded && (
            <Tag color="green" icon={<Check className="w-3 h-3" />}>
              所有角度已上传
            </Tag>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-800 mb-2">拍摄要求</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>请在纯色背景下拍摄，确保光线充足均匀</li>
            <li>不戴眼镜、帽子等饰品，头发向后梳理露出面部轮廓</li>
            <li>保持自然表情，不要过度夸张或刻意</li>
            <li>照片比例建议为 3:4（竖版）</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {photos.map((item) => (
            <Card
              key={item.angle}
              className={`relative overflow-hidden ${item.photo ? 'border-green-200' : ''}`}
              bordered
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-800">{item.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                </div>
                {item.photo && (
                  <Tag color="green" size="small">已上传</Tag>
                )}
              </div>

              {item.photo ? (
                <div className="relative group">
                  <img
                    src={item.photo.thumbnailUrl || item.photo.url}
                    alt={item.label}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button
                      type="primary"
                      size="small"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => handlePreview(item.photo!.url)}
                    >
                      预览
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CropIcon className="w-4 h-4" />}
                      onClick={() => handleFileSelect(item.angle)}
                    >
                      重新上传
                    </Button>
                    <Popconfirm
                      title="确认删除"
                      content="确定要删除这张照片吗？"
                      onOk={() => handleDeletePhoto(item.photo!.id)}
                    >
                      <Button
                        status="danger"
                        size="small"
                        icon={<Trash2 className="w-4 h-4" />}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => handleFileSelect(item.angle)}
                  className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium">点击上传</p>
                  <p className="text-xs text-gray-400 mt-1">{item.label}照片</p>
                </div>
              )}
            </Card>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </Card>

      <Modal
        title="裁剪照片"
        visible={cropModalVisible}
        onOk={handleCropComplete}
        onCancel={() => {
          setCropModalVisible(false);
          setSelectedImage(null);
          setCompletedCrop(null);
          setUploadingAngle(null);
        }}
        okText="确认裁剪并上传"
        cancelText="取消"
        style={{ width: 700 }}
        confirmLoading={loading}
      >
        {selectedImage && (
          <div className="flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={3 / 4}
              className="max-h-[500px]"
            >
              <img
                ref={imageRef}
                src={selectedImage}
                alt="Crop preview"
                style={{ maxHeight: '500px', maxWidth: '100%' }}
              />
            </ReactCrop>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-4 text-center">
          拖动选框调整裁剪区域，保持 3:4 比例
        </p>
      </Modal>

      <Modal
        title="照片预览"
        visible={previewModalVisible}
        onOk={() => setPreviewModalVisible(false)}
        onCancel={() => setPreviewModalVisible(false)}
        okText="关闭"
        footer={null}
        style={{ width: 600 }}
      >
        {previewImage && (
          <img
            src={previewImage}
            alt="Preview"
            className="w-full rounded-lg"
          />
        )}
      </Modal>
    </div>
  );
}
