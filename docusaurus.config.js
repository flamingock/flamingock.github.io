// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Flamingock ',
  tagline: 'Flamingock rules!',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://flamingock.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'flamingock', // Usually your GitHub org/user name.
  projectName: 'flamingock.github.io', // Usually your repo name.
  trailingSlash: false,
  deploymentBranch: 'gh-pages', // Rama donde se desplegará el sitio

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          sidebarCollapsible: false,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/flamingock/flamingock-java',
          lastVersion: 'current',
          versions: {
            current: {
              label: '1.0.0',
              path: '',
            },
          },
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/flamingock/flamingock-java',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  customFields: {
    homepageRedirect: '/docs/overview/Introduction',
  },

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      algolia: {
        appId: '5PMADXD49E',
        apiKey: '75c637346b7b46ab191f9e7a9e039d08',
        indexName: 'flamingock_docs',
        contextualSearch: true,
        searchPagePath: 'search', // Enables the /search page
      },
      navbar: {
        title: 'Flamingock',
        logo: {
          alt: 'Flamingock',
          src: 'img/flamingock.svg',
        },
        items: [
          { type: 'search', position: 'right' },
          {
            href: 'https://github.com/flamingock/flamingock-java',
            label: 'GitHub',
            position: 'right',
          },
          //Disable version dropdown
          /*{
            type: 'docsVersionDropdown',
            position: 'right',
            dropdownActiveClassDisabled: true, // Muestra siempre el desplegable
          },*/
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Overview',
                to: '/docs/overview/Introduction',
              },
              {
                label: 'Library configuration',
                to: '/docs/flamingock-library-config/introduction',
              },
              {
                label: 'Target Systems',
                to: '/docs/target-systems/introduction',
              },
              {
                label: 'Audit Stores',
                to: '/docs/audit-stores/introduction',
              },
              {
                label: 'Recovery and Safety',
                to: '/docs/recovery-and-safety/recovery-strategies',
              },
              {
                label: 'Resources',
                to: '/docs/resources/faq',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/flamingock',
              },
              {
                label: 'Linkedin',
                href: 'https://www.linkedin.com/company/flamingock',
              },
            ],
          },
          {
            title: 'More',
            items: [
              /*{
                label: 'Blog',
                to: '/blog',
              },*/
              {
                label: 'GitHub',
                href: 'https://github.com/flamingock/flamingock-java',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Flamingock, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['java', 'kotlin', 'yaml', 'sql', 'groovy', 'json']
      },
    }),
  plugins: [
    [
      "docusaurus-plugin-generate-llms-txt",
      {
        outputFile: "llms.txt",
      },
    ],
    [require.resolve('docusaurus-lunr-search'), {
      languages: ['en']
    }]
  ],
};
export default config;
