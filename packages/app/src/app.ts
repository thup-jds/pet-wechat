import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { ensureMockLoginState } from './mock/mode'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    ensureMockLoginState()
    console.log('App launched.')
  })

  // children 是将要被渲染的页面
  return children
}

export default App
