import { isStarted } from '../start';
import { reroute } from './reroute';

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

export function callEventListener(eventArgs) {
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
        window.dispatchEvent(createPopStateEvent(window.history.state, methodName));
      } else {
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

window.addEventListener('hashchange', urlReroute);
window.addEventListener('popstate', urlReroute);

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

window.history.pushState = patchedUpdateState(window.history.pushState, 'pushState');
window.history.replaceState = patchedUpdateState(window.history.replaceState, 'replaceState');

window.spaNavigateTo = navigateToUrl;
