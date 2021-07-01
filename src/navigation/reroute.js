import { getAppChanges } from '../applications/apps';
import { shouldBeActive } from '../applications/helper';
import { toBootstrapPromise } from '../lifecycles/bootstrap';
import { toLoadPromise } from '../lifecycles/load';
import { toMountPromise } from '../lifecycles/mount';
import { toUnloadPromise } from '../lifecycles/unload';
import { toUnmountPromise } from '../lifecycles/unmount';
import { isStarted } from '../start';
import { callCapturedListener } from './navigation';

let appChangeUnderway = false,
  waitingOnAppChange = [],
  currentUrl = window.location.href;

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
  let appsThatChanged,
    orlUrl = currentUrl,
    newUrl = (currentUrl = window.location.href);

  if (isStarted()) {
    appChangeUnderway = true;
    appsThatChanged = appsToUnload.concat(appsToLoad, appsToUnmount, appsToMount);
    return preformAppChanges();
  } else {
    appsThatChanged = appsToLoad;
    return loadApps();
  }

  function loadApps() {
    return Promise.resolve().then(() => {
      const loadPromises = appsToLoad.map(toLoadPromise);

      return Promise.all(loadPromises)
        .then(callAllEventListeners)
        .then(() => [])
        .catch((err) => {
          callAllEventListeners();
          throw err;
        });
    });
  }

  function preformAppChanges() {
    return Promise.resolve().then(() => {
      const unloadPromises = appsToUnload.map(toUnloadPromise);
      const unmountPromises = appsToUnmount.map(toUnmountPromise)
        .map((promise) => promise.then(toUnloadPromise));
      const unmountAllPromises = Promise.all(unmountPromises.concat(unloadPromises));
  
      const loadPromises = appsToLoad.map((app) => {
        return toLoadPromise(app).then((app) => {
          bootstrapAndMount(app);
        })
      })
      const mountPromises = appsToMount.map((app) => {
        return bootstrapAndMount(app);
      });

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
    pendingPromises.forEach((promise) => promise.resolve());

    appChangeUnderway = false;

    if (waitingOnAppChange.length > 0) {
      const nextPromises = waitingOnAppChange;
      waitingOnAppChange = [];
      reroute(nextPromises);
    }
  }

  function callAllEventListeners() {
    pendingPromises.forEach((promise) => {
      callCapturedListener(promise.eventArgs);
    });

    callCapturedListener(eventArgs);
  }
}

function bootstrapAndMount(app) {
  if (shouldBeActive(app)) {
    return toBootstrapPromise(app).then(toMountPromise);
  }
  return app;
}
