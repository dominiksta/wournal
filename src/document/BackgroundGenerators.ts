import { MM_TO_PIXEL } from "./WournalPageSize";

export type BackgroundGenerator =
  (params: {width: number, height: number, backgroundColor: string}) => SVGElement[];

export const BackgroundStyle = ['blank', 'graph', 'ruled'] as const;
export type BackgroundStyleT = 'blank' | 'graph' | 'ruled';

export const BackgroundGeneratorDesc: { [K in BackgroundStyleT]: string } = {
  blank: 'Blank',
  graph: 'Graph',
  ruled: 'Ruled',
}

function genBackgroundRect(
  params: {width: number, height: number, backgroundColor: string}
): SVGRectElement {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', params.width.toString());
  rect.setAttribute('height', params.height.toString());
  rect.setAttribute('fill', params.backgroundColor);
  rect.setAttribute('stroke', params.backgroundColor);
  return rect;
}

export const BackgroundGenerators: {
  [K in BackgroundStyleT]: BackgroundGenerator
} = {

  blank: ({width, height, backgroundColor}) => {
    return [ genBackgroundRect({width, height, backgroundColor}) ];
  },

  graph: ({width, height, backgroundColor}) => {
    // says wikipedia, also same as in xournal++
    const squareSize = 5 * MM_TO_PIXEL;

    const ret: SVGElement[] = [];
    ret.push(genBackgroundRect({width, height, backgroundColor}))
    for (let i = 0; i < width / squareSize; i++) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const currX = squareSize * i;
      path.setAttribute('d', `M${currX} 0 L${currX} ${height}`)
      path.setAttribute('stroke', '#BCDDEE'); // stolen from xournal++
      ret.push(path);
    }

    for (let i = 0; i < height / squareSize; i++) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const currY = squareSize * i;
      path.setAttribute('d', `M0 ${currY} L${width} ${currY}`)
      path.setAttribute('stroke', '#BDBDBD'); // stolen from xournal++
      ret.push(path);
    }

    return ret;
  },


  ruled: ({width, height, backgroundColor}) => {
    // says wikipedia, also same as in xournal++
    const lineHeight = 8 * MM_TO_PIXEL;

    const skipTop = 3, skipBottom = 3;

    const ret: SVGElement[] = [];
    ret.push(genBackgroundRect({width, height, backgroundColor}))

    for (let i = skipTop; i < (height / lineHeight) - skipBottom; i++) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const currY = lineHeight * i;
      path.setAttribute('d', `M0 ${currY} L${width} ${currY}`)
      path.setAttribute('stroke', '#BDBDBD'); // stolen from xournal++
      ret.push(path);
    }

    return ret;
  },

}
