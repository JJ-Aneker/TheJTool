// Themed message singleton — follows ConfigProvider dark/light algorithm.
// Components import { message } from '../utils/message' instead of antd directly.
// App.jsx renders <MessageHolder /> which initializes the themed API via App.useApp().
import { message as _static } from 'antd'

let _api = _static

export function _setMessageApi(api) {
  _api = api
}

export const message = new Proxy({}, {
  get(_, prop) {
    return (...args) => _api[prop](...args)
  }
})
