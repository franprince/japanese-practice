# [2.1.0](https://github.com/franprince/japanese-practice/compare/v2.0.2...v2.1.0) (2026-01-18)


### Features

* **game-card:** add glassmorphism design for light themes ([4e418da](https://github.com/franprince/japanese-practice/commit/4e418da62c8e89030eafe5393dae89a9f3b4c6c9))
* **theme-switcher:** group themes by dark/light with icons ([387dea7](https://github.com/franprince/japanese-practice/commit/387dea7713056f687fa0433112ec966169092bc7))
* **theme:** add daylight, lavender, and mint light themes ([7f52d1d](https://github.com/franprince/japanese-practice/commit/7f52d1dce6da5f539900481e93195b36113ffd78))

## [2.0.2](https://github.com/franprince/japanese-practice/compare/v2.0.1...v2.0.2) (2026-01-18)


### Bug Fixes

* enforce strict Hepburn romanization for じゃ/じゅ/じょ ([8c1c682](https://github.com/franprince/japanese-practice/commit/8c1c68246037b0368676846777c7625a7758ec30))

## [2.0.1](https://github.com/franprince/japanese-practice/compare/v2.0.0...v2.0.1) (2026-01-17)


### Bug Fixes

* mix hiragana and katakana in both character mode ([fe33581](https://github.com/franprince/japanese-practice/commit/fe335816dbee0b318f112f33a6b5f2a861fd2b20))

# [2.0.0](https://github.com/franprince/japanese-practice/compare/v1.6.0...v2.0.0) (2026-01-17)


### Bug Fixes

* add onRequestOpenSettings handler for better UX ([ce2ac54](https://github.com/franprince/japanese-practice/commit/ce2ac54d8f4bc260c1464a2e766d17679e15a06a))
* improve character selection accuracy in random mode ([598c421](https://github.com/franprince/japanese-practice/commit/598c42165aae48234b1b1a33eca8d0cfe3dc6f2a))


### Features

* add new wordsets ([bae6389](https://github.com/franprince/japanese-practice/commit/bae6389b6b8dda17b8e77a81d0341d217163c711))
* embed version in wordset JSON and simplify file naming ([7def370](https://github.com/franprince/japanese-practice/commit/7def370c49f145d7a325266257ba57cb0af34866))
* implement version-based cache invalidation for wordsets ([6fa5cfe](https://github.com/franprince/japanese-practice/commit/6fa5cfef8b37c7238ab70bdd73c3b121876a5943))
* update wordset API to use embedded version for ETags ([b43230f](https://github.com/franprince/japanese-practice/commit/b43230fa6d0f827994e8af79d14989a88e9e7394))


### BREAKING CHANGES

* Wordset file naming convention changed from wordset-{lang}-v{n}.json to wordset-{lang}.json

# [1.6.0](https://github.com/franprince/japanese-practice/compare/v1.5.0...v1.6.0) (2026-01-17)


### Features

* add lang='ja' tags to all game components for proper font rendering ([4206eca](https://github.com/franprince/japanese-practice/commit/4206ecac87af8411846c0f214e1124e75f068ac7))

# [1.5.0](https://github.com/franprince/japanese-practice/compare/v1.4.0...v1.5.0) (2026-01-17)


### Features

* add reusable utility functions ([5c703f1](https://github.com/franprince/japanese-practice/commit/5c703f1986b3190c11a69af9149e0663a157d90a))
* add useGameScore hook for centralized scoring ([f84d643](https://github.com/franprince/japanese-practice/commit/f84d6432001736cc4bc995c6cd78ab0c92f0181d))
* add useKeyboardNavigation hook ([d252ff4](https://github.com/franprince/japanese-practice/commit/d252ff4ba9fd5e969c53a132a577f5bbf41486f7))

# [1.4.0](https://github.com/franprince/japanese-practice/compare/v1.3.0...v1.4.0) (2026-01-17)


### Features

* add lang='ja' to Japanese text in game components ([56bd292](https://github.com/franprince/japanese-practice/commit/56bd29227543ea14e0e06743f40a08e340a7361d))
* add lang='ja' to Japanese text in UI components ([99b932c](https://github.com/franprince/japanese-practice/commit/99b932c666be0d0c6d6f55a829d1e6e94f6243e6))
* add lang='ja' to Japanese text on home page ([a6a61d1](https://github.com/franprince/japanese-practice/commit/a6a61d10b27154ed89029ee698bda87ea5cfd717))
* sync HTML lang attribute with app language ([8dfd354](https://github.com/franprince/japanese-practice/commit/8dfd3546a8e45ffa81ffc6918581736d53367f2c))

# [1.3.0](https://github.com/franprince/japanese-practice/compare/v1.2.0...v1.3.0) (2026-01-16)


### Features

* add i18n for incorrect characters table ([e49410a](https://github.com/franprince/japanese-practice/commit/e49410a515ff34d1999791d0f9644d1467537af1))
* display top 3 incorrect chars in session summary ([1c2f381](https://github.com/franprince/japanese-practice/commit/1c2f381cf1d5bf5397e59a856927e30c60a7e05a))
* track incorrect characters with romaji in session ([33273f3](https://github.com/franprince/japanese-practice/commit/33273f34fc8fd2fb4615bea4413cae4c7eb04442))
* wire incorrect chars to session summary ([44324f3](https://github.com/franprince/japanese-practice/commit/44324f3db7de101b00c03402956b21ccab17ab5d))

# [1.2.0](https://github.com/franprince/japanese-practice/compare/v1.1.0...v1.2.0) (2026-01-16)


### Features

* add error detection ([ca2d184](https://github.com/franprince/japanese-practice/commit/ca2d184b4fc9bd365de021ee9afb4b7b796a33f7))

# [1.1.0](https://github.com/franprince/japanese-practice/compare/v1.0.0...v1.1.0) (2026-01-15)


### Features

* close custom menu on click outside ([f0b02f2](https://github.com/franprince/japanese-practice/commit/f0b02f21a86add044bf67a16bd101b7267117a35))

# 1.0.0 (2026-01-15)


### Bug Fixes

* correct JSON syntax errors in kanaDictionary ([7483656](https://github.com/franprince/japanese-practice/commit/7483656ff46ff35a846334437c34c9f274fad918))
* **game:** prevent word reload on language switch when session complete ([2164855](https://github.com/franprince/japanese-practice/commit/2164855ba6643079d996564ef41eed3e9279cbeb))
* preload character groups in word game components ([a350f38](https://github.com/franprince/japanese-practice/commit/a350f382195adcaee5e5df7571fdf2836ab1fb00))
* **test:** configure bun test scripts and pre-push hook ([2c74760](https://github.com/franprince/japanese-practice/commit/2c74760199983bdb5e1f966b5cffdf9e23a56ff2))
* **ui:** suppress hydration warning in root layout ([50642be](https://github.com/franprince/japanese-practice/commit/50642be42ba37846fa482a5191a747b806204a2d))


### Features

* add analytics ([7d6e92f](https://github.com/franprince/japanese-practice/commit/7d6e92f151e00d4adda52675b6288b76ef957900))
* add blacklist feature ([6c4cc57](https://github.com/franprince/japanese-practice/commit/6c4cc57fbf4590ef16a66367a8ec2e01f16c195e))
* add dates game ([4409e35](https://github.com/franprince/japanese-practice/commit/4409e35e8db93d51c20b81be02b39cbd73d0683a))
* add english dictionary ([2f7114c](https://github.com/franprince/japanese-practice/commit/2f7114c364a4099825e65beddb4a4f20b3b1af96))
* add footer ([943a53d](https://github.com/franprince/japanese-practice/commit/943a53d6f3d49ae4758d65e7755def9423644839))
* add home button on each page ([e34ca51](https://github.com/franprince/japanese-practice/commit/e34ca512fbec89256e7e019606633e2598231d29))
* add home button on each page ([342052b](https://github.com/franprince/japanese-practice/commit/342052ba87ef80289d88d5e606f37538fdbb8525))
* add i18n ([ef49d34](https://github.com/franprince/japanese-practice/commit/ef49d34b30a9212f087b7c0ff36a8e7f3adbb378))
* add i18n for round counter ([366b1b4](https://github.com/franprince/japanese-practice/commit/366b1b434698621447ee281e5119224a3758ee73))
* add IndexedDB caching for kanji data ([7e35587](https://github.com/franprince/japanese-practice/commit/7e355871826bd227ca6182f945fed1737509fd8d))
* add kanji game ([1f1246e](https://github.com/franprince/japanese-practice/commit/1f1246e41ff5dc7e4b1f969040cf65536bd07696))
* add kanji practice page ([43e65b0](https://github.com/franprince/japanese-practice/commit/43e65b0fce5118db27a06457b2428f9954b398db))
* add lazy loading for kana dictionary ([b0eb9db](https://github.com/franprince/japanese-practice/commit/b0eb9db8cb69dd1cc5730efb1912e9d0e1316384))
* add new dataset ([c7de5de](https://github.com/franprince/japanese-practice/commit/c7de5deab49337493700bc9a97037c7c6aaeffc9))
* add new kanji page to home ([af45e9d](https://github.com/franprince/japanese-practice/commit/af45e9db958ae74779c42e3aa65c5b36077e4f35))
* add new menu on words game ([2ce0498](https://github.com/franprince/japanese-practice/commit/2ce049896349517f7020bf1bae8b361dd589d86d))
* add new numbers game mode ([4b12f57](https://github.com/franprince/japanese-practice/commit/4b12f572b1357492cfbd500520bb2111506fa5fd))
* add new rule to accept は as particle in word game ([8c821d6](https://github.com/franprince/japanese-practice/commit/8c821d615df5fe04287c08d0c2bb42c57ce454a5))
* add pages for each game ([1fe3f3e](https://github.com/franprince/japanese-practice/commit/1fe3f3ee0312737e6360171676c0eb605cc44f6a))
* add semantic release workflow ([26e7f84](https://github.com/franprince/japanese-practice/commit/26e7f84895aa68415e090bb7adcbb0eab3ad5563))
* add session and infinite mode on each game ([c1f310f](https://github.com/franprince/japanese-practice/commit/c1f310ff0fb861c70066567986fdf151ebb5b0c0))
* add shuffle checkbox for number keypad ([379508d](https://github.com/franprince/japanese-practice/commit/379508dfbeba9ad473ffa399b34c825568131c04))
* add speed insights ([d539c27](https://github.com/franprince/japanese-practice/commit/d539c27c1d0d16a03a8578850699d60a985649dc))
* add speed insights ([ffc4539](https://github.com/franprince/japanese-practice/commit/ffc45392efe94a31329c91c40e6e9d3818774cb9))
* add theme switcher ([3b62e56](https://github.com/franprince/japanese-practice/commit/3b62e56c8404451061c87a70c69848cf7ae72786))
* add tooltip with disclaimer when a spanish translation is missing ([38e937d](https://github.com/franprince/japanese-practice/commit/38e937d21de8903aa6ea9111aa207a5a1b8d4691))
* add workers to load words ([28c954d](https://github.com/franprince/japanese-practice/commit/28c954d4e6b5c3c891c1cd846c8b82e1ca12b580))
* adjust dataset selection logic ([fca0b70](https://github.com/franprince/japanese-practice/commit/fca0b70e37086957c4d6296cc065c312aed3ec30))
* adjust gh actions ([79f780f](https://github.com/franprince/japanese-practice/commit/79f780f7057385e2be0ed16c209aea3acc0bf906))
* adjust gh actions node version ([eb13e53](https://github.com/franprince/japanese-practice/commit/eb13e531d95783dc45ec9a6932721033e4f3691f))
* adjust kanji difficulty based on level ([1a822f7](https://github.com/franprince/japanese-practice/commit/1a822f7052704c3b37aa277045e7b39117f2764f))
* adjust kanji level depending difficulty ([d9c8e70](https://github.com/franprince/japanese-practice/commit/d9c8e704daeaedbbc6ebc5eb065a1300eadb0c09))
* adjust kanjiset loading logic ([1ec5247](https://github.com/franprince/japanese-practice/commit/1ec524768d3717d4175b158e728ee6a3adb7e9b0))
* adjust translations ([8612723](https://github.com/franprince/japanese-practice/commit/86127231cd4bcea4492f3b8afe0dbfb70bb993ce))
* allow multi language datasets ([e1e545b](https://github.com/franprince/japanese-practice/commit/e1e545b9a19713a5c318ed331d5dde61949a4d54))
* avoid building wordsets in CI ([e2598ba](https://github.com/franprince/japanese-practice/commit/e2598ba255fa5da973227959be249e0f43c07a44))
* componentize game pages ([5b310b9](https://github.com/franprince/japanese-practice/commit/5b310b93c3a0fe76523546a41a627deb5a329513))
* create remaining rounds component ([36ee27b](https://github.com/franprince/japanese-practice/commit/36ee27bb3ac2f52ce077977117294ece9909f322))
* create session progress hook ([ff2f8e7](https://github.com/franprince/japanese-practice/commit/ff2f8e77936a333e7ec5aa28593d4aca459cd291))
* **dates:** implement hybrid week days mode and fix game logic ([d8b1a8a](https://github.com/franprince/japanese-practice/commit/d8b1a8a6719277b77952abc8f4b4bff49d99287a))
* **e2e:** implement comprehensive Words Game test suite with visual documentation ([5177c9c](https://github.com/franprince/japanese-practice/commit/5177c9ce45da0a9af8c82d3f0f758e5cc67b0670))
* enhance japanese input validation with particle and romaji support ([2566347](https://github.com/franprince/japanese-practice/commit/256634705fe92a501a166f6c721a40d9fc515226))
* get words with both hiragana and katakana ([5e0fd8b](https://github.com/franprince/japanese-practice/commit/5e0fd8bab9ac2d5150af30af06914eef2de3a8fe))
* handle sokuon ([3d554b2](https://github.com/franprince/japanese-practice/commit/3d554b2bdb576d009179143dff6f6dc328a25932))
* implement character mode with toggle and random generator ([23de74d](https://github.com/franprince/japanese-practice/commit/23de74d85cd9d9a588573f0a4be989523fe99139))
* implement ETag caching for wordset API ([7761eff](https://github.com/franprince/japanese-practice/commit/7761eff38d79c924b8b458b9e5303d577de70a79))
* improve date game ([18c0326](https://github.com/franprince/japanese-practice/commit/18c0326fed80c7dfab79576f4c2ed69246fbc54d))
* improve mobile ui ([478e4fa](https://github.com/franprince/japanese-practice/commit/478e4faae5dc463f0dd6b2eaa6ba9705528d0938))
* improve numbers game UI ([50cc359](https://github.com/franprince/japanese-practice/commit/50cc359d81d334d2fd049d42faaac3de0966feb9))
* improve ui ([f5d49f3](https://github.com/franprince/japanese-practice/commit/f5d49f341bbbb95f01709469633c77f8b50762ba))
* kanji game improvements ([11ab3a3](https://github.com/franprince/japanese-practice/commit/11ab3a310dbdc4802238f2d2328d51211fcef6a3))
* minor improvements ([254c901](https://github.com/franprince/japanese-practice/commit/254c90179c88d1dc15964be3cb277c146a831fef))
* mobile ui fixes ([46da1ed](https://github.com/franprince/japanese-practice/commit/46da1edab296322ea8ba46f5af54db5eca8c32f6))
* new features ([9102ddb](https://github.com/franprince/japanese-practice/commit/9102ddb85f1f1c41f50b5bf49e2d5c6d07891382))
* prebuild wordset ([55326f1](https://github.com/franprince/japanese-practice/commit/55326f114f656291628d8e1fd4b18923756a08e4))
* quality of life improvements ([d230166](https://github.com/franprince/japanese-practice/commit/d230166f42a91a51c48d6cb114376f5d75793423))
* refactor app ([46ce3cd](https://github.com/franprince/japanese-practice/commit/46ce3cd22eed55644c271239f51d2c35151f3c49))
* refactor home page ([b2f042a](https://github.com/franprince/japanese-practice/commit/b2f042acaa529c4eb0a12f4bcdc568058aa3af86))
* refactor scaffolding ([519510d](https://github.com/franprince/japanese-practice/commit/519510db5f06adae9d108775d89c556b7d2a0b66))
* show all definitions on the dictionary ([783b05d](https://github.com/franprince/japanese-practice/commit/783b05d8be0a7d92f2decc00da6b2f355962888f))
* show mode names on date game mobile ([f5d7cfc](https://github.com/franprince/japanese-practice/commit/f5d7cfc638449fd3d25363f17aa7153deeb5d118))
* show round number on game page ([aff4ce1](https://github.com/franprince/japanese-practice/commit/aff4ce156a08667673aedae2b0d823a904210762))
* show translated mode labels on mobile ([b9bab1f](https://github.com/franprince/japanese-practice/commit/b9bab1fa6c72f79ff002f19230b9d621e4581342))
* smart wordset generation and english support ([b0e1aa9](https://github.com/franprince/japanese-practice/commit/b0e1aa9b9969dd2d2d30660c69f8beeab7662416))
* store dictionary using git lfs ([fe338f3](https://github.com/franprince/japanese-practice/commit/fe338f3fca97af833a162bd8cdb03fc297c6df9c))
* ui rework ([1545bc8](https://github.com/franprince/japanese-practice/commit/1545bc825d3bf1901aac2d15fed4b3ac054cb5cc))
* update dataset creation scripts ([3edc8b3](https://github.com/franprince/japanese-practice/commit/3edc8b33514c8687740e262829b45f93e10d593e))
* word game improvements ([497c4eb](https://github.com/franprince/japanese-practice/commit/497c4eb655af645b5954f29003ba671a1862a59a))


### Performance Improvements

* add cache-control headers to API routes ([2a84a5a](https://github.com/franprince/japanese-practice/commit/2a84a5a52ce6dc01c27974b047b1210689408003))
* optimize kanji data loading by splitting dataset into chunks ([281a654](https://github.com/franprince/japanese-practice/commit/281a654e790d2dc32f8bd5c5a79014b13024ac8a))
