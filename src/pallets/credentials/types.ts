export enum SchemaTypes {
  u8,
  i8,
  u16,
  i16,
  u32,
  i32,
  u64,
  f32,
  f64,
  char
}

export const stringToSchemaType = (str: string): SchemaTypes | undefined => ({
  u8: SchemaTypes.u8,
  i8: SchemaTypes.i8,
  u16: SchemaTypes.u16,
  i16: SchemaTypes.i16,
  u32: SchemaTypes.u32,
  i32: SchemaTypes.i32,
  u64: SchemaTypes.u64,
  f32: SchemaTypes.f32,
  f64: SchemaTypes.f64,
  char: SchemaTypes.char,
}[str.toLowerCase()]);

export type SchemaObject = {
  key: string,
  type: SchemaTypes
}[]

export const schemaObjectToRaw = (obj: SchemaObject) => obj.map(item => [item.key, SchemaTypes[item.type]])

