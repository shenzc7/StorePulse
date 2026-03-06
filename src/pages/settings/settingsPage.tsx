import { useState, useEffect } from 'react';
import { apiGet, apiPut, apiDelete } from '../../src/lib/api';

// Types for settings
interface ModelConfig {
  default_forecast_horizon: number;
  confidence_levels: number[];
  enable_caching: boolean;
  cache_ttl_seconds: number;
  min_training_samples: number;
  training_timeout_seconds: number;
}

interface DataManagement {
  data_retention_days: number;
  auto_cleanup_enabled: boolean;
  quality_monitoring_enabled: boolean;
  anomaly_detection_threshold: number;
}

interface StaffingConfig {
  customers_per_staff: number;
  high_traffic_threshold: number;
  labor_cost_per_staff: number;
}

interface InventoryConfig {
  conversion_rate: number;
  high_risk_visits: number;
  medium_risk_visits: number;
}

interface Automation {
  auto_forecast_enabled: boolean;
  auto_forecast_time: string;
  auto_training_enabled: boolean;
  auto_training_interval_days: number;
  alerts_enabled: boolean;
  alert_accuracy_threshold: number;
}

interface SystemMonitoring {
  health_check_interval_seconds: number;
  performance_logging_enabled: boolean;
  diagnostic_mode_enabled: boolean;
  max_log_age_days: number;
}

interface AdvancedConfig {
  database_pool_size: number;
  api_timeout_seconds: number;
  logging_level: string;
  enable_debug_mode: boolean;
}

interface QualityGates {
  lite_vs_baseline_improvement_pct: number;
  pro_vs_lite_improvement_pct: number;
  calibration_coverage_min: number;
  cold_start_max_ms: number;
}

interface SystemHealth {
  system: {
    cpu_percent: number;
    memory_percent: number;
    disk_usage: number;
    process_count: number;
    uptime_seconds: number;
  };
  database: { healthy: boolean };
  models: { lite_available: boolean; pro_available: boolean };
  data: { records_count: number };
  timestamp: string;
}

interface AppSettings {
  nb_ingarch_config: ModelConfig;
  staffing_config: StaffingConfig;
  inventory_config: InventoryConfig;
  data_management: DataManagement;
  automation: Automation;
  system_monitoring: SystemMonitoring;
  advanced_config: AdvancedConfig;
  quality_gates: QualityGates;
  auto_run: boolean;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  // Ensure time strings are always valid HH:MM to avoid native input pattern errors
  const normalizeTime = (value?: string | null): string => {
    if (!value) return '06:00';
    const match = /^(\d{1,2}):(\d{1,2})/.exec(value.trim());
    if (!match) return '06:00';
    const hours = Math.min(23, Math.max(0, parseInt(match[1], 10)));
    const minutes = Math.min(59, Math.max(0, parseInt(match[2], 10)));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    loadSettings();
    loadSystemHealth();
    const interval = setInterval(loadSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiGet<AppSettings>('/api/settings/');
      const normalized: AppSettings = {
        ...data,
        automation: {
          ...data.automation,
          auto_forecast_time: normalizeTime(data.automation?.auto_forecast_time),
        },
      };
      setSettings(normalized);
      setError(null);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const data = await apiGet<SystemHealth>('/api/settings/system/health');
      setSystemHealth(data);
    } catch (err) {
      console.error('Failed to load system health:', err);
    }
  };

