const sleep = (_ms: number) =>
  new Promise<void>((_resolve) =>
    setTimeout(() => {
      _resolve()
    }, _ms),
  )

export default sleep
