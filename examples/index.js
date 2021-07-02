import * as mySingleSpa from 'my-single-spa';

function pathPrefix(prefix) {
  return function(location) {
    return location.pathname.startsWith(`${prefix}`);
  }
}

mySingleSpa.registerApplication('app-1', () => import('./apps/app1'), pathPrefix('/app1'));
mySingleSpa.registerApplication('app-2', () => import('./apps/app2'), pathPrefix('/app2'));

mySingleSpa.start();
