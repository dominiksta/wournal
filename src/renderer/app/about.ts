import { Component, h, style } from '@mvuijs/core';
import * as ui5 from '@mvuijs/ui5';
import PackageJson from 'PackageJson';
import imgLogo from 'res/icon/wournal/logo.png';
import environment from 'Shared/environment';

@Component.register
export default class About extends Component {
  render() {
    const link = (url: string, text?: string) =>
      ui5.link({ fields: { href: url, target: '_blank' }}, text ?? url);

    const ver = PackageJson.version;

    return [
      h.section(h.img({ fields: { src: imgLogo, width: 128 }})),

      ui5.title('Wournal'),

      h.section(h.i('Digital paper as easy as it should be')),

      h.section(
        h.table([
          h.tr([
            h.td('Version'),
            h.td(
              ver +
              (environment.pkgPortable ? ' Portable' : '') +
              (ver.includes('dev') ? ` ${environment.gitVersion}` : '')
            )
          ]),
          h.tr([
            h.td('Build Time'),
            h.td(new Date(environment.buildTime).toISOString())
          ]),
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
