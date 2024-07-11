import { ConfigDTO } from "./ConfigDTO";

export interface ConfigRepository {
  load(): Promise<ConfigDTO>;
  save(dto: ConfigDTO): Promise<void>;
}
