import "./index.css"
import React from "react"
import ReactDOM from "react-dom/client"

export default class Snackbar {
  #scheduleCloseTimer
  #scheduleCloseId
  #secRemainedToClose
  #animationFrameRef
  #snackPosition
  #reactRoot
  #animationEnded
  #animationStarted
  #timeoutCopy

  constructor({
    message,
    decorators,
    timeout = 3000,
    autoClose,
    formatter,
    snackStyles,
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
    this.snackStyles = snackStyles
    this.animationSelector = animationSelector
    this.action = action
    this.ToastComponent = SnackbarComponent
    this.hooks = hooks
    this.position = position
    this.#timeoutCopy = structuredClone(timeout)
  }

  #positionSnack() {
    switch (this.position) {
      case "top-right":
        this.#snackPosition.topRight()
        break
      case "top-left":
        this.#snackPosition.topLeft()
        break
      case "top-center":
        this.#snackPosition.topCenter()
        break
      case "right-center":
        this.#snackPosition.rightCenter()
        break
      case "left-center":
        this.#snackPosition.leftCenter()
        break
      case "bottom-right":
        this.#snackPosition.bottomRight()
        break
      case "bottom-left":
        this.#snackPosition.bottomLeft()
        break
      case "bottom-center":
        this.#snackPosition.bottomCenter()
        break

      default:
        this.root.style.right = "0px"
        this.root.style.bottom = "0px"
        break
    }
  }

