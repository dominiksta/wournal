import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerAppImage } from '@reforged/maker-appimage';
import { MakerWix } from '@electron-forge/maker-wix';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

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
      appUserModelId: 'me.dominiksta.wournal',
      upgradeCode: '4688d0da-d0d8-4255-90cb-8b05f233d909',
    }),
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
};

export default config;
