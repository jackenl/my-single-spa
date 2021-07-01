import { MOUNTED, NOT_MOUNTED } from '../applications/helper';

export function toMountPromise(app) {
  return Promise.resolve().then(() => {
    if (app.status !== NOT_MOUNTED) {
      return app;
    }

    app.mount(app.customProps).then(() => {
      app.status = MOUNTED;
      return app;
    });
  });
}
