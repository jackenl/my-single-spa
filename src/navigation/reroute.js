import { getAppChanges, getMountedApps } from '../applications/apps';
import { shouldBeActive } from '../applications/helper';
import { toBootstrapPromise } from '../lifecycles/bootstrap';
import { toLoadPromise } from '../lifecycles/load';
import { toMountPromise } from '../lifecycles/mount';
import { toUnloadPromise } from '../lifecycles/unload';
import { toUnmountPromise } from '../lifecycles/unmount';
import { isStarted } from '../start';
import { callEventListener } from './navigation';

let appChangeUnderway = false, waitingOnAppChange = [];

export function reroute(pendingPromises = [], eventArgs) {
  if (appChangeUnderway) {
    return new Promise((resolve, reject) => {
      waitingOnAppChange.push({
        resolve,
        reject,
        eventArgs,
      });
    });
  }

  const {
    appsToUnload,
    appsToUnmount,
    appsToLoad,
    appsToMount,
  } = getAppChanges();

  if (isStarted()) {
    appChangeUnderway = true;
    return preformAppChanges();
  } else {
    return loadApps();
  }

  function loadApps() {
    return Promise.resolve().then(() => {
      const loadPromises = appsToLoad.map(toLoadPromise);

      return Promise.all(loadPromises)
        .then(callAllEventListeners)
        .catch((err) => {
          callAllEventListeners();
          throw err;
        });
    });
  }

  function preformAppChanges() {
    return Promise.resolve().then(() => {
      const unloadPromises = appsToUnload.map(toUnloadPromise);
      const unmountPromises = appsToUnmount
        .map(toUnmountPromise)
        .map((promise) => promise.then(toUnloadPromise));
      const unmountAllPromises = Promise.all(unmountPromises.concat(unloadPromises));
  
      const loadPromises = appsToLoad.map((app) => {
        return toLoadPromise(app).then((app) => {
          bootstrapAndMount(app);
        });
      });
      const mountPromises = appsToMount.map((app) => bootstrapAndMount(app));

      return unmountAllPromises
        .then(() => {
          callAllEventListeners();
          Promise.all(mountPromises.concat(loadPromises)).then(finishUpAndReturn);
        })
        .catch((err) => {
          callAllEventListeners();
          throw err;
        });
    });
  }

  function finishUpAndReturn() {
    const returnValue = getMountedApps();
    pendingPromises.forEach((promise) => promise.resolve(returnValue));

    appChangeUnderway = false;

    if (waitingOnAppChange.length > 0) {
      const nextPromises = waitingOnAppChange;
      waitingOnAppChange = [];
      reroute(nextPromises);
    }

    return returnValue;
  }

  function callAllEventListeners() {
    pendingPromises.forEach((promise) => {
      callEventListener(promise.eventArgs);
    });

    callEventListener(eventArgs);
  }
}

function bootstrapAndMount(app) {
  if (shouldBeActive(app)) {
    return toBootstrapPromise(app).then((app) => {
      return shouldBeActive(app) ? toMountPromise(app) : app;
    });
  }
  return app;
}