  const updateSetting = async <T,>(section: string, newSettings: T) => {
    if (!settings) return;

    try {
      setSaving(section);
      setError(null);
      setSuccessMessage(null);

      const payload =
        section === 'automation' && typeof newSettings === 'object' && newSettings !== null
          ? {
            ...(newSettings as any),
            auto_forecast_time: normalizeTime((newSettings as any).auto_forecast_time),
          }
          : newSettings;

      await apiPut(`/api/settings/`, { section, settings: payload });

      setSettings(prev => prev ? { ...prev, [section]: payload } : null);

      if (section === 'auto_run') {
        localStorage.setItem('storepulse_auto_run', String(newSettings));
      }

      setSuccessMessage(`${section.replace('_', ' ')} updated successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save setting:', err);
      setError(`Failed to save ${section.replace('_', ' ')}`);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">System Configuration</h1>
            <p className="text-sm text-ink-600 mt-1">Loading configuration...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-border rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-surface-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-3 bg-surface-200 rounded"></div>
                <div className="h-3 bg-surface-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Configuration Error</h3>
              <p className="text-sm text-ink-600">{error}</p>
            </div>
          </div>
          <button
            onClick={loadSettings}
            className="mt-4 btn-secondary text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">System Configuration</h1>
          <p className="text-sm text-ink-600 mt-1">Configure your forecasting preferences and system settings</p>
        </div>
        {successMessage && (
          <div className="bg-accent-50 border border-accent-200 rounded-lg px-4 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <svg className="w-4 h-4 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-accent-900">{successMessage}</span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('basic')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'basic'
            ? 'border-primary-600 text-primary-600'
            : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'
            }`}
        >
          General Settings
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'advanced'
            ? 'border-primary-600 text-primary-600'
            : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'
            }`}
        >
          Advanced Configuration
        </button>
      </div>

      {activeTab === 'basic' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Health Summary */}
          {systemHealth && (
            <div className="bg-white border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-ink-900 mb-4">System Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${systemHealth.database.healthy ? 'bg-accent-500' : 'bg-danger-500'}`}></div>
                  <div>
                    <div className="text-sm font-medium text-ink-900">Database</div>
                    <div className="text-xs text-ink-500">{systemHealth.database.healthy ? 'Connected & Healthy' : 'Connection Error'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${systemHealth.models.lite_available ? 'bg-accent-500' : 'bg-ink-300'}`}></div>
                  <div>
                    <div className="text-sm font-medium text-ink-900">Lite Model</div>
                    <div className="text-xs text-ink-500">{systemHealth.models.lite_available ? 'Ready for Use' : 'Needs Training'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${systemHealth.models.pro_available ? 'bg-accent-500' : 'bg-ink-300'}`}></div>
                  <div>
                    <div className="text-sm font-medium text-ink-900">Pro Model</div>
                    <div className="text-xs text-ink-500">{systemHealth.models.pro_available ? 'Ready for Use' : 'Needs Training'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Core Preferences */}
          <div className="bg-white border border-border rounded-lg">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-ink-900">Forecasting Preferences</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">
                  Forecast Window
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={settings.nb_ingarch_config.default_forecast_horizon}
                    onChange={(e) => {
                      updateSetting('nb_ingarch_config', {
                        ...settings.nb_ingarch_config,
                        default_forecast_horizon: parseInt(e.target.value)
                      });
                    }}
                    className="flex-grow h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <span className="text-lg font-semibold text-primary-600 w-16 text-right">
                    {settings.nb_ingarch_config.default_forecast_horizon} days
                  </span>
                </div>
                <p className="text-xs text-ink-500 mt-2">Choose how many days into the future you want to see forecasts by default.</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <label className="text-sm font-medium text-ink-900">Automatic Updates</label>
                  <p className="text-xs text-ink-500 mt-0.5">Keep forecasts up-to-date automatically when you open the app</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.auto_run ?? false}
                    onChange={(e) => updateSetting('auto_run', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-300 rounded-full peer peer-checked:bg-primary-600 transition-colors duration-200">
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 translate-x-0.5 translate-y-0.5 peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          {/* System Status - Resource Monitoring */}
          {systemHealth && (
            <div className="bg-white border border-border rounded-lg">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-lg font-semibold text-ink-900">Resource Monitoring</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-surface-50 rounded-lg border border-border">
                    <div className="text-xs text-ink-600 mb-1">CPU Usage</div>
                    <div className="text-lg font-semibold text-ink-900">{systemHealth.system.cpu_percent.toFixed(1)}%</div>
                    <div className="w-full h-1.5 bg-surface-200 rounded-full mt-2">
                      <div
                        className="h-1.5 bg-primary-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(systemHealth.system.cpu_percent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-lg border border-border">
                    <div className="text-xs text-ink-600 mb-1">Memory</div>
                    <div className="text-lg font-semibold text-ink-900">{systemHealth.system.memory_percent.toFixed(1)}%</div>
                    <div className="w-full h-1.5 bg-surface-200 rounded-full mt-2">
                      <div
                        className="h-1.5 bg-primary-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(systemHealth.system.memory_percent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-lg border border-border">
                    <div className="text-xs text-ink-600 mb-1">Disk Usage</div>
                    <div className="text-lg font-semibold text-ink-900">{systemHealth.system.disk_usage.toFixed(1)}%</div>
                    <div className="w-full h-1.5 bg-surface-200 rounded-full mt-2">
                      <div
                        className="h-1.5 bg-primary-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(systemHealth.system.disk_usage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-lg border border-border">
                    <div className="text-xs text-ink-600 mb-1">Data Records</div>
                    <div className="text-lg font-semibold text-ink-900">{systemHealth.data.records_count.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NB-INGARCH Engine - Detailed */}
          <div className="bg-white border border-border rounded-lg">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-ink-900">Engine Parameters</h2>
              <p className="text-sm text-ink-600 mt-1">Deep configuration for the NB-INGARCH forecasting heart</p>
            </div>
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div>
                  <label className="block text-sm font-semibold text-ink-900 mb-1">Maximum Training Time</label>
                  <p className="text-xs text-ink-500 mb-2 leading-relaxed">
                    Controls how long the AI is allowed to study your data. Increasing this allows for more complex patterns but makes training take longer.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={settings.nb_ingarch_config.training_timeout_seconds}
                      onChange={(e) => updateSetting('nb_ingarch_config', { ...settings.nb_ingarch_config, training_timeout_seconds: parseInt(e.target.value) })}
                      className="w-32 px-3 py-2 text-sm border border-border rounded-lg bg-white"
                    />
                    <span className="text-xs text-ink-400">seconds</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-900 mb-1">Required History Depth</label>
                  <p className="text-xs text-ink-500 mb-2 leading-relaxed">
                    The minimum number of past days of data needed before a forecast can be generated. More data typically results in much better accuracy.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={settings.nb_ingarch_config.min_training_samples}
                      onChange={(e) => updateSetting('nb_ingarch_config', { ...settings.nb_ingarch_config, min_training_samples: parseInt(e.target.value) })}
                      className="w-32 px-3 py-2 text-sm border border-border rounded-lg bg-white"
                    />
                    <span className="text-xs text-ink-400">days</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-900 mb-1">Forecast Memory Duration (TTL)</label>
                  <p className="text-xs text-ink-500 mb-2 leading-relaxed">
                    How long the system "remembers" a forecast before recalculating it. Higher values make the app faster but may show slightly older data.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={settings.nb_ingarch_config.cache_ttl_seconds}
                      onChange={(e) => updateSetting('nb_ingarch_config', { ...settings.nb_ingarch_config, cache_ttl_seconds: parseInt(e.target.value) })}
                      className="w-32 px-3 py-2 text-sm border border-border rounded-lg bg-white"
                    />
                    <span className="text-xs text-ink-400">seconds</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-900 mb-1">Certainty Intervals</label>
                  <p className="text-xs text-ink-500 mb-2 leading-relaxed">
                    Tracks 'Low Risk', 'Expected', and 'High Risk' scenarios. These show the range of possibilities, from best-case to worst-case.
                  </p>
                  <div className="flex gap-2">
                    {settings.nb_ingarch_config.confidence_levels.map((level, index) => (
                      <span key={index} className="px-3 py-1.5 bg-surface-100 border border-border rounded-md text-sm font-medium text-ink-700">
                        {Math.round(level * 100)}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-border">
                <div>
                  <label className="text-sm font-semibold text-ink-900">Enable Smart Caching</label>
                  <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                    When enabled, the system reuses recent calculations to make switching between pages near-instant. Highly recommended.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.nb_ingarch_config.enable_caching}
                    onChange={(e) => updateSetting('nb_ingarch_config', { ...settings.nb_ingarch_config, enable_caching: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-300 rounded-full peer peer-checked:bg-primary-600 transition-colors duration-200">
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 translate-x-0.5 translate-y-0.5 peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* System Reset */}
          <div className="bg-white border border-danger-300 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-danger-50 border-b border-danger-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-lg font-semibold text-danger-900">Danger Zone</h2>
              </div>
            </div>
            <div className="p-6 border-t border-danger-100">
              <p className="text-sm text-ink-600 mb-4">
                Resetting the system will permanently delete all uploaded data, trained models, and forecast history.
              </p>
              <button
                onClick={async () => {
                  const confirmed = window.confirm('Are you absolutely sure you want to reset all data? This cannot be undone.');
                  if (!confirmed) return;
                  try {
                    await apiDelete('/api/data/clear_all');
                    Object.keys(localStorage).filter(k => k.startsWith('storepulse_')).forEach(k => localStorage.removeItem(k));
                    window.location.reload();
                  } catch (error) {
                    setError('Failed to reset system');
                  }
                }}
                className="px-4 py-2 bg-white border border-danger-300 text-danger-700 rounded-lg text-sm font-medium hover:bg-danger-50 transition-colors"
              >
                Reset System Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
