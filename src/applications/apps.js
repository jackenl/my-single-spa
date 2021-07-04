import { getAppUnloadInfo } from '../lifecycles/unload';
import {
  isActive,
  LOADING_SOURCE_CODE,
  LOAD_ERROR,
  MOUNTED,
  NOT_BOOTSTRAPPED,
  NOT_LOADED,
  NOT_MOUNTED,
  shouldBeActive,
  SKIP_BECAUSE_BROKEN,
} from './helper';

// 用于存储注册的应用
const apps = [];

export function getAppChanges() {
  const appsToUnload = [],
    appsToUnmount = [],
    appsToLoad = [],
    appsToMount = [];

  apps.forEach((app) => {
    const appShouldBeActive = apps.status !== SKIP_BECAUSE_BROKEN && shouldBeActive(app);

    switch (app.status) {
      case LOAD_ERROR:
        if (appShouldBeActive) {
          appsToLoad.push(app);
        }
        break;
      case NOT_LOADED:
      case LOADING_SOURCE_CODE:
        if (appShouldBeActive) {
          appsToLoad.push(app);
        }
        break;
      case NOT_BOOTSTRAPPED:
      case NOT_MOUNTED:
        if (!appShouldBeActive && getAppUnloadInfo(app.name)) {
          appsToUnload.push(app);
        } else if (appShouldBeActive) {
          appsToMount.push(app);
        }
        break;
      case MOUNTED:
        if (!appShouldBeActive) {
          appsToUnmount.push(app);
        }
        break;
    }
  });

  return { appsToUnload, appsToUnmount, appsToLoad, appsToMount };
}

export function registerApplication(name, loadApp, activeWhen, customProps) {
  const registration = {
    name,
    loadApp: sanitizeLoadApp(loadApp),
    activeWhen: sanitizeActiveWhen(activeWhen),
    customProps: sanitizeCustomProps(customProps),
  };

  apps.push(
    Object.assign(
      {
        status: NOT_LOADED, // 应用初始状态
      },
      registration
    )
  );
}

function sanitizeLoadApp(loadApp) {
  // 保证loadApp执行返回的是promise
  if (typeof loadApp !== 'function') {
    return () => Promise.resolve(loadApp);
  }

  return loadApp;
}

function sanitizeActiveWhen(activeWhen) {
  let activeWhenArray = Array.isArray(activeWhen) ? activeWhen : [activeWhen];
  return (location) => activeWhenArray.some((activeWhen) => activeWhen(location));
}

function sanitizeCustomProps(customProps) {
  return customProps ? customProps : {};
}

export function getMountedApps() {
  return apps.filter(isActive).map((app) => app.name);
}
