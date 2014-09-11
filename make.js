// Thaddee Tyl, AGPLv3.
// Contrary to popular belief, this file is meant to be a JS code concatenator.
// It is meant to be used in a node environment, as in, `node make.js`.

var fs = require('fs');
var path = require('path');
var uglify = require('uglify-js');

var debug = !!process.argv[2] || false;

function bundle(file, inputs, options) {
  options = options || {};
  var output = fs.createWriteStream(file);

  function cat(i) {
    var input = fs.createReadStream(path.join(__dirname, inputs[i]));
    input.pipe(output, {end: false});
    input.on('end', function() {
      var next = i + 1;
      if (next < inputs.length) {
        cat(next);
      } else {
        output.end();
      }
    });
  }
  if (debug) {  // do not minify the code.
    cat(0);
  } else {
    var total = inputs.map(function(filename) {
      return fs.readFileSync(filename);
    }).reduce(function(acc, next) { return acc + next; });
    if (options.closure) {
      total = '(function(){' + total + '}())';
    }
    var minified = uglify.minify(total, { fromString: true });
    output.write(minified.code, function(){});
  }
}

// Union of lists (in the correct order).
function union(lists) {
  var ulist = [];
  for (var i = 0; i < lists.length; i++) {
    ulist = ulist.concat(lists[i]);
  }
  return ulist;
}

var stream = require('stream');
function streamFromString(str) {
  var newStream = new stream.Readable();
  newStream._read = function() { newStream.push(str); newStream.push(null); };
  return newStream;
}

bundle('.js', [
  'terrain.js',
  'graphics.js',
  'engine.js',
  'ui.js',
], { closure: true });
