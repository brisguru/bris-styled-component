// @flow
import { createElement } from 'react'

import isTag from '../utils/isTag'
import type { RuleSet, Target } from '../types'

import { CHANNEL } from './ThemeProvider'
import InlineStyle from './InlineStyle'
import AbstractStyledComponent from './AbstractStyledComponent'

const createStyledNativeComponent = (target: Target, rules: RuleSet, parent?: Target) => {
  /* Handle styled(OtherStyledNativeComponent) differently */
  const isStyledNativeComponent = AbstractStyledComponent.isPrototypeOf(target)
  if (isStyledNativeComponent && !isTag(target)) {
    return createStyledNativeComponent(target.target, target.rules.concat(rules), target)
  }

  const inlineStyle = new InlineStyle(rules)
  const ParentComponent = parent || AbstractStyledComponent

  // $FlowIssue need to convince flow that ParentComponent can't be string here
  class StyledNativeComponent extends ParentComponent {
    static rules: RuleSet
    static target: Target

    constructor() {
      super()
      this.state = {
        theme: {},
      }
    }

    componentWillMount() {
      // If there is a theme in the context, subscribe to the event emitter. This
      // is necessary due to pure components blocking context updates, this circumvents
      // that by updating when an event is emitted
      if (this.context[CHANNEL]) {
        const subscribe = this.context[CHANNEL]
        this.unsubscribe = subscribe(theme => {
          // This will be called once immediately
          this.setState({ theme })
        })
      }
    }

    componentWillUnmount() {
      if (this.unsubscribe) {
        this.unsubscribe()
      }
    }

    /* eslint-disable react/prop-types */
    render() {
      const { style, children, innerRef } = this.props
      const theme = this.state.theme || this.props.theme || {}

      const generatedStyles = inlineStyle.generateStyleObject({ theme })

      const propsForElement = Object.assign({}, this.props)
      propsForElement.style = [generatedStyles, style]
      if (innerRef) {
        propsForElement.ref = innerRef
      }

      return createElement(target, propsForElement, children)
    }
  }

  /* Used for inheritance */
  StyledNativeComponent.rules = rules
  StyledNativeComponent.target = target
  StyledNativeComponent.displayName = isTag(target) ? `styled.${target}` : `Styled(${target.displayName})`

  return StyledNativeComponent
}

export default createStyledNativeComponent
