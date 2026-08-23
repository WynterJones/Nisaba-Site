// Nisaba ships for macOS today. Everyone else gets pointed at building from source.
const isMac = /Mac/i.test(navigator.userAgent)

if (!isMac) {
  const note = document.querySelector('[data-other-platform]')
  if (note) {
    note.insertAdjacentHTML(
      'afterbegin',
      '<strong>Nisaba ships for macOS today.</strong> On Windows or Linux you can still run it — '
    )
  }
}
