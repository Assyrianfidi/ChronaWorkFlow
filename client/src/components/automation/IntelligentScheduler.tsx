import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAutomation } from "./AutomationEngine";
import { useAnalytics } from "@/components/analytics/AnalyticsEngine";

// Scheduler Types
interface ScheduleTask {
  id: string;
  name: string;
  type: "automation" | "workflow" | "report" | "maintenance" | "backup";
  priority: "low" | "medium" | "high" | "critical";
  schedule: ScheduleConfig;
  resource: ResourceRequirement;
  dependencies: string[];
  status: "scheduled" | "running" | "completed" | "failed" | "cancelled";
  createdAt: number;
  nextRun: number;
  lastRun?: number;
  executionHistory: TaskExecution[];
}

interface ScheduleConfig {
  type: "cron" | "interval" | "once" | "event" | "adaptive";
  expression?: string; // cron expression
  interval?: number; // milliseconds
  startTime?: number;
  endTime?: number;
  timezone?: string;
  adaptive?: {
    optimizeFor: "performance" | "cost" | "reliability";
    learningEnabled: boolean;
    constraints: ScheduleConstraints;
  };
}

interface ResourceRequirement {
  cpu: number; // percentage
  memory: number; // MB
  disk: number; // MB
  network: boolean;
  exclusive: boolean;
  priority: number;
}

interface ScheduleConstraints {
  maxConcurrentTasks: number;
  blackoutWindows: TimeWindow[];
  resourceLimits: {
    maxCPU: number;
    maxMemory: number;
    maxDisk: number;
  };
  businessHours: TimeWindow;
}

interface TimeWindow {
  start: string; // HH:mm
  end: string; // HH:mm
  days: number[]; // 0-6 (Sunday-Saturday)
  timezone?: string;
}

interface TaskExecution {
  id: string;
  taskId: string;
  startTime: number;
  endTime?: number;
  status: "running" | "completed" | "failed" | "cancelled";
  duration?: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
  };
  result?: any;
  error?: string;
  logs: string[];
}

interface ScheduleOptimization {
  taskId: string;
  originalSchedule: ScheduleConfig;
  optimizedSchedule: ScheduleConfig;
  improvement: {
    performance: number; // percentage
    cost: number; // percentage
    reliability: number; // percentage
  };
  confidence: number;
  reason: string;
}

