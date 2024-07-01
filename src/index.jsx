import "./index.css"
import React from "react"
import ReactDOM from "react-dom/client"

class Snackbar {
  constructor({
    message,
    decorators,
    timeout = 3000,
    autoClose,
    formatter,
    toastStyles,
    animationSelector,
    action,
    SnackbarComponent,
    hooks,
    position
  }) {
    this.message = message
    this.decorators = decorators
    this.timeout = timeout
    this.autoClose = autoClose
    this.formatter = formatter
    this.toastStyles = toastStyles
    this.animationSelector = animationSelector
    this.action = action
    this.ToastComponent = SnackbarComponent
    this.hooks = hooks
    this.position = position
  }

  #positionVerticallyCenter() {
    const docHeight = document.documentElement.scrollHeight
    const top = (docHeight - this.container.offsetHeight) / 2
    this.container.style.top = `${top}px`
  }

  #positionHorizontllyCenter() {
    const docWidth = document.documentElement.scrollWidth
    const left = (docWidth - this.container.offsetWidth) / 2
    this.container.style.left = `${left}px`
  }

  #positionToast() {
    switch (this.position) {
      case "top-right":
        this.container.style.right = "0px"
        this.container.style.top = "0px"
        break
      case "top-left":
        this.container.style.left = "0px"
        this.container.style.top = "0px"
        break
      case "vertical-center-right":
        this.container.style.right = "0px"
        this.#positionVerticallyCenter()
        break
      case "vertical-center-left":
        this.container.style.left = "0px"
        this.#positionVerticallyCenter()
        break
      case "horizontal-center-top":
        this.container.style.top = "0px"
        this.#positionHorizontllyCenter()
        break
      case "horizontal-center-bottom":
        this.container.style.bottom = "0px"
        this.#positionHorizontllyCenter()
        break
      case "bottom-right":
        this.container.style.right = "0px"
        this.container.style.bottom = "0px"
        break
      case "bottom-left":
        this.container.style.left = "0px"
        this.container.style.bottom = "0px"
        break

      default:
        this.container.style.right = "0px"
        this.container.style.bottom = "0px"
        break
    }
  }

  async #prepareToastContainer() {
    const container = document.createElement("div")
    container.id = "toast-it-root"
    const root = document.getElementById("toast-it-root")

    if (!root) {
      ReactDOM.createRoot(container).render(this.#SnackbarComponent())
      //To avoid race condition during .querySelector
      //wait 0.1s before returning container and its children
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([container, container.firstChild])
        }, 100)
      })
    }
  }

  #fmtMessage() {
    if (
      this.formatter &&
      typeof this.formatter === "function"
    ) return this.formatter(this.message)
    return this.message
  }

  #SnackbarComponent() {
    if (this.ToastComponent) return this.ToastComponent
    return (
      <div className={`:toast ${this.toastStyles}`} >
        <div className="toast-startDecorator">{this.decorators.startDecorator}</div>
        <div><p>{this.#fmtMessage()}</p></div>
        <div className="toast-endDecorator">{this.decorators.endDecorator}</div>
      </div>
    )
  }

  async toast() {
    const container = await this.#prepareToastContainer()
    const appended = document.querySelector("#toast-it-root")

    if (
      container &&
      container.length &&
      !appended
    ) {
      this.container = container[0]
      this.#hydrateToastContainer()
      document.body.appendChild(container[0])
      this.#positionToast()
      container[1].classList.add(this.animationSelector)
      this.#onToastOpen()

      if (this.autoClose && this.timeout) {
        setTimeout(() => {
          // container[1].classList.remove(this.animationSelector)
          this.#onToastEnd()
        }, this.timeout)
      } else {

      }
    }
  }


  #hydrateToastContainer() {
    this.container.addEventListener("mouseover", e => {
      console.log(e)
    })
  }


  #pauseToast(e) {

  }



  #onToastEnd() {
    if (this.hooks) {
      this.hooks.onToastEnd && this.hooks.onToastEnd === "function" && this.hooks.onToastEnd()
    }
  }
  #onToastOpen() {
    if (this.hooks) {
      this.hooks.onToastOpen && this.hooks.onToastOpen === "function" && this.hooks.onToastOpen()
    }
  }
  updateToast({ message, decorators, timeout, formatter, selector }) { }
}

export default Snackbar












const action = {
  close: () => { },
  escape: () => { },
  swipe: () => { },
  hover: () => { }
}











// class ReactNotification {
//   constructor({
//     message,
//     timeout = 2500,
//     root = 'notification',
//     animation = 'animation',
//     formatter = (message) => message
//   }) {
//     this.root = root
//     this.message = message
//     this.timeout = timeout
//     this.animation = animation
//     this.formatter = formatter
//     this.rootWrapper = document.querySelector('.notification')
//   }
//
//   populateRoot() {
//     let root = this.rootWrapper
//     if (this.root !== 'notification') {
//       root = document.querySelector(`.${this.root}`)
//     }
//     root.innerHTML = this.formatter(this.message)
//     return {
//       depopulate: () => {
//         root.innerHTML = ''
//       }
//     }
//   }
//
//   #polyfillWithResolvers() {
//     Promise.withResolvers = () => {
//       let _resolve, _reject
//       const promise = new Promise((resolve, reject) => {
//         _resolve = resolve
//         _reject = reject
//       })
//       return {
//         promise,
//         resolve: _resolve,
//         reject: _reject
//       }
//     }
//   }
//
//   async notify(cb = () => { }) {
//     this.#polyfillWithResolvers()
//     const root = this.populateRoot()
//     this.rootWrapper.classList.add(this.animation)
//     const { promise, resolve, reject } = Promise.withResolvers()
//
//     setTimeout(() => {
//       this.rootWrapper.classList.remove(this.animation)
//       root.depopulate()
//       if (typeof cb === 'function') {
//         resolve(cb())
//       } else {
//         reject(new Error('Error: Callback should be a function'))
//       }
//     }, this.timeout)
//
//     return promise
//   }
// }
//
// export default ReactNotification
