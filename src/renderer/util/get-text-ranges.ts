const debug = false;

/**
   Get a list of `Range` elements for the given `needle` in `els`.

   This only works when supplied with elements that have no child nodes. It is
   therefore probably not that useful in a general sense, but it does map well
   to how pdfjs and Wournal put text in the DOM.

   @example

   ```html
     <span>hello my </span>
     <i>friend</i>
     <span>its me</span>
   ```

   ```typescript
   const ranges = getTextRanges(
     'hello my friend', document.body.querySelectorAll('*')
   );
   getSelection().removeAllRanges();
   getSelection().addRange(ranges[0]);

   // 'hello my friend' will be visibly highlighted in the DOM
   ```
 */
export default function getTextRanges(
  needle: string, els: Element[] | NodeListOf<Element>
): Range[] {
  // algorithm outline:
  // - we go through each element and set it to be the start of the range
  // - we then go through the needle char by char starting from the starting
  //   element and see at which ending element we end up

  if (needle.length === 0) return [];

  els = Array.from(els).filter(el => trim(el.textContent).length !== 0);

  const ranges: Range[] = [];
  const needleOrig = needle;
  needle = trim(needle);

  // outer loop per starting element
  // ------------------------------------------------------------
  let startElIdx = 0, startElOffset = 0;

  startingEl: while (startElIdx < els.length) {
    log(`startingEl`, els[startElIdx]);
    console.assert(els[startElIdx].children.length === 0);
    if (els[startElIdx].textContent.trim() === '') {
      log('element empty, skipping');
      startElIdx++; startElOffset = 0;
      continue startingEl;
    }

    // simplest case: full needle is in one element
    // ============================================================
    {
      const fullIdx = els[startElIdx].textContent.indexOf(needleOrig, startElOffset);
      if (fullIdx !== -1) {
        log('found full string in one element');
        const range = document.createRange();
        range.setStart(els[startElIdx].firstChild, fullIdx);
        range.setEnd(els[startElIdx].firstChild, fullIdx + needleOrig.length);
        ranges.push(range);
        log(range.toString());
        startElOffset = fullIdx + needleOrig.length;
        continue startingEl;
      }
    }

    // harder case: needle stretches over multiple elements
    // (or can not be found)
    // ============================================================

    // get starting position of largest needle portion in starting element
    // ------------------------------------------------------------
    let start = -1;
    {
      const localHaystack = trim(els[startElIdx].textContent.slice(startElOffset));
      for (let i = 0; i < needle.length; i++) {
        const found = localHaystack.lastIndexOf(needle.slice(0, i));
        if (found === -1) break;
        start = found + startElOffset;
      }

      if (start === -1) {
        log('no part of needle found, moving to next startingEl');
        startElIdx++; startElOffset = 0;
        continue startingEl;
      }
    }
    log('start: ', start);

    // main algo loop
    // ------------------------------------------------------------

    let endElIdx = startElIdx, // the current ending element
      // where we found the previous char in the needle *in the current ending
      // element*
      foundInEndIdx = start - 1,
      prevFoundInEndIdx = foundInEndIdx,
      searchCharIdx = 0; // the current char in the needle that we are looking for

    while (searchCharIdx < needle.length) {
      const localHaystack = trim(els[endElIdx].textContent);

      prevFoundInEndIdx = foundInEndIdx;
      foundInEndIdx = localHaystack.indexOf(needle[searchCharIdx], foundInEndIdx + 1);
      log({ prevFoundInEndIdx, foundInEndIdx, localHaystack });
      log('char: ', needle[searchCharIdx], foundInEndIdx);

      // === case 1: the needle was not found
      // -> attempt next starting element
      if (
        foundInEndIdx === -1
        // prevent matching text by character like matching "abc" in
        // "a___il7cvoz___b__c".
        || foundInEndIdx !== prevFoundInEndIdx + 1
      ) {
        log('needle not found');
        startElIdx++; startElOffset = 0;
        continue startingEl;
      }

      // === case 2: we have found the entire needle
      // -> stop and add found range
      if (searchCharIdx === needle.length - 1) {
        log('found entire needle');
        break;
      }

      // === case 3: we have reached the end of the current ending element
      if (foundInEndIdx === localHaystack.length - 1) {
        endElIdx++;
        // === case 2.1: we have run out of elements
        // -> the needle was not found
        if (endElIdx >= els.length) {
          log('needle not found (ran out of elements)');
          break startingEl;
        }
        // === case 2.2: there are more elements
        // -> we move to the next ending element
        foundInEndIdx = -1;
        searchCharIdx++;
        log('move to next endEl', els[endElIdx]);
        continue;
      }

      // === case 4: we have found the current char, but still need to look
      // further in the current ending element
      searchCharIdx++;
    }

    // look for start again, this time without replacing whitespace
    // ------------------------------------------------------------
    {
      const txt = els[startElIdx].textContent;
      for (let i = 0; i < needle.length; i++) {
        const found = txt.lastIndexOf(needle.slice(0, i));
        if (found === -1) break;
        start = found;
      }
    }

    // look for end (foundCharIdx is not useful bc we stripped whitespace)
    // ------------------------------------------------------------
    let end = 0;
    {
      const txt = els[endElIdx].textContent;
      for (let i = 0; i < txt.length; i++) {
        const found = needleOrig.lastIndexOf(txt.slice(0, i));
        if (found === -1) break;
        end = i;
      }
    }

    // tadaaa
    // ------------------------------------------------------------
    const range = document.createRange();
    range.setStart(els[startElIdx].firstChild, start);
    range.setEnd(els[endElIdx].firstChild, end + 1);
    ranges.push(range);
    log(range);
    log(trim(range.toString()));
    startElIdx++; startElOffset = 0;
  }

  if (debug) for (const r of ranges) {
    getSelection().removeAllRanges();
    getSelection().addRange(r);
  }

  log('return', ranges);
  return ranges;
}

