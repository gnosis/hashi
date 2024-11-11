import "dotenv/config"

import { Common, Hardfork } from "@ethereumjs/common"

const getCommon = (_chainId: number) =>
  Common.custom(
    {
      chainId: _chainId,
    },
    {
      hardfork: Hardfork.Cancun,
      eips: [1559, 4895, 4844, 4788],
    },
  )

export default getCommon
