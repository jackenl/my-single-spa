import { LOADING_SOURCE_CODE, LOAD_ERROR, NOT_BOOTSTRAPPED, NOT_LOADED } from '../applications/helper';
import { flattenFnArray } from './helper';

export function toLoadPromise(app) {
  return Promise.resolve().then(() => {
    if (app.loadPromise) {
      return app.loadPromise;
    }

    if (app.status !== NOT_LOADED && app.status !== LOAD_ERROR) {
      return app;
    }

    app.status = LOADING_SOURCE_CODE;

    return (app.loadPromise = Promise.resolve().then(() => {
      const loadPromise = app.loadApp(app.customProps);

      return loadPromise
        .then((val) => {
          app.loadErrorTime = null;
          app.status = NOT_BOOTSTRAPPED;
          app.bootstrap = flattenFnArray(val, 'bootstrap');
          app.mount = flattenFnArray(val, 'mount');
          app.unmount = flattenFnArray(val, 'unmount');
          app.unload = flattenFnArray(val, 'unload');

          delete app.loadPromise;

          return app;
        })
        .catch((err) => {
          console.error(err);
          app.loadErrorTime = new Date().getTime();
          app.status = LOAD_ERROR;

          delete app.loadPromise;

          return app;
        });
    }));
  });
}
