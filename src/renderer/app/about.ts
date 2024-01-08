import { Component, h, style } from '@mvui/core';
import * as ui5 from '@mvui/ui5';
import PackageJson from 'PackageJson';

@Component.register
export default class About extends Component {
  render() {
    const link = (url: string, text?: string) =>
      ui5.link({ fields: { href: url, target: '_blank' }}, text ?? url);

    return [
      h.section(h.img({ fields: { src: 'res/icon/wournal/logo.png', width: 128 }})),

      ui5.title('Wournal'),

      h.section(h.i('Digital paper as easy as it should be')),

      h.section(
        h.table([
          h.tr([h.td('Version'), h.td(PackageJson.version)]),
          h.tr([h.td('Website'), h.td(link('https://github.com/dominiksta/wournal'))]),
          h.tr([h.td('License'), h.td(
            link(
              'https://github.com/dominiksta/wournal/blob/master/LICENSE',
              PackageJson.license
            )
          )]),
        ]),
      ),

      h.section([
        h.span('Made with '),
        h.span({ style: {
          fontFamily: 'monospace', fontWeight: 'bold', fontSize: '110%',
        }}, '<3'),
        h.span(' by Dominik Stahmer (and hopefully others in the future)')
      ]),
    ]
  }

  static styles = style.sheet({
    'table > tr > td:first-child': {
      fontWeight: 'bold',
      paddingRight: '10px',
    },
    'section': {
      margin: '30px 0px',
    },
    '*': {
      textAlign: 'center',
    },
    'table': {
      display: 'inline-block',
    }
  })
}