// Intelligent Scheduler Engine
class IntelligentSchedulerEngine {
  private tasks: Map<string, ScheduleTask> = new Map();
  private queue: ScheduleTask[] = [];
  private running: Map<string, TaskExecution> = new Map();
  private completed: TaskExecution[] = [];
  private resourceMonitor: ResourceMonitor;
  private optimizer: ScheduleOptimizer;
  private learningEngine: ScheduleLearningEngine;
  private scheduler: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.resourceMonitor = new ResourceMonitor();
    this.optimizer = new ScheduleOptimizer();
    this.learningEngine = new ScheduleLearningEngine();
    this.startScheduler();
  }

  private startScheduler(): void {
    // Run scheduler every minute
    this.scheduler = setInterval(() => {
      this.processSchedule();
    }, 60000);
  }

  async addTask(
    task: Omit<
      ScheduleTask,
      "id" | "createdAt" | "nextRun" | "executionHistory"
    >,
  ): Promise<ScheduleTask> {
    const scheduleTask: ScheduleTask = {
      ...task,
      id: Math.random().toString(36),
      createdAt: Date.now(),
      nextRun: this.calculateNextRun(task.schedule),
      executionHistory: [],
    };

    this.tasks.set(scheduleTask.id, scheduleTask);

    // Optimize schedule if adaptive
    if (task.schedule.type === "adaptive" && task.schedule.adaptive) {
      await this.optimizeTaskSchedule(scheduleTask);
    }

    return scheduleTask;
  }

  private calculateNextRun(schedule: ScheduleConfig): number {
    const now = Date.now();

    switch (schedule.type) {
      case "once":
        return schedule.startTime || now;

      case "interval":
        const interval = schedule.interval || 3600000; // Default 1 hour
        return now + interval;

      case "cron":
        // Simplified cron calculation - in production use a proper cron library
        return this.parseCronExpression(schedule.expression || "0 * * * *");

      case "event":
        return now; // Event-based tasks run immediately when triggered

      case "adaptive":
        return now + 15 * 60 * 1000; // Start with 15 minutes, will be optimized

      default:
        return now + 60 * 60 * 1000; // Default 1 hour
    }
  }

  private parseCronExpression(expression: string): number {
    // Very simplified cron parser - DO NOT use in production
    const parts = expression.split(" ");
    if (parts.length !== 5) return Date.now() + 60 * 60 * 1000;

    const [minute, hour, day, month, weekday] = parts;
    const now = new Date();

    // Simple implementation - find next matching time
    const nextTime = new Date(now);

    if (minute !== "*") {
      nextTime.setMinutes(parseInt(minute));
    }

    if (hour !== "*") {
      nextTime.setHours(parseInt(hour));
    }

    // If time is in the past, move to next day
    if (nextTime <= now) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime.getTime();
  }

  private async processSchedule(): Promise<void> {
    const now = Date.now();

    // Find tasks ready to run
    const readyTasks = Array.from(this.tasks.values()).filter(
      (task) => task.status === "scheduled" && task.nextRun <= now,
    );

    // Check resource availability and dependencies
    const executableTasks = await this.filterExecutableTasks(readyTasks);

    // Execute tasks based on priority and resource availability
    for (const task of executableTasks) {
      if (await this.canExecuteTask(task)) {
        await this.executeTask(task);
      }
    }

    // Update next run times
    this.updateNextRunTimes();

    // Learn from executions
    await this.learningEngine.learnFromExecutions(this.completed);
  }

  private async filterExecutableTasks(
    tasks: ScheduleTask[],
  ): Promise<ScheduleTask[]> {
    const executable: ScheduleTask[] = [];

    for (const task of tasks) {
      // Check dependencies
      const dependenciesMet = task.dependencies.every((depId) => {
        const dep = this.tasks.get(depId);
        return dep && dep.status === "completed";
      });

      if (dependenciesMet) {
        executable.push(task);
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    executable.sort(
      (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority],
    );

    return executable;
  }

  private async canExecuteTask(task: ScheduleTask): Promise<boolean> {
    const currentResources = await this.resourceMonitor.getCurrentUsage();
    const totalResources = await this.resourceMonitor.getTotalCapacity();

    // Check if we have enough resources
    const hasCPU =
      currentResources.cpu + task.resource.cpu <= totalResources.cpu;
    const hasMemory =
      currentResources.memory + task.resource.memory <= totalResources.memory;
    const hasDisk =
      currentResources.disk + task.resource.disk <= totalResources.disk;

    // Check for exclusive tasks
    const hasExclusive = task.resource.exclusive
      ? this.running.size === 0
      : true;

    return hasCPU && hasMemory && hasDisk && hasExclusive;
  }

  private async executeTask(task: ScheduleTask): Promise<void> {
    const execution: TaskExecution = {
      id: Math.random().toString(36),
      taskId: task.id,
      startTime: Date.now(),
      status: "running",
      resourceUsage: {
        cpu: task.resource.cpu,
        memory: task.resource.memory,
        disk: task.resource.disk,
      },
      logs: [`Task execution started at ${new Date().toISOString()}`],
    };

    this.running.set(execution.id, execution);
    task.status = "running";
    task.lastRun = Date.now();

    try {
      // Simulate task execution
      const duration = await this.simulateTaskExecution(task);

      execution.endTime = Date.now();
      execution.duration = duration;
      execution.status = "completed";
      execution.result = { success: true, duration };
      execution.logs.push(
        `Task completed successfully at ${new Date().toISOString()}`,
      );

      task.status = "completed";
      task.executionHistory.push(execution);

      // Keep only last 10 executions
      if (task.executionHistory.length > 10) {
        task.executionHistory = task.executionHistory.slice(-10);
      }
    } catch (error) {
      execution.endTime = Date.now();
      execution.status = "failed";
      execution.error =
        error instanceof Error ? error.message : "Unknown error";
      execution.logs.push(`Task failed: ${execution.error}`);

      task.status = "failed";
      task.executionHistory.push(execution);
    }

    this.running.delete(execution.id);
    this.completed.push(execution);

    // Keep only last 100 completed executions
    if (this.completed.length > 100) {
      this.completed = this.completed.slice(-100);
    }

    // Schedule next run
    task.nextRun = this.calculateNextRun(task.schedule);
    task.status = "scheduled";
  }

  private async simulateTaskExecution(task: ScheduleTask): Promise<number> {
    // Simulate different execution times based on task type
    const baseDurations = {
      automation: 30000, // 30 seconds
      workflow: 120000, // 2 minutes
      report: 180000, // 3 minutes
      maintenance: 300000, // 5 minutes
      backup: 600000, // 10 minutes
    };

    const baseDuration = baseDurations[task.type] || 60000;
    const variation = Math.random() * 0.4 - 0.2; // ±20% variation
    const duration = baseDuration * (1 + variation);

    // Simulate execution time
    await new Promise((resolve) => setTimeout(resolve, 100)); // Short simulation for demo

    return duration;
  }

  private updateNextRunTimes(): void {
    for (const task of this.tasks.values()) {
      if (task.status === "scheduled" && task.nextRun <= Date.now()) {
        task.nextRun = this.calculateNextRun(task.schedule);
      }
    }
  }

  private async optimizeTaskSchedule(task: ScheduleTask): Promise<void> {
    if (!task.schedule.adaptive) return;

    const optimization = await this.optimizer.optimizeSchedule(
      task,
      this.tasks,
    );

    if (optimization) {
      task.schedule = optimization.optimizedSchedule;
      task.nextRun = this.calculateNextRun(task.schedule);
    }
  }

  async getScheduleMetrics(): Promise<{
    totalTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageExecutionTime: number;
    resourceUtilization: {
      cpu: number;
      memory: number;
      disk: number;
    };
  }> {
    const tasks = Array.from(this.tasks.values());
    const runningTasks = this.running.size;
    const completedTasks = this.completed.length;
    const failedTasks = tasks.filter((t) => t.status === "failed").length;

    const averageExecutionTime =
      this.completed.length > 0
        ? this.completed.reduce((sum, exec) => sum + (exec.duration || 0), 0) /
          this.completed.length
        : 0;

    const resourceUtilization = await this.resourceMonitor.getCurrentUsage();

    return {
      totalTasks: tasks.length,
      runningTasks,
      completedTasks,
      failedTasks,
      averageExecutionTime,
      resourceUtilization,
    };
  }

  async getOptimizations(): Promise<ScheduleOptimization[]> {
    const optimizations: ScheduleOptimization[] = [];

    for (const task of this.tasks.values()) {
      if (task.schedule.type === "adaptive" && task.schedule.adaptive) {
        const optimization = await this.optimizer.optimizeSchedule(
          task,
          this.tasks,
        );
        if (optimization) {
          optimizations.push(optimization);
        }
      }
    }

    return optimizations;
  }

  destroy(): void {
    if (this.scheduler) {
      clearInterval(this.scheduler);
    }
    this.tasks.clear();
    this.running.clear();
    this.completed = [];
  }
}

// Resource Monitor
class ResourceMonitor {
  async getCurrentUsage(): Promise<{
    cpu: number;
    memory: number;
    disk: number;
  }> {
    // Simulate current resource usage
    return {
      cpu: Math.random() * 80, // 0-80% CPU usage
      memory: Math.random() * 70, // 0-70% memory usage
      disk: Math.random() * 60, // 0-60% disk usage
    };
  }

  async getTotalCapacity(): Promise<{
    cpu: number;
    memory: number;
    disk: number;
  }> {
    return {
      cpu: 100,
      memory: 16000, // 16GB
      disk: 1000000, // 1TB
    };
  }

  async getHistoricalUsage(hours: number = 24): Promise<
    Array<{
      timestamp: number;
      cpu: number;
      memory: number;
      disk: number;
    }>
  > {
    const data = [];
    const now = Date.now();
    const interval = (hours * 60 * 60 * 1000) / 100; // 100 data points

    for (let i = 0; i < 100; i++) {
      data.push({
        timestamp: now - (100 - i) * interval,
        cpu: Math.random() * 80,
        memory: Math.random() * 70,
        disk: Math.random() * 60,
      });
    }

    return data;
  }
}

// Schedule Optimizer
class ScheduleOptimizer {
  async optimizeSchedule(
    task: ScheduleTask,
    allTasks: Map<string, ScheduleTask>,
  ): Promise<ScheduleOptimization | null> {
    if (!task.schedule.adaptive) return null;

    const originalSchedule = { ...task.schedule };
    const optimizedSchedule = { ...task.schedule };

    // Analyze historical execution data
    const executionHistory = task.executionHistory;
    if (executionHistory.length < 3) return null; // Need history for optimization

    // Calculate optimal execution time based on patterns
    const optimalTime = this.calculateOptimalExecutionTime(task, allTasks);

    // Apply optimization based on objective
    const objective = task.schedule.adaptive.optimizeFor;

    switch (objective) {
      case "performance":
        optimizedSchedule.startTime = optimalTime.performance;
        break;
      case "cost":
        optimizedSchedule.startTime = optimalTime.cost;
        break;
      case "reliability":
        optimizedSchedule.startTime = optimalTime.reliability;
        break;
    }

    // Calculate improvements
    const improvement = this.calculateImprovement(
      originalSchedule,
      optimizedSchedule,
      executionHistory,
    );

    return {
      taskId: task.id,
      originalSchedule,
      optimizedSchedule,
      improvement,
      confidence: Math.min(0.9, executionHistory.length / 10), // Confidence based on history size
      reason: this.generateOptimizationReason(objective, improvement),
    };
  }

  private calculateOptimalExecutionTime(
    task: ScheduleTask,
    allTasks: Map<string, ScheduleTask>,
  ): { performance: number; cost: number; reliability: number } {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Analyze resource usage patterns
    const lowUsageTimes = this.findLowResourceUsageTimes(allTasks);

    return {
      performance: now + 2 * 60 * 60 * 1000, // 2 hours from now (low usage)
      cost: now + 14 * 60 * 60 * 1000, // Off-peak hours
      reliability: now + 6 * 60 * 60 * 1000, // Most reliable time window
    };
  }

  private findLowResourceUsageTimes(
    tasks: Map<string, ScheduleTask>,
  ): number[] {
    // Simple implementation - find gaps in schedule
    const scheduleGaps = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Check each hour of the next 24 hours
    for (let hour = 0; hour < 24; hour++) {
      const timeSlot = now + hour * 60 * 60 * 1000;
      const concurrentTasks = Array.from(tasks.values()).filter((task) => {
        const nextRun = task.nextRun;
        const estimatedDuration = 30 * 60 * 1000; // 30 minutes average
        return nextRun <= timeSlot && nextRun + estimatedDuration > timeSlot;
      });

      if (concurrentTasks.length < 2) {
        // Low concurrency
        scheduleGaps.push(timeSlot);
      }
    }

    return scheduleGaps;
  }

  private calculateImprovement(
    original: ScheduleConfig,
    optimized: ScheduleConfig,
    history: TaskExecution[],
  ): { performance: number; cost: number; reliability: number } {
    // Simulate improvement calculations
    const avgDuration =
      history.reduce((sum, exec) => sum + (exec.duration || 0), 0) /
      history.length;
    const failureRate =
      history.filter((exec) => exec.status === "failed").length /
      history.length;

    return {
      performance: Math.random() * 20 + 5, // 5-25% improvement
      cost: Math.random() * 15 + 10, // 10-25% cost reduction
      reliability: Math.random() * 30 + 10, // 10-40% reliability improvement
    };
  }

  private generateOptimizationReason(
    objective: string,
    improvement: any,
  ): string {
    switch (objective) {
      case "performance":
        return `Optimized for ${improvement.performance.toFixed(1)}% better performance by scheduling during low-resource periods`;
      case "cost":
        return `Reduced costs by ${improvement.cost.toFixed(1)}% by moving to off-peak hours`;
      case "reliability":
        return `Improved reliability by ${improvement.reliability.toFixed(1)}% by avoiding high-risk time windows`;
      default:
        return "Schedule optimized based on historical patterns";
    }
  }
}

// Schedule Learning Engine
class ScheduleLearningEngine {
  private patterns: Map<string, any> = new Map();

  async learnFromExecutions(executions: TaskExecution[]): Promise<void> {
    if (executions.length < 10) return;

    // Analyze execution patterns
    const patterns = this.analyzePatterns(executions);

    // Update learning models
    this.updatePatterns(patterns);
  }

  private analyzePatterns(executions: TaskExecution[]): any {
    // Analyze timing patterns
    const hourlyStats = this.analyzeHourlyPatterns(executions);
    const failurePatterns = this.analyzeFailurePatterns(executions);
    const resourcePatterns = this.analyzeResourcePatterns(executions);

    return {
      hourly: hourlyStats,
      failures: failurePatterns,
      resources: resourcePatterns,
    };
  }

  private analyzeHourlyPatterns(executions: TaskExecution[]): any {
    const hourlyData: Record<
      number,
      { count: number; avgDuration: number; failures: number }
    > = {};

    executions.forEach((exec) => {
      const hour = new Date(exec.startTime).getHours();

      if (!hourlyData[hour]) {
        hourlyData[hour] = { count: 0, avgDuration: 0, failures: 0 };
      }

      hourlyData[hour].count++;
      hourlyData[hour].avgDuration += exec.duration || 0;

      if (exec.status === "failed") {
        hourlyData[hour].failures++;
      }
    });

    // Calculate averages
    Object.keys(hourlyData).forEach((hour) => {
      const data = hourlyData[parseInt(hour)];
      data.avgDuration = data.avgDuration / data.count;
    });

    return hourlyData;
  }

  private analyzeFailurePatterns(executions: TaskExecution[]): any {
    const failures = executions.filter((exec) => exec.status === "failed");

    return {
      totalFailures: failures.length,
      failureRate: failures.length / executions.length,
      commonErrors: this.findCommonErrors(failures),
      failureTimes: failures.map((f) => new Date(f.startTime).getHours()),
    };
  }

  private analyzeResourcePatterns(executions: TaskExecution[]): any {
    const resourceUsage = {
      avgCPU:
        executions.reduce((sum, exec) => sum + exec.resourceUsage.cpu, 0) /
        executions.length,
      avgMemory:
        executions.reduce((sum, exec) => sum + exec.resourceUsage.memory, 0) /
        executions.length,
      avgDisk:
        executions.reduce((sum, exec) => sum + exec.resourceUsage.disk, 0) /
        executions.length,
    };

    return resourceUsage;
  }

  private findCommonErrors(failures: TaskExecution[]): string[] {
    const errorCounts: Record<string, number> = {};

    failures.forEach((failure) => {
      const error = failure.error || "Unknown error";
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error]) => error);
  }

  private updatePatterns(patterns: any): void {
    patterns.hourly && this.patterns.set("hourly", patterns.hourly);
    patterns.failures && this.patterns.set("failures", patterns.failures);
    patterns.resources && this.patterns.set("resources", patterns.resources);
  }

  getPatterns(): Map<string, any> {
    return this.patterns;
  }
}

