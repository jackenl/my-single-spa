import { isStarted } from '../start';
import { reroute } from './reroute';

// 用于收集路由事件监听器
const eventListeners = {
  hashchange: [],
  popstate: [],
};

export const eventNames = ['hashchange', 'popstate'];

export function navigateToUrl(url) {
  const destination = parseUri(url);
  if (url.indexOf('#') === 0) {
    window.location.hash = destination.hash;
  } else {
    window.history.pushState(null, null, url);
  }
}

export function callCapturedEventListeners(eventArgs) {
  if (!eventArgs) return;

  const eventType = eventArgs[0].type;
  if (eventNames.indexOf(eventType) >= 0) {
    eventListeners[eventType].forEach((listener) => {
      try {
        listener.apply(this, eventArgs);
      } catch (err) {
        throw err;
      }
    });
  }
}

function parseUri(str) {
  const anchor = document.createElement('a');
  anchor.href = str;
  return anchor;
}

function urlReroute() {
  reroute([], arguments);
}

function patchedUpdateState(updateState, methodName) {
  return function () {
    const urlBefore = window.location.href;
    const result = updateState.apply(this, arguments);
    const urlAfter = window.location.href;

    if (urlBefore !== urlAfter) {
      if (isStarted()) {
        // 如果已启动，则正常分发 history 事件
        window.dispatchEvent(createPopStateEvent(window.history.state, methodName));
      } else {
        // 否则初始化应用生命周期
        reroute([]);
      }
    }

    return result;
  };
}

function createPopStateEvent(state, methodName) {
  let evt = new PopStateEvent('popstate', { state });

  evt.singleSpa = true;
  evt.singleSpaTrigger = methodName;
  return evt;
}

// 监听路由事件触发修改应用生命周期
window.addEventListener('hashchange', urlReroute);
window.addEventListener('popstate', urlReroute);

// 重写事件监听器添加和移除函数，拦截和收集路由事件监听器
const originAddEventListener = window.addEventListener;
const originRemoveEventListener = window.removeEventListener;
window.addEventListener = function (eventName, fn) {
  if (
    eventNames.indexOf(eventName) >= 0 &&
    !find(eventListeners[eventName], (listener) => listener === fn)
  ) {
    eventListeners[eventName].push(fn);
    return;
  }

  return originAddEventListener.apply(this, arguments);
};
window.removeEventListener = function (eventName, fn) {
  if (eventNames.indexOf(eventName) >= 0) {
    eventListeners[eventName] = eventListeners[eventName].filter((listener) => listener !== fn);
    return;
  }

  return originRemoveEventListener.apply(this, arguments);
};

// 重写 history API，判断微前端是否已启动，匹配对应对应操作
window.history.pushState = patchedUpdateState(window.history.pushState, 'pushState');
window.history.replaceState = patchedUpdateState(window.history.replaceState, 'replaceState');

window.spaNavigateTo = navigateToUrl;
