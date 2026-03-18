export type FieldType = "checkbox" | "range" | "text" | "select";

export interface StrategyFieldDef {
  id: string;
  label: string;
  type: FieldType;
  order: number;
  options?: string[];
  min?: number;
  max?: number;
}

export type ChecklistValues = Record<string, string | boolean | number>;
