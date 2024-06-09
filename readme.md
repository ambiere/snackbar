# react-notification [![CI](https://github.com/ambiere/react-notification/actions/workflows/main.yml/badge.svg)](https://github.com/ambiere/react-notification/actions/workflows/main.yml)

>Utility to simplify react notification. Apply animation properties to your notification component

## Install

```bash
npm install @ambiere/react-notification
```

## Usage

```jsx
import { seEffect  from "react"
import Notification from "react-notification"

function SignUp() {
const [errorText, setErrorText] = useState()
const [signUp, {data,error} ] = useMutation(SIGN_UP)

useEffect(()=> {
  if(error) {
    const notification = new Notification({
        timeout: 2500,
        message: error.message,
        root: "notificationWrapper"
        animation: "animateNotification",
        preNotification: (root, format) => setErrorText(format()),
        postNotification: (root) => setErrorText(""),
    })

    notification.notify(()=> navigate("/signup"))
  }
}, [error])


return (
<div>
  // ...
  <div className="notificationWrapper">{text}</div>
</div>
)
```


## Options

`timeout`

Time in milliseconds, that notification will be displayed before disappering.

`message`

Raw message from your queries results or custom hardcoded message to be displayed upon notification

`root`

Class selector of a DOM element where notification context will be placed

`animation`

CSS class that contains defined animation properties to be applied on `root`

`preNotification`

Callback function that is executed prior notification. The callback is supplied with `root`, DOM element and
a callback function that format the `message`. Useful to update the notification message state before notification.

`postNotification`

Callback function that is executed after notification. The callback is supplied with `root`, DOM element. Useful to clear
notification message state after notification.


## License

MIT License

