import ReactNotification from '../src'
import { it, vi, assert, afterEach } from 'vitest'
import notificationWrapper from './fixtures/index.js'

// @vitest-environment jsdom

it('should notify and disappear', async ({ expect }) => {
  document.body.innerHTML = notificationWrapper
  const notification = new ReactNotification({
    message: 'test has passed',
    timeout: 100,
    root: 'root',
    animation: 'animation',
    formatter (message) {
      return message.concat(' :)')
    }
  })

  const p = document.body.querySelector('.root')
  const notify = vi.spyOn(notification, 'notify')
  const formatter = vi.spyOn(notification, 'formatter')
  const div = document.body.querySelector('.notification')
  const populateRoot = vi.spyOn(notification, 'populateRoot')

  assert.isFalse(div.classList.contains('animation'), 'animation class not added')

  notification.notify()

  expect(notify).toHaveBeenCalled()
  expect(formatter).toHaveBeenCalled()
  expect(populateRoot).toHaveBeenCalled()
  expect(populateRoot).toHaveReturned()
  expect(formatter).toHaveReturnedWith('test has passed :)')

  assert.isOk(p.innerHTML, 'returned string')
  assert.strictEqual(p.innerHTML, 'test has passed :)')
  assert.isTrue(div.classList.contains('animation'), 'animation class added')

  let callback = false

  await vi.waitUntil(async () => {
     await notification.notify(() => {
      callback = true
    })
    return true
  }, { timeout: 500 })

  assert.strictEqual(p.innerHTML, '')
  assert.isTrue(callback, 'callback executed')
  assert.isNotOk(p.innerHTML, 'returned empty string')
  assert.isFalse(div.classList.contains('animation'), 'animation class added')

  afterEach(() => {
    callback = false
  })
})
