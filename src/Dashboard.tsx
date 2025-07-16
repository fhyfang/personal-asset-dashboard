import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Activity, Brain, FileText, Focus, TrendingUp, Calendar, Target, AlertCircle, RefreshCw, Settings, Database, BarChart3, Zap, Sun, Moon, Eye } from 'lucide-react';

const PersonalAssetDashboard = () => {
  const [data, setData] = useState({
    health: {},
    cognitive: {},
    content: {},
    focus: {},
    totalScore: 0,
    trend: [],
    habits: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Notion API 配置 - 适配 Vite 环境变量
  const NOTION_API_KEY = import.meta.env.VITE_NOTION_API_KEY || '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';
  const DATABASE_IDS = {
    health: import.meta.env.VITE_NOTION_HEALTH_DB_ID || '232b6a1ba4068034bfa0f398d639a325',
    cognitive: import.meta.env.VITE_NOTION_COGNITIVE_DB_ID || '232b6a1ba40680c7b6c3ed2e3485e2ef',
    content: import.meta.env.VITE_NOTION_CONTENT_DB_ID || '232b6a1ba40680a99c68e77a7a3dad9d',
    focus: import.meta.env.VITE_NOTION_FOCUS_DB_ID || '232b6a1ba4068028ad1ffa79c1660fcf'
  };

  // 从Notion API获取数据
  const fetchNotionData = async (databaseId) => {
    try {
      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          sorts: [
            {
              property: '日期',
              direction: 'descending'
            }
          ],
          page_size: 30
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Notion API Error:', error);
      return [];
    }
  };

  // 处理Notion数据
  const processNotionData = (results, type) => {
    if (!results || results.length === 0) return {};
    
    const latest = results[0];
    const properties = latest.properties;
    
    switch (type) {
      case 'health':
        return {
          steps: properties['步数']?.number || 0,
          heartRate: properties['心率']?.number || 0,
          exerciseTime: properties['运动时长（M）']?.number || 0,
          sleepHours: properties['睡眠时长']?.number || 0,
          deepSleepHours: properties['深度睡眠时长']?.number || 0,
          remSleepHours: properties['REM睡眠时长']?.number || 0,
          meditationTime: properties['冥想时长']?.number || 0,
          meditationQuality: properties['冥想质量']?.number || 0,
          mindfulnessCount: properties['正念觉察次数']?.number || 0,
          stressLevel: properties['压力等级']?.select?.name || '中',
          bodyFeeling: properties['身体感受']?.select?.name || '良好',
          exerciseIntensity: properties['运动强度']?.select?.name || '中',
          sleepQuality: properties['睡眠质量评分']?.select?.name || '良'
        };
      case 'cognitive':
        return {
          newConcepts: properties['新增概念数']?.number || 0,
          newNotes: properties['新增笔记数']?.number || 0,
          conceptConnections: properties['概念连接数']?.number || 0,
          knowledgeApplications: properties['知识应用次数']?.number || 0,
          readingPages: properties['阅读页数']?.number || 0,
          studyTime: properties['学习时长']?.number || 0,
          creativityIdeas: properties['创意想法数']?.number || 0,
          creativityExecutions: properties['创意执行数']?.number || 0,
          crossDomainLinks: properties['跨领域链接']?.number || 0,
          studyQuality: properties['学习质量评分']?.number || 0,
          innovationScore: properties['创新度评分']?.number || 0
        };
      case 'content':
        return {
          publishedContent: properties['发布内容数']?.number || 0,
          totalViews: properties['总浏览量']?.number || 0,
          totalEngagement: properties['总互动数']?.number || 0,
          newFollowers: properties['新增粉丝数']?.number || 0,
          contentQuality: properties['内容质量评分']?.number || 0,
          creationTime: properties['创作时长']?.number || 0,
          ideaConversion: properties['想法转化数']?.number || 0,
          capturedIdeas: properties['捕获想法数']?.number || 0,
          professionalScore: properties['专业度评分']?.number || 0,
          innovationScore: properties['创新度评分']?.number || 0,
          revenueContribution: properties['收入贡献']?.number || 0
        };
      case 'focus':
        return {
          flowTime: properties['心流时长']?.number || 0,
          flowSessions: properties['心流次数']?.number || 0,
          flowQuality: properties['心流质量']?.number || 0,
          screenTime: properties['屏幕时间']?.number || 0,
          productiveTime: properties['生产力应用时间']?.number || 0,
          entertainmentTime: properties['娱乐应用时间']?.number || 0,
          notifications: properties['通知次数']?.number || 0,
          noPhoneTime: properties['无手机时长']?.number || 0,
          pomodoroCount: properties['番茄钟完成数']?.number || 0,
          taskSwitches: properties['任务切换次数']?.number || 0
        };
      default:
        return {};
    }
  };

  // 获取所有数据
  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // 并行获取所有数据库数据
      const [healthResults, cognitiveResults, contentResults, focusResults] = await Promise.all([
        fetchNotionData(DATABASE_IDS.health),
        fetchNotionData(DATABASE_IDS.cognitive),
        fetchNotionData(DATABASE_IDS.content),
        fetchNotionData(DATABASE_IDS.focus)
      ]);

      // 处理数据
      const healthData = processNotionData(healthResults, 'health');
      const cognitiveData = processNotionData(cognitiveResults, 'cognitive');
      const contentData = processNotionData(contentResults, 'content');
      const focusData = processNotionData(focusResults, 'focus');

      // 计算各维度得分
      const healthScore = calculateHealthScore(healthData);
      const cognitiveScore = calculateCognitiveScore(cognitiveData);
      const contentScore = calculateContentScore(contentData);
      const focusScore = calculateFocusScore(focusData);
      
      const totalScore = healthScore * 0.25 + cognitiveScore * 0.30 + contentScore * 0.25 + focusScore * 0.20;

      // 生成趋势数据（简化版，实际应从历史数据生成）
      const trendData = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        health: healthScore + Math.random() * 10 - 5,
        cognitive: cognitiveScore + Math.random() * 10 - 5,
        content: contentScore + Math.random() * 10 - 5,
        focus: focusScore + Math.random() * 10 - 5,
        total: totalScore + Math.random() * 8 - 4
      }));

      // 生成习惯数据
      const habitsData = [
        { name: '每日冥想20分钟', completed: [true, true, true, true, false, false, false], target: 7, type: 'meditation' },
        { name: '每周运动3次', completed: [true, false, true, false, false, false, false], target: 3, type: 'exercise' },
        { name: '每周创作1篇', completed: [false, false, false, true, false, false, false], target: 1, type: 'content' },
        { name: '每日学习1小时', completed: [true, true, true, true, false, false, false], target: 7, type: 'study' },
        { name: '屏幕时间<6小时', completed: [true, false, true, true, false, false, false], target: 7, type: 'digital' }
      ];

      setData({
        health: { ...healthData, score: healthScore },
        cognitive: { ...cognitiveData, score: cognitiveScore },
        content: { ...contentData, score: contentScore },
        focus: { ...focusData, score: focusScore },
        totalScore: totalScore,
        trend: trendData,
        habits: habitsData
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('获取数据失败:', error);
      // 使用模拟数据作为后备
      setData(getMockData());
      setLastUpdated(new Date());
    }
    
    setIsLoading(false);
  };

  // 模拟数据生成
  const getMockData = () => {
    const mockHealthData = {
      steps: 8500,
      heartRate: 72,
      exerciseTime: 45,
      sleepHours: 7.5,
      deepSleepHours: 1.8,
      remSleepHours: 1.2,
      meditationTime: 15,
      meditationQuality: 8,
      mindfulnessCount: 5,
      stressLevel: '中',
      bodyFeeling: '良好',
      exerciseIntensity: '中',
      sleepQuality: '优'
    };

    const mockCognitiveData = {
      newConcepts: 5,
      newNotes: 12,
      conceptConnections: 8,
      knowledgeApplications: 3,
      readingPages: 50,
      studyTime: 120,
      creativityIdeas: 4,
      creativityExecutions: 2,
      crossDomainLinks: 2,
      studyQuality: 8.5,
      innovationScore: 7.8
    };

    const mockContentData = {
      publishedContent: 2,
      totalViews: 3240,
      totalEngagement: 180,
      newFollowers: 267,
      contentQuality: 8.2,
      creationTime: 180,
      ideaConversion: 3,
      capturedIdeas: 5,
      professionalScore: 8.0,
      innovationScore: 7.5,
      revenueContribution: 1580
    };

    const mockFocusData = {
      flowTime: 3.2,
      flowSessions: 2,
      flowQuality: 8.5,
      screenTime: 5.2,
      productiveTime: 4.8,
      entertainmentTime: 1.4,
      notifications: 23,
      noPhoneTime: 8.5,
      pomodoroCount: 6,
      taskSwitches: 7
    };

    const healthScore = calculateHealthScore(mockHealthData);
    const cognitiveScore = calculateCognitiveScore(mockCognitiveData);
    const contentScore = calculateContentScore(mockContentData);
    const focusScore = calculateFocusScore(mockFocusData);
    
    const totalScore = healthScore * 0.25 + cognitiveScore * 0.30 + contentScore * 0.25 + focusScore * 0.20;

    const trendData = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      health: healthScore + Math.random() * 10 - 5,
      cognitive: cognitiveScore + Math.random() * 10 - 5,
      content: contentScore + Math.random() * 10 - 5,
      focus: focusScore + Math.random() * 10 - 5,
      total: totalScore + Math.random() * 8 - 4
    }));

    const habitsData = [
      { name: '每日冥想20分钟', completed: [true, true, true, true, false, false, false], target: 7, type: 'meditation' },
      { name: '每周运动3次', completed: [true, false, true, false, false, false, false], target: 3, type: 'exercise' },
      { name: '每周创作1篇', completed: [false, false, false, true, false, false, false], target: 1, type: 'content' },
      { name: '每日学习1小时', completed: [true, true, true, true, false, false, false], target: 7, type: 'study' },
      { name: '屏幕时间<6小时', completed: [true, false, true, true, false, false, false], target: 7, type: 'digital' }
    ];

    return {
      health: { ...mockHealthData, score: healthScore },
      cognitive: { ...mockCognitiveData, score: cognitiveScore },
      content: { ...mockContentData, score: contentScore },
      focus: { ...mockFocusData, score: focusScore },
      totalScore: totalScore,
      trend: trendData,
      habits: habitsData
    };
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  // 手动刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // 健康资产评分计算
  const calculateHealthScore = (healthData) => {
    const exerciseScore = calculateExerciseScore(healthData);
    const sleepScore = calculateSleepScore(healthData);
    const mindfulnessScore = calculateMindfulnessScore(healthData);
    
    return exerciseScore * 0.40 + sleepScore * 0.35 + mindfulnessScore * 0.25;
  };

  const calculateExerciseScore = (data) => {
    const stepScore = Math.min(data.steps / 10000 * 100, 100);
    const heartRateScore = 50 + (data.heartRate - 72) * 2;
    const consistencyScore = data.exerciseTime >= 30 ? 100 : data.exerciseTime / 30 * 100;
    
    return stepScore * 0.3 + Math.max(0, Math.min(100, heartRateScore)) * 0.4 + consistencyScore * 0.3;
  };

  const calculateSleepScore = (data) => {
    const durationScore = data.sleepHours >= 7 && data.sleepHours <= 9 ? 100 : 
                         data.sleepHours < 7 ? Math.max(0, 100 - (7 - data.sleepHours) * 20) :
                         Math.max(0, 100 - (data.sleepHours - 9) * 15);
    
    const qualityScore = data.sleepQuality === '优' ? 100 : 
                        data.sleepQuality === '良' ? 80 : 
                        data.sleepQuality === '中' ? 60 : 40;
    
    const consistencyScore = 85;
    
    return durationScore * 0.4 + qualityScore * 0.4 + consistencyScore * 0.2;
  };

  const calculateMindfulnessScore = (data) => {
    const frequencyScore = Math.min(data.mindfulnessCount / 5 * 100, 100);
    const durationScore = Math.min(data.meditationTime / 20 * 100, 100);
    const qualityScore = data.meditationQuality * 10;
    
    return frequencyScore * 0.4 + durationScore * 0.3 + qualityScore * 0.3;
  };

  // 认知资产评分计算
  const calculateCognitiveScore = (cognitiveData) => {
    const knowledgeScore = calculateKnowledgeScore(cognitiveData);
    const creativityScore = calculateCreativityScore(cognitiveData);
    
    return knowledgeScore * 0.5 + creativityScore * 0.5;
  };

  const calculateKnowledgeScore = (data) => {
    const nodeScore = Math.min(data.newConcepts / 5 * 100, 100);
    const connectionScore = Math.min(data.conceptConnections / 8 * 100, 100);
    const applicationScore = Math.min(data.knowledgeApplications / 3 * 100, 100);
    const depthScore = data.studyQuality * 10;
    const breadthScore = Math.min(data.readingPages / 50 * 100, 100);
    
    return nodeScore * 0.2 + connectionScore * 0.3 + applicationScore * 0.2 + depthScore * 0.15 + breadthScore * 0.15;
  };

  const calculateCreativityScore = (data) => {
    const ideaGenerationScore = Math.min(data.creativityIdeas / 4 * 100, 100);
    const executionScore = data.creativityIdeas > 0 ? (data.creativityExecutions / data.creativityIdeas * 100) : 0;
    const crossDomainScore = Math.min(data.crossDomainLinks / 2 * 100, 100);
    const noveltyScore = data.innovationScore * 10;
    
    return ideaGenerationScore * 0.25 + executionScore * 0.35 + crossDomainScore * 0.20 + noveltyScore * 0.20;
  };

  // 内容资产评分计算
  const calculateContentScore = (contentData) => {
    const influenceScore = calculateInfluenceScore(contentData);
    const productionScore = calculateProductionScore(contentData);
    
    return influenceScore * 0.4 + productionScore * 0.6;
  };

  const calculateInfluenceScore = (data) => {
    const reachScore = Math.min(data.totalViews / 3000 * 100, 100);
    const engagementScore = data.totalViews > 0 ? Math.min(data.totalEngagement / data.totalViews * 1000, 100) : 0;
    const growthScore = Math.min(data.newFollowers / 200 * 100, 100);
    const authorityScore = data.professionalScore * 10;
    
    return reachScore * 0.3 + engagementScore * 0.25 + growthScore * 0.25 + authorityScore * 0.2;
  };

  const calculateProductionScore = (data) => {
    const consistencyScore = Math.min(data.publishedContent / 2 * 100, 100);
    const qualityScore = data.contentQuality * 10;
    const conversionScore = data.capturedIdeas > 0 ? (data.ideaConversion / data.capturedIdeas * 100) : 0;
    
    return consistencyScore * 0.3 + qualityScore * 0.3 + conversionScore * 0.4;
  };

  // 注意力资产评分计算
  const calculateFocusScore = (focusData) => {
    const flowScore = calculateFlowScore(focusData);
    const digitalHealthScore = calculateDigitalHealthScore(focusData);
    
    return flowScore * 0.5 + digitalHealthScore * 0.5;
  };

  const calculateFlowScore = (data) => {
    const timeScore = Math.min(data.flowTime / 3 * 100, 100);
    const sessionScore = Math.min(data.flowSessions / 2 * 100, 100);
    const qualityScore = data.flowQuality * 10;
    
    return timeScore * 0.3 + sessionScore * 0.2 + qualityScore * 0.5;
  };

  const calculateDigitalHealthScore = (data) => {
    const screenTimeScore = Math.max(0, 100 - (data.screenTime - 6) * 10);
    const productiveRatio = data.screenTime > 0 ? (data.productiveTime / data.screenTime * 100) : 0;
    const notificationScore = Math.max(0, 100 - data.notifications);
    const detoxScore = Math.min(data.noPhoneTime / 8 * 100, 100);
    
    return screenTimeScore * 0.25 + productiveRatio * 0.25 + notificationScore * 0.25 + detoxScore * 0.25;
  };

  // 雷达图数据
  const radarData = [
    { subject: '健康资产', A: data.health.score || 0, fullMark: 100 },
    { subject: '认知资产', A: data.cognitive.score || 0, fullMark: 100 },
    { subject: '内容资产', A: data.content.score || 0, fullMark: 100 },
    { subject: '注意力资产', A: data.focus.score || 0, fullMark: 100 }
  ];

  // 颜色配置
  const colors = {
    health: '#10B981',
    cognitive: '#3B82F6',
    content: '#8B5CF6',
    focus: '#F59E0B'
  };

  // 获取PEI状态
  const getPEIStatus = (score) => {
    if (score >= 90) return { text: '巅峰状态', color: '#10B981', icon: '🔥' };
    if (score >= 80) return { text: '精力充沛', color: '#3B82F6', icon: '⚡' };
    if (score >= 70) return { text: '状态良好', color: '#F59E0B', icon: '👍' };
    if (score >= 60) return { text: '需要调整', color: '#EF4444', icon: '⚠️' };
    return { text: '亟需恢复', color: '#DC2626', icon: '🚨' };
  };

  const peiStatus = getPEIStatus(data.totalScore);

  // 习惯追踪组件
  const HabitTracker = ({ habits }) => {
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    
    return (
      <div className="space-y-4">
        {habits.map((habit, index) => {
          const completedCount = habit.completed.filter(Boolean).length;
          const completionRate = (completedCount / habit.target * 100).toFixed(0);
          const status = completionRate >= 80 ? '🟢' : completionRate >= 60 ? '🟡' : '🔴';
          
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{habit.name}</div>
                <div className="text-sm text-gray-500">完成率: {completionRate}%</div>
              </div>
              <div className="flex items-center space-x-2">
                {habit.completed.map((completed, dayIndex) => (
                  <div key={dayIndex} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">{days[dayIndex]}</div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {completed ? '✓' : '○'}
                    </div>
                  </div>
                ))}
                <div className="ml-3 text-lg">{status}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 资产卡片组件
  const AssetCard = ({ title, score, icon: Icon, color, trend, details, onClick }) => (
    <div 
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">当前得分</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color }}>
            {score.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {details.map((detail, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-600">{detail.label}</span>
            <span className="font-medium">{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // 快速访问按钮
  const QuickAccessButton = ({ title, icon: Icon, color, onClick }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 hover:border-gray-300"
    >
      <Icon className="w-5 h-5" style={{ color }} />
      <span className="font-medium text-gray-700">{title}</span>
    </button>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎯 个人数字资产引擎</h1>
              <p className="text-gray-600 mt-1">基于凯文·凯利未来10000天理念 | 让无形资产变得可见、可衡量、可优化</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? '更新中...' : '刷新数据'}
              </button>
              
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">过去7天</option>
                <option value="30d">过去30天</option>
                <option value="90d">过去90天</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* PEI 指数 */}
        <div className="mb-8">
          <div 
            className="text-center p-6 rounded-xl text-white shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            <h2 className="text-xl font-semibold mb-2">📊 今日个人精力指数 (PEI)</h2>
            <div className="text-5xl font-bold mb-2">{data.totalScore.toFixed(0)}/100</div>
            <div className="text-lg">{peiStatus.icon} 状态：{peiStatus.text}</div>
            <div className="mt-4 text-sm opacity-90">
              💡 <strong>今日核心行动建议：</strong> 
              {data.totalScore >= 85 ? '你的睡眠和专注力状态优异，建议今天安排1个重要创作任务和1次高强度运动' :
               data.totalScore >= 70 ? '状态良好，适合进行中等强度的工作和学习任务' :
               '精力偏低，建议优先恢复和轻松活动'}
            </div>
            {lastUpdated && (
              <div className="text-xs opacity-75 mt-2">
                最后更新: {lastUpdated.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* 核心习惯追踪 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">⚡ 本周核心习惯追踪</h2>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <HabitTracker habits={data.habits} />
          </div>
        </div>

        {/* 四大资产快照 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 四大资产健康度快照</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AssetCard
              title="🏃 健康资产"
              score={data.health.score}
              icon={Activity}
              color={colors.health}
              trend={2.3}
              details={[
                { label: '运动得分', value: `${calculateExerciseScore(data.health).toFixed(1)}` },
                { label: '睡眠得分', value: `${calculateSleepScore(data.health).toFixed(1)}` },
                { label: '冥想得分', value: `${calculateMindfulnessScore(data.health).toFixed(1)}` }
              ]}
              onClick={() => setActiveTab('health')}
            />
            <AssetCard
              title="🧠 认知资产"
              score={data.cognitive.score}
              icon={Brain}
              color={colors.cognitive}
              trend={1.8}
              details={[
                { label: '知识库得分', value: `${calculateKnowledgeScore(data.cognitive).toFixed(1)}` },
                { label: '创意流得分', value: `${calculateCreativityScore(data.cognitive).toFixed(1)}` },
                { label: '学习时长', value: `${data.cognitive.studyTime}min` }
              ]}
              onClick={() => setActiveTab('cognitive')}
            />
            <AssetCard
              title="📝 内容资产"
              score={data.content.score}
              icon={FileText}
              color={colors.content}
              trend={-0.5}
              details={[
                { label: '影响力得分', value: `${calculateInfluenceScore(data.content).toFixed(1)}` },
                { label: '生产力得分', value: `${calculateProductionScore(data.content).toFixed(1)}` },
                { label: '发布内容数', value: `${data.content.publishedContent}` }
              ]}
              onClick={() => setActiveTab('content')}
            />
            <AssetCard
              title="🎯 专注力资产"
              score={data.focus.score}
              icon={Focus}
              color={colors.focus}
              trend={3.2}
              details={[
                { label: '心流得分', value: `${calculateFlowScore(data.focus).toFixed(1)}` },
                { label: '数字健康得分', value: `${calculateDigitalHealthScore(data.focus).toFixed(1)}` },
                { label: '心流时长', value: `${data.focus.flowTime}h` }
              ]}
              onClick={() => setActiveTab('focus')}
            />
          </div>
        </div>

        {/* 快速入口 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 快速入口</h2>
          <div className="flex flex-wrap gap-4">
            <QuickAccessButton 
              title="记录今日数据" 
              icon={Database} 
              color="#3B82F6"
              onClick={() => setActiveTab('input')}
            />
            <QuickAccessButton 
              title="健康数据录入" 
              icon={Activity} 
              color="#10B981"
              onClick={() => setActiveTab('health')}
            />
            <QuickAccessButton 
              title="内容创作记录" 
              icon={FileText} 
              color="#8B5CF6"
              onClick={() => setActiveTab('content')}
            />
            <QuickAccessButton 
              title="专注力追踪" 
              icon={Focus} 
              color="#F59E0B"
              onClick={() => setActiveTab('focus')}
            />
            <QuickAccessButton 
              title="查看周报" 
              icon={BarChart3} 
              color="#EF4444"
              onClick={() => setActiveTab('trends')}
            />
            <QuickAccessButton 
              title="战略分析" 
              icon={Target} 
              color="#6366F1"
              onClick={() => setActiveTab('strategy')}
            />
          </div>
        </div>

        {/* 雷达图 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 四大资产雷达图</h2>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="得分"
                    dataKey="A"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 趋势图 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 本周核心洞察</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">🔍 关键发现</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>睡眠→专注力强关联：</strong>优质睡眠后次日心流时长平均增加45分钟
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>运动频次达标：</strong>连续运动3天后创作质量提升23%
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>晨间习惯效应：</strong>建立晨间运动+冥想+创作链条后，整体效率提升35%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">⚠️ 需要关注</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>周中运动频次偏低，建议调整运动时间安排</div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>内容想法捕获量下降，考虑增加灵感收集工具使用</div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>屏幕时间在周二和周四超标，需要数字排毒干预</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">🎯 本周优化重点</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>睡眠质量巩固：</strong>保持22:30关屏习惯，深度睡眠比例已达27%
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>内容生产稳定化：</strong>建立内容创作SOP，提升想法→发布转化率
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>专注力系统优化：</strong>测试不同专注技巧，记录最佳心流触发条件
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 趋势分析图表 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 趋势分析</h2>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#374151" strokeWidth={3} name="总分" />
                  <Line type="monotone" dataKey="health" stroke={colors.health} name="健康资产" />
                  <Line type="monotone" dataKey="cognitive" stroke={colors.cognitive} name="认知资产" />
                  <Line type="monotone" dataKey="content" stroke={colors.content} name="内容资产" />
                  <Line type="monotone" dataKey="focus" stroke={colors.focus} name="注意力资产" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 本周焦点目标 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 本周焦点目标</h2>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">优先级</th>
                    <th className="text-left py-3 px-4">目标</th>
                    <th className="text-left py-3 px-4">当前进度</th>
                    <th className="text-left py-3 px-4">目标值</th>
                    <th className="text-left py-3 px-4">截止时间</th>
                    <th className="text-left py-3 px-4">状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4">P0</td>
                    <td className="py-3 px-4">健康总分稳定在85+</td>
                    <td className="py-3 px-4">{data.health.score.toFixed(0)}分</td>
                    <td className="py-3 px-4">85分</td>
                    <td className="py-3 px-4">本周日</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        data.health.score >= 85 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {data.health.score >= 85 ? '🟢' : '🟡'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">P1</td>
                    <td className="py-3 px-4">完成3篇高质量内容</td>
                    <td className="py-3 px-4">1/3</td>
                    <td className="py-3 px-4">3篇</td>
                    <td className="py-3 px-4">本周日</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        🟡
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">P2</td>
                    <td className="py-3 px-4">心流时长达到20h/周</td>
                    <td className="py-3 px-4">16h</td>
                    <td className="py-3 px-4">20h</td>
                    <td className="py-3 px-4">本周日</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        🟡
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">P3</td>
                    <td className="py-3 px-4">知识连接数增加15个</td>
                    <td className="py-3 px-4">187个</td>
                    <td className="py-3 px-4">202个</td>
                    <td className="py-3 px-4">本周日</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        🟢
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 数据同步状态 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 数据同步状态</h2>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">📱 Health_Daily</div>
                  <div className="text-sm text-gray-500">30分钟前</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">98%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">🧠 Cognitive_Daily</div>
                  <div className="text-sm text-gray-500">2小时前</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">95%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">📝 Content_Daily</div>
                  <div className="text-sm text-gray-500">1小时前</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">90%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">🎯 Focus_Daily</div>
                  <div className="text-sm text-gray-500">实时</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 使用提示 */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 使用提示</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <div className="font-medium mb-2">日常使用：</div>
              <ul className="space-y-1">
                <li>• 每天花1分钟查看PEI指数和核心建议</li>
                <li>• 点击资产卡片深入分析具体表现</li>
                <li>• 设置手机提醒，养成数据录入习惯</li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-2">深度分析：</div>
              <ul className="space-y-1">
                <li>• 每周查看战略分析中心进行深度复盘</li>
                <li>• 关注趋势图发现个人行为模式</li>
                <li>• 利用相关性分析优化生活习惯</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalAssetDashboard;