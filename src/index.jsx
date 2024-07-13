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
  #isOnSnackbarControl
  #snackbarControl
  #swipeStartX
  #swipeStartY
  #isSwipping

  constructor({
    message,
    decorators,
    timeout = 3000,
    autoClose,
    formatter,
    initialStyles,
    animationStyles,
    action,
    SnackbarComponent,
    hooks = {},
    position,
    swipeThreshold = 150,
  }) {
    this.message = message
    this.decorators = decorators
    this.timeout = timeout
    this.autoClose = autoClose
    this.formatter = formatter
    this.initialStyles = initialStyles
    this.animationStyles = animationStyles
    this.action = Object.assign({}, this.#action(), action)
    this.SnackbarComponent = SnackbarComponent
    this.hooks = hooks
    this.position = position
    this.#timeoutCopy = structuredClone(timeout) // store original timeout
    this.swipeThreshold = swipeThreshold
  }

  #action() {
    return {
      close: (_e, callback) => {
        callback()
      },
      escape: (e, callback) => {
        if (e.key === "Escape" && this.#animationStarted) {
          callback()
        }
      }
    }
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
    const SnackbarComponent = this.#SnackbarComponent()
    this.#reactRoot.render(
      this.SnackbarComponent ?
        <SnackbarComponent
          message={this.#fmtMessage(this.message) ?? ""}
          action={this.action}
          callback={this.#closeSnack.bind(this)}
        />
        :
        <SnackbarComponent
          initialStyles={this.initialStyles ?? ""}
          startDecorator={this.decorators.startDecorator ?? <></>}
          endDecorator={this.decorators.endDecorator ?? <></>}
          closeDecorator={this.decorators.closeDecorator ?? "x"}
          message={this.#fmtMessage() ?? ""}
          action={this.action}
          callback={this.#closeSnack}
        />
    )
  }

  #unmountSnackbar() {
    if (this.#animationEnded) {
      setTimeout(() => {
        this.#reactRoot && this.#reactRoot.unmount()
        this.#reactRoot = null
        this.root && document.body.removeChild(this.root)
        this.root = null
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

  #SnackbarComponent() {
    if (this.SnackbarComponent) return this.SnackbarComponent
    return function SnackbarComponent({
      initialStyles,
      startDecorator,
      endDecorator,
      closeDecorator,
      message,
      action,
      callback
    }) {
      return (
        <div className={`snackbar ${initialStyles}`}>
          <div className="snackbar-content">
            <div className="snackbar-startDecorator">
              {startDecorator}
            </div>
            <div><p>{message}</p></div>
            <div className="snackbar-endDecorator">
              {endDecorator}
            </div>
          </div>
          <div className="snackbar-control">
            <span className="esc">esc</span>
            <button
              className="snackbar-close-btn"
              onClick={(e) => action.close(e, callback)}>
              {closeDecorator}
            </button>
          </div>
        </div>
      )
    }
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

      // wait 0.05s for root to be appended, before starting animating
      // (without it, animation starts before the root has been appended)
      setTimeout(() => {
        this.container.classList.add(this.animationStyles)
        this.#emitEvent("snackopen")

        if (this.autoClose && this.timeout) {
          this.#scheduleCloseId = this.#scheduleClose()
          //We track the time elapsed before our snack close
          this.#scheduleCloseTimer = performance.now()
          this.#animationFrameRef = requestAnimationFrame(() => this.#trackTime())
        } else { }
      }, 50)
    }
  }

  close() {
    if (this.root) {
      this.#closeSnack()
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
    resize: () => this.#positionSnack(),
    snackClose: () => {
      this.#onSnackClose()
    },
    snackOpen: () => {
      this.#animationStarted = true
      this.#onSnackOpen()
    },
    snackUpdate: () => {
      // update snackbar root if root is mounted
      if (this.#reactRoot) {
        return this.#renderSnackbar()
      }
      console.warn(
        "Snackbar root was unmounted on close. " +
        "Cannot update an unmounted root. " +
        "New states is preserved and will be applied on next render"
      )
    },
    mouseMove: (e) => {
      this.#pauseSnack()
      this.#isOnSnackbarControl = e.target.closest(".snackbar-control")
    },
    mouseOut: (e) => {
      const isSnackRoot = e.target.closest("#snack-root")
      isSnackRoot && !this.#isOnSnackbarControl && this.#resumeSnack()
    },
    pointerDown: (e) => {
      this.#swipeStartX = e.clientX
      this.#swipeStartY = e.clientY
      this.#isSwipping = true
      this.root.setPointerCapture(e.pointerId)
    },
    pointerMove: (e) => {
      if (this.#isSwipping) {
        const deltaX = e.clientX - this.#swipeStartX
        const deltaY = e.clientY - this.#swipeStartY
        const parcentMovedX = Math.abs(deltaX) / this.swipeThreshold
        const parcentMovedY = Math.abs(deltaY) / this.swipeThreshold

        this.#snackPosition.transform(deltaX, deltaY)
        this.#fadeSnackOnSwipe(parcentMovedX, parcentMovedY)
      }
    },
    pointerUp: (e) => {
      if (this.#isSwipping) {
        this.#isSwipping = false
        this.root.releasePointerCapture(e.pointerId)

        let deltaX = e.clientX - this.#swipeStartX
        let deltaY = e.clientY - this.#swipeStartY

        if (Math.abs(deltaY) > this.swipeThreshold || Math.abs(deltaX) > this.swipeThreshold) {
          deltaX = deltaX > 0 ? 1000 : -1000
          deltaY = deltaY > 0 ? 1000 : -1000
          this.#snackPosition.transform(deltaX, deltaY)
          this.#closeSnack()
          return
        }

        this.#snackPosition.transform(0, 0)
        this.#fadeSnackOnSwipe(0, 0)
      }
    },
    pointerCancel: () => {
      this.#isSwipping = false
      this.#snackPosition.transform(0, 0)
    }
  }

  #fadeSnackOnSwipe(x, y) {
    if (x >= y) return this.root.style.opacity = 1 - x
    if (x <= y) return this.root.style.opacity = 1 - y
  }

  #hydrateSnackbar() {
    console.debug("[Snackbar] hydration: hydrating snackbar...")
    try {
      this.#snackbarControl = this.root.querySelector(".snackbar-control")
      window.addEventListener("resize", this.#eventListeners.resize)
      this.root.addEventListener("mousemove", this.#eventListeners.mouseMove)
      // when user provide custom component, snackbar-control is undefined/null
      this.#snackbarControl && this.#snackbarControl.addEventListener("mousemove", this.#eventListeners.mouseMove)
      this.root.addEventListener("mouseout", this.#eventListeners.mouseOut)
      this.container.addEventListener("snackclose", this.#eventListeners.snackClose)
      this.container.addEventListener("snackopen", this.#eventListeners.snackOpen)
      this.container.addEventListener("snackupdate", this.#eventListeners.snackUpdate)
      window.addEventListener("keydown", (e) => this.action.escape(e, this.#closeSnack.bind(this)))



      this.#attachSwipeEvent()
      console.debug("[Snackbar] hydration: successfully hydrated snackbar")
    } catch (error) {
      console.error(error)
    }
  }

  #attachSwipeEvent() {
    console.debug("[Snackbar] event: attaching pointer events...")
    try {
      this.root.addEventListener("pointerdown", this.#eventListeners.pointerDown)
      this.root.addEventListener("pointermove", this.#eventListeners.pointerMove)
      this.root.addEventListener("pointerup", this.#eventListeners.pointerUp)
      this.root.addEventListener("pointercancel", this.#eventListeners.pointerCancel)
      console.debug("[Snackbar] event: attached pointer events :/")
    } catch (error) {
      console.error(error)
    }
  }

  #dehydrateSnackbar() {
    console.debug("[Snackbar] dehydration: dehydrating snackbar...")
    try {
      window.removeEventListener("resize", this.#eventListeners.resize)
      this.root.removeEventListener("mousemove", this.#eventListeners.mouseMove)
      // when user provide custom component, snackbar-control is undefined/null
      this.#snackbarControl && this.#snackbarControl.removeEventListener("mousemove", this.#eventListeners.mouseMove)
      this.root.removeEventListener("mouseout", this.#eventListeners.mouseOut)
      this.container.removeEventListener("snackclose", this.#eventListeners.snackClose)
      this.container.removeEventListener("snackopen", this.#eventListeners.snackOpen)
      this.container.removeEventListener("snackupdate", this.#eventListeners.snackUpdate)
      this.container.removeEventListener("keydown", (e) => this.action.escape(e, this.#closeSnack.bind(this)))

      console.debug("[Snackbar] dehydration: successfully dehydrated snackbar")
    } catch (error) {
      console.error(error)
    }
  }

  #closeSnack() {
    try {
      this.container.classList.remove(this.animationStyles)
      this.#animationEnded = true
      this.#emitEvent("snackclose")
      this.#dehydrateSnackbar()
      this.#unmountSnackbar()
      this.timeout = this.#timeoutCopy //restore timeout

    } catch (error) {
      console.error(error)
    }
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

      this.#emitEvent("snackupdate")
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

  /**
    * Transform snackbar root based on pointer move
    * */
  transform(x, y) {
    // this.root.style.transition = "transform 0.3s ease-in-out"
    this.root.style.transform = `translate(${x}px, ${y}px)`
  }
}

