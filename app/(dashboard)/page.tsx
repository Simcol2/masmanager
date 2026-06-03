"use client";

import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  DollarSign,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Hammer,
  Shirt,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// Mock data - replace with real Firestore data
const metrics = {
  totalRegistrations: 12,
  totalRevenue: 3600,
  outstandingBalance: 1200,
  inventoryAlerts: 3,
  productionAlerts: 5,
  registrationsByCostumeType: {
    girls_backline: 3,
    boys_backline: 4,
    toddler_frontline: 1,
    girls_frontline: 0,
    boys_frontline: 0,
    girls_ultra_frontline: 1,
    boys_ultra_frontline: 3,
  },
  productionProgress: 65,
  parentShirtTotals: {
    XS: 0, S: 1, M: 1, L: 0, XL: 0, XXL: 0, XXXL: 0,
  },
  recentActivity: [
    { id: 1, action: "New registration", detail: "Zayne Walsh - Boys Backline", time: "2h ago" },
    { id: 2, action: "Payment received", detail: "Caleeb Smith - $300", time: "4h ago" },
    { id: 3, action: "Inventory updated", detail: "Gold Half Pearl Trim - 10 yards added", time: "6h ago" },
    { id: 4, action: "Production complete", detail: "Ankle Bands - Small (5/7)", time: "1d ago" },
  ],
};

const costumeTypeLabels: Record<string, string> = {
  girls_backline: "Girls Backline",
  boys_backline: "Boys Backline",
  toddler_frontline: "Toddler Frontline",
  girls_frontline: "Girls Frontline",
  boys_frontline: "Boys Frontline",
  girls_ultra_frontline: "Girls Ultra Frontline",
  boys_ultra_frontline: "Boys Ultra Frontline",
};

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            The Black Stars <span className="gold-text">2026</span>
          </h1>
          <p className="text-void-400 mt-1">
            Welcome back, {user?.displayName || "Admin"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/registrations">
            <Button className="gold-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Registration
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Registrations"
          value={metrics.totalRegistrations}
          icon={Users}
          trend={{ value: 12, direction: "up" }}
          delay={0}
        />
        <MetricCard
          title="Revenue"
          value={`$${metrics.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 8, direction: "up" }}
          delay={0.1}
        />
        <MetricCard
          title="Outstanding"
          value={`$${metrics.outstandingBalance.toLocaleString()}`}
          icon={AlertTriangle}
          trend={{ value: 5, direction: "down" }}
          delay={0.2}
          alert
        />
        <MetricCard
          title="Inventory Alerts"
          value={metrics.inventoryAlerts}
          icon={Package}
          alert={metrics.inventoryAlerts > 0}
          delay={0.3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Registration Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-void-300 uppercase tracking-wider">
                  Registration Breakdown
                </CardTitle>
                <Badge variant="outline" className="badge-gold">
                  {metrics.totalRegistrations} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(metrics.registrationsByCostumeType).map(([type, count]) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-void-300">{costumeTypeLabels[type]}</span>
                    <span className="font-semibold text-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 bg-void-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / metrics.totalRegistrations) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full bg-gold-gradient rounded-full"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Production Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-void-300 uppercase tracking-wider">
                  Production Progress
                </CardTitle>
                <Hammer className="w-4 h-4 text-gold-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="metric-value text-5xl">{metrics.productionProgress}%</div>
                <p className="text-void-500 text-sm mt-1">Overall Completion</p>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: "Ankle Bands", progress: 70, total: 24 },
                  { name: "Thigh Bands", progress: 45, total: 10 },
                  { name: "Arm Bands", progress: 60, total: 24 },
                  { name: "Headbands", progress: 30, total: 11 },
                ].map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-void-400">{item.name}</span>
                      <span className="text-void-500">{item.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-void-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold-gradient rounded-full transition-all duration-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/production">
                <Button variant="ghost" className="w-full text-gold-400 hover:text-gold-300 hover:bg-gold-500/5 text-sm">
                  View Production Planner
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Parent Shirt Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-void-300 uppercase tracking-wider">
                  Parent Shirt Orders
                </CardTitle>
                <Shirt className="w-4 h-4 text-gold-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(metrics.parentShirtTotals).map(([size, count]) => (
                  <div
                    key={size}
                    className="text-center p-3 rounded-sm bg-void-800/30 border border-void-800/50"
                  >
                    <div className="text-lg font-bold text-foreground">{count}</div>
                    <div className="text-xs text-void-500">{size}</div>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 border-t border-void-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-void-400">Total Shirts</span>
                  <span className="text-lg font-bold gold-text">
                    {Object.values(metrics.parentShirtTotals).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
              </div>

              <Link href="/parent-shirts">
                <Button variant="ghost" className="w-full text-gold-400 hover:text-gold-300 hover:bg-gold-500/5 text-sm">
                  Manage Orders
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-void-300 uppercase tracking-wider">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics.recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-sm hover:bg-void-800/20 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-gold-500/50 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.action}</p>
                    <p className="text-xs text-void-500 truncate">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-void-600 flex-shrink-0">{activity.time}</span>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-void-300 uppercase tracking-wider">
                Alerts & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AlertItem
                type="warning"
                title="Low Stock: Gold Half Pearl Trim"
                description="Only 0.8 yards remaining. Reorder threshold: 5 yards."
              />
              <AlertItem
                type="warning"
                title="Production Behind: Thigh Bands"
                description="Only 45% complete. 6 sets still needed."
              />
              <AlertItem
                type="info"
                title="New Season Approaching"
                description="2027 season setup available. Duplicate 2026 configuration?"
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  alert,
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; direction: "up" | "down" };
  alert?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="glass-card">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-void-500 uppercase tracking-wider">
                {title}
              </p>
              <p className={cn("text-xl md:text-2xl font-bold", alert ? "text-crimson" : "text-foreground")}>
                {value}
              </p>
              {trend && (
                <div className="flex items-center gap-1">
                  {trend.direction === "up" ? (
                    <TrendingUp className="w-3 h-3 text-emerald" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-crimson" />
                  )}
                  <span className={cn("text-xs", trend.direction === "up" ? "text-emerald" : "text-crimson")}>
                    {trend.value}%
                  </span>
                </div>
              )}
            </div>
            <div className={cn(
              "p-2 rounded-sm",
              alert ? "bg-crimson/10" : "bg-gold-500/10"
            )}>
              <Icon className={cn("w-4 h-4", alert ? "text-crimson" : "text-gold-400")} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AlertItem({
  type,
  title,
  description,
}: {
  type: "warning" | "info" | "error";
  title: string;
  description: string;
}) {
  const styles = {
    warning: "border-l-2 border-gold-500 bg-gold-500/5",
    info: "border-l-2 border-emerald bg-emerald/5",
    error: "border-l-2 border-crimson bg-crimson/5",
  };

  return (
    <div className={cn("p-3 rounded-sm", styles[type])}>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-void-500 mt-1">{description}</p>
    </div>
  );
}

function cn(...inputs: (string | undefined | false)[]) {
  return inputs.filter(Boolean).join(" ");
}
