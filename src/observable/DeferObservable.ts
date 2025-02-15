import {Observable, SubscribableOrPromise} from '../Observable';
import {Subscriber} from '../Subscriber';
import {Subscription} from '../Subscription';

import {subscribeToResult} from '../util/subscribeToResult';
import {OuterSubscriber} from '../OuterSubscriber';
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @extends {Ignored}
 * @hide true
 */
export class DeferObservable<T> extends Observable<T> {

  /**
   * Creates an Observable that, on subscribe, calls an Observable factory to
   * make an Observable for each new Observer.
   *
   * <span class="informal">Creates the Observable lazily, that is, only when it
   * is subscribed.
   * </span>
   *
   * <img src="./img/defer.png" width="100%">
   *
   * `defer` allows you to create the Observable only when the Observer
   * subscribes, and create a fresh Observable for each Observer. It waits until
   * an Observer subscribes to it, and then it generates an Observable,
   * typically with an Observable factory function. It does this afresh for each
   * subscriber, so although each subscriber may think it is subscribing to the
   * same Observable, in fact each subscriber gets its own individual
   * Observable.
   *
   * @example <caption>Subscribe to either an Observable of clicks or an Observable of interval, at random</caption>
   * var clicksOrInterval = Rx.Observable.defer(function () {
   *   if (Math.random() > 0.5) {
   *     return Rx.Observable.fromEvent(document, 'click');
   *   } else {
   *     return Rx.Observable.interval(1000);
   *   }
   * });
   * clicksOrInterval.subscribe(x => console.log(x));
   *
   * @see {@link create}
   *
   * @param {function(): Observable|Promise} observableFactory The Observable
   * factory function to invoke for each Observer that subscribes to the output
   * Observable. May also return a Promise, which will be converted on the fly
   * to an Observable.
   * @return {Observable} An Observable whose Observers' subscriptions trigger
   * an invocation of the given Observable factory function.
   * @static true
   * @name defer
   * @owner Observable
   */
  static create<T>(observableFactory: () => SubscribableOrPromise<T> | void): Observable<T> {
    return new DeferObservable(observableFactory);
  }

  constructor(private observableFactory: () => SubscribableOrPromise<T> | void) {
    super();
  }

  protected _subscribe(subscriber: Subscriber<T>): Subscription {
    return new DeferSubscriber(subscriber, this.observableFactory);
  }
}

class DeferSubscriber<T> extends OuterSubscriber<T, T> {
  constructor(destination: Subscriber<T>,
              private factory: () => SubscribableOrPromise<T> | void) {
    super(destination);
    this.tryDefer();
  }

  private tryDefer(): void {
    try {
      const result = this.factory.call(this);
      if (result) {
        this.add(subscribeToResult(this, result));
      }
    } catch (err) {
      this._error(err);
    }
  }
}
