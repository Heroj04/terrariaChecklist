import { defineConfig } from 'vite';

const wikiImageProxy = {
  '/wiki-images': {
    target: 'https://terraria.wiki.gg',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/wiki-images/, ''),
    configure: (proxy) => {
      proxy.on('proxyReq', (request) => request.removeHeader('referer'));
    },
  },
};

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/').at(-1);
const base = process.env.GITHUB_ACTIONS && repositoryName && !repositoryName.endsWith('.github.io')
  ? `/${repositoryName}/`
  : '/';

export default defineConfig({
  base,
  server: { proxy: wikiImageProxy },
  preview: { proxy: wikiImageProxy },
});