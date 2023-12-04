import { ConfigDTO } from "./ConfigDTO";

export abstract class ConfigRepository {
  public abstract load(): ConfigDTO;
  public abstract save(dto: ConfigDTO): void;
}
