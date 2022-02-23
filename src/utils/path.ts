export const basename = (str: string) => str.substring(str.lastIndexOf('/') + 1)

export const dirname = (str: string) => str.substring(0, str.lastIndexOf('/'))

export const pathToPosix = (path: string) => path.replace(/\\/g, '/')
