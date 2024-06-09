class ReactNotification {
  constructor({
    message,
    timeout = 2500,
    root = "notification",
    animation = "animation",
    formatter = (message) => message
  }) {
    this.root = root
    this.message = message
    this.timeout = timeout
    this.animation = animation
    this.formatter = formatter
    this.rootWrapper = document.querySelector(`.notification`)
  }

  populateRoot() {
    let root = this.rootWrapper
    if (this.root != "notification") {
      root = document.querySelector(`.${this.root}`)
    }
    root.innerHTML = this.formatter(this.message)
    return {
      depopulate: () => {
        root.innerHTML = ""
      }
    }
  }

  notify(cb = () => { }) {
    const root = this.populateRoot()
    this.rootWrapper.classList.add(this.animation)
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        this.rootWrapper.classList.remove(this.animation)
        root.depopulate()
        if (typeof cb === "function") {
          resolve(cb())
        } else {
          reject("Error: Callback should be a function")
        }
      }, this.timeout))
  }
}

export default ReactNotification
