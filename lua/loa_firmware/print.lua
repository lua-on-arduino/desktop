local oldPrint = print

---Monkey-patch lua's `print()` function so it always calls `Log#flush()`. This
---is important because we use a SLIP serial and the the printed output might
---not be displayed in the console immediately otherwise.
function print(...)
  oldPrint(...)
  Log._flush()
end
