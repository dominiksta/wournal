import { rx, TemplateElementChild } from "@mvui/core";
import * as ui5 from "@mvui/ui5";

export function SimpleSelect<T extends string>(
  value: rx.State<T>,
  options: { value: T, name: string, icon?: string }[],
): TemplateElementChild {
  return ui5.select({
    events: {
      change: e => {
        value.next(e.detail.selectedOption.value as any);
      }
    }
  }, [
    ...options.map(opt => ui5.option({
      fields: {
        value: opt.value,
        selected: value.derive(v => v === opt.value)
      }
    }, opt.name))
  ])
}
