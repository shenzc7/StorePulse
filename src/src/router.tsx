import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'; 
import { HomePage } from '../pages/home'; 
import { DataPage } from '../pages/data'; 
import { TrainPage } from '../pages/train'; 
import { ForecastPage } from '../pages/forecast'; 
import { LabPage } from '../pages/lab'; 
import { ReportsPage } from '../pages/reports'; 
import { SettingsPage } from '../pages/settings'; 
import { Layout } from './shell/layout'; 
const rootRoute = createRootRoute({
  component: Layout, 
});
const indexRoute = createRoute({
  getParentRoute: () => rootRoute, 
  path: '/', 
  component: HomePage, 
});
const dataRoute = createRoute({
  getParentRoute: () => rootRoute, 
  path: '/data', 
  component: DataPage, 
});
const trainRoute = createRoute({
  getParentRoute: () => rootRoute, 
  path: '/train', 
  component: TrainPage, 
});
const forecastRoute = createRoute({
  getParentRoute: () => rootRoute, 
  path: '/forecast', 
  component: ForecastPage, 
});
const labRoute = createRoute({
  getParentRoute: () => rootRoute, 
  path: '/lab', 
  component: LabPage, 
});
const reportsRoute = createRoute({
  getParentRoute: () => rootRoute, 
  path: '/reports', 
  component: ReportsPage, 
});
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute, 
  path: '/settings', 
  component: SettingsPage, 
});
const routeTree = rootRoute.addChildren([
  indexRoute, 
  dataRoute, 
  trainRoute, 
  forecastRoute, 
  labRoute, 
  reportsRoute, 
  settingsRoute, 
]);
export const router = createRouter({ routeTree }); 
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router; 
  }
}
