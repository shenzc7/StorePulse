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
  const [activeSection, setActiveSection] = useState<string | null>(null);

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

  const updateSetting = async (section: string, newSettings: any) => {
    if (!settings) return;

    try {
      setSaving(section);
      setError(null);
      setSuccessMessage(null);

      const payload =
        section === 'automation'
          ? {
            ...newSettings,
            auto_forecast_time: normalizeTime(newSettings?.auto_forecast_time),
          }
          : newSettings;

      await apiPut(`/api/settings/`, { section, settings: payload });

      setSettings(prev => prev ? { ...prev, [section]: payload } : null);

      if (section === 'auto_run') {
        localStorage.setItem('storepulse_auto_run', newSettings.toString());
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

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">System Configuration</h1>
          <p className="text-sm text-ink-600 mt-1">Configure NB-INGARCH forecasting engine and system parameters</p>
        </div>
        {systemHealth && (
          <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white border border-border rounded-lg">
            <div className={`w-2 h-2 rounded-full ${systemHealth.database.healthy ? 'bg-accent-500' : 'bg-ink-400'}`}></div>
            <span className="text-xs font-medium text-ink-700">
              {systemHealth.database.healthy ? 'Operational' : 'Degraded'}
            </span>
            {systemHealth.models.lite_available && (
              <span className="text-xs text-ink-500">•</span>
            )}
            {systemHealth.models.lite_available && (
              <span className="text-xs text-ink-600">Lite Model Ready</span>
            )}
          </div>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-danger-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-danger-900">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-accent-50 border border-accent-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-accent-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-accent-900">{successMessage}</p>
        </div>
      )}

      {/* System Status - Moved to Top */}
      {systemHealth && (
        <div className="bg-white border border-border rounded-lg">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-ink-900">System Status</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-600">Database</span>
                <span className={`text-sm font-medium ${systemHealth.database.healthy ? 'text-accent-600' : 'text-ink-600'}`}>
                  {systemHealth.database.healthy ? 'Healthy' : 'Degraded'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-600">Lite Model</span>
                <span className={`text-sm font-medium ${systemHealth.models.lite_available ? 'text-accent-600' : 'text-ink-600'}`}>
                  {systemHealth.models.lite_available ? 'Available' : 'Not Trained'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-600">Pro Model</span>
                <span className={`text-sm font-medium ${systemHealth.models.pro_available ? 'text-accent-600' : 'text-ink-600'}`}>
                  {systemHealth.models.pro_available ? 'Available' : 'Not Trained'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NB-INGARCH Core Configuration */}
      <div className="bg-white border border-border rounded-lg">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">NB-INGARCH Engine</h2>
              <p className="text-sm text-ink-600 mt-1">Core forecasting model parameters</p>
            </div>
            {saving === 'nb_ingarch_config' && (
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <div className="w-4 h-4 border-2 border-ink-300 border-t-ink-600 rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-2">
                Forecast Horizon
              </label>
              <input
                type="number"
                value={settings.nb_ingarch_config.default_forecast_horizon}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 1 && value <= 30) {
                    updateSetting('nb_ingarch_config', {
                      ...settings.nb_ingarch_config,
                      default_forecast_horizon: value
                    });
                  }
                }}
                min={1}
                max={30}
                disabled={saving === 'nb_ingarch_config'}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-ink-500 mt-1.5">Days ahead to forecast (1-30)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-900 mb-2">
                Training Timeout
              </label>
              <input
                type="number"
                value={settings.nb_ingarch_config.training_timeout_seconds}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 60 && value <= 1800) {
                    updateSetting('nb_ingarch_config', {
                      ...settings.nb_ingarch_config,
                      training_timeout_seconds: value
                    });
                  }
                }}
                min={60}
                max={1800}
                disabled={saving === 'nb_ingarch_config'}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-ink-500 mt-1.5">Maximum training time (seconds)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-900 mb-2">
                Minimum Training Samples
              </label>
              <input
                type="number"
                value={settings.nb_ingarch_config.min_training_samples}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 30 && value <= 365) {
                    updateSetting('nb_ingarch_config', {
                      ...settings.nb_ingarch_config,
                      min_training_samples: value
                    });
                  }
                }}
                min={30}
                max={365}
                disabled={saving === 'nb_ingarch_config'}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-ink-500 mt-1.5">Minimum historical data points required</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-900 mb-2">
                Cache TTL
              </label>
              <input
                type="number"
                value={settings.nb_ingarch_config.cache_ttl_seconds}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 300 && value <= 86400) {
                    updateSetting('nb_ingarch_config', {
                      ...settings.nb_ingarch_config,
                      cache_ttl_seconds: value
                    });
                  }
                }}
                min={300}
                max={86400}
                disabled={saving === 'nb_ingarch_config'}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-ink-500 mt-1.5">Forecast cache duration (seconds)</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-900 mb-2">
              Confidence Levels
            </label>
            <div className="flex gap-2">
              {settings.nb_ingarch_config.confidence_levels.map((level, index) => (
                <input
                  key={index}
                  type="number"
                  value={level}
                  step={0.05}
                  min={0.01}
                  max={0.99}
                  onChange={(e) => {
                    const newLevels = [...settings.nb_ingarch_config.confidence_levels];
                    const value = parseFloat(e.target.value);
                    if (value >= 0.01 && value <= 0.99) {
                      newLevels[index] = value;
                      updateSetting('nb_ingarch_config', {
                        ...settings.nb_ingarch_config,
                        confidence_levels: newLevels.sort((a, b) => a - b)
                      });
                    }
                  }}
                  disabled={saving === 'nb_ingarch_config'}
                  className="w-20 px-2 py-1.5 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
                />
              ))}
            </div>
            <p className="text-xs text-ink-500 mt-1.5">Prediction interval confidence levels (P10, P50, P90)</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <label className="text-sm font-medium text-ink-900">Enable Forecast Caching</label>
              <p className="text-xs text-ink-500 mt-0.5">Cache forecast results to improve performance</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.nb_ingarch_config.enable_caching}
                onChange={(e) => updateSetting('nb_ingarch_config', {
                  ...settings.nb_ingarch_config,
                  enable_caching: e.target.checked
                })}
                disabled={saving === 'nb_ingarch_config'}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-300 rounded-full peer peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed transition-colors duration-200">
                <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 translate-x-0.5 translate-y-0.5 peer-checked:translate-x-5"></div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Business Logic Configuration */}
      <div className="bg-white border border-border rounded-lg">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Business Logic</h2>
              <p className="text-sm text-ink-600 mt-1">Operational parameters for actionable insights</p>
            </div>
            {(saving === 'staffing_config' || saving === 'inventory_config') && (
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <div className="w-4 h-4 border-2 border-ink-300 border-t-ink-600 rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 space-y-8">

          {/* Staffing Logic */}
          <div>
            <h3 className="text-sm font-semibold text-ink-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Staffing Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">
                  Customers per Staff
                </label>
                <input
                  type="number"
                  value={settings.staffing_config?.customers_per_staff ?? 45}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 1) {
                      updateSetting('staffing_config', {
                        ...settings.staffing_config,
                        customers_per_staff: value
                      });
                    }
                  }}
                  min={1}
                  disabled={saving === 'staffing_config'}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-ink-500 mt-1.5">How many customers can one staff member handle?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">
                  High Traffic Threshold
                </label>
                <input
                  type="number"
                  value={settings.staffing_config?.high_traffic_threshold ?? 150}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 10) {
                      updateSetting('staffing_config', {
                        ...settings.staffing_config,
                        high_traffic_threshold: value
                      });
                    }
                  }}
                  min={10}
                  disabled={saving === 'staffing_config'}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-ink-500 mt-1.5">Daily visits to trigger "High Traffic" status</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">
                  Labor Cost per Staff (₹)
                </label>
                <input
                  type="number"
                  value={settings.staffing_config?.labor_cost_per_staff ?? 650}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 0) {
                      updateSetting('staffing_config', {
                        ...settings.staffing_config,
                        labor_cost_per_staff: value
                      });
                    }
                  }}
                  min={0}
                  disabled={saving === 'staffing_config'}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-ink-500 mt-1.5">Daily cost estimate for one staff member</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-semibold text-ink-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Inventory Alerts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">
                  Conversion Rate
                </label>
                <input
                  type="number"
                  value={settings.inventory_config?.conversion_rate ?? 0.18}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (value >= 0.01 && value <= 1.0) {
                      updateSetting('inventory_config', {
                        ...settings.inventory_config,
                        conversion_rate: value
                      });
                    }
                  }}
                  step={0.01}
                  min={0.01}
                  max={1.0}
                  disabled={saving === 'inventory_config'}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-ink-500 mt-1.5">Expected ratio of visits to sales (0.01 - 1.0)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">
                  Medium Risk Threshold
                </label>
                <input
                  type="number"
                  value={settings.inventory_config?.medium_risk_visits ?? 120}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 1) {
                      updateSetting('inventory_config', {
                        ...settings.inventory_config,
                        medium_risk_visits: value
                      });
                    }
                  }}
                  min={1}
                  disabled={saving === 'inventory_config'}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-ink-500 mt-1.5">Daily visits to trigger "Medium Risk" alert</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">
                  High Risk Threshold
                </label>
                <input
                  type="number"
                  value={settings.inventory_config?.high_risk_visits ?? 180}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 1) {
                      updateSetting('inventory_config', {
                        ...settings.inventory_config,
                        high_risk_visits: value
                      });
                    }
                  }}
                  min={1}
                  disabled={saving === 'inventory_config'}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-ink-500 mt-1.5">Daily visits to trigger "High Risk" alert</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Gates */}
      <div className="bg-white border border-border rounded-lg">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Quality Gates</h2>
              <p className="text-sm text-ink-600 mt-1">Model performance validation thresholds</p>
            </div>
            {saving === 'quality_gates' && (
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <div className="w-4 h-4 border-2 border-ink-300 border-t-ink-600 rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-2">
                Lite vs Baseline Improvement (%)
              </label>
              <input
                type="number"
                value={settings.quality_gates.lite_vs_baseline_improvement_pct}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value >= 0 && value <= 50) {
                    updateSetting('quality_gates', {
                      ...settings.quality_gates,
                      lite_vs_baseline_improvement_pct: value
                    });
                  }
                }}
                step={0.1}
                min={0}
                max={50}
                disabled={saving === 'quality_gates'}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-ink-500 mt-1.5">Minimum sMAPE improvement over baseline</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-900 mb-2">
                Pro vs Lite Improvement (%)
              </label>
              <input
                type="number"
                value={settings.quality_gates.pro_vs_lite_improvement_pct}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value >= 0 && value <= 50) {
                    updateSetting('quality_gates', {
                      ...settings.quality_gates,
                      pro_vs_lite_improvement_pct: value
                    });
                  }
                }}
                step={0.1}
                min={0}
                max={50}
                disabled={saving === 'quality_gates'}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-ink-500 mt-1.5">Required Pro model improvement</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-900 mb-2">
                Calibration Coverage (%)
              </label>
              <input
                type="number"
                value={(settings.quality_gates.calibration_coverage_min * 100).toFixed(1)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value >= 50 && value <= 100) {
                    updateSetting('quality_gates', {
                      ...settings.quality_gates,
                      calibration_coverage_min: value / 100
                    });
                  }
                }}
                step={0.1}
                min={50}
                max={100}
                disabled={saving === 'quality_gates'}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-ink-500 mt-1.5">Minimum prediction interval coverage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white border border-border rounded-lg">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Data Management</h2>
              <p className="text-sm text-ink-600 mt-1">Data retention and quality monitoring</p>
            </div>
            {saving === 'data_management' && (
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <div className="w-4 h-4 border-2 border-ink-300 border-t-ink-600 rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-2">
                Data Retention Period
              </label>
              <input
                type="number"
                value={settings.data_management.data_retention_days}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 30 && value <= 3650) {
                    updateSetting('data_management', {
                      ...settings.data_management,
                      data_retention_days: value
                    });
                  }
                }}
                min={30}
                max={3650}
                disabled={saving === 'data_management'}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-ink-500 mt-1.5">Days of historical data to retain</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-900 mb-2">
                Anomaly Detection Threshold (σ)
              </label>
              <input
                type="number"
                value={settings.data_management.anomaly_detection_threshold}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value >= 1.0 && value <= 5.0) {
                    updateSetting('data_management', {
                      ...settings.data_management,
                      anomaly_detection_threshold: value
                    });
                  }
                }}
                step={0.1}
                min={1.0}
                max={5.0}
                disabled={saving === 'data_management'}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-ink-500 mt-1.5">Standard deviations for outlier detection</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-ink-900">Automatic Data Cleanup</label>
                  <p className="text-xs text-ink-500 mt-0.5">Remove data older than retention period</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.data_management.auto_cleanup_enabled}
                    onChange={(e) => updateSetting('data_management', {
                      ...settings.data_management,
                      auto_cleanup_enabled: e.target.checked
                    })}
                    disabled={saving === 'data_management'}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-300 rounded-full peer peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed transition-colors duration-200">
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 translate-x-0.5 translate-y-0.5 peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-ink-900">Quality Monitoring</label>
                  <p className="text-xs text-ink-500 mt-0.5">Monitor data quality and detect anomalies</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.data_management.quality_monitoring_enabled}
                    onChange={(e) => updateSetting('data_management', {
                      ...settings.data_management,
                      quality_monitoring_enabled: e.target.checked
                    })}
                    disabled={saving === 'data_management'}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-300 rounded-full peer peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed transition-colors duration-200">
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 translate-x-0.5 translate-y-0.5 peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automation */}
      <div className="bg-white border border-border rounded-lg">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Automation</h2>
              <p className="text-sm text-ink-600 mt-1">Scheduled operations and alerts</p>
            </div>
            {saving === 'automation' && (
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <div className="w-4 h-4 border-2 border-ink-300 border-t-ink-600 rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <label className="text-sm font-medium text-ink-900">Automatic Forecasts</label>
                  <p className="text-xs text-ink-500 mt-0.5">Generate forecasts automatically</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.automation.auto_forecast_enabled}
                    onChange={(e) => updateSetting('automation', {
                      ...settings.automation,
                      auto_forecast_enabled: e.target.checked
                    })}
                    disabled={saving === 'automation'}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-300 rounded-full peer peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed transition-colors duration-200">
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 translate-x-0.5 translate-y-0.5 peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">Forecast Time</label>
                <input
                  type="time"
                  value={settings.automation.auto_forecast_time}
                  onChange={(e) => updateSetting('automation', {
                    ...settings.automation,
                    auto_forecast_time: e.target.value
                  })}
                  disabled={!settings.automation.auto_forecast_enabled || saving === 'automation'}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <label className="text-sm font-medium text-ink-900">Automatic Retraining</label>
                  <p className="text-xs text-ink-500 mt-0.5">Retrain models periodically</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.automation.auto_training_enabled}
                    onChange={(e) => updateSetting('automation', {
                      ...settings.automation,
                      auto_training_enabled: e.target.checked
                    })}
                    disabled={saving === 'automation'}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-300 rounded-full peer peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed transition-colors duration-200">
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 translate-x-0.5 translate-y-0.5 peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-900 mb-2">Retraining Interval</label>
                <input
                  type="number"
                  value={settings.automation.auto_training_interval_days}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 7 && value <= 90) {
                      updateSetting('automation', {
                        ...settings.automation,
                        auto_training_interval_days: value
                      });
                    }
                  }}
                  min={7}
                  max={90}
                  disabled={!settings.automation.auto_training_enabled || saving === 'automation'}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-ink-500 mt-1.5">Days between retraining cycles</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <label className="text-sm font-medium text-ink-900">Performance Alerts</label>
              <p className="text-xs text-ink-500 mt-0.5">Notify when model accuracy drops below threshold</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.automation.alerts_enabled}
                onChange={(e) => updateSetting('automation', {
                  ...settings.automation,
                  alerts_enabled: e.target.checked
                })}
                disabled={saving === 'automation'}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-300 rounded-full peer peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed transition-colors duration-200">
                <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 translate-x-0.5 translate-y-0.5 peer-checked:translate-x-5"></div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Configuration */}
      <div className="bg-white border border-border rounded-lg">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-900">Advanced Configuration</h2>
            {saving === 'advanced_config' && (
              <div className="flex items-center gap-2 text-sm text-ink-500">
                <div className="w-4 h-4 border-2 border-ink-300 border-t-ink-600 rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-2">Logging Level</label>
            <select
              value={settings.advanced_config.logging_level}
              onChange={(e) => updateSetting('advanced_config', {
                ...settings.advanced_config,
                logging_level: e.target.value
              })}
              disabled={saving === 'advanced_config'}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
            >
              <option value="DEBUG">Debug</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-2">DB Pool Size</label>
              <input
                type="number"
                value={settings.advanced_config.database_pool_size}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 1 && value <= 20) {
                    updateSetting('advanced_config', {
                      ...settings.advanced_config,
                      database_pool_size: value
                    });
                  }
                }}
                min={1}
                max={20}
                disabled={saving === 'advanced_config'}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-2">API Timeout (s)</label>
              <input
                type="number"
                value={settings.advanced_config.api_timeout_seconds}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 10 && value <= 300) {
                    updateSetting('advanced_config', {
                      ...settings.advanced_config,
                      api_timeout_seconds: value
                    });
                  }
                }}
                min={10}
                max={300}
                disabled={saving === 'advanced_config'}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <label className="text-sm font-medium text-ink-900">Debug Mode</label>
              <p className="text-xs text-ink-500 mt-0.5">Enable detailed diagnostic logging</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.advanced_config.enable_debug_mode}
                onChange={(e) => updateSetting('advanced_config', {
                  ...settings.advanced_config,
                  enable_debug_mode: e.target.checked
                })}
                disabled={saving === 'advanced_config'}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-300 rounded-full peer peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed transition-colors duration-200">
                <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 translate-x-0.5 translate-y-0.5 peer-checked:translate-x-5"></div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* User Preferences */}
      <div className="bg-white border border-border rounded-lg">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-ink-900">User Preferences</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-ink-900">Auto-Run Forecasts</label>
              <p className="text-xs text-ink-500 mt-0.5">Automatically refresh forecasts when opening pages</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.auto_run ?? false}
                onChange={(e) => updateSetting('auto_run', e.target.checked)}
                disabled={saving === 'auto_run'}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-300 rounded-full peer peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed transition-colors duration-200">
                <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 translate-x-0.5 translate-y-0.5 peer-checked:translate-x-5"></div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* System Reset */}
      <div className="bg-white border border-danger-300 rounded-lg">
        <div className="border-b border-danger-200 px-6 py-4 bg-danger-50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-lg font-semibold text-ink-900">System Reset</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm text-ink-600 mb-4">
            Permanently delete all data, models, forecasts, and settings. This action cannot be undone.
          </p>
          <button
            onClick={async () => {
              const confirmed = window.confirm(
                'WARNING: This will permanently delete all data, models, forecasts, and settings.\n\n' +
                'This action CANNOT be undone.\n\n' +
                'Are you absolutely sure?'
              );
              if (!confirmed) return;

              try {
                await apiDelete('/api/data/clear_all');
                Object.keys(localStorage)
                  .filter(k => k.startsWith('storepulse_'))
                  .forEach(k => localStorage.removeItem(k));
                window.location.reload();
              } catch (error) {
                console.error('Clear error:', error);
                setError('Failed to reset system');
              }
            }}
            className="btn-secondary text-sm px-4 py-2 border-danger-300 text-danger-700 hover:bg-danger-50"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}
