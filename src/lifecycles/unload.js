import { LOAD_ERROR, NOT_LOADED, NOT_MOUNTED, UNLOADING } from '../applications/helper';

const appsToUnload = {};

export function toUnloadPromise(app) {
  return Promise.resolve().then(() => {
    const unloadInfo = appsToUnload[app.name];

    if (!unloadInfo) {
      return app;
    }

    if (app.status === NOT_LOADED) {
      finishedUnloadingApp(app, unloadInfo);
      return app;
    }

    if (app.status === UNLOADING) {
      return unloadInfo.promise.then(() => app);
    }

    if (app.status !== NOT_MOUNTED && app.status !== LOAD_ERROR) {
      return app;
    }

    const unloadPromise = app.status === LOAD_ERROR
      ? Promise.resolve()
      : Promise.resolve().then(() => app.unload(app.customProps));

    app.status = UNLOADING;

    return unloadPromise
      .then(() => {
        finishedUnloadingApp(app, unloadInfo);
        return app;
      })
      .catch((err) => {
        errorUnloadingApp(app, unloadInfo, err);
        return app;
      });
  });
}

function finishedUnloadingApp(app, unloadInfo) {
  delete appsToUnload[app.name];

  delete app.bootstrap;
  delete app.mount;
  delete app.unmount;
  delete app.unload;

  app.status = NOT_LOADED;

  unloadInfo.resolve();
}

function errorUnloadingApp(app, unloadInfo, err) {
  delete appsToUnload[toName(app)];

  delete app.bootstrap;
  delete app.mount;
  delete app.unmount;
  delete app.unload;

  handleAppError(err, app, SKIP_BECAUSE_BROKEN);
  unloadInfo.reject(err);
}