const trim = (s: string) => s.replaceAll('\n', '').replaceAll(' ', '');

export function testGetTextRanges() {

  const assert = (cond: boolean, msg?: string) => { if (!cond) throw msg; }

  document.body.innerHTML = `
  <span>hello my </span>
  <i>friend</i>
  <span>its me</span>
  `;

  let els = document.body.querySelectorAll('*');
  let found = getTextRanges('my friend', els);
  assert(found.length === 1, 'first two els');
  assert(trim(found[0].toString()) === 'myfriend', 'first two els')

  found = getTextRanges('hello my', els);
  assert(found.length === 1, 'first el');
  assert(trim(found[0].toString()) === 'hellomy', 'first el')

  found = getTextRanges('ell', els);
  assert(found.length === 1, 'first el');
  assert(trim(found[0].toString()) === 'ell', 'first el')

  found = getTextRanges('fri', els);
  assert(found.length === 1, 'second el');
  assert(trim(found[0].toString()) === 'fri', 'second el')

  found = getTextRanges('ts me', els);
  assert(found.length === 1, 'last el');
  assert(trim(found[0].toString()) === 'tsme', 'last el')

  document.body.innerHTML = `
  <span>hello my my my </span>
  <i>friend</i>
  <span>its me</span>
  <span>my friend</span>
  `;

  els = document.body.querySelectorAll('*');
  found = getTextRanges('my friend', els);
  assert(found.length === 2, 'twice & not in front');
  assert(trim(found[0].toString()) === 'myfriend', 'twice & not in front');
  assert(trim(found[1].toString()) === 'myfriend', 'twice & not in front');

  found = getTextRanges('my friend its me', els);
  assert(found.length === 1, 'over three els');
  assert(trim(found[0].toString()) === 'myfrienditsme', 'over three els');

  found = getTextRanges('my my', els);
  assert(found.length === 1, 'use first found');
  assert(trim(found[0].toString()) === 'mymy', 'use first found');
  assert(found[0].startOffset === 6, 'use first found');

  found = getTextRanges('my', els);
  assert(found.length === 4, 'find multiple in one el');
  assert(trim(found[0].toString()) === 'my', 'find multiple in one el');
}

const log = debug ? console.log : ((..._: any[]): null => null);
