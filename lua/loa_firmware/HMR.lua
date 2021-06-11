HMR = _G.HMR or {}

---Try to hot-replace a module.
---@param modulePath string
---@return boolean - Wether or not the module could be hot-replaced.
function HMR.update(modulePath)
  -- Get the module name from the path by replacing all slashes and omit the
  -- lua root folder.
  -- (The root name `lua/` is 4 characters and so is the file extension `.lua`
  -- therefore we use the indexes 5 and -5 for `string.sub()`)
  local moduleName = string.sub(string.gsub(modulePath, '%/', '.'), 5, -5)

  local oldModule = _G._LOADED[moduleName]
  local data

  if
    type(oldModule) == 'table'
    and type(oldModule.__hmrDispose) == 'function'
  then
    data = oldModule.__hmrDispose(oldModule)
  end

  -- Remove the the module from the cache so the new version gets required.
  _G._LOADED[moduleName] = nil
  local newModule = require(moduleName)

  local hotReplaced = false
  if
    type(newModule) == 'table'
    and type(newModule.__hmrAccept) == 'function'
  then
    local decline = type(newModule.__hmrDecline) == 'function'
      and newModule.__hmrDecline(data, newModule)

    if not decline then
      newModule.__hmrAccept(data, newModule)
      hotReplaced = true
    end
  end

  return hotReplaced
end
