export default ReactNotification
declare class ReactNotification {
  constructor({ message, formatter, timeout, root, animation, }: {
    /** Raw unformatted notification message*/
    message: string;
    /**
     * Custom function to format notification message
     * @param {String} message - Raw unformatted text, internally supplied as the first argument of the function
     * @returns {String} message - Formatted text
     */
    formatter(message: string): string;
    /** Time in milliseconds a notification will be displyed before disappearing */
    timeout?: number;
    /** Node class selector, where notification content will be populated. Default: `notification`*/
    root?: string;
    /** CSS class selector containing animation properties to be applied on notification node wrapper*/
    animation?: string;
  })

  /** Node class selector, where notification content will be populated. Default: `notification`*/
  root: string

  /** Raw unformatted notification message*/
  message: string

  /** Time in milliseconds a notification will be displyed before disappearing */
  timeout: number

  /** CSS class selector containing animation properties to be applied on notification node wrapper*/
  animation: string

  /**
   * Custom function to format notification message
   * @param {String} message - Raw unformatted text, internally supplied as the first argument of the function
   * @returns {String} message - Formatted text
   */
  formatter(message: string): string

  /** Notification node wrapper*/
  rootWrapper: Element

  /** Function that populate notification message in notification node specified by node class selector, `root`*/
  populateRoot(): {
    /** Function that depopulate notification message from notification node specified by node class selector, `root`*/
    depopulate: () => void;
  }

  /** Function that applies animation properties to the notification node wrapper. Accept a callback function that will be executed after animation is completed
   * @param cb - callback function
   * */
  notify(cb?: () => void): void;
}
