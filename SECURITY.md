# Security Policy

## Supported Versions

Only the latest minor release of `@cbs-consulting/generator-btp` receives
security fixes. Upgrade to it before you report a problem.

| Version | Supported |
| ------- | --------- |
| 1.5.x   | Yes       |
| < 1.5   | No        |

## Reporting a Vulnerability

Do not open a public issue for a security problem. Report it privately in one
of these ways:

- Through [GitHub private vulnerability reporting](https://github.com/cbs-consulting/generator-btp/security/advisories/new).
- By email to [cp_opensource@cbs-consulting.de](mailto:cp_opensource@cbs-consulting.de),
  with [administrator@cbs-consulting.de](mailto:administrator@cbs-consulting.de)
  in copy.

Describe the problem, the affected version and the steps to reproduce it. If
you know of a fix or a workaround, add it as well.

We confirm that we received your report within five working days and keep you
informed while we work on a fix. Once the fix is released we publish a
security advisory and credit you, unless you would rather stay anonymous.

## Scope

This policy covers the generator itself. A vulnerability in a project that the
generator scaffolded is in scope when it comes from the files or settings the
generator wrote. Problems in third-party dependencies, such as the SAP CAP or
UI5 tooling, belong with those projects.
