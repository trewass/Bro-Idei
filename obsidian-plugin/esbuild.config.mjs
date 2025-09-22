import esbuild from 'esbuild';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const isWatch = process.argv.includes('--watch');

async function build() {
  const context = await esbuild.context({
    entryPoints: ['src/main.ts'],
    bundle: true,
    outfile: 'main.js',
    format: 'cjs',
    platform: 'node',
    external: ['obsidian'],
    banner: {
      js: `/* Idea Cards Sync plugin */`
    }
  });

  if (isWatch) {
    await context.watch();
    console.log('watching for changes...');
  } else {
    await context.rebuild();
    await context.dispose();
  }
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
