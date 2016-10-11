// @noflow
import { Component, createElement, PropTypes } from 'react'

import ComponentStyle from '../models/ComponentStyle'
import validAttr from '../utils/validAttr'
import { CHANNEL } from './ThemeProvider'

import type { RuleSet, Target } from '../types'

/* eslint-disable react/prefer-stateless-function */
class AbstractStyledComponent extends Component {
  static isPrototypeOf: Function
}

const createStyledComponent = (target: Target, rules: RuleSet) => {
  /* Handle styled(OtherStyledComponent) differently */
  const isStyledComponent = AbstractStyledComponent.isPrototypeOf(target)
  if (isStyledComponent) return createStyledComponent(target.target, target.rules.concat(rules))

  const isTag = typeof target === 'string'
  const componentStyle = new ComponentStyle(rules)

  class StyledComponent extends AbstractStyledComponent {
    static rules: RuleSet
    static target: Target
    constructor() {
      super()
      this.state = {
        value: null,
        broadcast: true,
      }
    }

    componentWillMount() {
      if (this.context.broadcasts) {
        const subscribe = this.context.broadcasts[CHANNEL]
        this.unsubscribe = subscribe(theme => {
          // This function will be called once immediately.
          this.setState({ theme })
        })
      } else {
        this.setState({
          broadcast: false,
        })
      }
    }

    componentWillUnmount() {
      if (this.state.broadcast) {
        this.unsubscribe()
      }
    }

    /* eslint-disable react/prop-types */
    render() {
      const { className, children } = this.props

      const generatedClassName = componentStyle.generateAndInjectStyles({ theme: this.state.theme })
      const propsForElement = {}
      /* Don't pass through non HTML tags through to HTML elements */
      Object.keys(this.props)
        .filter(propName => !isTag || validAttr(propName))
        .forEach(propName => {
          propsForElement[propName] = this.props[propName]
        })
      propsForElement.className = [className, generatedClassName].filter(x => x).join(' ')

      return createElement(target, propsForElement, children)
    }
  }

  /* Used for inheritance */
  StyledComponent.rules = rules
  StyledComponent.target = target

  StyledComponent.displayName = isTag ? `styled.${target}` : `Styled(${target.displayName})`
  StyledComponent.contextTypes = {
    broadcasts: PropTypes.object,
  }
  return StyledComponent
}

export default createStyledComponent
