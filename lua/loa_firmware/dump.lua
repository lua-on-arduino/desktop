local function quote(value) return "'" .. value .. "'" end
local function doubleQuote(value) return '"' .. value .. '"' end
local function bracket(value) return "[" .. value .. "]" end

---Check wether a value is primitive (number, boolean, string) or complex
---(table, function, ...)
---@param value any
---@return boolean
local function isPrimitve(value)
  local valueType = type(value)
  return (
    valueType == 'number' or
    valueType == 'string' or
    valueType == 'boolean'
  )
end

---Return a json representation of the value.
---@param value any
---@return string
local function valueToJson(value)
  local valueType = type(value)
  local str = isPrimitve(value) and tostring(value) or doubleQuote(valueType)
  return valueType == 'string' and doubleQuote(quote(str)) or str
end

---Return a json representation of the key.
---@param key any
---@return string
local function keyToJson(key)
  local keyType = type(key)
  local keyIsPrimitve = isPrimitve(key)
  local str = keyIsPrimitve and tostring(key) or type(key)
  return (not keyIsPrimitve or keyType == 'number') and bracket(str) or str
end

---Convert a table into a json representation.
---based on https://stackoverflow.com/a/64796533/12207499, thanks Francisco!
---@param t table
---@return string
local function tableToJson(t, done)
  done = done or {}
  done[t] = true

  local str = '{'
  local key, value = next(t, nil)
  while key do
    if (type(value) == 'table' and not done[value]) then
      done[value] = true
      str = str .. string.format(
        '"%s":%s',
        keyToJson(key),
        tableToJson(value, done)
      )

      done[value] = nil
    else
      str = str .. 
        string.format('"%s":%s', keyToJson(key), valueToJson(value))
    end

    key, value = next(t, key)
    if key then str = str .. ',' end
  end
  return str .. '}'
end

---Generate a json representation of the value.
local function dump(...)
  local args = {...}
  local json = ''
  for i = 1, select('#', ...) do
    local value = args[i]
    json = json
      .. (i > 1 and ', ' or '')
      .. (type(value) == 'table' and tableToJson(value) or valueToJson(value))
  end
  return bracket(json)
end

return dump