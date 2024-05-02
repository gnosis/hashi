# relayer

The Relayer is a service used to relay batches of dispatched messages through Yaho to the adapters.

&nbsp;

---

&nbsp;

## Installation
To install the Relayer, follow these steps:

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

Before running the Relayer, you need to create an `.env` file. All parameters can be found within `.env.example`.

&nbsp;

---

&nbsp;

## Usage

To start Relayer, run the following command:

```
yarn start dotenv_config_path="your env file"
```

