import { reroute } from "./navigation/reroute";

let started = false;

export function start() {
  reroute();
}

export function isStarted() {
  return started;
}
