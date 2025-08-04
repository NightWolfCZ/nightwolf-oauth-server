const rawOrigins = process.env.ORIGINS;

if (typeof rawOrigins !== 'string') {
  throw new Error('process.env.ORIGINS must be defined as a string');
}

console.log('Loaded ORIGINS:', rawOrigins);

const origins = rawOrigins
  .split(',')
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0);

// Regex pro https://domenu.tld i http://localhost
const originRegex = /^https:\/\/([\w-]+\.)+[\w-]+$|^http:\/\/localhost:\d+$/;

const invalidOrigins = origins.filter(origin => !originRegex.test(origin));

if (invalidOrigins.length > 0) {
  console.error('Invalid origins detected:', invalidOrigins);
  throw new Error(`Invalid origin(s): ${invalidOrigins.join(', ')}`);
}


const REQUIRED_ORIGIN_PATTERN = 
  /^https:\/\/([\w_-]+\.)+[\w_-]+(,https:\/\/([\w_-]+\.)+[\w_-]+)*$/

console.log('Loaded ORIGINS:', process.env.ORIGINS)

if (
  typeof process.env.ORIGINS !== 'string' ||
  !process.env.ORIGINS.match(REQUIRED_ORIGIN_PATTERN)
) {
  throw new Error('process.env.ORIGINS MUST be comma separated list of origins that login can succeed on.')
}
const origins = process.env.ORIGINS.split(',')


module.exports = (oauthProvider, message, content) => `
<script>
(function() {
  function contains(arr, elem) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].indexOf('*') >= 0) {
        const regex = new RegExp(arr[i].replaceAll('.', '\\\\.').replaceAll('*', '[\\\\w_-]+'))
        console.log(regex)
        if (elem.match(regex) !== null) {
          return true;
        }
      } else {
        if (arr[i] === elem) {
          return true;
        }
      }
    }
    return false;
  }
  function recieveMessage(e) {
    console.log("recieveMessage %o", e)
    if (!contains(${JSON.stringify(origins)}, e.origin.replace('https://', 'http://').replace('http://', ''))) {
      console.log('Invalid origin: %s', e.origin);
      return;
    }
    // send message to main window with da app
    window.opener.postMessage(
      'authorization:${oauthProvider}:${message}:${JSON.stringify(content)}',
      e.origin
    )
  }
  window.addEventListener("message", recieveMessage, false)
  // Start handshare with parent
  console.log("Sending message: %o", "${oauthProvider}")
  window.opener.postMessage("authorizing:${oauthProvider}", "*")
})()
</script>`
