import { getLogger } from "Shared/logging";

const LOG = getLogger(__filename);

export default class DTOVersioner<T> {

  constructor(
    private props: {
      name: string,
      validator: (obj: any) => { success: boolean, error?: string },
      getVersion: (obj: any) => number,
      updateFunctions: { [key: number]: (lastVer: any) => any },
    },
  ) { }

  public updateToCurrent(obj: any): T {
    return this.update(obj) as T;
  }

  public maxVersion() {
    const versions = Object.keys(this.props.updateFunctions).map(parseFloat);
    if (versions.length === 0) return 0.0;
    return Math.max(...versions);
  }

  public validate(obj: any): void {
    const res = this.props.validator(obj);
    if (!res.success) {
      throw new Error(
        `Could not validate ${this.props.name}, msg: \n` +
        res.error
      )
    }
  }

  private update(
    obj: object, toVersion: number = -1 // -1 is current
  ) {
    const { validator, updateFunctions, getVersion, name } =
      this.props;

    const versions = Object.keys(updateFunctions).map(parseFloat);
    const maxVersion = this.maxVersion();
    if (toVersion === -1) toVersion = maxVersion;

    const startingVersion = getVersion(obj);
    LOG.info(
      `got ${name} version ${startingVersion}, wanted ${toVersion}`
    );

    if (startingVersion > maxVersion)
      throw new Error(
        `You traveled to the future with ${name} version ` +
        `${startingVersion}, maxVersion = ${maxVersion}`
      );
    if (startingVersion > toVersion)
      throw new Error(
        `Starting ${name} version ${startingVersion} was` +
        ` bigger than toVersion ${toVersion}`
      );

    let newObj: object = obj;

    const toUpdate = versions.filter(ver => ver > startingVersion);
    LOG.info(`Versions to Update: ${toUpdate}`);

    for (const ver of toUpdate) {
      LOG.info(`updating ${name} to version ${ver}`);
      newObj = updateFunctions[ver](newObj);
    }

    if (toVersion === maxVersion) this.validate(newObj);

    return newObj;
  }
}
