import { reroute } from "./navigation/reroute";

let started = false;

export function start() {
  started = true;
  reroute();
}

export function isStarted() {
  return started;
}
