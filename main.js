// Label the download buttons with the visitor's platform. Everything else is CSS.
const platform = (() => {
  const ua = navigator.userAgent
  if (/Mac/i.test(ua)) return 'macOS'
  if (/Win/i.test(ua)) return 'Windows'
  if (/Linux|X11/i.test(ua)) return 'Linux'
  return null
})()

if (platform) {
  for (const el of document.querySelectorAll('[data-download-label]')) {
    el.textContent = el.textContent.trim() === 'Download' ? `Download for ${platform}` : el.textContent
  }
}
