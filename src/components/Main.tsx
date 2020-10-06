import '../assets/App.css'

import * as FileSaver from 'file-saver'
import * as PropTypes from 'prop-types'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Avatar, AvatarStyle, OptionContext, allOptions } from 'avataaars'
import { Button } from 'react-bootstrap'
import { Helmet } from 'react-helmet'
import {
  UrlQueryParamTypes,
  UrlUpdateTypes,
  addUrlProps
} from 'react-url-query'
import { fromPairs, sample } from 'lodash'

import AvatarForm from './AvatarForm'
import ComponentCode from './ComponentCode'
import ComponentImg from './ComponentImg'

// const Cookies = require('js-cookie')
// const cookies = Cookies.get()

interface Props {
  __render__?: string
  avatarStyle: AvatarStyle
  token?: string
  callBackUrl?: string
  onChangeUrlQueryParams: (params: any, updateType: string) => void
  onChangeAvatarStyle: (avatarStyle: AvatarStyle) => void
}

const updateType = UrlUpdateTypes.pushIn
const urlPropsQueryConfig = {
  ...fromPairs(
    allOptions.map(option => [
      option.key,
      {
        type: UrlQueryParamTypes.string,
        updateType
      }
    ])
  ),
  token: {
    type: UrlQueryParamTypes.string,
    queryParam: 'token'
  },
  callBackUrl: {
    type: UrlQueryParamTypes.string,
    queryParam: 'callback_url'
  },
  avatarStyle: {
    type: UrlQueryParamTypes.string,
    updateType
  }
}

interface State {
  displayComponentCode: boolean,
  displayComponentImg: boolean
}

