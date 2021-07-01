import { MOUNTED, NOT_MOUNTED, SKIP_BECAUSE_BROKEN } from '../applications/helper';

export function toMountPromise(app) {
  return Promise.resolve().then(() => {
    if (app.status !== NOT_MOUNTED) {
      return app;
    }

    app.mount(app.customProps)
      .then(() => {
        app.status = MOUNTED;
        return app;
      })
      .catch((err) => {
        console.error(err);
        app.status = SKIP_BECAUSE_BROKEN;
        return app;
      });
  });
}
