import { getAppChanges, getMountedApps } from '../applications/apps';
import { shouldBeActive } from '../applications/helper';
import { toBootstrapPromise } from '../lifecycles/bootstrap';
import { toLoadPromise } from '../lifecycles/load';
import { toMountPromise } from '../lifecycles/mount';
import { toUnloadPromise } from '../lifecycles/unload';
import { toUnmountPromise } from '../lifecycles/unmount';
import { isStarted } from '../start';
import { callCapturedEventListeners } from './navigation';

let appChangeUnderway = false; // 判断应用是否更改中
let waitingOnAppChange = []; // 用于存储等待中的上次应用更改

export function reroute(pendingPromises = [], eventArgs) {
  // 应用更改中，缓存本次应用更改用于更改完成后执行
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
    // 微前端启动中，进行应用更改
    appChangeUnderway = true;
    return preformAppChanges();
  } else {
    // 加载相关应用
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
      // 移除和卸载需要卸载的应用
      const unloadPromises = appsToUnload.map(toUnloadPromise);
      const unmountPromises = appsToUnmount
        .map(toUnmountPromise)
        .map((promise) => promise.then(toUnloadPromise));
      const unmountAllPromises = Promise.all(unmountPromises.concat(unloadPromises));
  
      // 加载和挂载需要进行挂载的应用
      const loadPromises = appsToLoad.map((app) => {
        return toLoadPromise(app).then((app) => {
          bootstrapAndMount(app);
        });
      });
      const mountPromises = appsToMount.map((app) => bootstrapAndMount(app));

      // 确保应用卸载和挂载完成后在注册路由事件监听器
      return unmountAllPromises
        .then(() => {
          callAllEventListeners();
          // 完成应用挂载，继续执行等待中的应用更改队列
          Promise.all(mountPromises.concat(loadPromises)).then(finishUpAndReturn);
        })
        .catch((err) => {
          callAllEventListeners();
          throw err;
        });
    });
  }

  function finishUpAndReturn() {
    // 完成应用更改，返回挂载的应用名称
    const returnValue = getMountedApps();
    pendingPromises.forEach((promise) => promise.resolve(returnValue));

    appChangeUnderway = false;

    if (waitingOnAppChange.length > 0) {
      const nextPromises = waitingOnAppChange;
      waitingOnAppChange = [];
      // 执行上次等待中的应用更改
      reroute(nextPromises);
    }

    return returnValue;
  }

  function callAllEventListeners() {
    pendingPromises.forEach((promise) => {
      callCapturedEventListeners(promise.eventArgs);
    });

    callCapturedEventListeners(eventArgs);
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