function capitalizeFirstLetter (text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export class Main extends React.Component<Props, State> {
  static childContextTypes = {
    optionContext: PropTypes.instanceOf(OptionContext)
  }
  static defaultProps = {
    avatarStyle: AvatarStyle.Circle
  }

  state = {
    displayComponentCode: false,
    displayComponentImg: false
  }

  private avatarRef: Avatar | null = null
  private canvasRef: HTMLCanvasElement | null = null
  private optionContext: OptionContext = new OptionContext(allOptions)

  getChildContext () {
    return { optionContext: this.optionContext }
  }

  componentWillReceiveProps (nextProps: Props) {
    this.updateOptionContext(nextProps)
  }

  componentWillMount () {
    this.optionContext.addValueChangeListener(this.onOptionValueChange)
    this.updateOptionContext(this.props)
  }

  componentDidMount () {
    const anyWindow = window as any
    setTimeout(() => {
      anyWindow.prerenderReady = true
    }, 500)
  }

  componentWillUnmount () {
    this.optionContext.removeValueChangeListener(this.onOptionValueChange)
  }

  render () {
    const { avatarStyle } = this.props
    const { displayComponentCode, displayComponentImg } = this.state
    const title = 'Avataaars Generator - Generate your own avataaars!'
    const imageURL = process.env.REACT_APP_IMG_RENDERER_URL + location.search
    return (
      <main role='main'>
        <header className='header clearfix'>
          <h2 style={{ color: '#6A39D7' }}>
            avataaars generator
            <Button
              type='submit'
              bsStyle='secondary'
              style={{ marginLeft: '1rem' }}
              onClick={this.onRandom}
              className='pull-right'>
              <i className='fa fa-random' /> Random
            </Button>
          </h2>
        </header>
        <Helmet>
          <meta property='og:title' content={title} />
          <meta property='og:site_name' content='Avataaars Generator' />
          <meta property='og:url' content={document.location.href} />
          <meta property='og:image' content={imageURL} />
          <meta
            property='og:description'
            content='Avataaars Generator is a free online tool for generating your own avatar'
          />
          <meta name='twitter:card' content='photo' />
          <meta name='twitter:site' content='Avataaars Generator' />
          <meta name='twitter:title' content={title} />
          <meta name='twitter:image' content={imageURL} />
          <meta name='twitter:url' content={document.location.href} />
        </Helmet>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <Avatar ref={this.onAvatarRef} avatarStyle={avatarStyle} />
        </div>
        <AvatarForm
          optionContext={this.optionContext}
          avatarStyle={avatarStyle}
          displayingCode={displayComponentCode}
          displayingImg={displayComponentImg}
          onDownloadPNG={this.onDownloadPNG}
          onDownloadSVG={this.onDownloadSVG}
          onAvatarStyleChange={this.onAvatarStyleChange}
          onToggleCode={this.onToggleCode}
          onToggleImg={this.onToggleImg}
          onSendToWP={this.onSendToWP}
        />
        {displayComponentImg ? (
          <ComponentImg avatarStyle={avatarStyle} />
        ) : null}
        {displayComponentCode ? (
          <ComponentCode avatarStyle={avatarStyle} />
        ) : null}
        <canvas
          style={{ display: 'none' }}
          width='528'
          height='560'
          ref={this.onCanvasRef}
        />
      </main>
    )
  }

  private onAvatarRef = (ref: Avatar) => {
    this.avatarRef = ref
  }

  private onCanvasRef = (ref: HTMLCanvasElement) => {
    this.canvasRef = ref
  }

  private onOptionValueChange = (key: string, value: string) => {
    const name = capitalizeFirstLetter(key)
    const handlerName = `onChange${name}`
    const updateHandler = this.props[handlerName] as (value: string) => void
    updateHandler(value)
  }

  private updateOptionContext (nextProps: Props) {
    this.optionContext.setData(nextProps as any)
  }

  private onAvatarStyleChange = (avatarStyle: AvatarStyle) => {
    this.props.onChangeAvatarStyle(avatarStyle)
  }

  private onRandom = () => {
    const { optionContext } = this
    let values: { [index: string]: string } = {
      avatarStyle: this.props.avatarStyle,
      token: this.props.token,
      callBackUrl: this.props.callBackUrl
    }

    for (const option of optionContext.options) {
      if (option.key in values) {
        continue
      }
      const optionState = optionContext.getOptionState(option.key)!
      // Notice, when the app just launch and we didn't explore too much
      // options, some of these nested option is not added by the selector
      // yet, so we won't be able to select value for them. But as they
      // keep tapping random button, soon or later we will get all the
      // options. So it should be fine. Ideally we should find a better
      // way to collect all the options, but that's okay to just do it this
      // way for now.
      if (!optionState.options.length) {
        continue
      }
      values[option.key] = sample(optionState.options)!
    }
    this.optionContext.setData(values)
    this.props.onChangeUrlQueryParams!(values, UrlUpdateTypes.push)
  }

  private onDownloadPNG = () => {
    // here we need to send the image to WP
    const svgNode = ReactDOM.findDOMNode(this.avatarRef!)
    const canvas = this.canvasRef!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const anyWindow = window as any
    const DOMURL = anyWindow.URL || anyWindow.webkitURL || window

    const data = (svgNode as any).outerHTML
    const img = new Image()
    const svg = new Blob([data], { type: 'image/svg+xml' })
    const url = DOMURL.createObjectURL(svg)

    img.onload = () => {
      ctx.save()
      ctx.scale(2, 2)
      ctx.drawImage(img, 0, 0)
      ctx.restore()
      DOMURL.revokeObjectURL(url)
      this.canvasRef!.toBlob(imageBlob => {
        this.triggerDownload(imageBlob!, 'avataaars.png')
      })
    }
    img.src = url
  }

  private onDownloadSVG = () => {
    const svgNode = ReactDOM.findDOMNode(this.avatarRef!)
    const data = (svgNode as any).outerHTML
    const svg = new Blob([data], { type: 'image/svg+xml' })
    this.triggerDownload(svg, 'avataaars.svg')
  }

  private triggerDownload (imageBlob: Blob, fileName: string) {
    FileSaver.saveAs(imageBlob, fileName)
  }

  private onSendToWP = () => {
    // send ajax call to WP
    const { callBackUrl, token, ...avatarParams } = this.props
    let filtered = Object.keys(avatarParams)
      .filter(key => key.match(/^(?!on).*/g)) // only the properties that are not methods
      .map(key => key + '=' + avatarParams[key])
    console.log(filtered.join('&'))
    const postParams = JSON.stringify({
      action: 'change_avatar_from_generator',
      ...avatarParams
    })
    // ajax call to my-action
    if (callBackUrl) {
      let url = decodeURIComponent(callBackUrl.replace(/\+/g, ' '))
      fetch(url, {
        method: 'POST',
        mode: 'same-origin',
        credentials: 'include',
        referrerPolicy: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: postParams
      })
        .then(response => response.json())
        .then(data => {
          console.log('Success:', data)
        })
        .catch((error) => {
          console.error('Error:', error)
        })
    }
  }

  private onToggleCode = () => {
    this.setState(state => ({
      ...state,
      displayComponentCode: !state.displayComponentCode,
      displayComponentImg: false
    }))
  }

  private onToggleImg = () => {
    this.setState(state => ({
      ...state,
      displayComponentImg: !state.displayComponentImg,
      displayComponentCode: false
    }))
  }
}

export default addUrlProps({ urlPropsQueryConfig })(Main)
