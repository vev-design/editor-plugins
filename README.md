# Vev editor plugins

This repository contains asset-source plugins for the Vev editor.
Each provider directory contains its source, dependencies, and Vev configuration.
The `shared` directory contains request and settings helpers.

## Guides

- [OAuth connections, picker windows, and authenticated images](docs/oauth.md)
- [Asset-source template](asset-source-template/src/asset-source.ts)

The OAuth guide describes the pending platform implementation.
It lists the release requirements before setup instructions.

## Development

Run these commands from the provider directory:

```sh
npm install
vev start
```

The editor lists local plugins while the CLI runs.
For OAuth plugins, follow the guide's local-token instructions.

After local checks, build the plugin:

```sh
vev build
```

When the target environment supports the plugin, deploy it:

```sh
vev deploy
```
