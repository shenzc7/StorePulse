import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router';
import { HomePage } from '../pages/home'; // Dashboard - Overview and current status
import { DataPage } from '../pages/data'; // Store Data - Upload and manage data (foundation)
import { TrainPage } from '../pages/train'; // Setup Forecasting - Configure and train model (depends on data)
import { ForecastPage } from '../pages/forecast'; // View Predictions - See forecasting results (depends on trained model)
import { LabPage } from '../pages/lab'; // What-If Planner - Test scenarios (analysis after forecasting)
import { ReportsPage } from '../pages/reports'; // Reports - Export and analyze results (final step)
import { SettingsPage } from '../pages/settings'; // Settings - Configuration and preferences (administrative)
import { Layout } from './shell/layout'; 
// Application flow routes in user-preferred order:
// 1. Dashboard - Overview and current status
// 2. Setup Forecasting - Configure and train model
// 3. View Predictions - See forecasting results
// 4. Store Data - Upload and manage data
// 5. What-If Planner - Test scenarios and analysis
// 6. Reports - Export and analyze results
// 7. Settings - Configuration and preferences
const rootRoute = createRootRoute({
  component: Layout,
});
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage, // Dashboard - Overview
});
const dataRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/data',
  component: DataPage, // Store Data - Foundation
});
const trainRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/train',
  component: TrainPage, // Setup Forecasting - Model training
});
const forecastRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forecast',
  component: ForecastPage, // View Predictions - Results
});
const labRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lab',
  component: LabPage, // What-If Planner - Analysis
});
const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsPage, // Reports - Final outputs
});
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage, // Settings - Configuration
});
const routeTree = rootRoute.addChildren([
  indexRoute,    // 1. Dashboard
  trainRoute,    // 2. Setup Forecasting
  forecastRoute, // 3. View Predictions
  dataRoute,     // 4. Store Data
  labRoute,      // 5. What-If Planner
  reportsRoute,  // 6. Reports
  settingsRoute, // 7. Settings
]);
export const router = createRouter({ routeTree }); 
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router; 
  }
}
