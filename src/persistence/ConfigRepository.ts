import { ConfigDTO } from "./ConfigDTO";

export abstract class ConfigRepository {
  public abstract load(): Promise<ConfigDTO>;
  public abstract save(dto: ConfigDTO): Promise<void>;
}
