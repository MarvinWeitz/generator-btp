# Contributing

Thank you for helping to improve `@cbs-consulting/generator-btp`. This guide
explains how to propose a change. [DEVELOPMENT.md](DEVELOPMENT.md) explains how
the generators work and how to test them locally.

By taking part in this project you agree to follow our
[Code of Conduct](CODE_OF_CONDUCT.md). To report a security problem, follow the
[Security Policy](SECURITY.md) instead of opening an issue.

## Reporting bugs and requesting features

Search the [existing issues](https://github.com/cbs-consulting/generator-btp/issues)
first. If nothing matches, open a new issue with the bug report or feature
request form. For a larger change, open an issue before you start so we can
agree on the approach.

## Making a change

1. Fork the repository and create a branch from `main`.
2. Install the dependencies and enable the pre-commit hook, which lints and
   formats the staged files:

   ```sh
   npm install
   npm run hooks
   ```

3. Make your change and add or update the tests for it.
4. Check that everything passes:

   ```sh
   npm run lint
   npm run format:check
   npm test
   ```

5. Add a line under "Unreleased" in [CHANGELOG.md](CHANGELOG.md) that describes
   the change for users. A pull request that changes nothing a user notices,
   such as a CI or documentation fix, gets the label "no changelog" instead.
6. Open a pull request against `main` and fill in the template.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/), for example
`feat: add UI5 lint config` or `fix(cap): keep existing mta.yaml`. Keep each
pull request to one topic; it is squashed into a single commit when merged.

## License

By contributing you agree that your contribution is licensed under the
[Apache License 2.0](LICENSE), the license of this project.
