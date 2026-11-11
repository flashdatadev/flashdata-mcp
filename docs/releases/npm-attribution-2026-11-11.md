# npm attribution metadata patch candidates

These patches publish the website URLs merged in PR4. Only README.md and package.json differ from each preceding npm tarball; package.json changes only version and homepage. Runtime, declarations, examples, licenses, bundled dependencies and package file lists are preserved byte for byte. No API action or paid service is executed.

AI SDK and the transcript/captions Piece builds match the preceding public runtime. The other 13 Piece builds do not match byte for byte, so this release uses the preceding verified registry artifacts as its runtime base instead of republishing current shared build output. This change does not assert that those build differences are behavioral or resolve them.

Preparation: download each exact base tarball, verify its registry SHA-1, retain all files, replace README.md and package.json with this commit's files, then use `npm pack --ignore-scripts`. Verify the packed file set is unchanged and all other file bytes match the base. The registry base and target hashes below identify these metadata-only patches. Earlier tags are not moved; no new release tag claims a runtime build from this commit.

Validation: AI SDK 69 tests and type checking; Activepieces 117 tests and type checking; 15 preserved runtime bundles load with 17 expected actions without running an action. All 16 packed artifacts preserve runtime bytes and file lists. Publication and registry readback are tracked separately; preparation is not proof of publication.

| Package | Base version | Base SHA-1 | Patch version | Patch SHA-1 |
| --- | --- | --- | --- | --- |
| `@flashdata-dev/ai-sdk` | 0.2.0 | `57e21a66abcbe92d68b5725d0e0cfe9906d4529f` | 0.2.1 | `869de5b0eb7b913b96f274bdfc434171f729bfa5` |
| `@flashdata-dev/piece-google-search` | 0.1.0 | `5035ac570c257ad4503de7066179e826f34dba37` | 0.1.1 | `5dca76e55a7ad9ff72eb5e1477a56386ea6743d5` |
| `@flashdata-dev/piece-google-news` | 0.1.0 | `42f7ec72d459c57fe5d5f195d2ab0b6b25cdfb16` | 0.1.1 | `34348b0e43847dfd63da07e711e7cad3940da5f7` |
| `@flashdata-dev/piece-google-images` | 0.1.0 | `e217d25052719d47409c7e2127a3fc6682b9ada0` | 0.1.1 | `4c8b919d0bafb8a4c11e8a717218f338f50d200d` |
| `@flashdata-dev/piece-google-shopping` | 0.1.0 | `36f5ded8b93d751f782066f23a0479dc84443f90` | 0.1.1 | `4414705d13ea5b6e33f7be8d8355fc8d29bd47b7` |
| `@flashdata-dev/piece-google-video-search` | 0.1.0 | `a990823cc793bbabc7a7fa30124c873924e1de40` | 0.1.1 | `2011962785c5b5d622ba949e42d091beb47c9122` |
| `@flashdata-dev/piece-google-places` | 0.1.0 | `8d79e06a3f611b954a1ec5254cafd1e3570aef21` | 0.1.1 | `4d716a8fad1d58127d2cb139a3f34d548784c1ce` |
| `@flashdata-dev/piece-youtube-search` | 0.1.0 | `8152522879d125b4833d8475fa3d617b96a2631d` | 0.1.1 | `2dbac3dfa89863d9876cb748255e84292722fcf2` |
| `@flashdata-dev/piece-youtube-extended-search` | 0.1.0 | `900660d6c2cdaea3e9b6f4b43c5cf229ac5f8df0` | 0.1.1 | `9338d4da77e17347855726721f9e0f08362f047f` |
| `@flashdata-dev/piece-youtube-metadata` | 0.1.0 | `43906281f3886e13549c5466c959e9e6557fd5af` | 0.1.1 | `0c02efdaf6448a44f7cd23e461cc4b351fbf1e6b` |
| `@flashdata-dev/piece-youtube-transcript` | 0.2.0 | `f1073a8c00d1b7ecabdf6f3bedbd3e426b8811e3` | 0.2.1 | `f3cb65ab4ae6c1e66b1a742f6212baa2eeef6dbe` |
| `@flashdata-dev/piece-youtube-captions` | 0.2.0 | `50144d0829edbb636c8ffe0456eca281fdf3e0b1` | 0.2.1 | `9db870276ac5fb49d504f24c3ba444fce3973e15` |
| `@flashdata-dev/piece-youtube-license-metadata` | 0.1.0 | `3db4ccdd41a33aa2ce154905640c3bf4b653c5a9` | 0.1.1 | `2a8b5d13f730c777be531d102d33b237fdb9fd1a` |
| `@flashdata-dev/piece-youtube-channel` | 0.1.0 | `40ae4344e8442d19c879ca90220e683eeae533da` | 0.1.1 | `a60dfed838572c7f0608e016acffe9b671d544b6` |
| `@flashdata-dev/piece-youtube-autocomplete` | 0.1.0 | `5ddf80be125f315173682a967404653095b7d4c0` | 0.1.1 | `17cf08a1a27f4b4205152b39a3fa6f9420bfad4e` |
| `@flashdata-dev/piece-youtube-cloud-storage` | 0.1.0 | `4cb2fe1eeb241cfa3388f7638a18fb6d499e8d6f` | 0.1.1 | `05641083c2668352e1066f87c9ee93cb6e9e6481` |
