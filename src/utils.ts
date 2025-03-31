export const camelCaseToUpperCase = (str: string) => str.replace(/_([a-z])/g, (m, p1) => p1.toUpperCase());

export const replaceKeysWithFunc = (obj: object, func: (str: string) => string) =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => [func(key), value]));