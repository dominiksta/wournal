
type Env = {
  pkgPortable: string,
  production: boolean,
  buildTime: string,
  gitVersion: string,
}

declare var WOURNAL_ENV: Env;
const environment = {
  pkgPortable: WOURNAL_ENV.pkgPortable,
  production: WOURNAL_ENV.production,
  buildTime: WOURNAL_ENV.buildTime,
  gitVersion: WOURNAL_ENV.gitVersion,
};
export default environment;
