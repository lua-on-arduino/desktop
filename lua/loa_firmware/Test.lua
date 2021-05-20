local Test = {}

local count = 0

function Test.__hmrAccept(data)
  if not data then return end
  count = data.count + 1
  print(count)
end

function Test.__hmrDispose()
  return { count = count }
end

return Test