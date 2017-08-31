import { rollup } from 'rollup';
import duration from 'humanize-duration';
import watch from 'rollup-watch';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import filesize from 'rollup-plugin-filesize';
import progress from 'rollup-plugin-progress';
import uglify from 'rollup-plugin-uglify';
import minimist from 'minimist';
import _ from 'lodash';

const args = minimist(process.argv.slice(2), {
  boolean: ['watch', 'minify', 'progress'],
  default: {
    progress: true
  },
  alias: {
    w: 'watch',
    m: 'minify',
    p: 'progress'
  }
});

if (args.watch) {
  args.progress = false;
}

const primedResolve = resolve({
  jsnext: true,
  main: true,
  browser: true
});
const primedCjs = commonjs({
  sourceMap: false
});

const es = {
  options: {
    entry: 'lib/browser-index.js',
    plugins: [
      json(),
      args.progress ? progress() : {},
      filesize()
    ],
    onwarn(warning) {
      if (warning.code === 'UNUSED_EXTERNAL_IMPORT' ||
          warning.code === 'UNRESOLVED_IMPORT') {
        return;
      }

      // eslint-disable-next-line no-console
      console.warn(warning.message);
    },
    legacy: true
  },
  useStrict: false,
  format: 'es',
  dest: 'dist/vtt.es.js'
};

const cjs = Object.assign({}, es, {
  format: 'cjs',
  dest: 'dist/vtt.cjs.js'
});

const umd = {
  options: {
    entry: 'lib/browser-index.js',
    plugins: [
      primedResolve,
      json(),
      primedCjs,
      args.progress ? progress() : {},
      filesize()
    ],
    legacy: true
  },
  useStrict: false,
  format: 'umd',
  dest: 'dist/vtt.js'
};

const minifiedUmd = Object.assign({}, _.cloneDeep(umd), {
  dest: 'dist/vtt.min.js'
});

minifiedUmd.options.plugins.splice(4, 0, uglify({
  preserveComments: 'some',
  screwIE8: false,
  mangle: true,
  compress: {
    /* eslint-disable camelcase */
    sequences: true,
    dead_code: true,
    conditionals: true,
    booleans: true,
    unused: true,
    if_return: true,
    join_vars: true,
    drop_console: true
    /* eslint-enable camelcase */
  }
}));

const global = Object.assign({}, _.cloneDeep(umd), {
  dest: 'dist/vtt.global.js',
  format: 'iife'
});

const minifiedGlobal = Object.assign({}, _.cloneDeep(umd), {
  dest: 'dist/vtt.global.min.js'
});

minifiedGlobal.options.plugins.splice(4, 0, uglify({
  preserveComments: 'some',
  screwIE8: false,
  mangle: true,
  compress: {
    /* eslint-disable camelcase */
    sequences: true,
    dead_code: true,
    conditionals: true,
    booleans: true,
    unused: true,
    if_return: true,
    join_vars: true,
    drop_console: true
    /* eslint-enable camelcase */
  }
}));

function runRollup({options, useStrict, format, dest, banner}) {
  rollup(options)
  .then(function(bundle) {
    bundle.write({
      useStrict,
      format,
      dest,
      banner,
      moduleName: 'vttjs',
      sourceMap: false
    });
  }, function(err) {
    // eslint-disable-next-line no-console
    console.error(err);
  });
}

if (!args.watch) {
  if (args.minify) {
    runRollup(minifiedUmd);
    runRollup(minifiedGlobal);
  } else {
    runRollup(es);
    runRollup(cjs);
    runRollup(umd);
    runRollup(global);
  }
} else {
  const props = ['format', 'dest', 'banner', 'useStrict'];
  const watchers = [
    ['es', watch({rollup},
                 Object.assign({},
                               es.options,
                               _.pick(es, props)))],
    ['cjs', watch({rollup},
                  Object.assign({},
                                cjs.options,
                                _.pick(cjs, props)))],
    ['umd', watch({rollup},
                  Object.assign({moduleName: 'vttjs'},
                                umd.options,
                                _.pick(umd, props)))],
    ['global', watch({rollup},
                  Object.assign({moduleName: 'vttjs'},
                                umd.options,
                                _.pick(global, props)))],
  ];

  watchers.forEach(function([type, watcher]) {
    watcher.on('event', (details) => {
      if (details.code === 'BUILD_START') {
        // eslint-disable-next-line no-console
        console.log(`Bundling ${type}...`);
        return;
      }

      if (details.code === 'BUILD_END') {
        // eslint-disable-next-line no-console
        console.log(`Bundled ${type} in %s`, duration(details.duration));
        return;
      }

      if (details.code === 'ERROR') {
        // eslint-disable-next-line no-console
        console.error(details.error.toString());
        return;
      }
    });
  });
}