  #renderSnackbar() {
    const SnackbarComponent = this.#SnackbarComponent
    this.#reactRoot.render(
      <SnackbarComponent
        snackStyles={this.snackStyles ?? ""}
        startDecorator={this.decorators.startDecorator ?? <></>}
        endDecorator={this.decorators.endDecorator ?? <></>}
        message={this.#fmtMessage() ?? ""}
      />
    )
  }

  #unmountSnackbar() {
    if (this.#animationEnded) {
      setTimeout(() => {
        this.#reactRoot.unmount()
        this.#reactRoot = null
        document.body.removeChild(this.root)
      }, 250)
    }
  }

  async #prepareSnackRoot() {
    const root = document.createElement("div")
    root.id = "snack-root"
    const thereIsRoot = document.getElementById("snack-root")

    if (!thereIsRoot || !this.#reactRoot) {
      this.#reactRoot = ReactDOM.createRoot(root)
    }

    this.#renderSnackbar()
    //To avoid race condition during .querySelector
    //wait 0.1s before returning root and its children
    return new Promise(resolve => {
      setTimeout(() => {
        this.#snackPosition = new SnackPosition(root)
        resolve([root, root.firstChild])
      }, 100)
    })
  }

  #fmtMessage() {
    if (
      this.formatter &&
      typeof this.formatter === "function"
    ) return this.formatter(this.message)
    return this.message
  }

  #SnackbarComponent({
    snackStyles,
    startDecorator,
    endDecorator,
    message
  }) {
    return (
      <div className={`:snack ${snackStyles}`}>
        <div className="snack-startDecorator">
          {startDecorator}
        </div>
        <div><p>{message}</p></div>
        <div className="snack-endDecorator">
          {endDecorator}
        </div>
      </div>
    )
  }

  async toast() {
    const container = await this.#prepareSnackRoot()
    const appended = document.querySelector("#snack-root")

    if (
      container &&
      container.length &&
      !appended
    ) {
      this.root = container[0]
      this.container = container[1]
      this.#hydrateSnackbar()
      document.body.appendChild(this.root)
      this.#positionSnack()
      this.container.classList.add(this.animationSelector)

      this.#emitEvent("snackopen")

      if (this.autoClose && this.timeout) {
        this.#scheduleCloseId = this.#scheduleClose()
        //We track the time elapsed before our snack close
        this.#scheduleCloseTimer = performance.now()
        requestAnimationFrame(() => this.#trackTime())
      } else { }
    }
  }

  #emitEvent(type) {
    const event = new Event(type)
    this.container.dispatchEvent(event)
  }

  #trackTime() {
    const current = performance.now()
    const elapsed = (current - this.#scheduleCloseTimer)
    if (this.timeout > elapsed) {
      this.#secRemainedToClose = this.timeout - elapsed
      this.#animationFrameRef = requestAnimationFrame(() => this.#trackTime())
    } else {
      this.#secRemainedToClose = 0
      this.timeout = 0
    }
  }

  #scheduleClose() {
    return setTimeout(() => {
      this.#closeSnack()
    }, this.timeout)
  }

  #eventListeners = {
    resizeEvent: () => this.#positionSnack(),
    snackClose: () => {
      this.#animationEnded = true
      this.#onSnackClose()
    },
    snackOpen: () => {
      this.#animationStarted = true
      this.#onSnackOpen()
    },
    mouseEnterEvent: (e) => {
      const isSnackRoot = e.target.closest("#snack-root")
      isSnackRoot && this.#pauseSnack()
    },
    mouseOutEvent: (e) => {
      const isSnackRoot = e.target.closest("#snack-root")
      isSnackRoot && this.#resumeSnack()
    }
  }

  #hydrateSnackbar() {
    window.addEventListener("resize", this.#eventListeners.resizeEvent)
    this.root.addEventListener("mouseenter", this.#eventListeners.mouseEnterEvent)
    this.root.addEventListener("mouseout", this.#eventListeners.mouseOutEvent)
    this.container.addEventListener("snackclose", this.#eventListeners.snackClose)
    this.container.addEventListener("snackopen", this.#eventListeners.snackOpen)
  }

  #dehydrateSnackbar() {
    window.removeEventListener("resize", this.#eventListeners.resizeEvent)
    this.root.removeEventListener("mouseenter", this.#eventListeners.mouseEnterEvent)
    this.root.removeEventListener("mouseout", this.#eventListeners.mouseOutEvent)
    this.container.removeEventListener("snackclose", this.#eventListeners.snackClose)
    this.container.removeEventListener("snackopen", this.#eventListeners.snackOpen)
  }

  #closeSnack() {
    this.container.classList.remove(this.animationSelector)
    this.#emitEvent("snackclose")
    this.#dehydrateSnackbar()
    this.#unmountSnackbar()
    this.timeout = this.#timeoutCopy //restore timeout
  }

  #pauseSnack() {
    cancelAnimationFrame(this.#animationFrameRef)
    clearTimeout(this.#scheduleCloseId)
  }

  #resumeSnack() {
    if (this.#secRemainedToClose > 0) {
      this.timeout = this.#secRemainedToClose
      this.#scheduleCloseId = this.#scheduleClose()
      this.#animationFrameRef = requestAnimationFrame(() => this.#trackTime())
    } else if (this.timeout === 0) {
      this.#scheduleCloseId = this.#scheduleClose()
    }
  }

  #onSnackClose() {
    if (
      this.hooks &&
      this.hooks.onSnackClose &&
      typeof this.hooks.onSnackClose === "function" &&
      this.#animationEnded
    ) this.hooks.onSnackClose(this.#updateSnack())
  }

  #onSnackOpen() {
    if (
      this.hooks &&
      this.hooks.onSnackOpen &&
      typeof this.hooks.onSnackOpen === "function" &&
      this.#animationStarted
    ) this.hooks.onSnackOpen(this.#updateSnack())
  }

  on(event, handler) {
    switch (event) {
      case "snackopen":
        if (typeof handler !== "function") {
          throw new Error("Invalid snackopen event handler :/")
        }
        this.hooks.onSnackOpen = handler
        break

      case "snackclose":
        if (typeof handler !== "function") {
          throw new Error("Invalid snackclose event handler :/")
        }
        this.hooks.onSnackClose = handler
        break

      default:
        break
    }
  }

  #updateSnack() {
    return ({
      message,
      decorators,
      timeout,
      autoClose,
      formatter,
      snackStyles,
      animationSelector,
      action,
      SnackbarComponent,
      hooks,
      position
    }) => {
      this.message = message ?? this.message
      this.decorators = decorators ? Object.assign({}, this.decorators, decorators) : decorators
      this.timeout = timeout ?? this.timeout
      this.autoClose = autoClose ?? this.autoClose
      this.formatter = formatter ?? this.formatter
      this.snackStyles = snackStyles ?? this.snackStyles
      this.animationSelector = animationSelector ?? this.animationSelector
      this.action = action ? Object.assign({}, this.action, action) : this.action
      this.ToastComponent = SnackbarComponent ?? this.#SnackbarComponent
      this.hooks = hooks ? Object.assign({}, this.hooks, hooks) : this.hooks
      this.position = position ?? this.position

      // update snackbar root if root is mounted
      if (this.#reactRoot) {
        this.#renderSnackbar()
      } else {
        console.warn(
          "Snackbar root was unmounted on close. " +
          "Cannot update an unmounted root. " +
          "New states is preserved and will be applied on next render"
        )
      }
    }
  }
}


/**
* @class
* Snack positions utility class
* */
class SnackPosition {
  /**
  * @param {HTMLDivElement} root - snackbar root
  * */
  constructor(root) {
    this.root = root
  }

  /**
  * Place the snack root vertically center
  * @private
  * */
  #alignVerCenter() {
    const docHeight = document.documentElement.scrollHeight
    const top = (docHeight - this.root.offsetHeight) / 2
    this.root.style.top = `${top}px`
  }

  /**
  * Place the snack root horizontally center
  * @private
  * */
  #alignHorCenter() {
    const docWidth = document.documentElement.scrollWidth
    const left = (docWidth - this.root.offsetWidth) / 2
    this.root.style.left = `${left}px`
  }

  /**
  * Place the snack root top-right
  * */
  topRight() {
    this.root.style.right = "0px"
    this.root.style.top = "0px"
  }

  /**
  * Place the snack root top-left
  * */
  topLeft() {
    this.root.style.left = "0px"
    this.root.style.top = "0px"
  }

  /**
  * Place the snack root top-center
  * */
  topCenter() {
    this.root.style.top = "0px"
    this.#alignHorCenter()
  }

  /**
    * Place the snack root right-center
    * */
  rightCenter() {
    this.root.style.right = "0px"
    this.#alignVerCenter()
  }

  /**
    * Place the snack root left-center
    * */
  leftCenter() {
    this.root.style.left = "0px"
    this.#alignVerCenter()
  }

  /**
    * Place the snack root bottom-right
    * */
  bottomRight() {
    this.root.style.right = "0px"
    this.root.style.bottom = "0px"
  }

  /**
    * Place the snack root bottom-left
    * */
  bottomLeft() {
    this.root.style.left = "0px"
    this.root.style.bottom = "0px"
  }

  /**
    * Place the snack root bottom-center
    * */
  bottomCenter() {
    this.root.style.bottom = "0px"
    this.#alignHorCenter()
  }
}











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
