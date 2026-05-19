const isDev = import.meta.env.DEV;

export const devLog = isDev ? console.log.bind(console) : () => {};
export const devWarn = isDev ? console.warn.bind(console) : () => {};
export const devError = isDev ? console.error.bind(console) : () => {};
