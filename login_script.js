const rawOrigins = process.env.ORIGINS;

if (typeof rawOrigins !== 'string') {
  throw new Error('process.env.ORIGINS must be defined as a string');
}

console.log('Loaded ORIGINS:', rawOrigins);

const origins = rawOrigins
  .split(',')
  .map(origin => origin.trim())
  .filter(origin => origin.length > 0);

// Regex: https://doména.cz nebo http://localhost:PORT
const originRegex = /^https:\/\/([\w-]+\.)+[\w-]+$|^http:\/\/localhost:\d+$/;

const invalidOrigins = origins.filter(origin => !originRegex.test(origin));

if (invalidOrigins.length > 0) {
  console.error('Invalid origins detected:', invalidOrigins);
  throw new Error(`Invalid origin(s): ${invalidOrigins.join(', ')}`);
}

// ✅ EXPORTUJEME HTML SE SCRIPTEM
module.exports = (oauthProvider, message, content) => `
<script>
(function() {
  function contains(arr, elem) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].indexOf('*') >= 0) {
        const regex = new RegExp(
          arr[i]
            .replaceAll('.', '\\\\.')
            .replaceAll('*', '[\\\\w_-]+')
        );
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
    console.log("recieveMessage %o", e);
    const originHost = e.origin
      .replace('https://', '')
      .replace('http://', '');
    if (!contains(${JSON.stringify(origins)}, originHost)) {
      console.log('Invalid origin: %s', e.origin);
      return;
    }
    window.opener.postMessage(
      'authorization:${oauthProvider}:${message}:${JSON.stringify(content)}',
      e.origin
    );
  }

  window.addEventListener("message", recieveMessage, false);
  console.log("Sending message: %o", "${oauthProvider}");
  window.opener.postMessage("authorizing:${oauthProvider}", "*");
})();
</script>
`;

