import { rx } from '@mvuijs/core';
import { DSUtils } from './DSUtils';
import { getLogger } from 'Shared/logging';

export function setupMvuiStateLogging() {
  const LOG = getLogger('state-change');

  rx.State.loggingCallback = (name, prev, next) => {
    const prevScalar = DSUtils.isScalar(prev);
    const nextScalar = DSUtils.isScalar(prev);
    const msg = `<${name}>`;

    if (!prevScalar && !nextScalar) {
      LOG.debug(msg);
    } else {
      LOG.debug(msg, {
        prev: prevScalar ? prev : `[${typeof prev}]`,
        next: nextScalar ? next : `[${typeof next}]`,
      });
    }
  };
}

function maybeShorten(s: string, len: number = 20): string {
  if (s.length > 20) return s.slice(0, len) + '...';
  else return s;
}

export function logAllClicks() {
  const LOG = getLogger('click');

  window.onclick = (e: MouseEvent) => {
    const path = e.composedPath().filter(
      el => (
        el instanceof HTMLElement &&
          (
            el.tagName.includes('-') || // custom element
            el.innerText || el.title
          )
      )
    ) as HTMLElement[];

    if (path[0] === undefined) return; // drag outside of window

    if (path[0].tagName.includes('WOURNAL-DOCUMENT')) return;

    const pathStr = path.map(el => {
      let ret = el.tagName.toLowerCase();
      if (el.innerText)
        ret += ` [${maybeShorten(el.innerText.replace('\n', ' '))}]`;
      else if (el.title)
        ret += ` [${maybeShorten(el.title)}]`;
      return ret
    });

    LOG.debug(pathStr.join(' > '));
  }
}
