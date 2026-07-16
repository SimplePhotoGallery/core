# Agent Instructions

## Release And Publish Flow

When publishing the `@simple-photo-gallery/common`, `@simple-photo-gallery/theme-modern`, and `simple-photo-gallery` packages, use the GitHub Actions CI flow. Do not run `npm publish` manually from a local shell, and do not ask for an npm OTP for these packages.

The publish workflow lives in `.github/workflows/release.yml` and is triggered by tags matching `v*.*.*`. All three packages are released together. The workflow verifies that every package version matches the tag, runs the repository CI checks and a package dry-run, then publishes the packages to npm in dependency order.

Use this sequence for releases:

1. Check the registry versions with `npm view @simple-photo-gallery/common version`, `npm view @simple-photo-gallery/theme-modern version`, and `npm view simple-photo-gallery version`.
2. Bump `common/package.json`, `themes/modern/package.json`, and `gallery/package.json` to the same next patch, minor, or major version.
3. Run `yarn ci` and `yarn release:check --version <version>` from the repository root.
4. Commit the release changes.
5. Push the release commit to `main`.
6. Create and push the matching version tag, for example `git tag v2.2.2 && git push origin v2.2.2`.
7. Verify all three packages on npm before updating downstream applications.
