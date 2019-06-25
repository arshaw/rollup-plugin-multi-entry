import { promise } from 'matched';

var entry = '\0rollup-plugin-multi-entry:entry-point';
function multiEntry() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var include = [];
  var exclude = [];
  var exporter = buildNamedExports;

  function configure(config) {
    if (typeof config === 'string') {
      include = [config];
    } else if (Array.isArray(config)) {
      include = config;
    } else {
      include = config.include || [];
      exclude = config.exclude || [];

      if (config.exports === false) {
        exporter = buildEmptyExports;
      } else if (config.exports === 'array') {
        exporter = buildArrayExports;
      }
    }
  }

  if (config) {
    configure(config);
  }

  return {
    options(options) {
      if (options.input && options.input !== entry) {
        configure(options.input);
      }

      options.input = entry;
    },

    resolveId(id) {
      if (id === entry) {
        return entry;
      }
    },

    load(id) {
      if (id === entry) {
        if (!include.length) {
          return Promise.resolve('');
        }

        var patterns = include.concat(exclude.map(function (pattern) {
          return '!' + pattern;
        }));
        return promise(patterns, {
          realpath: true
        }).then(function (paths) {
          return exporter(paths);
        });
      }
    }

  };
}

function buildNamedExports(paths) {
  return paths.map(function (path) {
    return `export * from ${JSON.stringify(path)};`;
  }).join('\n');
}

function buildEmptyExports(paths) {
  return paths.map(function (path) {
    return `import ${JSON.stringify(path)};`;
  }).join('\n');
}

function buildArrayExports(paths) {
  return paths.map(function (path, index) {
    return `import _m${index} from ${JSON.stringify(path)}`;
  }).join(';\n') + ';\n' + 'export default [\n' + paths.map(function (path, index) {
    return `_m${index}`;
  }).join(', ') + '\n];\n';
}

export default multiEntry;
