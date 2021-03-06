function getDomainFromUrl (url) {
  var a = document.createElement('a')
  a.setAttribute('href', url)
  return a.hostname
}

function debounce (fn, time) {
  let timeout

  return function () {
    const functionCall = () => fn.apply(this, arguments)

    clearTimeout(timeout)
    timeout = setTimeout(functionCall, time)
  }
}

function isDebug () {
  return process.env.NODE_ENV === 'development'
}

export {
  getDomainFromUrl,
  debounce,
  isDebug
}