// Main Intelligent Scheduler Component
export const IntelligentScheduler: React.FC<{
  onTaskUpdate?: (task: ScheduleTask) => void;
}> = ({ onTaskUpdate }) => {
  const { createRule, executeRule } = useAutomation();
  const { generateReport } = useAnalytics();

  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [optimizations, setOptimizations] = useState<ScheduleOptimization[]>(
    [],
  );
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const schedulerRef = useRef<IntelligentSchedulerEngine>();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize scheduler
  useEffect(() => {
    schedulerRef.current = new IntelligentSchedulerEngine();
    initializeDefaultTasks();

    // Update metrics periodically
    intervalRef.current = setInterval(() => {
      updateMetrics();
    }, 5000);

    return () => {
      schedulerRef.current?.destroy();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const initializeDefaultTasks = useCallback(async () => {
    if (!schedulerRef.current) return;

    const defaultTasks = [
      {
        name: "Daily Performance Report",
        type: "report" as const,
        priority: "medium" as const,
        schedule: {
          type: "cron" as const,
          expression: "0 8 * * *", // 8 AM daily
          timezone: "UTC",
        },
        resource: {
          cpu: 20,
          memory: 512,
          disk: 100,
          network: false,
          exclusive: false,
          priority: 2,
        },
        dependencies: [],
        status: "scheduled" as const,
      },
      {
        name: "Database Backup",
        type: "backup" as const,
        priority: "high" as const,
        schedule: {
          type: "cron" as const,
          expression: "0 2 * * 0", // 2 AM every Sunday
          timezone: "UTC",
        },
        resource: {
          cpu: 40,
          memory: 1024,
          disk: 5000,
          network: false,
          exclusive: true,
          priority: 3,
        },
        dependencies: [],
        status: "scheduled" as const,
      },
      {
        name: "System Health Check",
        type: "maintenance" as const,
        priority: "medium" as const,
        schedule: {
          type: "interval" as const,
          interval: 15 * 60 * 1000, // 15 minutes
          timezone: "UTC",
        },
        resource: {
          cpu: 10,
          memory: 256,
          disk: 50,
          network: true,
          exclusive: false,
          priority: 1,
        },
        dependencies: [],
        status: "scheduled" as const,
      },
      {
        name: "Adaptive Report Generation",
        type: "report" as const,
        priority: "low" as const,
        schedule: {
          type: "adaptive" as const,
          adaptive: {
            optimizeFor: "performance" as const,
            learningEnabled: true,
            constraints: {
              maxConcurrentTasks: 5,
              blackoutWindows: [],
              resourceLimits: {
                maxCPU: 80,
                maxMemory: 8192,
                maxDisk: 10000,
              },
              businessHours: {
                start: "09:00",
                end: "17:00",
                days: [1, 2, 3, 4, 5], // Monday-Friday
                timezone: "UTC",
              },
            },
          },
        },
        resource: {
          cpu: 30,
          memory: 768,
          disk: 200,
          network: false,
          exclusive: false,
          priority: 2,
        },
        dependencies: [],
        status: "scheduled" as const,
      },
    ];

    const createdTasks = await Promise.all(
      defaultTasks.map((task) => schedulerRef.current!.addTask(task)),
    );

    setTasks(createdTasks);
  }, []);

  const updateMetrics = useCallback(async () => {
    if (!schedulerRef.current) return;

    const metricsData = await schedulerRef.current.getScheduleMetrics();
    setMetrics(metricsData);

    const optimizationsData = await schedulerRef.current.getOptimizations();
    setOptimizations(optimizationsData);
  }, []);

  const handleAddTask = useCallback(
    async (
      taskData: Omit<
        ScheduleTask,
        "id" | "createdAt" | "nextRun" | "executionHistory"
      >,
    ) => {
      if (!schedulerRef.current) return;

      const task = await schedulerRef.current.addTask(taskData);
      setTasks((prev) => [...prev, task]);
      onTaskUpdate?.(task);
    },
    [onTaskUpdate],
  );

  const handleExecuteTask = useCallback(
    async (taskId: string) => {
      if (!schedulerRef.current) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Create and execute automation rule for the task
      const rule = await createRule({
        name: `Scheduled Task: ${task.name}`,
        description: "Execute scheduled task",
        category: "workflow",
        trigger: {
          type: "manual",
          config: {},
        },
        conditions: [],
        actions: [
          {
            type: "workflow",
            config: {
              workflowId: task.id,
              parameters: {},
            },
          },
        ],
        enabled: true,
        priority: task.priority,
      });

      await executeRule(rule.id, "manual");
      updateMetrics();
    },
    [tasks, createRule, executeRule, updateMetrics],
  );

  const renderTaskCard = (task: ScheduleTask) => {
    const isSelected = selectedTask === task.id;
    const statusColors = {
      scheduled: "bg-blue-100 text-blue-800",
      running: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    const priorityColors = {
      critical: "bg-red-500",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-green-500",
    };

    return (
      <div
        key={task.id}
        className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
          isSelected
            ? "border-blue-500 shadow-lg"
            : "border-gray-200 hover:border-gray-300"
        }`}
        onClick={() => setSelectedTask(isSelected ? null : task.id)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-medium">{task.name}</h3>
            <p className="text-sm text-gray-600">{task.type}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`}
            />
            <span
              className={`text-xs px-2 py-1 rounded ${statusColors[task.status]}`}
            >
              {task.status}
            </span>
          </div>
        </div>

        <div className="space-y-1 text-xs text-gray-500">
          <div>Next Run: {new Date(task.nextRun).toLocaleString()}</div>
          {task.lastRun && (
            <div>Last Run: {new Date(task.lastRun).toLocaleString()}</div>
          )}
          <div>Priority: {task.priority}</div>
          <div>
            Resource: CPU {task.resource.cpu}%, MEM {task.resource.memory}MB
          </div>
        </div>

        <div className="mt-3 flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleExecuteTask(task.id);
            }}
            disabled={task.status === "running"}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Execute Now
          </button>
        </div>
      </div>
    );
  };

  const renderMetrics = () => {
    if (!metrics) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold">{metrics.totalTasks}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold">{metrics.runningTasks}</div>
          <div className="text-sm text-gray-600">Running</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold">{metrics.completedTasks}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold">{metrics.failedTasks}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
      </div>
    );
  };

  const renderOptimizations = () => {
    if (optimizations.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Schedule Optimizations</h3>
        <div className="space-y-2">
          {optimizations.map((optimization) => (
            <div
              key={optimization.taskId}
              className="bg-blue-50 border border-blue-200 rounded-lg p-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-sm">
                    {tasks.find((t) => t.id === optimization.taskId)?.name}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {optimization.reason}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-green-600 font-medium">
                    +{optimization.improvement.performance.toFixed(1)}%
                    Performance
                  </div>
                  <div className="text-xs text-blue-600">
                    {optimization.confidence.toFixed(1)}% confidence
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Intelligent Scheduler</h2>
        <p className="text-gray-600">
          AI-powered task scheduling and optimization
        </p>
      </div>

      {renderMetrics()}
      {renderOptimizations()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Scheduled Tasks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map(renderTaskCard)}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Resource Utilization</h3>
          <div className="bg-white rounded-lg border p-4">
            {metrics && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span>{metrics.resourceUtilization.cpu.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${metrics.resourceUtilization.cpu}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span>
                      {metrics.resourceUtilization.memory.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${metrics.resourceUtilization.memory}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Disk Usage</span>
                    <span>{metrics.resourceUtilization.disk.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${metrics.resourceUtilization.disk}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligentScheduler;
