import { boot as ui5Boot } from '@ui5/webcomponents-base/dist/Boot';
import "@ui5/webcomponents/dist/Button.js";

/**
   This is kind of awful. When importing ui5 web components, they do not
   immediatly initialize properly - meaning they will be in the dom as generic
   `HTMLElement`s, lacking all of their fields and methods.
   One would think that `await`ing the `boot` method or using the provided
   `attachBoot` callback would fix this, but it doesn't. (We still call it here
   just to be safe.)
 */
export async function waitInitUi5() {
  await ui5Boot();
  const testEl = document.createElement('ui5-button');
  document.body.appendChild(testEl);
  testEl.hidden = true;
  let waitingFor = 0;
  while (!('design' in testEl)) {
    await new Promise(r => setTimeout(r, 50));
    waitingFor += 50;
    if (waitingFor > 3000) {
      console.warn('did not finish waiting for ui5');
      break;
    }
  }
  console.log('ui5 boot complete');
  testEl.remove();
}
