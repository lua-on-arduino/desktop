import { expect, it } from '@jest/globals'
import { join } from 'path'
import { dirListIncludes } from '../../src/utils/index.js'

describe('dirListIncludes', () => {
  it('checks if a dir list includes a certain path', () => {
    const dirList = ['init.lua', ['subfolder', ['nested.lua']]]

    expect(dirListIncludes(dirList, 'init.lua')).toBe(true)
    expect(dirListIncludes(dirList, join('subfolder', 'nested.lua'))).toBe(true)
    expect(dirListIncludes(dirList, 'does-not-exist.lua')).toBe(false)
  })
})
