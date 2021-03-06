export default function createSelection (field, start, end) {
  if (field.createTextRange) {
    const selRange = field.createTextRange()
    selRange.collapse(true)
    selRange.moveStart('character', start)
    selRange.moveEnd('character', end)
    selRange.select()
    field.focus()
  } else if (field.setSelectionRange) {
    field.focus()
    field.setSelectionRange(start, end)
  } else if (typeof field.selectionStart !== 'undefined') {
    field.selectionStart = start
    field.selectionEnd = end
    field.focus()
  }
}
