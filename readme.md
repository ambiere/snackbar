# react-notification [![CI](https://github.com/ambiere/react-notification/actions/workflows/main.yml/badge.svg)](https://github.com/ambiere/react-notification/actions/workflows/main.yml)

>Simple utility to simplify react notifications. <br>Applies animation properties to your notification components

## Install

```bash
npm install @ambiere/react-notification
```

## Usage

```jsx
import ReactNotification from "react-notification"

useEffect(()=>{
  //.....
  const notification = new ReactNotification({
    message: "Notification message",
    timeout: 2500,
    root: "root",
    animation: "animation",
    formatter(message) {
      return message.concat(" :)")
    }
  })

  notification.notify(()=>navigate("/home"))
  //....
})


return (
  //....
  <div className="notification">
    //....
    <p className="root"></p>
  </div>
)

```
> NB: The notification node wrapper should have a className of `notification`, react-notification internally query the node wrapper using `notification` class selector.

## Options

### formatter

type: `function`

Custom function to format notification message

- Param: `message` - Raw unformatted text, internally supplied as the first argument of the formatter function.
- Returns: `message` - Formatted text.


### timeout

type: `number`<br>
default: `2500`

Time in milliseconds a notification will be displyed before disappearing.


### message

type: `string`

Raw unformatted notification message.


### root

type: `string`<br>
default: `notification`

Node class selector, where notification content will be populated.


### animation

type: `string`

CSS class selector containing animation properties to be applied on notification node wrapper.


## API

### notify(cb?)

type: `function`

Function that applies animation properties to the notification node wrapper. Accept a callback function that will be executed after animation is completed

- Param: `cb` - Optional callback function


### populateRoot()

type: `function`

Function that populate notification message in notification node specified by node class selector, `root`.

- Returns: `depopulate()` - Function that depopulate notification message from notification node specified by node class selector, `root`.

## License

[MIT License](https://github.com/ambiere/react-notification/blob/main/license)

