# Changelog

All notable changes to this project will be documented in this auto-generated
file. The format is based on [Conventional Commits][1];
this project adheres to [Semantic Versioning][2].

<br />

## @nhscc/backend-airports[@1.2.0][3] (2026-05-29)

### ✨ Features

- Pull in new structure ([44667b5][4])

### 🪄 Fixes

- **packages/backend:** move validation logic into backend package ([09913e8][5])

<br />

### 🏗️ Patch @nhscc/backend-airports[@1.2.3][6] (2026-05-29)

#### 🪄 Fixes

- Use auth\_id to determine flight bookability and remove unnecessary keys from data schema ([f004616][7])

#### ⚙️ Build System

- **deps:** bump @nhscc/backend-airports from 1.2.1 to 1.2.2 ([1ccdda2][8])
- Update build script to use webpack ([8d4030d][9])
  <br />

### 🏗️ Patch @nhscc/backend-airports[@1.2.2][10] (2026-05-29)

#### ⚙️ Build System

- **deps:** bump @-xun/jest from 2.2.7 to 2.2.11 ([1f6eedc][11])
- **deps:** bump @-xun/symbiote from 4.11.4 to 4.15.10 ([87028ba][12])
- **deps:** bump @-xun/types from 1.2.0 to 1.3.0 ([b54c644][13])
- **deps:** bump @nhscc/backend-airports from 1.0.0 to 1.2.1 ([2de558b][14])
- **deps:** bump @testing-library/jest-dom from 6.6.4 to 6.9.1 ([480e021][15])
- **deps:** bump @testing-library/react from 16.3.0 to 16.3.2 ([7f45364][16])
- **deps:** bump @types/node from 24.1.0 to 25.9.1 ([dfdd02a][17])
- **deps:** bump @types/react from 19.1.8 to 19.2.15 ([dc047f4][18])
- **deps:** bump core-js from 3.44.0 to 3.49.0 ([9ff3b6d][19])
- **deps:** bump dotenv from 17.2.1 to 17.4.2 ([bc5695c][20])
- **deps:** bump jest-fixed-jsdom from 0.0.9 to 0.0.11 ([4d402fc][21])
- **deps:** bump mongodb from 6.18.0 to 7.2.0 ([99279df][22])
- **deps:** bump mongodb from 6.18.0 to 7.2.0 ([dd39214][23])
- **deps:** bump next from 15.5.18 to 16.2.6 ([af0abb1][24])
- **deps:** bump next-test-api-route-handler from 5.0.0 to 5.0.5 ([838c973][25])
- **deps:** bump react from 19.1.0 to 19.2.6 ([310d123][26])
- **deps:** bump rejoinder from 2.0.2 to 2.1.0 ([b1f5630][27])
- **deps:** bump type-fest from 4.40.0 to 5.6.0 ([4b6bc9f][28])
- **deps:** bump type-fest from 4.41.0 to 5.6.0 ([e2c691c][29])
- Downgrade mongodb back to version 6 ([efc7fb9][30])
- **package:** update dev command for next 16 ([f9c4270][31])
- Remove type-fest dependency ([b470f9c][32])

<br />

### 🏗️ Patch @nhscc/backend-airports[@1.2.1][33] (2026-05-29)

#### 🪄 Fixes

- **packages/backend:** use AuthError and update indices ([7d86310][34])

<br />

## @nhscc/backend-airports[@1.1.0][35] (2026-05-28)

### ✨ Features

- Extract backend code to @nhscc/backend-airports ([a9f1c34][36])

### ⚙️ Build System

- Update "engines" and lock file ([4f7c696][37])

<br />

### 🏗️ Patch @nhscc/backend-airports[@1.1.1][38] (2026-05-28)

#### ⚙️ Build System

- **packages/backend:** add /util export path ([d67532e][39])

[1]: https://conventionalcommits.org
[2]: https://semver.org
[3]: https://github.com/nhscc/airports.api.hscc.bdpa.org/compare/@nhscc/backend-airports@1.1.1...@nhscc/backend-airports@1.2.0
[4]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/44667b52fc967beab17891839f9777dadc58ca3c
[5]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/09913e8dcd16836d62112704c3b5912d8298d63b
[6]: https://github.com/nhscc/airports.api.hscc.bdpa.org/compare/@nhscc/backend-airports@1.2.2...@nhscc/backend-airports@1.2.3
[7]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/f004616541a33433190943097b5a6b00f257295b
[8]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/1ccdda232adf06b05a813c6a180ac4e4beab7a98
[9]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/8d4030da82101540fc55db01c915c9b0915250cb
[10]: https://github.com/nhscc/airports.api.hscc.bdpa.org/compare/@nhscc/backend-airports@1.2.1...@nhscc/backend-airports@1.2.2
[11]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/1f6eedc2343c159a1fa7ea09f86944fed4554cdd
[12]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/87028ba32e2b8a3b341a5959d4f7bf68253c8d4a
[13]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/b54c644d6cc6e1946e7dcaadd54a1ca424dd27dd
[14]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/2de558b985589414948037e0f67cd25c21bf4ee7
[15]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/480e021c7851adba485c2a371116a3e0e93c41b6
[16]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/7f4536431205f4e15e89cdb3b25e2e5dae1d7c8c
[17]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/dfdd02af67e70161b480ee25c8899fc4cc5cc78f
[18]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/dc047f4df120f5b3725e9fa757d8908843714ddb
[19]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/9ff3b6dba8fe5c73473883a99f508bed99451051
[20]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/bc5695c85ff44d0cece33f08d5673e8696bc931d
[21]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/4d402fcce2376e9c955cf002bf55fc4475ef7dff
[22]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/99279df140fd05edff6a6ddb9d3a545498d45418
[23]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/dd39214f6ce3cf54e8b341a7dc98e76f4bef9772
[24]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/af0abb17edbf73dfbfaf45183baaf5447859f884
[25]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/838c9734aef29ff7e39cdfad4f67584b8d31c91c
[26]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/310d123c65589c464f33c216b8d3505d9000af2d
[27]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/b1f56300b57960ecddbdd6f676d0dedb28c8539a
[28]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/4b6bc9f9af4848d3b8efb8e0f01f99d1c005ecca
[29]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/e2c691c645fe08a8bbd1cc9e74e14654df9db28e
[30]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/efc7fb97a91fce1300c3abf7cfa01daf7e202e6c
[31]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/f9c42705eed6401889c017110f00fd079b9fa94f
[32]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/b470f9c9d96f6b35b8590436385b9275ea3cbfa3
[33]: https://github.com/nhscc/airports.api.hscc.bdpa.org/compare/@nhscc/backend-airports@1.2.0...@nhscc/backend-airports@1.2.1
[34]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/7d863101038e742e6f0aea364dd4bb752fddc55c
[35]: https://github.com/nhscc/airports.api.hscc.bdpa.org/compare/@nhscc/backend-airports@0.0.0-init...@nhscc/backend-airports@1.1.0
[36]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/a9f1c3441859a7629204dcb3b989eb12cf789a27
[37]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/4f7c696b03d2aff9f6797857a9edb6d8c856d11e
[38]: https://github.com/nhscc/airports.api.hscc.bdpa.org/compare/@nhscc/backend-airports@1.1.0...@nhscc/backend-airports@1.1.1
[39]: https://github.com/nhscc/airports.api.hscc.bdpa.org/commit/d67532e282fe351f4c530f0480af3cec70355407
