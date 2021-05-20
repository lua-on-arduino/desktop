import { sep } from 'path'

function check(list, level, ...rest) {
  for (const entry of list) {
    if (Array.isArray(entry)) {
      const [dir, files] = entry
      if (dir === level) return dirListIncludes(files, ...rest)
    } else {
      if (entry === level) return true
    }
  }
  return false
}

export const dirListIncludes = (list, path) => check(list, ...path.split(sep))
