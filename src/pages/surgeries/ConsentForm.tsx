import { useState, useRef, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Select,
  Checkbox,
  Message,
  Modal,
  Divider,
  Tag,
  Typography,
  Grid,
  Alert,
} from '@arco-design/web-react';
import {
  FileText,
  PenTool,
  RotateCcw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  Eye,
  Download,
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useParams } from 'react-router-dom';
import { getConsentForm, createConsentForm, signConsentForm } from '@/services/surgeryService';
import type { ConsentForm as ConsentFormType } from '../../../shared/types';

const { Row, Col } = Grid;
const { Option } = Select;
const { Title, Paragraph, Text } = Typography;

interface ConsentFormProps {
  surgeryId?: number;
  onSuccess?: () => void;
}

export default function ConsentForm({ surgeryId, onSuccess }: ConsentFormProps) {
  const params = useParams();
  const resolvedSurgeryId = surgeryId ?? (params.id ? parseInt(params.id, 10) : 0);
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [consentForm, setConsentForm] = useState<ConsentFormType | null>(null);
  const [loading, setLoading] = useState(false);
  const [signing, setSigning] = useState(false);
  const [witnessId, setWitnessId] = useState<number | undefined>();
  const [signedBy, setSignedBy] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureHistory, setSignatureHistory] = useState<string[]>([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  const defaultContent = `
手术知情同意书

一、术前告知
1. 我已如实告知医生我的健康状况、既往病史、药物过敏史等情况。
2. 我已了解手术的目的、方法、过程、预期效果及可能存在的风险。
3. 我已了解麻醉方式及其可能存在的风险。

二、手术风险告知
医生已向我详细解释以下可能发生的风险及并发症：
1. 手术部位感染、出血、血肿、血清肿
2. 伤口愈合不良、瘢痕增生
3. 外形不对称、效果不理想
4. 植入物相关并发症（如适用）
5. 麻醉相关并发症
6. 其他不可预见的情况

三、术后注意事项
1. 遵医嘱按时服药、换药
2. 保持手术部位清洁干燥
3. 避免剧烈运动及外力撞击
4. 定期复诊，如有不适及时就医
5. 术后恢复期间忌食辛辣刺激性食物及烟酒

四、知情同意
我已认真阅读并理解以上全部内容，对手术的相关问题已得到医生的满意答复。
我自愿接受该手术，并愿意承担手术相关的一切风险。

五、特殊约定
_______________________________________________
_______________________________________________
  `.trim();

  useEffect(() => {
    fetchConsentForm();
  }, [resolvedSurgeryId]);

  const fetchConsentForm = async () => {
    setLoading(true);
    try {
      const response = await getConsentForm(resolvedSurgeryId);
      if (response.success && response.data) {
        setConsentForm(response.data);
        if (response.data.signature) {
          setHasSignature(true);
        }
      }
    } catch (error) {
      Message.error('获取知情同意书失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignatureHistory = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const dataUrl = sigCanvasRef.current.toDataURL();
      setSignatureHistory((prev) => [...prev, dataUrl]);
    }
  };

  const handleClear = () => {
    if (sigCanvasRef.current) {
      handleSaveSignatureHistory();
      sigCanvasRef.current.clear();
      setHasSignature(false);
    }
  };

  const handleUndo = () => {
    if (signatureHistory.length > 0) {
      const prevHistory = [...signatureHistory];
      const lastSignature = prevHistory.pop();
      setSignatureHistory(prevHistory);

      if (lastSignature && sigCanvasRef.current) {
        const canvas = sigCanvasRef.current.getCanvas();
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            setHasSignature(true);
          };
          img.src = lastSignature;
        }
      }
    } else {
      if (sigCanvasRef.current) {
        sigCanvasRef.current.clear();
        setHasSignature(false);
      }
      Message.info('没有可撤销的操作');
    }
  };

  const handleEndSignature = () => {
    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      setHasSignature(true);
    }
  };

  const handleSign = async () => {
    if (!agreed) {
      Message.warning('请先阅读并同意知情同意书内容');
      return;
    }
    if (!hasSignature || !sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      Message.warning('请先签署姓名');
      return;
    }
    if (!signedBy.trim()) {
      Message.warning('请输入签署人姓名');
      return;
    }

    setSigning(true);
    try {
      const signatureData = sigCanvasRef.current.toDataURL();

      let response;
      if (consentForm) {
        response = await signConsentForm(consentForm.id, signatureData, signedBy);
      } else {
        response = await createConsentForm(surgeryId, {
          content: defaultContent,
          signature: signatureData,
          signedBy,
          witnessId,
        });
      }

      if (response.success) {
        Message.success('签署成功');
        setConsentForm(response.data);
        onSuccess?.();
      }
    } catch (error) {
      Message.error('签署失败');
    } finally {
      setSigning(false);
    }
  };

  const handlePreview = () => {
    setPreviewModalVisible(true);
  };

  const handleDownload = () => {
    if (consentForm?.signature) {
      const link = document.createElement('a');
      link.download = `知情同意书_${resolvedSurgeryId}.png`;
      link.href = consentForm.signature;
      link.click();
    }
  };

  const witnesses = [
    { id: 1, name: '张护士' },
    { id: 2, name: '李护士' },
    { id: 3, name: '王护士' },
    { id: 4, name: '刘护士' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">电子知情同意书</h1>
              <p className="text-gray-500 text-sm">手术ID: {resolvedSurgeryId}</p>
            </div>
          </div>
          <Space>
            <Button icon={<Eye className="w-4 h-4" />} onClick={handlePreview}>
              预览
            </Button>
            {consentForm?.signature && (
              <Button icon={<Download className="w-4 h-4" />} onClick={handleDownload}>
                下载签名
              </Button>
            )}
          </Space>
        </div>
      </div>

      {consentForm?.signedAt && (
        <Alert
          type="success"
          showIcon
          className="mb-4"
          content={
            <Space>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <Text bold>该知情同意书已签署</Text>
                <div className="text-sm text-gray-500 mt-1">
                  签署人: {consentForm.signedBy} | 签署时间:{' '}
                  {new Date(consentForm.signedAt).toLocaleString('zh-CN')}
                  {consentForm.witnessId && ` | 见证人: ${witnesses.find((w) => w.id === consentForm.witnessId)?.name || consentForm.witnessId}`}
                </div>
              </div>
            </Space>
          }
        />
      )}

      <Row gutter={24}>
        <Col span={24} lg={14}>
          <Card
            title={
              <Space>
                <FileText className="w-5 h-5 text-blue-500" />
                <span>知情同意书内容</span>
              </Space>
            }
            className="h-full"
            loading={loading}
          >
            <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-[600px] overflow-y-auto">
              <Typography>
                <Title heading={3} style={{ textAlign: 'center', marginBottom: 24 }}>
                  手术知情同意书
                </Title>

                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <div>
                    <Text bold>一、术前告知</Text>
                    <Paragraph style={{ marginTop: 8 }}>
                      1. 我已如实告知医生我的健康状况、既往病史、药物过敏史等情况。
                    </Paragraph>
                    <Paragraph>
                      2. 我已了解手术的目的、方法、过程、预期效果及可能存在的风险。
                    </Paragraph>
                    <Paragraph>3. 我已了解麻醉方式及其可能存在的风险。</Paragraph>
                  </div>

                  <div>
                    <Text bold>二、手术风险告知</Text>
                    <Paragraph style={{ marginTop: 8 }}>
                      医生已向我详细解释以下可能发生的风险及并发症：
                    </Paragraph>
                    <Paragraph>1. 手术部位感染、出血、血肿、血清肿</Paragraph>
                    <Paragraph>2. 伤口愈合不良、瘢痕增生</Paragraph>
                    <Paragraph>3. 外形不对称、效果不理想</Paragraph>
                    <Paragraph>4. 植入物相关并发症（如适用）</Paragraph>
                    <Paragraph>5. 麻醉相关并发症</Paragraph>
                    <Paragraph>6. 其他不可预见的情况</Paragraph>
                  </div>

                  <div>
                    <Text bold>三、术后注意事项</Text>
                    <Paragraph style={{ marginTop: 8 }}>1. 遵医嘱按时服药、换药</Paragraph>
                    <Paragraph>2. 保持手术部位清洁干燥</Paragraph>
                    <Paragraph>3. 避免剧烈运动及外力撞击</Paragraph>
                    <Paragraph>4. 定期复诊，如有不适及时就医</Paragraph>
                    <Paragraph>5. 术后恢复期间忌食辛辣刺激性食物及烟酒</Paragraph>
                  </div>

                  <div>
                    <Text bold>四、知情同意</Text>
                    <Paragraph style={{ marginTop: 8 }}>
                      我已认真阅读并理解以上全部内容，对手术的相关问题已得到医生的满意答复。
                      我自愿接受该手术，并愿意承担手术相关的一切风险。
                    </Paragraph>
                  </div>

                  <div>
                    <Text bold>五、特殊约定</Text>
                    <Paragraph style={{ marginTop: 8 }}>
                      ______________________
                    </Paragraph>
                    <Paragraph>______________________</Paragraph>
                  </div>
                </div>
              </Typography>
            </div>
          </Card>
        </Col>

        <Col span={24} lg={10}>
          <Card
            title={
              <Space>
                <PenTool className="w-5 h-5 text-pink-500" />
                <span>手写签名</span>
                {hasSignature && <Tag color="green">已签名</Tag>}
              </Space>
            }
            className="mb-4"
          >
            <div className="space-y-4">
              {!consentForm?.signedAt ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      签署人姓名 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                          placeholder="请输入或选择签署人"
                          value={signedBy}
                          onChange={setSignedBy}
                          allowCreate
                          style={{ width: '100%' }}
                          prefix={<User className="w-4 h-4 text-gray-400" />}
                        >
                          <Option value="患者本人">患者本人</Option>
                          <Option value="家属">家属</Option>
                          <Option value="法定监护人">法定监护人</Option>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      见证人（可选）
                    </label>
                    <Select
                      placeholder="请选择见证人"
                      value={witnessId}
                      onChange={setWitnessId}
                      style={{ width: '100%' }}
                      allowClear
                      prefix={<User className="w-4 h-4 text-gray-400" />}
                    >
                      {witnesses.map((w) => (
                        <Option key={w.id} value={w.id}>
                          {w.name}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <Divider />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      签名区域
                      <span className="text-red-500 ml-1">*</span>
                      <span className="text-gray-400 text-xs ml-2">请在下方区域手写签名</span>
                    </label>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-blue-400 transition-colors"
                      style={{ height: 200 }}
                    >
                      <SignatureCanvas
                        ref={sigCanvasRef}
                        penColor="#1f2937"
                        canvasProps={{
                          className: 'w-full h-full rounded-lg cursor-crosshair',
                        }}
                        onEnd={handleEndSignature}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      icon={<RotateCcw className="w-4 h-4" />}
                      onClick={handleUndo}
                      disabled={!hasSignature && signatureHistory.length === 0}
                    >
                      撤销
                    </Button>
                    <Button
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={handleClear}
                      disabled={!hasSignature}
                    >
                      清空
                    </Button>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <Space align="start">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <Text bold className="text-amber-800">
                          签名提示
                        </Text>
                        <Paragraph className="text-amber-700 text-sm mt-1" style={{ marginBottom: 0 }}>
                          请确保签名清晰可辨，签名将作为法律有效凭证。签名完成后请勾选下方同意选项。
                        </Paragraph>
                      </div>
                    </Space>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox checked={agreed} onChange={setAgreed} />
                    <div className="flex-1">
                      <Text className="text-sm text-gray-600">
                        我已认真阅读并理解《手术知情同意书》的全部内容，对手术相关问题已得到医生的满意答复。
                        我自愿接受该手术，并愿意承担手术相关的一切风险。
                      </Text>
                    </div>
                  </div>

                  <Button
                    type="primary"
                    long
                    size="large"
                    onClick={handleSign}
                    loading={signing}
                    disabled={!agreed || !hasSignature || !signedBy.trim()}
                    icon={<CheckCircle className="w-4 h-4" />}
                  >
                    确认签署
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  {consentForm.signature && (
                    <div className="inline-block border border-gray-200 rounded-lg p-4 bg-white mb-4">
                      <img
                        src={consentForm.signature}
                        alt="签名"
                        className="max-w-full max-h-[200px]"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">签署人:</span>
                      <span className="font-medium">{consentForm.signedBy}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">签署时间:</span>
                      <span className="font-medium">
                        {new Date(consentForm.signedAt!).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    {consentForm.witnessId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">见证人:</span>
                        <span className="font-medium">
                          {witnesses.find((w) => w.id === consentForm.witnessId)?.name || consentForm.witnessId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card
            title={
              <Space>
                <Calendar className="w-5 h-5 text-green-500" />
                <span>签署信息</span>
              </Space>
            }
          >
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">手术ID</span>
                <span className="font-medium">{resolvedSurgeryId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">文档状态</span>
                <Tag color={consentForm?.signedAt ? 'green' : 'orange'}>
                  {consentForm?.signedAt ? '已签署' : '待签署'}
                </Tag>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">签署状态</span>
                <span className="font-medium">
                  {consentForm?.signedAt ? new Date(consentForm.signedAt).toLocaleString('zh-CN') : '待签署'}
                </span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="知情同意书预览"
        visible={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        style={{ width: 800 }}
      >
        <div className="bg-white p-8">
          <Typography>
            <Title heading={3} style={{ textAlign: 'center' }}>
              手术知情同意书
            </Title>
            <Paragraph className="text-gray-700 leading-relaxed whitespace-pre-line">
              {consentForm?.content || defaultContent}
            </Paragraph>
            <Divider />
            <div className="flex justify-end gap-16">
              <div className="text-center">
                <div className="mb-8 h-16 w-32 border-b border-gray-300 flex items-end justify-center">
                  {consentForm?.signature && (
                    <img src={consentForm.signature} alt="签名" className="max-h-full max-w-full" />
                  )}
                </div>
                <Text>患者签名</Text>
              </div>
              <div className="text-center">
                <div className="mb-8 h-16 w-32 border-b border-gray-300" />
                <Text>医生签名</Text>
              </div>
              <div className="text-center">
                <div className="mb-8 h-16 w-32 border-b border-gray-300" />
                <Text>见证人签名</Text>
              </div>
            </div>
            <div className="text-center mt-8">
              <Text className="text-gray-500">
                签署日期: {consentForm?.signedAt ? new Date(consentForm.signedAt).toLocaleDateString('zh-CN') : '-'}
              </Text>
            </div>
          </Typography>
        </div>
      </Modal>
    </div>
  );
}
