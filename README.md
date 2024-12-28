![Logo of node-modules-cleanup!](https://github.com/user-attachments/assets/0c76df92-4f9c-4c6a-aadd-bba7d75ef00a)

<p align="center" style="margin-bottom: 5px;">
  A simple CLI to bulk remove <em>node_modules</em> folders and free up some of that precious disk space.
</p>

<p align="center">
  <img src="https://img.shields.io/npm/v/node-modules-cleanup?logo=npm&cacheSeconds=3601" alt="" />
  <img src="https://img.shields.io/npm/dm/node-modules-cleanup?logo=npm&cacheSeconds=3601" alt=""/>
  <img src="https://img.shields.io/codecov/c/github/sebastianekstrom/node-modules-cleanup?logo=codecov&cacheSeconds=3601" alt=""/>
</p>

---

<p align="center">
  ⭐️ <a href="#-usage">Usage</a> • <a href="#-examples">Examples</a> • <a href="#-arguments">Arguments</a> • <a href="#-development">Development</a> ⭐️
</p>

---

![Frame 22222](https://github.com/user-attachments/assets/5d735d80-7e38-49d6-9ead-85aa5b9331b4)

## 🚀 Usage

```bash
npx node-modules-cleanup@latest <path>
```

## 📚 Examples

```bash
# Find all node_modules in the current directory
npx node-modules-cleanup@latest ./

# Find all node_modules in a specific directory
npx node-modules-cleanup@latest ~/Desktop/projects

# Skip confirmation before deleting folders
npx node-modules-cleanup@latest ./ --skip-confirmation

# Dry run of the cleanup process, no folders are deleted
npx node-modules-cleanup@latest ./ --dry
```

## 📝 Arguments

| Argument              | Description                                                | Required |
| --------------------- | ---------------------------------------------------------- | -------- |
| `<path>`              | The path to search for `node_modules` folders              | Yes      |
| `--skip-confirmation` | Skip confirmation before deleting folders                  | No       |
| `--dry`               | Dry run of the cleanup process, no folders will be deleted | No       |
| `--help`              | Show help information                                      | No       |
| `--version`           | Show package version                                       | No       |

## 💻 Development

### Install Bun

This project is built with [Bun](https://bun.sh/), to install it run the following command:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Install dependencies

To install the dependencies, run the following command:

```bash
bun install
```

### Generate dummy `node_modules` folders

For easier development a script is available that will generate multiple dummy `node_modules` folders inside of the `./dummy` folder.

```bash
bun run create-dummy-files
```

The number of folders that are generated is randomized, as well as their names and sizes.

### Run the script

The following command will then execute the script.

```bash
bun run dev ./dummy              # Or any other path
```

### Useful commands during development

```bash
bun run dev                     # Runs development build with hot reloading
bun run test                    # Runs the test suite
bun run unused-code-check       # Check for unused code
bun run lint                    # Run ESLint
bun run tsc                     # Runs TypeScript checks
bun run build                   # Builds the package
```
