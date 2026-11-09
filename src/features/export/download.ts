/** Starts the browser download of `url` through a temporary link. */
export function downloadFile(url: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = ''
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
}
