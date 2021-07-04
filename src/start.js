import { reroute } from "./navigation/reroute";

let started = false;

export function start() {
  started = true;
  reroute(); // 进行应用更改，加载匹配到的子应用
}

export function isStarted() {
  return started;
}
