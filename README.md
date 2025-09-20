# Flamingock Documentation

<p align="center">
  <strong>The official documentation source for Flamingock - the Change-as-Code platform</strong>
</p>

<p align="center">
  <a href="https://docs.flamingock.io">📖 View Documentation</a> •
  <a href="https://github.com/flamingock/flamingock-java">🏠 Main Repository</a> •
  <a href="https://github.com/flamingock/flamingock.github.io/issues">🐛 Report Issue</a>
</p>

---

## About

This repository contains the source code for the [Flamingock documentation site](https://docs.flamingock.io), built with [Docusaurus](https://docusaurus.io/).

**Flamingock** is a Change-as-Code platform that versions and orchestrates any state change that must evolve alongside your application:
- ✅ Databases (SQL/NoSQL)
- ✅ Message queues (Kafka, RabbitMQ)
- ✅ Cloud storage (S3, GCS)
- ✅ REST APIs & Webhooks
- ✅ Feature flags & Configuration
- ✅ Any external system

## 🤝 Contributing

We welcome contributions to improve our documentation! Whether you've found a typo, want to clarify a concept, or add a new guide, your help makes Flamingock better for everyone.

### Quick Contribution Guide

1. **Found an issue?** [Open an issue](https://github.com/flamingock/flamingock.github.io/issues/new) describing what needs to be fixed
2. **Have a fix?** Fork the repository and submit a pull request
3. **Major changes?** Please open an issue first to discuss your proposed changes

### Making Documentation Changes

1. Fork and clone this repository
2. Install dependencies: `yarn install`
3. Start local development: `yarn start`
4. Make your changes in the `docs/` directory
5. Test your changes locally
6. Submit a pull request

## 🚀 Development

### Prerequisites

- Node.js 18+
- Yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/flamingock/flamingock.github.io.git
cd flamingock.github.io

# Install dependencies
yarn install
```

### Local Development

```bash
# Start the development server
yarn start
```

This opens your browser to `http://localhost:3000` with hot reload enabled. Most changes are reflected instantly.

### Building

```bash
# Build static site
yarn build

# Test the build locally
yarn serve
```

## 📁 Documentation Structure

```
docs/
├── overview/           # Core concepts and introduction
├── quick-start/        # Getting started guides
├── changes/            # Change management documentation
├── target-systems/     # Target system configurations
├── audit-stores/       # Audit store implementations
├── templates/          # Template system documentation
├── frameworks/         # Framework integrations (Spring Boot, etc.)
├── testing/           # Testing strategies
└── cli/               # CLI documentation
```

## 🔧 Technical Stack

- **Generator**: Docusaurus 3.x
- **Search**: Algolia DocSearch
- **Deployment**: GitHub Pages
- **Package Manager**: Yarn

## 📝 Documentation Guidelines

When contributing documentation:

- Use clear, concise language
- Include code examples where helpful
- Follow the existing structure and formatting
- Test all code examples
- Update navigation in `sidebars.js` if adding new pages

## 🆘 Support

- **Documentation Issues**: [Open an issue here](https://github.com/flamingock/flamingock.github.io/issues)
- **Flamingock Issues**: [Main repository issues](https://github.com/flamingock/flamingock-java/issues)
- **Discussions**: [GitHub Discussions](https://github.com/flamingock/flamingock-java/discussions)
- **Email**: development@flamingock.io

## 🔗 Links

- **Live Documentation**: [https://docs.flamingock.io](https://docs.flamingock.io)
- **Main Repository**: [github.com/flamingock/flamingock-java](https://github.com/flamingock/flamingock-java)
- **Examples**: [github.com/flamingock/flamingock-examples](https://github.com/flamingock/flamingock-examples)
- **Website**: [flamingock.io](https://flamingock.io)

## 📄 License

This documentation is licensed under the [Apache License 2.0](LICENSE).

---

<p align="center">
  Made with ❤️ by the Flamingock Team
</p>