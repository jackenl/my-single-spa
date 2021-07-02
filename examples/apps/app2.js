let hEle;

export function bootstrap() {
  Promise.resolve().then(() => {
    hEle = document.createElement('h3');
    hEle.innerText = 'This is App2';
  });
}

export function mount() {
  Promise.resolve().then(() => {
    document.body.appendChild(hEle);
  });
}

export function unmount() {
  Promise.resolve().then(() => {
    document.body.removeChild(hEle);
  });
}

export function unload() {
  Promise.resolve().then(() => {
    hEle = null;
  });
}
