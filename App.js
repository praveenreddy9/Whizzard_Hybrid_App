import React, { PureComponent } from "react";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import { createLogger } from "redux-logger";
import Router from "./Router";
import { LogBox } from "react-native";
import reducers from "./components/Store/Reducers/index";

const logger = createLogger({ collapsed: true, diff: true });

// Correct middleware setup
const middlewares = [thunk]; // Always include thunk
if (__DEV__) {
    middlewares.push(logger); // Add logger only in development mode
}

const store = createStore(reducers, applyMiddleware(...middlewares));

export default class App extends PureComponent {
  render() {
    LogBox.ignoreAllLogs();
    return (
        <Provider store={store}>
          <Router />
        </Provider>
    );
  }
}
