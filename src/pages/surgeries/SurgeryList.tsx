import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Message,
  Popconfirm,
  Radio,
  Calendar,
  Tooltip,
} from '@arco-design/web-react';
import {
  Scissors,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CalendarDays,
  User,
  List,
  LayoutGrid,
  Plus as PlusIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { getSurgeries, deleteSurgery, updateSurgeryStatus } from '@/services/surgeryService';
import type { Surgery, SurgeryStatus, PaginatedResponse } from '../../../shared/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

type ViewMode = 'table' | 'calendar';
type CalendarMode = 'month' | 'week';

interface SurgeryWithNames extends Surgery {
  customerName?: string;
  surgeonName?: string;
}

const statusMap: Record<SurgeryStatus, { text: string; color: string; bg: string; border: string }> = {
  scheduled: { text: '已预约', color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200' },
  in_progress: { text: '进行中', color: 'gold', bg: 'bg-amber-50', border: 'border-amber-200' },
  completed: { text: '已完成', color: 'green', bg: 'bg-green-50', border: 'border-green-200' },
  cancelled: { text: '已取消', color: 'red', bg: 'bg-red-50', border: 'border-red-200' },
};

export default function SurgeryList() {
  const navigate = useNavigate();
  const [data, setData] = useState<SurgeryWithNames[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState<Surgery | null>(null);
  const [newStatus, setNewStatus] = useState<SurgeryStatus>('scheduled');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');
  const [calendarPageDate, setCalendarPageDate] = useState<Dayjs>(dayjs());

  const fetchData = async () => {
    setLoading(true);
    try {
      const pageSizeVal = viewMode === 'calendar' ? 500 : pagination.pageSize;
      const params: any = {
        page: viewMode === 'calendar' ? 1 : pagination.current,
        pageSize: pageSizeVal,
      };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0];
        params.endDate = dateRange[1];
      }
      const response = await getSurgeries(params);
      if (response.success) {
        const result = response.data as PaginatedResponse<SurgeryWithNames>;
        setData(result.list);
        if (viewMode !== 'calendar') {
          setPagination((prev) => ({ ...prev, total: result.total }));
        }
      }
    } catch (error) {
      Message.error('获取手术列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, viewMode]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleReset = () => {
    setKeyword('');
    setStatusFilter('');
    setDateRange([]);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData();
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await deleteSurgery(id);
      if (response.success) {
        Message.success('删除成功');
        fetchData();
      }
    } catch (error) {
      Message.error('删除失败');
    }
  };

  const handleStatusChange = (record: Surgery) => {
    setSelectedSurgery(record);
    setNewStatus(record.status);
    setStatusModalVisible(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedSurgery) return;
    try {
      const response = await updateSurgeryStatus(selectedSurgery.id, newStatus);
      if (response.success) {
        Message.success('状态更新成功');
        setStatusModalVisible(false);
        fetchData();
      }
    } catch (error) {
      Message.error('状态更新失败');
    }
  };

  const surgeriesByDate = useMemo(() => {
    const map = new Map<string, SurgeryWithNames[]>();
    for (const s of data) {
      const d = dayjs(s.surgeryDate).format('YYYY-MM-DD');
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(s);
    }
    return map;
  }, [data]);

  const renderSurgeryChip = (s: SurgeryWithNames) => {
    const sInfo = statusMap[s.status] || statusMap.scheduled;
    const time = dayjs(s.surgeryDate).format('HH:mm');
    return (
      <Tooltip
        key={s.id}
        content={
          <div className="space-y-1 text-xs">
            <div className="font-medium">{s.surgeryName}</div>
            <div>时间：{dayjs(s.surgeryDate).format('YYYY-MM-DD HH:mm')}</div>
            {s.customerName && <div>顾客：{s.customerName}</div>}
            {s.surgeonName && <div>术者：{s.surgeonName}</div>}
            <div>状态：{sInfo.text}</div>
          </div>
        }
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/surgeries/${s.id}/edit`);
          }}
          className={`mb-1 px-2 py-1 rounded text-xs cursor-pointer border ${sInfo.border} ${sInfo.bg} hover:shadow-sm transition-shadow`}
        >
          <div className="flex items-center gap-1 truncate">
            <span className={`inline-block w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: `var(--color-${sInfo.color}-6)` }} />
            <span className="font-medium text-gray-700 truncate">{time} {s.surgeryName}</span>
          </div>
          {s.customerName && <div className="text-gray-500 truncate">{s.customerName}</div>}
        </div>
      </Tooltip>
    );
  };

  const renderCalendarCell = (currentDate: Dayjs) => {
    const dateKey = currentDate.format('YYYY-MM-DD');
    const daySurgeries = surgeriesByDate.get(dateKey) || [];
    const displayList = daySurgeries.slice(0, calendarMode === 'week' ? 10 : 3);
    const rest = daySurgeries.length - displayList.length;

    const handleCellClick = () => {
      if (daySurgeries.length === 0) {
        navigate(`/surgeries/new?date=${dateKey}`);
      } else if (daySurgeries.length === 1) {
        navigate(`/surgeries/${daySurgeries[0].id}/edit`);
      }
    };

    return (
      <div
        onClick={handleCellClick}
        className="h-full cursor-pointer"
      >
        <div className="space-y-1">
          {displayList.map(renderSurgeryChip)}
          {rest > 0 && (
            <div className="px-2 py-0.5 text-xs text-gray-500 hover:text-blue-600">
              + 还有 {rest} 台手术
            </div>
          )}
        </div>
        {daySurgeries.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1 text-xs text-blue-500">
              <PlusIcon className="w-3 h-3" />
              新建
            </div>
          </div>
        )}
      </div>
    );
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '手术名称',
      dataIndex: 'surgeryName',
      render: (text: string) => (
        <Space>
          <Scissors className="w-4 h-4 text-pink-500" />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      render: (name: string, record: Surgery) => (
        <Space>
          <User className="w-4 h-4 text-gray-400" />
          <span>{name || `ID: ${record.customerId}`}</span>
        </Space>
      ),
    },
    {
      title: '手术日期',
      dataIndex: 'surgeryDate',
      render: (date: Date) => (
        <Space>
          <CalendarDays className="w-4 h-4 text-gray-400" />
          <span>{new Date(date).toLocaleString('zh-CN')}</span>
        </Space>
      ),
    },
    {
      title: '术者',
      dataIndex: 'surgeonName',
      render: (name: string, record: Surgery) => name || `ID: ${record.surgeonId}`,
    },
    {
      title: '麻醉方式',
      dataIndex: 'anesthesiaType',
      render: (type: string) => (
        <Tag color={type === 'local' ? 'cyan' : 'purple'}>
          {type === 'local' ? '局麻' : '全麻'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: SurgeryStatus) => {
        const s = statusMap[status] || { text: status, color: 'gray' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (date: Date) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      dataIndex: 'actions',
      width: 240,
      render: (_: unknown, record: Surgery) => (
        <Space>
          <Button
            size="small"
            type="primary"
            status="success"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => navigate(`/surgeries/${record.id}/edit`)}
          >
            查看
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={() => navigate(`/surgeries/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Button
            size="small"
            type="primary"
            status="warning"
            onClick={() => handleStatusChange(record)}
          >
            状态
          </Button>
          <Popconfirm
            title="确认删除"
            content="确定要删除这条手术记录吗？"
            onOk={() => handleDelete(record.id)}
          >
            <Button size="small" type="primary" status="danger" icon={<Trash2 className="w-4 h-4" />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderStatusLegend = () => (
    <div className="flex items-center gap-4 flex-wrap">
      {Object.entries(statusMap).map(([key, info]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className={`inline-block w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: `var(--color-${info.color}-6)` }} />
          <span className="text-sm text-gray-600">{info.text}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">手术管理</h1>
              <p className="text-gray-500 text-sm">
                {viewMode === 'calendar' ? '查看与管理手术排期' : '管理所有手术项目记录'}
              </p>
            </div>
          </div>
          <Space>
            <Radio.Group
              type="button"
              size="small"
              value={viewMode}
              onChange={(v) => setViewMode(v as ViewMode)}
            >
              <Radio value="calendar">
                <Space size={4}>
                  <LayoutGrid className="w-3.5 h-3.5" />
                  日历
                </Space>
              </Radio>
              <Radio value="table">
                <Space size={4}>
                  <List className="w-3.5 h-3.5" />
                  列表
                </Space>
              </Radio>
            </Radio.Group>
            <Button type="primary" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/surgeries/new')}>
              新增手术
            </Button>
          </Space>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <Space wrap>
          <Input
            placeholder="搜索手术名称、客户或术者"
            value={keyword}
            onChange={setKeyword}
            style={{ width: 240 }}
            prefix={<Search className="w-4 h-4 text-gray-400" />}
          />
          <Select
            placeholder="选择状态"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            allowClear
          >
            <Option value="scheduled">已预约</Option>
            <Option value="in_progress">进行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 280 }}
            placeholder={['开始日期', '结束日期']}
          />
          <Button type="primary" onClick={handleSearch} icon={<Search className="w-4 h-4" />}>
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm">
          <Table
            columns={columns}
            data={data}
            loading={loading}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showTotal: true,
              sizeCanChange: true,
              onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
            }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <Radio.Group
              type="button"
              size="small"
              value={calendarMode}
              onChange={(v) => setCalendarMode(v as CalendarMode)}
            >
              <Radio value="month">月视图</Radio>
              <Radio value="week">周视图</Radio>
            </Radio.Group>
            {renderStatusLegend()}
          </div>
          <Calendar
            mode={calendarMode === 'week' ? 'day' : 'month'}
            isWeek={calendarMode === 'week'}
            pageShowDate={calendarPageDate.toDate()}
            onPanelChange={(d) => setCalendarPageDate(dayjs(d))}
            onChange={(d) => setCalendarPageDate(dayjs(d))}
            dateInnerContent={renderCalendarCell}
            dayStartOfWeek={1}
          />
        </div>
      )}

      <Modal
        title="更新手术状态"
        visible={statusModalVisible}
        onOk={confirmStatusChange}
        onCancel={() => setStatusModalVisible(false)}
      >
        <div className="py-4">
          <p className="mb-4 text-gray-600">
            当前手术: <span className="font-medium">{selectedSurgery?.surgeryName}</span>
          </p>
          <Select
            value={newStatus}
            onChange={(val) => setNewStatus(val as SurgeryStatus)}
            style={{ width: '100%' }}
          >
            <Option value="scheduled">已预约</Option>
            <Option value="in_progress">进行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}
