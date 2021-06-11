local dump = require('loa_firmware.dump')

Log = _G.Log or {}

local LogType = {
  Info = 1,
  Warning = 2,
  Error = 3,
  Dump = 4,
}

function Log.log(type, ...)
  local args = { ... }
  local message = ''
  for i = 1, select('#', ...) do
    message = message .. (i > 1 and ', ' or '') .. tostring(args[i])
  end
  Log._log(type, message)
end

function Log.error(...)
  Log.log(LogType.Error, ...)
end

function Log.warning(...)
  Log.log(LogType.Warning, ...)
end

function Log.info(...)
  Log.log(LogType.Info, ...)
end

function Log.dump(...)
  local jsonDump = dump(...)
  Log._log(LogType.Dump, jsonDump)
end
