import esbuild from 'esbuild';
import { resolve } from 'path';

const prod = process.argv[2] === 'production';

esbuild
  .build({
    entryPoints: [resolve('src', 'main.ts')],
    bundle: true,
    external: ['obsidian'],
    format: 'cjs',
    platform: 'node',
    target: 'es2021',
    outfile: resolve('main.js'),
    sourcemap: prod ? false : 'inline',
    minify: prod,
    treeShaking: true,
    plugins: [
      {
        name: 'watch',
        setup(build) {
          if (!prod) {
            build.onEnd((result) => {
              if (result.errors.length) {
                console.error('Build failed:', result.errors);
              } else {
                console.log('Build succeeded.');
              }
            });
          }
        },
      },
    ],
  })
  .catch(() => process.exit(1));
