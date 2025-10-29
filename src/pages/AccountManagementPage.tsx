import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/utils/apiClient";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  CreditCard, 
  RefreshCw, 
  Wallet, 
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

interface AccountInfo {
  nichandle: string;
  customerCode: string;
  email: string;
  firstname: string;
  name: string;
  state: string;
  kycValidated: boolean;
  city: string;
  country: string;
  phone: string;
  currency: {
    code: string;
    symbol: string;
  };
}

interface Refund {
  refundId: string;
  date: string;
  orderId: number;
  originalBillId: string;
  password: string;
  pdfUrl: string;
  priceWithTax: {
    currencyCode: string;
    text: string;
    value: number;
  };
}

interface CreditBalance {
  balanceName: string;
  amount: {
    currencyCode: string;
    text: string;
    value: number;
  };
  destination: string;
  type: string;
  expirationDate?: string;
}


const AccountManagementPage = () => {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [creditBalances, setCreditBalances] = useState<CreditBalance[]>([]);
  const [loading, setLoading] = useState({
    account: false,
    refunds: false,
    credits: false
  });

  // 获取账户信息
  const fetchAccountInfo = async () => {
    setLoading(prev => ({ ...prev, account: true }));
    try {
      const response = await api.get('/ovh/account/info');
      if (response.data.status === 'success') {
        setAccountInfo(response.data.data);
      }
    } catch (error: any) {
      toast.error('获取账户信息失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(prev => ({ ...prev, account: false }));
    }
  };

  // 获取退款列表
  const fetchRefunds = async () => {
    setLoading(prev => ({ ...prev, refunds: true }));
    try {
      const response = await api.get('/ovh/account/refunds');
      if (response.data.status === 'success') {
        // 按日期降序排序，确保最新的在前面
        const sortedRefunds = response.data.data.sort((a: Refund, b: Refund) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setRefunds(sortedRefunds);
      }
    } catch (error: any) {
      toast.error('获取退款列表失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(prev => ({ ...prev, refunds: false }));
    }
  };

  // 获取信用余额
  const fetchCreditBalances = async () => {
    setLoading(prev => ({ ...prev, credits: true }));
    try {
      const response = await api.get('/ovh/account/credit-balance');
      if (response.data.status === 'success') {
        setCreditBalances(response.data.data);
      }
    } catch (error: any) {
      toast.error('获取信用余额失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(prev => ({ ...prev, credits: false }));
    }
  };


  // 格式化日期时间
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 初始加载
  useEffect(() => {
    fetchAccountInfo();
    fetchRefunds();
    fetchCreditBalances();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-1 cyber-glow-text">账户管理</h1>
          <p className="text-cyber-muted">查看和管理您的 OVH 账户信息</p>
        </div>
        {/* 客户代码 - 右上角 */}
        {loading.account ? (
          <div className="flex items-center gap-2 cyber-panel bg-cyber-grid/30 px-4 py-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-cyber-muted text-sm">加载中...</span>
          </div>
        ) : accountInfo ? (
          <div className="cyber-panel bg-cyber-grid/30 px-6 py-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-cyber-muted" />
              <span className="text-xs text-cyber-muted">客户代码</span>
            </div>
            <p className="text-xl font-bold text-cyber-accent">
              {accountInfo.customerCode}
            </p>
            <p className="text-xs text-cyber-muted mt-1">
              {accountInfo.nichandle}
            </p>
          </div>
        ) : null}
      </motion.div>

      {/* 详细信息标签页 */}
      <Tabs defaultValue="credits" className="w-full">
        <TabsList className="grid w-full grid-cols-2 cyber-card">
          <TabsTrigger value="credits" className="data-[state=active]:bg-cyber-accent/20">
            <Wallet className="w-4 h-4 mr-2" />
            信用余额
          </TabsTrigger>
          <TabsTrigger value="refunds" className="data-[state=active]:bg-cyber-accent/20">
            <RefreshCw className="w-4 h-4 mr-2" />
            退款记录
          </TabsTrigger>
        </TabsList>

        {/* 信用余额 */}
        <TabsContent value="credits">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>信用余额</span>
                <button 
                  onClick={fetchCreditBalances}
                  className="cyber-button-sm"
                  disabled={loading.credits}
                >
                  {loading.credits ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>
              </CardTitle>
              <CardDescription>您的账户信用余额和优惠券</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.credits ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyber-accent" />
                  <p className="text-cyber-muted mt-2">加载中...</p>
                </div>
              ) : creditBalances.length === 0 ? (
                <div className="text-center py-8 text-cyber-muted">
                  <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>没有信用余额</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {creditBalances.map((balance, index) => (
                    <div key={index} className="cyber-panel p-4 bg-cyber-grid/30">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-cyber-text">{balance.balanceName}</p>
                            <Badge variant="outline" className="text-xs">
                              {balance.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-cyber-muted mt-1">
                            用途: {balance.destination}
                          </p>
                          {balance.expirationDate && (
                            <div className="flex items-center gap-1 mt-2">
                              <AlertCircle className="w-3 h-3 text-yellow-400" />
                              <p className="text-xs text-yellow-400">
                                过期时间: {formatDate(balance.expirationDate)}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-cyber-muted mb-1">余额</p>
                          <p className="text-xl font-bold text-green-400">
                            {balance.amount.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 退款记录 */}
        <TabsContent value="refunds">
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>退款记录</span>
                <button 
                  onClick={fetchRefunds}
                  className="cyber-button-sm"
                  disabled={loading.refunds}
                >
                  {loading.refunds ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>
              </CardTitle>
              <CardDescription>查看您的退款记录和状态</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.refunds ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyber-accent" />
                  <p className="text-cyber-muted mt-2">加载中...</p>
                </div>
              ) : refunds.length === 0 ? (
                <div className="text-center py-8 text-cyber-muted">
                  <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>没有退款记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {refunds.map((refund) => (
                    <div key={refund.refundId} className="cyber-panel p-4 bg-cyber-grid/30">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-cyber-text">退款 #{refund.refundId}</p>
                            <Badge variant="outline" className="text-xs">
                              订单 {refund.orderId}
                            </Badge>
                          </div>
                          <p className="text-sm text-cyber-muted mt-2">
                            📅 {formatDateTime(refund.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-cyber-muted mb-1">退款金额</p>
                          <p className="text-xl font-bold text-green-400">
                            {refund.priceWithTax.text}
                          </p>
                          {refund.pdfUrl && (
                            <a 
                              href={refund.pdfUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-cyber-accent hover:underline inline-flex items-center gap-1 mt-2"
                            >
                              <FileText className="w-3 h-3" />
                              下载PDF
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 账户状态卡片 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* KYC验证状态 */}
        <motion.div variants={itemVariants}>
          <Card className="cyber-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-cyber-muted flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                KYC 验证
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.account ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-cyber-muted text-sm">加载中...</span>
                </div>
              ) : (
                <div>
                  {accountInfo?.kycValidated ? (
                    <>
                      <p className="text-2xl font-bold text-green-400">已验证</p>
                      <p className="text-xs text-cyber-muted mt-1">身份已确认</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-yellow-400">未验证</p>
                      <p className="text-xs text-cyber-muted mt-1">需要验证</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 账户状态 */}
        <motion.div variants={itemVariants}>
          <Card className="cyber-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-cyber-muted flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                账户状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.account ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-cyber-muted text-sm">加载中...</span>
                </div>
              ) : (
                <div>
                  <p className={`text-2xl font-bold ${accountInfo?.state === 'complete' ? 'text-green-400' : 'text-cyber-text'}`}>
                    {accountInfo?.state === 'complete' ? '正常' : accountInfo?.state || '-'}
                  </p>
                  <p className="text-xs text-cyber-muted mt-1">
                    {accountInfo?.email || '-'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 货币 */}
        <motion.div variants={itemVariants}>
          <Card className="cyber-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-cyber-muted flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                账户货币
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.account ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-cyber-muted text-sm">加载中...</span>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-cyber-text">
                    {accountInfo?.currency?.code || '-'}
                  </p>
                  <p className="text-xs text-cyber-muted mt-1">
                    符号: {accountInfo?.currency?.symbol || '-'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AccountManagementPage;

