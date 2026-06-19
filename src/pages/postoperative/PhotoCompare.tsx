import { useEffect, useState, useRef } from 'react';
import {
  Card,
  Space,
  Button,
  Select,
  Tabs,
  Slider,
  Empty,
  Message,
  Grid,
  Tag,
} from '@arco-design/web-react';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Image as ImageIcon,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPhotoComparison } from '@/services/postopService.ts';
import { getCustomers } from '@/services/customerService.ts';
import type { Photo, PhotoAngle, Customer } from '../../../shared/types.ts';

const { Row, Col } = Grid;

const angleTabs = [
  { key: 'front', label: '正面' },
  { key: 'side45', label: '侧面45°' },
  { key: 'side90', label: '侧面90°' },
];

const mockPreOpPhotos: Record<PhotoAngle, string> = {
  front: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
  side45: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop',
  side90: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
};

const mockPostOpPhotos: Record<PhotoAngle, string> = {
  front: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
  side45: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
  side90: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop',
};

export default function PhotoCompare() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [currentAngle, setCurrentAngle] = useState<PhotoAngle>('front');
  const [zoom, setZoom] = useState(100);
  const [preOpIndex, setPreOpIndex] = useState(0);
  const [postOpIndex, setPostOpIndex] = useState(0);
  const [preOpPhotos, setPreOpPhotos] = useState<Photo[]>([]);
  const [postOpPhotos, setPostOpPhotos] = useState<Photo[]>([]);
  const preImageRef = useRef<HTMLDivElement>(null);
  const postImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchPhotos(selectedCustomer);
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      const res = await getCustomers({ page: 1, pageSize: 100 });
      if (res.success && res.data) {
        setCustomers(res.data.list);
      }
    } catch (error) {
      Message.error('获取顾客列表失败');
    }
  };

  const fetchPhotos = async (customerId: number) => {
    setLoading(true);
    try {
      const res = await getPhotoComparison(customerId);
      if (res.success && res.data) {
        setPreOpPhotos(res.data.preOpPhotos);
        setPostOpPhotos(res.data.postOpPhotos);
        setPreOpIndex(0);
        setPostOpIndex(0);
      }
    } catch (error) {
      Message.error('获取照片失败');
    } finally {
      setLoading(false);
    }
  };

  const handleZoomChange = (value: number) => {
    setZoom(value);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const handleReset = () => {
    setZoom(100);
    setPreOpIndex(0);
    setPostOpIndex(0);
  };

  const handleSyncScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target === preImageRef.current && postImageRef.current) {
      postImageRef.current.scrollTop = target.scrollTop;
      postImageRef.current.scrollLeft = target.scrollLeft;
    } else if (target === postImageRef.current && preImageRef.current) {
      preImageRef.current.scrollTop = target.scrollTop;
      preImageRef.current.scrollLeft = target.scrollLeft;
    }
  };

  const filteredPreOpPhotos = preOpPhotos.filter((p) => p.angle === currentAngle);
  const filteredPostOpPhotos = postOpPhotos.filter((p) => p.angle === currentAngle);

  const currentPrePhoto = filteredPreOpPhotos[preOpIndex] || null;
  const currentPostPhoto = filteredPostOpPhotos[postOpIndex] || null;

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const PhotoPanel = ({
    title,
    photos,
    currentIndex,
    setCurrentIndex,
    imageRef,
    isPre = true,
  }: {
    title: string;
    photos: Photo[];
    currentIndex: number;
    setCurrentIndex: (index: number) => void;
    imageRef: React.RefObject<HTMLDivElement>;
    isPre?: boolean;
  }) => {
    const filteredPhotos = photos.filter((p) => p.angle === currentAngle);
    const currentPhoto = filteredPhotos[currentIndex];

    const displayUrl = currentPhoto?.url || (isPre ? mockPreOpPhotos[currentAngle] : mockPostOpPhotos[currentAngle]);

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <Space>
            <Tag color={isPre ? 'blue' : 'green'}>{title}</Tag>
            {filteredPhotos.length > 1 && (
              <span className="text-sm text-gray-500">
                {currentIndex + 1} / {filteredPhotos.length}
              </span>
            )}
          </Space>
          {filteredPhotos.length > 1 && (
            <Space size={4}>
              <Button
                type="text"
                size="small"
                icon={<ChevronLeft className="w-4 h-4" />}
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(currentIndex - 1)}
              />
              <Button
                type="text"
                size="small"
                icon={<ChevronRight className="w-4 h-4" />}
                disabled={currentIndex === filteredPhotos.length - 1}
                onClick={() => setCurrentIndex(currentIndex + 1)}
              />
            </Space>
          )}
        </div>

        <div
          ref={imageRef}
          className="flex-1 bg-gray-100 rounded-xl overflow-hidden relative"
          style={{ minHeight: 500 }}
          onScroll={handleSyncScroll}
        >
          {displayUrl ? (
            <div
              className="w-full h-full flex items-center justify-center overflow-auto"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
            >
              <img
                src={displayUrl}
                alt={isPre ? '术前' : '术后'}
                className="object-contain"
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p>暂无{isPre ? '术前' : '术后'}照片</p>
            </div>
          )}
        </div>

        {currentPhoto && (
          <div className="mt-3 text-sm text-gray-500">
            上传时间：{new Date(currentPhoto.createdAt).toLocaleDateString('zh-CN')}
          </div>
        )}
      </div>
    );
  };

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
              <div className="p-2 rounded-lg bg-blue-100">
                <ImageIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">术前术后照片对比</h1>
                <p className="text-sm text-gray-500">同角度并排对比，支持同步缩放</p>
              </div>
            </div>
          </div>

          <Space>
            <Select
              placeholder="请选择顾客"
              style={{ width: 200 }}
              value={selectedCustomer}
              onChange={(val) => setSelectedCustomer(val)}
              options={customerOptions}
            />
          </Space>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <Tabs
            activeTab={currentAngle}
            onChange={(key) => {
              setCurrentAngle(key as PhotoAngle);
              setPreOpIndex(0);
              setPostOpIndex(0);
            }}
            type="card"
          >
            {angleTabs.map((tab) => (
              <Tabs.TabPane key={tab.key} title={tab.label} />
            ))}
          </Tabs>

          <Space size={16}>
            <Space size={8}>
              <Button
                type="text"
                icon={<ZoomOut className="w-4 h-4" />}
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              />
              <Slider
                style={{ width: 150 }}
                value={zoom}
                onChange={handleZoomChange}
                min={50}
                max={200}
                step={5}
              />
              <Button
                type="text"
                icon={<ZoomIn className="w-4 h-4" />}
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              />
              <span className="text-sm text-gray-500 w-12">{zoom}%</span>
            </Space>
            <Button icon={<RotateCcw className="w-4 h-4" />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </div>

        {!selectedCustomer ? (
          <div className="py-20">
            <Empty description="请先选择顾客查看照片对比" />
          </div>
        ) : (
          <Row gutter={16} className="h-full">
            <Col span={24} md={12}>
              <PhotoPanel
                title="术前"
                photos={preOpPhotos}
                currentIndex={preOpIndex}
                setCurrentIndex={setPreOpIndex}
                imageRef={preImageRef}
                isPre={true}
              />
            </Col>
            <Col span={24} md={12}>
              <PhotoPanel
                title="术后"
                photos={postOpPhotos}
                currentIndex={postOpIndex}
                setCurrentIndex={setPostOpIndex}
                imageRef={postImageRef}
                isPre={false}
              />
            </Col>
          </Row>
        )}
      </Card>
    </div>
  );
}
