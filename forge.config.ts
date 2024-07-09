import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerAppImage } from '@reforged/maker-appimage';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerWix } from '@electron-forge/maker-wix';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import PublisherGitHub from '@electron-forge/publisher-github';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: 'src/renderer/res/icon/wournal/logo',
    appBundleId: 'me.dominiksta.wournal',
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ['linux', 'win32']),
    new MakerWix({
      name: 'Wournal',
      upgradeCode: '4557647c-871f-43d8-9fc4-2c0729f27e16',
      ui: { chooseDirectory: true },
    }),
    // new MakerSquirrel({
    //   // iconUrl: '' TODO
    //   setupIcon: 'src/renderer/res/icon/wournal/logo.ico',
    // }),
    // new MakerNSIS(),
    new MakerAppImage({
      options: {
        bin: 'Wournal',
        icon: 'src/renderer/res/icon/wournal/logo.png',
        categories: ['Education', 'Graphics', 'Office', 'VectorGraphics']
      },
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      packageSourceMaps: true,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/renderer/index.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],

  publishers: [
    new PublisherGitHub({
      repository: { owner: 'dominiksta', name: 'wournal' },
      draft: true,
      tagPrefix: '',
    })
  ]
};

export default config;
