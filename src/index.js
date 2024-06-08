class Notification {
  constructor({
    message,
    timeout = 2500,
    preNotification,
    postNotification,
    root = "notification",
    animation = "animation"
  }) {
    this.message = message
    this.timeout = timeout
    this.preNotification = preNotification
    this.postNotification = postNotification
    this.root = document.querySelector(`.${root}`)
    this.animation = animation
  }

  format(formatCb) {
    if (formatCb) {
      return formatCb(this.message)
    }
    return this.message.split(":")[1]
  }

  notify(cb = () => { }) {
    this.preNotification(this.root, this.format)
    this.root.classList.add(this.animation)
    setTimeout(() => {
      this.postNotification(this.root)
      this.root.classList.remove(this.animation)
      return cb
    }, this.timeout)
  }
}

export default Notification
