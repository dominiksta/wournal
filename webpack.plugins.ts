import { execSync } from 'child_process';
import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { DefinePlugin } from 'webpack';

const git = (cmd: string) => execSync(`git ${cmd}`, { encoding: 'utf8' }).trim();

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin =
  require('fork-ts-checker-webpack-plugin');

export const plugins = [
  new DefinePlugin({
    'WOURNAL_ENV.pkgPortable': process.env.PKG_PORTABLE === 'true',
    'WOURNAL_ENV.production': process.env.NODE_ENV !== 'development',
    'WOURNAL_ENV.gitVersion': JSON.stringify(git('describe --always')),
    'WOURNAL_ENV.buildTime': JSON.stringify(new Date().toISOString()),
  }),
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
    typescript: {
      configFile: './src/renderer/tsconfig.json',
    }
  }),
];
