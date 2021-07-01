export function flattenFnArray(app, lifecycle) {
  let fns = app[lifecycle] || [];
  fns = Array.isArray(fns) ? fns : [fns];
  if (fns.length === 0) {
    fns = [() => Promise.resolve()];
  }

  return function (props) {
    return fns.reduce((promise, fn, index) => {
      return promise.then(() => fn(props));
    }, Promise.resolve());
  };
}
