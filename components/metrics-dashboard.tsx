'use client';

import type { ReactNode } from 'react';

export interface ProjectMetrics {
  totalFiles: number;
  totalLines: number;
  avgFileSize: number;
  languages: { language: string; percentage: number }[];
  testCoverage: number;
  dependencies: { name: string; version: string; outdated?: boolean }[];
  vulnerabilities: number;
  complexity: {
    average: number;
    highest: string;
    rating: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'stable';
  color?: 'default' | 'success' | 'warning' | 'error';
}

const MetricCard = ({ title, value, unit, icon, trend, color = 'default' }: MetricCardProps) => {
  const colorClasses = {
    default: 'bg-gray-800 border-gray-700',
    success: 'bg-green-900/20 border-green-700',
    warning: 'bg-yellow-900/20 border-yellow-700',
    error: 'bg-red-900/20 border-red-700',
  };

  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    stable: 'text-gray-400',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">
            {value}
            {unit && <span className="text-lg text-gray-400 ml-1">{unit}</span>}
          </p>
        </div>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>
      {trend && (
        <p className={`text-xs mt-2 ${trendColors[trend]}`}>
          {trend === 'up' && '↑ '}
          {trend === 'down' && '↓ '}
          {trend === 'stable' && '→ '}
          {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
        </p>
      )}
    </div>
  );
};

interface LanguageBarProps {
  language: string;
  percentage: number;
}

const LanguageBar = ({ language, percentage }: LanguageBarProps) => {
  const colors: Record<string, string> = {
    TypeScript: 'bg-blue-600',
    JavaScript: 'bg-yellow-500',
    Python: 'bg-blue-500',
    Go: 'bg-blue-400',
    Rust: 'bg-orange-600',
    SQL: 'bg-purple-600',
    CSS: 'bg-pink-600',
    HTML: 'bg-red-600',
    default: 'bg-gray-600',
  };

  const barColor = colors[language] || colors.default;

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-300">{language}</span>
        <span className="text-sm text-gray-400">{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface DependencyItemProps {
  name: string;
  version: string;
  outdated?: boolean;
}

const DependencyItem = ({ name, version, outdated }: DependencyItemProps) => {
  return (
    <div className="flex items-center justify-between py-2 px-2 bg-gray-800/50 rounded mb-1">
      <span className="text-sm text-gray-300">{name}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded ${
          outdated
            ? 'bg-yellow-900/30 text-yellow-400'
            : 'bg-green-900/30 text-green-400'
        }`}>
          {version}
          {outdated && ' (outdated)'}
        </span>
      </div>
    </div>
  );
};

interface MetricsDashboardProps {
  metrics: ProjectMetrics;
}

export default function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  const complexityColors = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h3 className="font-semibold text-white">Project Metrics</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MetricCard
            title="Total Files"
            value={metrics.totalFiles}
            trend="stable"
          />
          <MetricCard
            title="Total Lines"
            value={metrics.totalLines.toLocaleString()}
            trend="up"
          />
          <MetricCard
            title="Avg File Size"
            value={(metrics.avgFileSize / 1024).toFixed(1)}
            unit="KB"
            trend="stable"
          />
          <MetricCard
            title="Test Coverage"
            value={metrics.testCoverage}
            unit="%"
            color={metrics.testCoverage >= 80 ? 'success' : metrics.testCoverage >= 50 ? 'warning' : 'error'}
            trend={metrics.testCoverage >= 80 ? 'up' : 'down'}
          />
        </div>

        <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <h4 className="text-sm font-medium text-white mb-3">Code Distribution</h4>
          {metrics.languages.map((lang) => (
            <LanguageBar
              key={lang.language}
              language={lang.language}
              percentage={lang.percentage}
            />
          ))}
        </div>

        <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <h4 className="text-sm font-medium text-white mb-3">Code Complexity</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Average:</span>
              <span className="text-sm font-medium text-gray-300">{metrics.complexity.average.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Highest:</span>
              <span className="text-sm font-medium text-gray-300">{metrics.complexity.highest}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Rating:</span>
              <span className={`text-sm font-medium ${complexityColors[metrics.complexity.rating]}`}>
                {metrics.complexity.rating.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <h4 className="text-sm font-medium text-white mb-3">Security</h4>
          <MetricCard
            title="Vulnerabilities"
            value={metrics.vulnerabilities}
            color={metrics.vulnerabilities === 0 ? 'success' : metrics.vulnerabilities < 3 ? 'warning' : 'error'}
          />
        </div>

        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <h4 className="text-sm font-medium text-white mb-3">Dependencies ({metrics.dependencies.length})</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {metrics.dependencies.slice(0, 5).map((dep) => (
              <DependencyItem
                key={dep.name}
                name={dep.name}
                version={dep.version}
                outdated={dep.outdated}
              />
            ))}
            {metrics.dependencies.length > 5 && (
              <p className="text-xs text-gray-500 pt-2">
                +{metrics.dependencies.length - 5} more dependencies
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
