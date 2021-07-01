import { LOADING_SOURCE_CODE, LOAD_ERROR, MOUNTED, NOT_BOOTSTRAPPED, NOT_LOADED, NOT_MOUNTED, shouldBeActive, SKIP_BECAUSE_BROKEN } from './helper';

const apps = [];

export function getAppChanges() {
  const appsToUnload = [],
    appsToUnmount = [],
    appsToLoad = [],
    appsToMount = [];

  const currentTime = new Date().getTime();

  apps.forEach((app) => {
    const appShouldBeActive = apps.status !== SKIP_BECAUSE_BROKEN
      && shouldBeActive(app);

    switch (app.status) {
      case LOAD_ERROR:
        if (appShouldBeActive && currentTime - app.loadErrorTime >= 200) {
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
        if (appShouldBeActive) {
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
        loadErrorTime: null,
        status: NOT_LOADED,
      },
      registration
    )
  );
}

function sanitizeLoadApp(loadApp) {
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
