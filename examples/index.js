import * as mySingleSpa from 'my-single-spa';

const application1 = {
  bootstrap: () => Promise.resolve().then(() => { console.log('bootstrap1') }),
  mount: () => Promise.resolve().then(() => { console.log('mount1') }),
  unmount: () => Promise.resolve().then(() => { console.log('unmount1') }),
}

const application2 = {
  bootstrap: () => Promise.resolve().then(() => { console.log('bootstrap2') }),
  mount: () => Promise.resolve().then(() => { console.log('mount2') }),
  unmount: () => Promise.resolve().then(() => { console.log('unmount2') }),
}

function pathPrefix(prefix) {
  return function(location) {
    return location.pathname.startsWith(`${prefix}`);
  }
}

mySingleSpa.registerApplication('app-1', application1, pathPrefix('/app1'));
mySingleSpa.registerApplication('app-2', application2, pathPrefix('/app2'));

mySingleSpa.start();
