import { reroute } from "./reroute";

function urlReroute() {
  reroute([], arguments);
}

window.addEventListener('hashchange', urlReroute);
window.addEventListener('popstate', urlReroute);

const originAddEventListener = window.addEventListener;
const originRemoveEventListener = window.removeEventListener;
window.addEventListener = function (eventName, fn) {

}
window.removeEventListener = function (eventName, fn) {

}
