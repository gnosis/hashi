# executor

The Executor is a service utilized to execute messages once they have achieved consensus, meaning when adapters have reached consensus on the message.

&nbsp;

---

&nbsp;

## Installation
To install the Executor, follow these steps:

```bash
git clone https://github.com/gnosis/hashi
cd hashi
nvm use
yarn install
```

&nbsp;

---

&nbsp;

## Configuration

Before running the Executor, you need to create an `.env` file. All parameters can be found within `.env.example`.

&nbsp;

---

&nbsp;

## Usage

To start Executor, run the following command:

```
yarn start dotenv_config_path="your env file"
```

